export type DecisionCaptureType =
  | "question"
  | "rejection"
  | "mode_switch"
  | "pair_feedback";

export interface DecisionCaptureEntry {
  type: DecisionCaptureType;
  question: string;
  answer: string;
  impact: string;
  rationale?: string;
}

export function formatDecisionCaptureEntry(entry: DecisionCaptureEntry): string {
  const lines = [
    `- type: ${entry.type}`,
    `  question: ${entry.question}`,
    `  answer: ${entry.answer}`,
  ];

  if (entry.rationale) {
    lines.push(`  rationale: ${entry.rationale}`);
  }

  lines.push(`  impact: ${entry.impact}`);
  return lines.join("\n");
}
