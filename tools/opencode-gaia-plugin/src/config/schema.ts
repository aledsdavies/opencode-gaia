import { z } from "zod";

const ModeSchema = z.enum(["supervised", "autopilot", "locked"]);
const AgentSetSchema = z.enum(["lean", "full", "custom"]);
const CustomAgentSchema = z.enum(["athena", "hephaestus", "demeter"]);

const ThinkingSchema = z.object({
  type: z.literal("enabled"),
  budgetTokens: z.number().int().positive(),
});

const AgentOverrideShape = {
  model: z.string().min(1).optional(),
  fallback: z.array(z.string().min(1)).optional(),
  temperature: z.number().min(0).max(2).optional(),
  reasoningEffort: z.enum(["low", "medium", "high"]).optional(),
  thinking: ThinkingSchema.optional(),
  maxTokens: z.number().int().positive().optional(),
  disabled: z.boolean().optional(),
  prompt_append: z.string().optional(),
  prompt: z.string().optional(),
} as const;

export const AgentOverrideSchema = z.object(AgentOverrideShape);
export const AgentOverridePatchSchema = z.object(AgentOverrideShape);

export const GaiaConfigSchema = z.object({
  mode: ModeSchema.default("supervised"),
  operationProfile: z
    .object({
      agentSet: AgentSetSchema.default("lean"),
      customAgents: z.array(CustomAgentSchema).optional(),
    })
    .superRefine((value, context) => {
      if (value.agentSet !== "custom" && value.customAgents) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: "customAgents is only allowed when agentSet is custom",
          path: ["customAgents"],
        });
      }
    })
    .default({
      agentSet: "lean",
    }),
  agents: z.record(AgentOverrideSchema).default({}),
});

export const GaiaConfigPatchSchema = z.object({
  mode: ModeSchema.optional(),
  operationProfile: z
    .object({
      agentSet: AgentSetSchema.optional(),
      customAgents: z.array(CustomAgentSchema).optional(),
    })
    .optional(),
  agents: z.record(AgentOverridePatchSchema).optional(),
});

export type AgentOverride = z.infer<typeof AgentOverrideSchema>;
export type GaiaConfig = z.infer<typeof GaiaConfigSchema>;
export type GaiaConfigPatch = z.infer<typeof GaiaConfigPatchSchema>;

export function parseGaiaConfig(input: unknown): GaiaConfig {
  return GaiaConfigSchema.parse(input);
}

export function parseGaiaConfigPatch(input: unknown): GaiaConfigPatch {
  return GaiaConfigPatchSchema.parse(input);
}
