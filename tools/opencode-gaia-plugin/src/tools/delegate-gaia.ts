export type DelegateGaiaStatus = "ok" | "retry_succeeded" | "parse_failed";

export interface DelegateGaiaArgs<TParsed> {
  sessionId: string;
  modelUsed: string;
  responseText: string;
  parse: (input: unknown) => TParsed;
  retry?: () => Promise<string>;
}

export interface DelegateGaiaResult<TParsed> {
  session_id: string;
  model_used: string;
  parsed_json: TParsed | null;
  parse_error: string | null;
  status: DelegateGaiaStatus;
  attempt_count: number;
}

function extractJsonCandidate(text: string): string {
  const trimmed = text.trim();
  if (trimmed.length === 0) {
    throw new Error("Response is empty");
  }

  const fencedMatch = trimmed.match(/```json\s*([\s\S]*?)\s*```/i);
  if (fencedMatch && fencedMatch[1]) {
    return fencedMatch[1].trim();
  }

  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    return trimmed;
  }

  const firstOpen = trimmed.indexOf("{");
  if (firstOpen < 0) {
    throw new Error("No JSON object found in response");
  }

  let depth = 0;
  for (let index = firstOpen; index < trimmed.length; index += 1) {
    const char = trimmed[index];
    if (char === "{") {
      depth += 1;
    } else if (char === "}") {
      depth -= 1;
      if (depth === 0) {
        return trimmed.slice(firstOpen, index + 1);
      }
    }
  }

  throw new Error("Unterminated JSON object in response");
}

function parseDelegateOutput<TParsed>(responseText: string, parse: (input: unknown) => TParsed): TParsed {
  const jsonCandidate = extractJsonCandidate(responseText);
  const parsed = JSON.parse(jsonCandidate) as unknown;
  return parse(parsed);
}

export async function delegateGaia<TParsed>(
  args: DelegateGaiaArgs<TParsed>,
): Promise<DelegateGaiaResult<TParsed>> {
  try {
    const first = parseDelegateOutput(args.responseText, args.parse);
    return {
      session_id: args.sessionId,
      model_used: args.modelUsed,
      parsed_json: first,
      parse_error: null,
      status: "ok",
      attempt_count: 1,
    };
  } catch (firstError) {
    if (!args.retry) {
      return {
        session_id: args.sessionId,
        model_used: args.modelUsed,
        parsed_json: null,
        parse_error: firstError instanceof Error ? firstError.message : "Unknown parse error",
        status: "parse_failed",
        attempt_count: 1,
      };
    }

    try {
      const retryResponse = await args.retry();
      const second = parseDelegateOutput(retryResponse, args.parse);
      return {
        session_id: args.sessionId,
        model_used: args.modelUsed,
        parsed_json: second,
        parse_error: null,
        status: "retry_succeeded",
        attempt_count: 2,
      };
    } catch (retryError) {
      return {
        session_id: args.sessionId,
        model_used: args.modelUsed,
        parsed_json: null,
        parse_error: retryError instanceof Error ? retryError.message : "Unknown parse error",
        status: "parse_failed",
        attempt_count: 2,
      };
    }
  }
}
