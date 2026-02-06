import { readFile as readFileFs } from "node:fs/promises";
import { parse as parseJsonc, type ParseErrorCode, type ParseError as JsoncParseError } from "jsonc-parser";

import {
  parseGaiaConfig,
  parseGaiaConfigPatch,
  type AgentOverride,
  type GaiaConfig,
  type GaiaConfigPatch,
} from "./schema.js";

export interface LoadGaiaConfigOptions {
  repoRoot: string;
  homeDir?: string;
  localConfigPath?: string;
  globalConfigPath?: string;
  readFile?: (filePath: string) => Promise<string>;
}

type ReadFileFn = (filePath: string) => Promise<string>;

function defaultReadFile(filePath: string): Promise<string> {
  return readFileFs(filePath, "utf8");
}

function isMissingFileError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message.toLowerCase();
  return (
    message.includes("enoent") ||
    message.includes("no such file") ||
    message.includes("not found")
  );
}

function joinPath(...parts: string[]): string {
  return parts
    .filter((part) => part.length > 0)
    .join("/")
    .replace(/\/+/g, "/");
}

function formatJsoncError(code: ParseErrorCode, offset: number): string {
  return `Invalid JSONC (${code}) at offset ${offset}`;
}

function parseJsoncStrict(raw: string): unknown {
  const errors: JsoncParseError[] = [];
  const parsed = parseJsonc(raw, errors, {
    allowTrailingComma: true,
    disallowComments: false,
    allowEmptyContent: false,
  });

  if (errors.length > 0) {
    const first = errors[0];
    if (!first) {
      throw new Error("Invalid JSONC");
    }

    throw new Error(formatJsoncError(first.error, first.offset));
  }

  return parsed;
}

function mergeAgentOverrides(
  base: Record<string, AgentOverride>,
  patch: Record<string, AgentOverride>,
): Record<string, AgentOverride> {
  const merged: Record<string, AgentOverride> = { ...base };

  for (const [agent, override] of Object.entries(patch)) {
    merged[agent] = {
      ...(merged[agent] ?? {}),
      ...override,
    };
  }

  return merged;
}

function mergePatch(base: GaiaConfigPatch, patch: GaiaConfigPatch): GaiaConfigPatch {
  return {
    ...base,
    ...patch,
    operationProfile: {
      ...(base.operationProfile ?? {}),
      ...(patch.operationProfile ?? {}),
    },
    startup: {
      ...(base.startup ?? {}),
      ...(patch.startup ?? {}),
    },
    gaiaContext: {
      ...(base.gaiaContext ?? {}),
      ...(patch.gaiaContext ?? {}),
    },
    unitPolicy: {
      ...(base.unitPolicy ?? {}),
      ...(patch.unitPolicy ?? {}),
    },
    autopilotSafeguards: {
      ...(base.autopilotSafeguards ?? {}),
      ...(patch.autopilotSafeguards ?? {}),
    },
    agents: mergeAgentOverrides(base.agents ?? {}, patch.agents ?? {}),
  };
}

async function readPatchIfPresent(
  filePath: string,
  readFile: ReadFileFn,
): Promise<GaiaConfigPatch> {
  try {
    const raw = await readFile(filePath);
    return parseGaiaConfigPatch(parseJsoncStrict(raw));
  } catch (error) {
    if (isMissingFileError(error)) {
      return {};
    }

    throw error;
  }
}

export async function loadGaiaConfig(options: LoadGaiaConfigOptions): Promise<GaiaConfig> {
  const readFile = options.readFile ?? defaultReadFile;
  const homeDir = options.homeDir ?? process.env.HOME;
  const localPath = options.localConfigPath ?? joinPath(options.repoRoot, ".gaia", "config.jsonc");
  const globalPath =
    options.globalConfigPath ??
    (homeDir ? joinPath(homeDir, ".config", "opencode", "gaia.jsonc") : "");

  const globalPatch = globalPath.length > 0 ? await readPatchIfPresent(globalPath, readFile) : {};
  const localPatch = await readPatchIfPresent(localPath, readFile);
  const mergedPatch = mergePatch(globalPatch, localPatch);

  return parseGaiaConfig(mergedPatch);
}
