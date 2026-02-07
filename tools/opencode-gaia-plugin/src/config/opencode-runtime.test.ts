import { describe, expect, test } from "bun:test";

import {
  applyGaiaRuntimeConfig,
  GAIA_SLASH_COMMAND_NAME,
} from "./opencode-runtime";

function asRecord(value: unknown): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error("Expected object record");
  }

  return value as Record<string, unknown>;
}

describe("applyGaiaRuntimeConfig", () => {
  test("injects GAIA agents and slash command defaults", () => {
    const config: Record<string, unknown> = {};

    applyGaiaRuntimeConfig(config);

    const agents = asRecord(config.agent);
    const commands = asRecord(config.command);

    const gaia = asRecord(agents.gaia);
    const minerva = asRecord(agents.minerva);
    const hephaestus = asRecord(agents.hephaestus);
    const demeter = asRecord(agents.demeter);
    const gaiaInitCommand = asRecord(commands[GAIA_SLASH_COMMAND_NAME]);

    expect(gaia.mode).toBe("primary");
    expect(minerva.mode).toBe("subagent");
    expect(hephaestus.mode).toBe("subagent");
    expect(demeter.mode).toBe("subagent");
    expect(typeof gaia.prompt).toBe("string");
    expect(typeof gaia.model).toBe("string");

    expect(gaiaInitCommand.template).toBe(
      "Run the gaia_init tool now with refresh=false unless the user explicitly asks to refresh.",
    );
    expect(gaiaInitCommand.agent).toBe("gaia");
  });

  test("preserves explicit user overrides for GAIA agent and slash command", () => {
    const config: Record<string, unknown> = {
      agent: {
        gaia: {
          model: "custom/model",
          prompt: "custom prompt",
          mode: "primary",
          permission: {
            gaia_init: "deny",
          },
        },
      },
      command: {
        [GAIA_SLASH_COMMAND_NAME]: {
          template: "custom template",
          description: "custom description",
          agent: "build",
        },
      },
    };

    applyGaiaRuntimeConfig(config);

    const agents = asRecord(config.agent);
    const commands = asRecord(config.command);
    const gaia = asRecord(agents.gaia);
    const permission = asRecord(gaia.permission);
    const gaiaInitCommand = asRecord(commands[GAIA_SLASH_COMMAND_NAME]);

    expect(gaia.model).toBe("custom/model");
    expect(gaia.prompt).toBe("custom prompt");
    expect(permission.gaia_init).toBe("deny");
    expect(gaiaInitCommand.template).toBe("custom template");
    expect(gaiaInitCommand.agent).toBe("build");
  });
});
