import type { GaiaConfig, AgentOverride } from "../config/schema.js";

import { LEAN_AGENT_PROMPTS } from "./prompts.js";
import type {
  AgentKey,
  AgentModelConfig,
  AgentRuntimeConfig,
  LeanAgentKey,
} from "./types.js";

export const LEAN_AGENT_KEYS: readonly LeanAgentKey[] = [
  "gaia",
  "minerva",
  "hephaestus",
  "demeter",
] as const;

export const ALL_AGENT_KEYS: readonly AgentKey[] = [
  "gaia",
  "minerva",
  "apollo",
  "eleuthia",
  "hephaestus",
  "demeter",
  "artemis",
  "aether",
  "poseidon",
  "hades",
] as const;

export type LeanAgentRegistry = Record<LeanAgentKey, AgentRuntimeConfig>;

export interface CreateLeanAgentRegistryArgs {
  config: GaiaConfig;
  defaults: Record<AgentKey, AgentModelConfig>;
}

function mergeModelConfig(base: AgentModelConfig, override?: AgentOverride): AgentModelConfig {
  const merged: AgentModelConfig = {
    model: override?.model ?? base.model,
    fallback: override?.fallback ?? base.fallback,
    temperature: override?.temperature ?? base.temperature,
  };

  const reasoningEffort = override?.reasoningEffort ?? base.reasoningEffort;
  if (reasoningEffort !== undefined) {
    merged.reasoningEffort = reasoningEffort;
  }

  const thinking = override?.thinking ?? base.thinking;
  if (thinking !== undefined) {
    merged.thinking = thinking;
  }

  const maxTokens = override?.maxTokens ?? base.maxTokens;
  if (maxTokens !== undefined) {
    merged.maxTokens = maxTokens;
  }

  return merged;
}

function mergePrompt(basePrompt: string, override?: AgentOverride): string {
  const prompt = override?.prompt ?? basePrompt;

  if (!override?.prompt_append) {
    return prompt;
  }

  return `${prompt}\n\n${override.prompt_append}`;
}

function resolveCustomLeanAgentKeys(config: GaiaConfig): AgentKey[] {
  const subsystemConfig = config.operationProfile.customSubsystems;
  if (!subsystemConfig) {
    throw new Error("custom operation profile requires customSubsystems");
  }

  const result: AgentKey[] = ["gaia"];

  if (subsystemConfig.reconRouting) {
    result.push("minerva");
  }

  if (subsystemConfig.implementation) {
    result.push("hephaestus");
  }

  if (subsystemConfig.projectMemory) {
    result.push("demeter");
  }

  return result;
}

export function resolveOperationAgentKeys(config: GaiaConfig): AgentKey[] {
  switch (config.operationProfile.agentSet) {
    case "lean":
      return [...LEAN_AGENT_KEYS];
    case "full":
      return [...ALL_AGENT_KEYS];
    case "custom": {
      return resolveCustomLeanAgentKeys(config);
    }
    default: {
      const unreachable: never = config.operationProfile.agentSet;
      throw new Error(`Unsupported operation profile: ${unreachable}`);
    }
  }
}

export function createLeanAgentRegistry(args: CreateLeanAgentRegistryArgs): LeanAgentRegistry {
  const registry: Partial<LeanAgentRegistry> = {};

  for (const agent of LEAN_AGENT_KEYS) {
    const baseModelConfig = args.defaults[agent];

    if (!baseModelConfig) {
      throw new Error(`Missing default model config for agent: ${agent}`);
    }

    const override = args.config.agents[agent];
    registry[agent] = {
      modelConfig: mergeModelConfig(baseModelConfig, override),
      prompt: mergePrompt(LEAN_AGENT_PROMPTS[agent], override),
      disabled: override?.disabled ?? false,
    };
  }

  return registry as LeanAgentRegistry;
}
