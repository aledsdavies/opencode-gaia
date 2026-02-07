import { z } from "zod";

const ModeSchema = z.enum(["supervised", "autopilot", "locked"]);
const VisibilitySchema = z.enum(["live", "checkpoint", "quiet"]);
const InteractionSchema = z.enum(["standard", "pair"]);
const CheckinCadenceSchema = z.enum(["step", "batch", "unit", "milestone"]);
const ReviewDepthSchema = z.enum(["inline", "diff", "risk", "deep_repo"]);
const AgentSetSchema = z.enum(["lean", "full", "custom"]);
const LeanSubsystemKeySchema = z.enum([
  "reconRouting",
  "implementation",
  "projectMemory",
]);
const DefaultProfileSchema = z.enum([
  "pair_live",
  "pair_batched",
  "pair_ramp",
  "agentic_checkpoint",
  "agentic_full",
  "standard",
]);

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
  visibility: VisibilitySchema.default("checkpoint"),
  interaction: InteractionSchema.default("standard"),
  checkinCadence: CheckinCadenceSchema.default("unit"),
  reviewDepth: ReviewDepthSchema.default("diff"),
  operationProfile: z
    .object({
      agentSet: AgentSetSchema.default("lean"),
      customSubsystems: z.record(LeanSubsystemKeySchema, z.boolean()).optional(),
    })
    .superRefine((value, context) => {
      if (value.agentSet === "custom") {
        if (!value.customSubsystems) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            message: "customSubsystems is required when agentSet is custom",
            path: ["customSubsystems"],
          });
          return;
        }

      }

      if (value.agentSet !== "custom" && value.customSubsystems) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: "customSubsystems is only allowed when agentSet is custom",
          path: ["customSubsystems"],
        });
      }
    })
    .default({
      agentSet: "lean",
    }),
  startup: z
    .object({
      askAtTaskStart: z.boolean().default(true),
      defaultProfile: DefaultProfileSchema.optional(),
      rampWarmupBatches: z.number().int().positive().default(2),
    })
    .default({ askAtTaskStart: true, rampWarmupBatches: 2 }),
  gaiaContext: z
    .object({
      initFile: z.string().default(".gaia/gaia-init.md"),
      gaiaInstructionFile: z.string().default("GAIA.md"),
      useLearnings: z.boolean().default(true),
      accountFor: z.array(z.string()).optional(),
      avoid: z.array(z.string()).optional(),
      extraContextFiles: z.array(z.string()).optional(),
    })
    .default({
      initFile: ".gaia/gaia-init.md",
      gaiaInstructionFile: "GAIA.md",
      useLearnings: true,
    }),
  unitPolicy: z
    .object({
      enforceUnitId: z.boolean().default(true),
      boundaryRule: z
        .enum(["implementation+basic_checks", "manual"])
        .default("implementation+basic_checks"),
    })
    .default({
      enforceUnitId: true,
      boundaryRule: "implementation+basic_checks",
    }),
  autopilotSafeguards: z
    .object({
      maxToolCallsPerUnit: z.number().int().positive().default(40),
      maxUnitMinutes: z.number().int().positive().default(20),
      maxBackgroundTasks: z.number().int().positive().default(3),
      consecutiveFailureLimit: z.number().int().positive().default(3),
      onFailureLimit: z.enum(["checkpoint", "supervised_pause"]).default("checkpoint"),
    })
    .default({
      maxToolCallsPerUnit: 40,
      maxUnitMinutes: 20,
      maxBackgroundTasks: 3,
      consecutiveFailureLimit: 3,
      onFailureLimit: "checkpoint",
    }),
  agents: z.record(AgentOverrideSchema).default({}),
});

export const GaiaConfigPatchSchema = z.object({
  mode: ModeSchema.optional(),
  visibility: VisibilitySchema.optional(),
  interaction: InteractionSchema.optional(),
  checkinCadence: CheckinCadenceSchema.optional(),
  reviewDepth: ReviewDepthSchema.optional(),
  operationProfile: z
    .object({
      agentSet: AgentSetSchema.optional(),
      customSubsystems: z.record(LeanSubsystemKeySchema, z.boolean()).optional(),
    })
    .optional(),
  startup: z
    .object({
      askAtTaskStart: z.boolean().optional(),
      defaultProfile: DefaultProfileSchema.optional(),
      rampWarmupBatches: z.number().int().positive().optional(),
    })
    .optional(),
  gaiaContext: z
    .object({
      initFile: z.string().optional(),
      gaiaInstructionFile: z.string().optional(),
      useLearnings: z.boolean().optional(),
      accountFor: z.array(z.string()).optional(),
      avoid: z.array(z.string()).optional(),
      extraContextFiles: z.array(z.string()).optional(),
    })
    .optional(),
  unitPolicy: z
    .object({
      enforceUnitId: z.boolean().optional(),
      boundaryRule: z.enum(["implementation+basic_checks", "manual"]).optional(),
    })
    .optional(),
  autopilotSafeguards: z
    .object({
      maxToolCallsPerUnit: z.number().int().positive().optional(),
      maxUnitMinutes: z.number().int().positive().optional(),
      maxBackgroundTasks: z.number().int().positive().optional(),
      consecutiveFailureLimit: z.number().int().positive().optional(),
      onFailureLimit: z.enum(["checkpoint", "supervised_pause"]).optional(),
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
