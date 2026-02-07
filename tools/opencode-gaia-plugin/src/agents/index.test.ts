import { describe, expect, test } from "bun:test";

import { AGENT_DEFAULTS } from "../config/defaults";
import { parseGaiaConfig } from "../config/schema";
import { createLeanAgentRegistry, resolveOperationAgentKeys } from "./index";

describe("createLeanAgentRegistry", () => {
  test("builds registry for GAIA lean agents", () => {
    const registry = createLeanAgentRegistry({
      config: parseGaiaConfig({}),
      defaults: AGENT_DEFAULTS,
    });

    expect(Object.keys(registry).sort()).toEqual([
      "demeter",
      "gaia",
      "hephaestus",
      "minerva",
    ]);

    expect(registry.gaia.modelConfig.model).toBe("openai/gpt-5.3-codex");
    expect(registry.minerva.modelConfig.model).toBe("zhipuai-coding-plan/glm-4.7");
  });

  test("merges model and prompt overrides", () => {
    const config = parseGaiaConfig({
      agents: {
        hephaestus: {
          model: "custom/model",
          temperature: 0.4,
          prompt_append: "Use migration-safe edits only.",
        },
      },
    });

    const registry = createLeanAgentRegistry({
      config,
      defaults: AGENT_DEFAULTS,
    });

    expect(registry.hephaestus.modelConfig.model).toBe("custom/model");
    expect(registry.hephaestus.modelConfig.temperature).toBe(0.4);
    expect(registry.hephaestus.prompt).toContain("Use migration-safe edits only.");
  });

  test("supports full prompt replacement", () => {
    const config = parseGaiaConfig({
      agents: {
        demeter: {
          prompt: "Custom DEMETER prompt",
          prompt_append: "Append this line",
        },
      },
    });

    const registry = createLeanAgentRegistry({
      config,
      defaults: AGENT_DEFAULTS,
    });

    expect(registry.demeter.prompt).toBe("Custom DEMETER prompt\n\nAppend this line");
  });

  test("propagates disabled flag", () => {
    const config = parseGaiaConfig({
      agents: {
        minerva: {
          disabled: true,
        },
      },
    });

    const registry = createLeanAgentRegistry({
      config,
      defaults: AGENT_DEFAULTS,
    });

    expect(registry.minerva.disabled).toBe(true);
  });
});

describe("resolveOperationAgentKeys", () => {
  test("returns lean set by default", () => {
    const keys = resolveOperationAgentKeys(parseGaiaConfig({}));

    expect(keys).toEqual(["gaia", "minerva", "hephaestus", "demeter"]);
  });

  test("returns subsystem-driven set for custom profile", () => {
    const keys = resolveOperationAgentKeys(
      parseGaiaConfig({
        operationProfile: {
          agentSet: "custom",
          customSubsystems: {
            reconRouting: true,
            implementation: false,
            projectMemory: true,
          },
        },
      }),
    );

    expect(keys).toEqual(["gaia", "minerva", "demeter"]);
  });

  test("returns gaia-only set when custom profile disables all subsystems", () => {
    const keys = resolveOperationAgentKeys(
      parseGaiaConfig({
        operationProfile: {
          agentSet: "custom",
          customSubsystems: {
            reconRouting: false,
            implementation: false,
            projectMemory: false,
          },
        },
      }),
    );

    expect(keys).toEqual(["gaia"]);
  });
});
