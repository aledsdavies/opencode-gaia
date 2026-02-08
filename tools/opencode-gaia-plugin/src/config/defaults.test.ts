import { describe, expect, test } from "bun:test";

import { AGENT_DEFAULTS } from "./defaults";

describe("AGENT_DEFAULTS", () => {
  test("includes all declared agents", () => {
    expect(Object.keys(AGENT_DEFAULTS).sort()).toEqual([
      "athena",
      "demeter",
      "gaia",
      "hephaestus",
    ]);
  });

  test("defines stable model settings per agent", () => {
    for (const config of Object.values(AGENT_DEFAULTS)) {
      expect(config.model.length > 0).toBe(true);
      expect(config.temperature >= 0).toBe(true);
      expect(config.temperature <= 2).toBe(true);
      expect(new Set(config.fallback).size).toBe(config.fallback.length);

      for (const fallbackModel of config.fallback) {
        expect(fallbackModel.length > 0).toBe(true);
      }
    }
  });
});
