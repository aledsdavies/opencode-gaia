import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, test } from "bun:test";

import { getPlanGaiaPaths, readPlanGaia, writePlanGaia } from "./plan-gaia";

const tempDirs: string[] = [];

afterEach(async () => {
  await Promise.all(
    tempDirs.splice(0).map(async (directory) => {
      await rm(directory, { recursive: true, force: true });
    }),
  );
});

describe("plan-gaia paths", () => {
  test("builds .gaia work-unit file paths", () => {
    const paths = getPlanGaiaPaths("/repo", "unit-1");

    expect(paths.base_dir).toBe("/repo/.gaia/unit-1");
    expect(paths.plan_path).toBe("/repo/.gaia/unit-1/plan.md");
    expect(paths.log_path).toBe("/repo/.gaia/unit-1/log.md");
    expect(paths.decisions_path).toBe("/repo/.gaia/unit-1/decisions.md");
  });

  test("rejects invalid work-unit identifiers", () => {
    expect(() => getPlanGaiaPaths("/repo", "../escape")).toThrow();
    expect(() => getPlanGaiaPaths("/repo", "unit/1")).toThrow();
  });
});

describe("plan-gaia io", () => {
  test("writes and reads plan/log/decisions files", async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), "gaia-plan-"));
    tempDirs.push(repoRoot);

    await writePlanGaia({
      repoRoot,
      workUnit: "unit-2",
      plan: "# Plan\n- implement",
      log: "# Log\n- started",
      decisions: "# Decisions\n- use bun",
    });

    const readBack = await readPlanGaia({ repoRoot, workUnit: "unit-2" });

    expect(readBack.plan).toBe("# Plan\n- implement");
    expect(readBack.log).toBe("# Log\n- started");
    expect(readBack.decisions).toBe("# Decisions\n- use bun");

    const direct = await readFile(join(repoRoot, ".gaia", "unit-2", "plan.md"), "utf8");
    expect(direct).toBe("# Plan\n- implement");
  });
});
