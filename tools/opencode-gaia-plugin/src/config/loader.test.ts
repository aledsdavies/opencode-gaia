import { describe, expect, test } from "bun:test";

import { loadGaiaConfig } from "./loader";

describe("loadGaiaConfig", () => {
  test("returns defaults when override files are missing", async () => {
    const config = await loadGaiaConfig({
      repoRoot: "/repo",
      homeDir: "/home/user",
      readFile: async () => {
        throw new Error("ENOENT");
      },
    });

    expect(config.mode).toBe("supervised");
    expect(config.startup.askAtTaskStart).toBe(true);
    expect(config.agents).toEqual({});
  });

  test("merges global then local overrides", async () => {
    const files = new Map<string, string>([
      [
        "/home/user/.config/opencode/gaia.jsonc",
        `{
          // global default
          "mode": "autopilot",
          "agents": {
            "hephaestus": {
              "model": "openai/gpt-5.2-codex"
            }
          }
        }`,
      ],
      [
        "/repo/.gaia/config.jsonc",
        `{
          "mode": "supervised",
          "agents": {
            "hephaestus": {
              "model": "openai/gpt-5.1-codex",
              "temperature": 0.3
            }
          }
        }`,
      ],
    ]);

    const config = await loadGaiaConfig({
      repoRoot: "/repo",
      homeDir: "/home/user",
      readFile: async (filePath) => {
        const content = files.get(filePath);
        if (!content) {
          throw new Error("ENOENT");
        }

        return content;
      },
    });

    expect(config.mode).toBe("supervised");
    expect(config.agents.hephaestus?.model).toBe("openai/gpt-5.1-codex");
    expect(config.agents.hephaestus?.temperature).toBe(0.3);
  });

  test("throws when config JSONC is invalid", async () => {
    await expect(
      loadGaiaConfig({
        repoRoot: "/repo",
        homeDir: "/home/user",
        readFile: async (filePath) => {
          if (filePath === "/repo/.gaia/config.jsonc") {
            return "{ invalid-json }";
          }

          throw new Error("ENOENT");
        },
      }),
    ).rejects.toThrow("Invalid JSONC");
  });
});
