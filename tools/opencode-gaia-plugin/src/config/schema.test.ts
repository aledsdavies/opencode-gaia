import { describe, expect, test } from "bun:test";

import { parseGaiaConfig } from "./schema";

describe("parseGaiaConfig", () => {
  test("applies default collaboration settings", () => {
    const config = parseGaiaConfig({});

    expect(config.mode).toBe("supervised");
    expect(config.visibility).toBe("checkpoint");
    expect(config.interaction).toBe("standard");
    expect(config.checkinCadence).toBe("wave");
    expect(config.reviewDepth).toBe("diff");
    expect(config.startup?.askAtTaskStart).toBe(true);
    expect(config.wavePolicy?.enforceWaveId).toBe(true);
    expect(config.autopilotSafeguards?.maxToolCallsPerWave).toBe(40);
    expect(config.operationProfile.agentSet).toBe("lean");
  });

  test("accepts per-agent model overrides", () => {
    const config = parseGaiaConfig({
      agents: {
        hephaestus: {
          model: "custom/provider-model",
          temperature: 0.3,
        },
      },
    });

    expect(config.agents.hephaestus?.model).toBe("custom/provider-model");
    expect(config.agents.hephaestus?.temperature).toBe(0.3);
  });

  test("rejects invalid mode values", () => {
    expect(() => {
      parseGaiaConfig({ mode: "turbo" });
    }).toThrow();
  });

  test("accepts future full agent set profile", () => {
    const config = parseGaiaConfig({
      operationProfile: {
        agentSet: "full",
      },
    });

    expect(config.operationProfile.agentSet).toBe("full");
  });

  test("accepts custom operation profile with subsystem mix", () => {
    const config = parseGaiaConfig({
      operationProfile: {
        agentSet: "custom",
        customSubsystems: {
          reconRouting: true,
          implementation: false,
          projectMemory: true,
        },
      },
    });

    expect(config.operationProfile.agentSet).toBe("custom");
    expect(config.operationProfile.customSubsystems).toEqual({
      reconRouting: true,
      implementation: false,
      projectMemory: true,
    });
  });

  test("rejects custom operation profile with no enabled subsystem", () => {
    expect(() => {
      parseGaiaConfig({
        operationProfile: {
          agentSet: "custom",
          customSubsystems: {
            reconRouting: false,
            implementation: false,
            projectMemory: false,
          },
        },
      });
    }).toThrow();
  });
});
