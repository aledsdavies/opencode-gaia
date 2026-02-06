import { describe, expect, test } from "bun:test";

import { getAgentPrompt, LEAN_AGENT_PROMPTS } from "./prompts";

describe("LEAN_AGENT_PROMPTS", () => {
  test("defines all lean prompts", () => {
    expect(Object.keys(LEAN_AGENT_PROMPTS).sort()).toEqual([
      "demeter",
      "gaia",
      "hephaestus",
      "minerva",
    ]);
  });

  test("keeps prompts contract-oriented", () => {
    expect(LEAN_AGENT_PROMPTS.gaia).toContain("## Output Contract");
    expect(LEAN_AGENT_PROMPTS.minerva).toContain("## Output Contract");
    expect(LEAN_AGENT_PROMPTS.hephaestus).toContain("## Output Contract");
    expect(LEAN_AGENT_PROMPTS.demeter).toContain("## Output Contract");
  });

  test("locks each prompt to reason, goal, and non-goals", () => {
    const prompts = Object.values(LEAN_AGENT_PROMPTS);

    for (const prompt of prompts) {
      expect(prompt).toContain("## Reason for Being");
      expect(prompt).toContain("## Primary Goal");
      expect(prompt).toContain("## Non-Goals");
    }
  });

  test("returns prompt by agent key", () => {
    expect(getAgentPrompt("gaia")).toBe(LEAN_AGENT_PROMPTS.gaia);
    expect(getAgentPrompt("minerva")).toBe(LEAN_AGENT_PROMPTS.minerva);
    expect(getAgentPrompt("hephaestus")).toBe(LEAN_AGENT_PROMPTS.hephaestus);
    expect(getAgentPrompt("demeter")).toBe(LEAN_AGENT_PROMPTS.demeter);
  });

  test("enforces small-unit TDD and checkpoint guidance", () => {
    expect(LEAN_AGENT_PROMPTS.gaia).toContain("small, actionable working unit");
    expect(LEAN_AGENT_PROMPTS.gaia).toContain("checkpoint");
    expect(LEAN_AGENT_PROMPTS.gaia).toContain("stacked PR");
    expect(LEAN_AGENT_PROMPTS.gaia).toContain("outside GAIA");
    expect(LEAN_AGENT_PROMPTS.gaia).toContain("stack traces, logs, or repro steps");
    expect(LEAN_AGENT_PROMPTS.gaia).toContain("reproducer test");
    expect(LEAN_AGENT_PROMPTS.gaia).toContain("Operator");
    expect(LEAN_AGENT_PROMPTS.gaia).toContain("Owner");
    expect(LEAN_AGENT_PROMPTS.gaia).toContain("Context");
    expect(LEAN_AGENT_PROMPTS.gaia).toContain("Options");
    expect(LEAN_AGENT_PROMPTS.gaia).toContain("Recommendation");
    expect(LEAN_AGENT_PROMPTS.gaia).toContain("Action needed");
    expect(LEAN_AGENT_PROMPTS.gaia).toContain("Approve work unit");
    expect(LEAN_AGENT_PROMPTS.gaia).toContain("targeted questions");
    expect(LEAN_AGENT_PROMPTS.gaia).toContain("gaia-init");

    expect(LEAN_AGENT_PROMPTS.hephaestus).toContain("TDD cycle");
    expect(LEAN_AGENT_PROMPTS.hephaestus).toContain("failing test first");
    expect(LEAN_AGENT_PROMPTS.hephaestus).toContain("small, working increments");
    expect(LEAN_AGENT_PROMPTS.hephaestus).toContain("stacked PR");
    expect(LEAN_AGENT_PROMPTS.hephaestus).toContain("tests passing");
    expect(LEAN_AGENT_PROMPTS.hephaestus).toContain("review-ready");
    expect(LEAN_AGENT_PROMPTS.hephaestus).toContain("submission-ready");
    expect(LEAN_AGENT_PROMPTS.hephaestus).toContain("low-mock");
    expect(LEAN_AGENT_PROMPTS.hephaestus).toContain("low-orchestration");
    expect(LEAN_AGENT_PROMPTS.hephaestus).toContain("real values");
    expect(LEAN_AGENT_PROMPTS.hephaestus).toContain("exact assertions");
    expect(LEAN_AGENT_PROMPTS.hephaestus).toContain("partial-response assertions");
  });
});
