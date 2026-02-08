import { describe, expect, test } from "bun:test";

import { parseGaiaConfig } from "./schema";

describe("parseGaiaConfig", () => {
  test("applies default collaboration settings", () => {
    const config = parseGaiaConfig({});

    expect(config.mode).toBe("supervised");
    expect(config.operationProfile.agentSet).toBe("lean");
    expect(config.operationProfile.customAgents).toBeUndefined();
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

  test("accepts custom operation profile with custom agents", () => {
    const config = parseGaiaConfig({
      operationProfile: {
        agentSet: "custom",
        customAgents: ["athena", "demeter"],
      },
    });

    expect(config.operationProfile.agentSet).toBe("custom");
    expect(config.operationProfile.customAgents).toEqual(["athena", "demeter"]);
  });

  test("accepts custom operation profile with gaia-only custom list", () => {
    const config = parseGaiaConfig({
      operationProfile: {
        agentSet: "custom",
        customAgents: [],
      },
    });

    expect(config.operationProfile.agentSet).toBe("custom");
    expect(config.operationProfile.customAgents).toEqual([]);
  });

});
