import { describe, expect, test } from "bun:test";

import { buildSandboxEnv, buildSandboxPaths } from "./paths";

describe("buildSandboxPaths", () => {
  test("creates deterministic sandbox path map", () => {
    const paths = buildSandboxPaths("/repo");

    expect(paths.sandboxDir).toBe("/repo/.sandbox");
    expect(paths.homeDir).toBe("/repo/.sandbox/home");
    expect(paths.opencodeConfigDir).toBe("/repo/.sandbox/opencode");
    expect(paths.opencodeConfigPath).toBe("/repo/.sandbox/opencode/opencode.jsonc");
    expect(paths.pluginTargetPath).toBe("/repo/.sandbox/opencode/plugins/gaia-plugin.ts");
  });
});

describe("buildSandboxEnv", () => {
  test("overrides environment for sandbox isolation", () => {
    const paths = buildSandboxPaths("/repo");
    const env = buildSandboxEnv(paths, { PATH: "/usr/bin" });

    expect(env.HOME).toBe(paths.homeDir);
    expect(env.OPENCODE_CONFIG_DIR).toBe(paths.opencodeConfigDir);
    expect(env.OPENCODE_CONFIG).toBe(paths.opencodeConfigPath);
    expect(env.OPENCODE_DISABLE_CLAUDE_CODE).toBe("1");
    expect(env.PATH).toBe("/usr/bin");
  });
});
