import type { AgentKey, AgentModelConfig } from "../agents/types.js";

export const AGENT_DEFAULTS: Record<AgentKey, AgentModelConfig> = {
  gaia: {
    model: "opencode/kimi-k2.5-free",
    fallback: ["opencode/trinity-large-preview-free", "opencode/glm-4.7-free"],
    temperature: 0.2,
  },
  athena: {
    model: "opencode/glm-4.7-free",
    fallback: ["opencode/minimax-m2.1-free", "opencode/kimi-k2.5-free"],
    temperature: 0.1,
  },
  hephaestus: {
    model: "opencode/kimi-k2.5-free",
    fallback: ["opencode/glm-4.7-free", "opencode/minimax-m2.1-free"],
    temperature: 0.1,
  },
  demeter: {
    model: "opencode/minimax-m2.1-free",
    fallback: ["opencode/glm-4.7-free"],
    temperature: 0.1,
  },
};
