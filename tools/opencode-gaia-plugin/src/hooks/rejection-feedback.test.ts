import { describe, expect, test } from "bun:test";

import { buildRejectionPrefill } from "./rejection-feedback";

describe("buildRejectionPrefill", () => {
  test("creates stable rejection prefill text", () => {
    expect(buildRejectionPrefill("bash")).toBe("Rejected bash because: ");
  });

  test("normalizes extra whitespace around tool name", () => {
    expect(buildRejectionPrefill("  edit  ")).toBe("Rejected edit because: ");
  });
});
