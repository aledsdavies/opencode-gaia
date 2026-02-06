import { describe, expect, test } from "bun:test";

import { delegateGaia } from "./delegate-gaia";

describe("delegateGaia", () => {
  test("parses contract JSON on first attempt", async () => {
    const result = await delegateGaia({
      sessionId: "s1",
      modelUsed: "openai/gpt-5.3-codex",
      responseText: '{"contract_version":"1.0","agent":"gaia"}',
      parse: (input) => input,
    });

    expect(result.session_id).toBe("s1");
    expect(result.model_used).toBe("openai/gpt-5.3-codex");
    expect(result.status).toBe("ok");
    expect(result.parse_error).toBeNull();
    expect(result.parsed_json).toEqual({ contract_version: "1.0", agent: "gaia" });
  });

  test("extracts JSON from fenced response", async () => {
    const result = await delegateGaia({
      sessionId: "s2",
      modelUsed: "openai/gpt-5.3-codex",
      responseText:
        "Sure, here is the payload:\n```json\n{\n  \"contract_version\": \"1.0\",\n  \"agent\": \"minerva\"\n}\n```",
      parse: (input) => input,
    });

    expect(result.status).toBe("ok");
    expect(result.parsed_json).toEqual({ contract_version: "1.0", agent: "minerva" });
  });

  test("retries once when first parse fails and returns retry result", async () => {
    let retryCount = 0;
    const result = await delegateGaia({
      sessionId: "s3",
      modelUsed: "openai/gpt-5.3-codex",
      responseText: "not-json",
      parse: (input) => input,
      retry: async () => {
        retryCount += 1;
        return '{"contract_version":"1.0","agent":"demeter"}';
      },
    });

    expect(retryCount).toBe(1);
    expect(result.status).toBe("retry_succeeded");
    expect(result.parse_error).toBeNull();
    expect(result.attempt_count).toBe(2);
    expect(result.parsed_json).toEqual({ contract_version: "1.0", agent: "demeter" });
  });

  test("returns parse failure metadata after retry fails", async () => {
    const result = await delegateGaia({
      sessionId: "s4",
      modelUsed: "openai/gpt-5.3-codex",
      responseText: "still-not-json",
      parse: (input) => input,
      retry: async () => "nope",
    });

    expect(result.status).toBe("parse_failed");
    expect(result.parsed_json).toBeNull();
    expect(typeof result.parse_error).toBe("string");
    expect(result.attempt_count).toBe(2);
  });
});
