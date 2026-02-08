import { describe, expect, test } from "bun:test";

import {
  buildSuiteSteps,
  getBugHarnessPermission,
  getSmokePermission,
} from "./plans";

describe("buildSuiteSteps", () => {
  test("returns basic suite command order", () => {
    expect(buildSuiteSteps("basic")).toEqual([
      "bootstrap",
      "list-free-models",
      "smoke",
    ]);
  });

  test("returns full suite command order", () => {
    expect(buildSuiteSteps("full")).toEqual([
      "bootstrap",
      "list-free-models",
      "smoke",
      "lean-subagents-smoke",
      "gaia-init-smoke",
      "locked-smoke",
      "bug",
    ]);
  });

  test("returns plugin suite command order", () => {
    expect(buildSuiteSteps("plugin")).toEqual([
      "bootstrap",
      "lean-subagents-smoke",
      "gaia-init-smoke",
    ]);
  });

  test("throws for unknown suite mode", () => {
    expect(() => buildSuiteSteps("unknown")).toThrow("Unknown harness mode");
  });
});

describe("permission defaults", () => {
  test("defines non-interactive smoke permissions", () => {
    expect(getSmokePermission()).toBe('{"bash":"allow","read":"allow","edit":"deny","write":"deny"}');
  });

  test("defines bug harness permissions", () => {
    expect(getBugHarnessPermission()).toBe('{"bash":"allow","read":"allow","edit":"allow","write":"allow"}');
  });
});
