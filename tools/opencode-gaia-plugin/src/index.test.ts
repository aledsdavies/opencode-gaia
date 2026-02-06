import { describe, expect, test } from "bun:test";

import { getPluginBanner, PLUGIN_NAME, PROJECT_PHASE } from "./index";

describe("plugin scaffold", () => {
  test("exports stable plugin name", () => {
    expect(PLUGIN_NAME).toBe("opencode-gaia-plugin");
  });

  test("marks project as pre-alpha", () => {
    expect(PROJECT_PHASE).toBe("pre-alpha");
  });

  test("renders deterministic banner", () => {
    expect(getPluginBanner()).toBe("opencode-gaia-plugin (pre-alpha)");
  });
});
