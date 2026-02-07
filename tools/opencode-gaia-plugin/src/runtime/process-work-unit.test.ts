import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, test } from "bun:test";

import { processWorkUnit } from "./process-work-unit";

const tempDirs: string[] = [];

afterEach(async () => {
  await Promise.all(
    tempDirs.splice(0).map(async (directory) => {
      await rm(directory, { recursive: true, force: true });
    }),
  );
});

describe("processWorkUnit", () => {
  test("delegates, collects, and persists .gaia files", async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), "gaia-runtime-"));
    tempDirs.push(repoRoot);

    const result = await processWorkUnit({
      repoRoot,
      workUnit: "unit-4",
      sessionId: "s1",
      modelUsed: "openai/gpt-5.3-codex",
      responseText: '{"contract_version":"1.0","agent":"gaia"}',
      parse: (input) => input,
      plan: "# Plan\n- next",
      log: "# Log\n- running",
      decisions: "# Decisions\n- keep scope small",
    });

    expect(result.delegation.status).toBe("ok");
    expect(result.collection.total).toBe(1);
    expect(result.collection.success_count).toBe(1);

    const planFile = await readFile(join(repoRoot, ".gaia", "unit-4", "plan.md"), "utf8");
    expect(planFile).toBe("# Plan\n- next");
  });

  test("preserves parse-failed status while still writing artifacts", async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), "gaia-runtime-"));
    tempDirs.push(repoRoot);

    const result = await processWorkUnit({
      repoRoot,
      workUnit: "unit-5",
      sessionId: "s2",
      modelUsed: "openai/gpt-5.3-codex",
      responseText: "not-json",
      retry: async () => "still-not-json",
      parse: (input) => input,
      plan: "# Plan\n- fallback",
      log: "# Log\n- parse failed",
      decisions: "# Decisions\n- capture error",
    });

    expect(result.delegation.status).toBe("parse_failed");
    expect(result.collection.failure_count).toBe(1);

    const decisionsFile = await readFile(
      join(repoRoot, ".gaia", "unit-5", "decisions.md"),
      "utf8",
    );
    expect(decisionsFile).toBe("# Decisions\n- capture error");
  });

  test("blocks artifact writes in locked mode", async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), "gaia-runtime-"));
    tempDirs.push(repoRoot);

    await expect(
      processWorkUnit({
        repoRoot,
        workUnit: "unit-locked-1",
        sessionId: "s3",
        modelUsed: "openai/gpt-5.3-codex",
        responseText: '{"contract_version":"1.0","agent":"gaia"}',
        parse: (input) => input,
        plan: "# Plan\n- blocked",
        log: "# Log\n- blocked",
        decisions: "# Decisions\n- blocked",
        mode: "locked",
      }),
    ).rejects.toThrow("Locked mode blocks plan_gaia writes");

    await expect(readFile(join(repoRoot, ".gaia", "unit-locked-1", "plan.md"), "utf8")).rejects.toThrow();
  });
});
