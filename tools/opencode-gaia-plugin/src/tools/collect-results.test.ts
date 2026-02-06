import { describe, expect, test } from "bun:test";

import { collectResults } from "./collect-results";

describe("collectResults", () => {
  test("summarizes successful and failed items", () => {
    const summary = collectResults([
      {
        session_id: "s1",
        model_used: "openai/gpt-5.3-codex",
        status: "ok",
        parsed_json: { ok: true },
        parse_error: null,
      },
      {
        session_id: "s2",
        model_used: "openai/gpt-5.3-codex",
        status: "parse_failed",
        parsed_json: null,
        parse_error: "Invalid JSON",
      },
    ]);

    expect(summary.total).toBe(2);
    expect(summary.success_count).toBe(1);
    expect(summary.failure_count).toBe(1);
  });

  test("returns empty summary for no results", () => {
    const summary = collectResults([]);

    expect(summary.total).toBe(0);
    expect(summary.success_count).toBe(0);
    expect(summary.failure_count).toBe(0);
    expect(summary.items).toEqual([]);
  });
});
