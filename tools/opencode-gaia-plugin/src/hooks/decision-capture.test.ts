import { describe, expect, test } from "bun:test";

import { formatDecisionCaptureEntry } from "./decision-capture";

describe("formatDecisionCaptureEntry", () => {
  test("formats decision entry with optional rationale", () => {
    const entry = formatDecisionCaptureEntry({
      type: "question",
      question: "Use Vitest or bun test?",
      answer: "bun test",
      impact: "No extra dependency",
      rationale: "Keep MVP lean",
    });

    expect(entry).toContain("- type: question");
    expect(entry).toContain("question: Use Vitest or bun test?");
    expect(entry).toContain("answer: bun test");
    expect(entry).toContain("rationale: Keep MVP lean");
    expect(entry).toContain("impact: No extra dependency");
  });
});
