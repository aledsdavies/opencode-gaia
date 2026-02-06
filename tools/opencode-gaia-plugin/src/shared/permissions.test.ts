import { describe, expect, test } from "bun:test";

import { AGENT_PERMISSION_MATRIX, isDangerousBashCommand } from "./permissions";

describe("AGENT_PERMISSION_MATRIX", () => {
  test("marks GAIA as non-editing orchestrator", () => {
    expect(AGENT_PERMISSION_MATRIX.gaia.edit).toBe("deny");
    expect(AGENT_PERMISSION_MATRIX.gaia.write).toBe("deny");
  });

  test("marks DEMETER writes as scoped to .gaia", () => {
    expect(AGENT_PERMISSION_MATRIX.demeter.write).toBe("gaia-only");
    expect(AGENT_PERMISSION_MATRIX.demeter.edit).toBe("gaia-only");
  });
});

describe("isDangerousBashCommand", () => {
  test("blocks force push", () => {
    expect(isDangerousBashCommand("git push --force origin main")).toBe(true);
  });

  test("blocks root wipe patterns", () => {
    expect(isDangerousBashCommand("rm -rf /" )).toBe(true);
  });

  test("allows safe checks", () => {
    expect(isDangerousBashCommand("bun test")).toBe(false);
    expect(isDangerousBashCommand("git status")).toBe(false);
  });
});
