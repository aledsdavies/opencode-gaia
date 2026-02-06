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
});
