import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, test } from "bun:test";

import { ensureGaiaInit, getDefaultGaiaInitTemplate } from "./gaia-init";

const tempDirs: string[] = [];

afterEach(async () => {
  await Promise.all(
    tempDirs.splice(0).map(async (directory) => {
      await rm(directory, { recursive: true, force: true });
    }),
  );
});

describe("ensureGaiaInit", () => {
  test("creates .gaia/gaia-init.md when missing", async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), "gaia-init-"));
    tempDirs.push(repoRoot);

    const result = await ensureGaiaInit({ repoRoot });

    expect(result.status).toBe("created");
    expect(result.path).toBe(join(repoRoot, ".gaia", "gaia-init.md"));

    const created = await readFile(result.path, "utf8");
    expect(created).toBe(getDefaultGaiaInitTemplate());
    expect(created).toContain("This file is GAIA-only orchestration context.");
    expect(created).toContain("It does not replace AGENTS.md");
    expect(created).toContain("## Instructions for GAIA Delegation");
    expect(created).toContain("## Product Context");
    expect(created).toContain("## Risk Tolerance");
    expect(created).toContain("## Decision Model");
    expect(created).toContain("## Quality Bar");
    expect(created).toContain("## Communication Contract");
    expect(created).toContain("## Project Notes");
  });

  test("does not overwrite existing file by default", async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), "gaia-init-"));
    tempDirs.push(repoRoot);

    const initPath = join(repoRoot, ".gaia", "gaia-init.md");
    await ensureGaiaInit({ repoRoot });
    await writeFile(initPath, "# Custom Init\n- keep this", "utf8");

    const result = await ensureGaiaInit({ repoRoot });
    const existing = await readFile(initPath, "utf8");

    expect(result.status).toBe("unchanged");
    expect(existing).toBe("# Custom Init\n- keep this");
  });

  test("refresh overwrites with provided template", async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), "gaia-init-"));
    tempDirs.push(repoRoot);

    const initPath = join(repoRoot, ".gaia", "gaia-init.md");
    await ensureGaiaInit({ repoRoot });
    await writeFile(initPath, "# Old", "utf8");

    const result = await ensureGaiaInit({
      repoRoot,
      refresh: true,
      content: "# Refreshed Init\n- new",
    });

    expect(result.status).toBe("updated");
    expect(await readFile(initPath, "utf8")).toBe("# Refreshed Init\n- new");
  });

  test("applies guided answers without touching AGENTS.md", async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), "gaia-init-"));
    tempDirs.push(repoRoot);

    const agentsPath = join(repoRoot, "AGENTS.md");
    await writeFile(agentsPath, "# Existing AGENTS\n- keep", "utf8");

    await ensureGaiaInit({
      repoRoot,
      answers: {
        mission: "Ship a lean GAIA integration smoke flow",
        productContext: ["Primary users are engineering leads and product operators"],
        successSignals: ["Work units have explicit done criteria"],
        constraints: ["No host-specific imports", "Preserve native plan/build"],
        nonGoals: ["Do not expand to full 9-agent roster"],
        riskTolerance: "low",
        qualityBar: ["All checks pass before completion"],
        communicationContract: ["Every handoff includes work_unit and done_when"],
        decisionModel: ["Operator approves medium/high-risk actions"],
        notes: ["Keep this phase focused on base GAIA and gaia_init"],
      },
    });

    const gaiaInit = await readFile(join(repoRoot, ".gaia", "gaia-init.md"), "utf8");
    const agents = await readFile(agentsPath, "utf8");

    expect(gaiaInit).toContain("Ship a lean GAIA integration smoke flow");
    expect(gaiaInit).toContain("Primary users are engineering leads and product operators");
    expect(gaiaInit).toContain("Work units have explicit done criteria");
    expect(gaiaInit).toContain("No host-specific imports");
    expect(gaiaInit).toContain("Risk tolerance: low.");
    expect(gaiaInit).toContain("All checks pass before completion");
    expect(gaiaInit).toContain("Every handoff includes work_unit and done_when");
    expect(gaiaInit).toContain("Operator approves medium/high-risk actions");
    expect(gaiaInit).toContain("Keep this phase focused on base GAIA and gaia_init");
    expect(agents).toBe("# Existing AGENTS\n- keep");
  });

  test("blocks file mutation in locked mode", async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), "gaia-init-"));
    tempDirs.push(repoRoot);

    await expect(
      ensureGaiaInit({
        repoRoot,
        mode: "locked",
      }),
    ).rejects.toThrow("Locked mode blocks gaia_init");

    await expect(readFile(join(repoRoot, ".gaia", "gaia-init.md"), "utf8")).rejects.toThrow();
  });
});
