import type { AgentKey, AgentModelConfig } from "../agents/types.js";

export const AGENT_DEFAULTS: Record<AgentKey, AgentModelConfig> = {
  gaia: {
    model: "openai/gpt-5.3-codex",
    fallback: ["kimi-for-coding/k2p5", "zhipuai-coding-plan/glm-4.7"],
    temperature: 0.2,
    reasoningEffort: "medium",
  },
  minerva: {
    model: "zhipuai-coding-plan/glm-4.7",
    fallback: ["zhipuai-coding-plan/glm-4.6", "kimi-for-coding/k2p5"],
    temperature: 0.1,
  },
  apollo: {
    model: "zhipuai-coding-plan/glm-4.7",
    fallback: ["kimi-for-coding/k2p5", "zhipuai-coding-plan/glm-4.6"],
    temperature: 0.1,
  },
  eleuthia: {
    model: "kimi-for-coding/k2p5",
    fallback: ["zhipuai-coding-plan/glm-4.7"],
    temperature: 0.2,
  },
  hephaestus: {
    model: "openai/gpt-5.3-codex",
    fallback: ["openai/gpt-5.2-codex", "kimi-for-coding/k2p5"],
    temperature: 0.1,
    reasoningEffort: "medium",
  },
  demeter: {
    model: "zhipuai-coding-plan/glm-4.7",
    fallback: ["zhipuai-coding-plan/glm-4.6"],
    temperature: 0.1,
  },
  artemis: {
    model: "openai/gpt-5.2-codex",
    fallback: ["kimi-for-coding/k2p5", "zhipuai-coding-plan/glm-4.7"],
    temperature: 0.1,
  },
  aether: {
    model: "zhipuai-coding-plan/glm-4.7",
    fallback: ["zhipuai-coding-plan/glm-4.6"],
    temperature: 0.1,
  },
  poseidon: {
    model: "kimi-for-coding/k2p5",
    fallback: ["zhipuai-coding-plan/glm-4.7"],
    temperature: 0.1,
  },
  hades: {
    model: "openai/gpt-5.2",
    fallback: ["kimi-for-coding/kimi-k2-thinking", "kimi-for-coding/k2p5"],
    temperature: 0.2,
    reasoningEffort: "medium",
  },
};
