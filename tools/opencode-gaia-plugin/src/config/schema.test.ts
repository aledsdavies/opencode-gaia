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
});
