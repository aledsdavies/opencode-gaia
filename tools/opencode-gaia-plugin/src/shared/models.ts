import type { AgentKey, AgentModelConfig } from "../agents/types.js";
import type { AgentOverride } from "../config/schema.js";

export type ModelResolutionSource =
  | "override"
  | "default"
  | "fallback"
  | "system"
  | "first_available";

export interface ResolveModelArgs {
  agent: AgentKey;
  defaults: Record<AgentKey, AgentModelConfig>;
  agentOverride?: AgentOverride;
  availableModels: ReadonlySet<string>;
  systemDefaultModel?: string;
}

export interface ResolvedModel {
  model: string;
  source: ModelResolutionSource;
  attempted: string[];
}

function isAvailable(model: string, availableModels: ReadonlySet<string>): boolean {
  return availableModels.size === 0 || availableModels.has(model);
}

export function resolveModel(args: ResolveModelArgs): ResolvedModel {
  const defaultConfig = args.defaults[args.agent];
  const attempted: string[] = [];

  const pushAttempt = (value: string | undefined): string | undefined => {
    if (!value || value.length === 0) {
      return undefined;
    }

    attempted.push(value);
    return value;
  };

  const overrideModel = pushAttempt(args.agentOverride?.model);
  if (overrideModel && isAvailable(overrideModel, args.availableModels)) {
    return { model: overrideModel, source: "override", attempted };
  }

  const defaultModel = pushAttempt(defaultConfig.model);
  if (!defaultModel) {
    throw new Error(`No default model configured for agent: ${args.agent}`);
  }

  if (isAvailable(defaultModel, args.availableModels)) {
    return { model: defaultModel, source: "default", attempted };
  }

  const overrideFallback = args.agentOverride?.fallback;
  const fallbackChain = overrideFallback && overrideFallback.length > 0
    ? overrideFallback
    : defaultConfig.fallback;

  for (const fallbackModel of fallbackChain) {
    const candidate = pushAttempt(fallbackModel);
    if (candidate && isAvailable(candidate, args.availableModels)) {
      return { model: candidate, source: "fallback", attempted };
    }
  }

  const systemDefaultModel = pushAttempt(args.systemDefaultModel);
  if (systemDefaultModel && isAvailable(systemDefaultModel, args.availableModels)) {
    return { model: systemDefaultModel, source: "system", attempted };
  }

  const firstAvailable = args.availableModels.values().next().value;
  if (typeof firstAvailable === "string" && firstAvailable.length > 0) {
    attempted.push(firstAvailable);
    return {
      model: firstAvailable,
      source: "first_available",
      attempted,
    };
  }

  return {
    model: defaultModel,
    source: "default",
    attempted,
  };
}
