import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export interface SandboxPaths {
  repoRoot: string;
  sandboxDir: string;
  homeDir: string;
  xdgConfigHome: string;
  xdgCacheHome: string;
  xdgDataHome: string;
  opencodeConfigDir: string;
  opencodeConfigPath: string;
  pluginTemplatePath: string;
  pluginTargetPath: string;
  sandboxPackageJsonPath: string;
}

export function resolveRepoRoot(): string {
  const currentFile = fileURLToPath(import.meta.url);
  return resolve(dirname(currentFile), "../../..");
}

export function buildSandboxPaths(repoRoot: string): SandboxPaths {
  const sandboxDir = resolve(repoRoot, ".sandbox");
  const homeDir = resolve(sandboxDir, "home");
  const opencodeConfigDir = resolve(sandboxDir, "opencode");

  return {
    repoRoot,
    sandboxDir,
    homeDir,
    xdgConfigHome: resolve(homeDir, ".config"),
    xdgCacheHome: resolve(homeDir, ".cache"),
    xdgDataHome: resolve(homeDir, ".local/share"),
    opencodeConfigDir,
    opencodeConfigPath: resolve(opencodeConfigDir, "opencode.jsonc"),
    pluginTemplatePath: resolve(repoRoot, "tools/opencode-gaia-harness/templates/gaia-plugin.ts"),
    pluginTargetPath: resolve(opencodeConfigDir, "plugins/gaia-plugin.ts"),
    sandboxPackageJsonPath: resolve(opencodeConfigDir, "package.json"),
  };
}

export function buildSandboxEnv(
  paths: SandboxPaths,
  baseEnv: NodeJS.ProcessEnv = process.env,
): NodeJS.ProcessEnv {
  return {
    ...baseEnv,
    HOME: paths.homeDir,
    XDG_CONFIG_HOME: paths.xdgConfigHome,
    XDG_CACHE_HOME: paths.xdgCacheHome,
    XDG_DATA_HOME: paths.xdgDataHome,
    OPENCODE_CONFIG_DIR: paths.opencodeConfigDir,
    OPENCODE_CONFIG: paths.opencodeConfigPath,
    OPENCODE_DISABLE_CLAUDE_CODE: "1",
    OPENCODE_DISABLE_CLAUDE_CODE_PROMPT: "1",
    OPENCODE_DISABLE_CLAUDE_CODE_SKILLS: "1",
  };
}
