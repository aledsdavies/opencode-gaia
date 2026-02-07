import { tool, type Plugin } from "@opencode-ai/plugin";

import { loadGaiaConfig } from "../../../tools/opencode-gaia-plugin/src/config/loader.ts";
import {
  applyGaiaRuntimeConfig,
  runDelegateGaiaTool,
  runGaiaInit,
} from "../../../tools/opencode-gaia-plugin/src/index.ts";

const LEAN_AGENTS = ["gaia", "minerva", "hephaestus", "demeter"] as const;

function resolveRepoRoot(context: { directory: string; worktree: string }): string {
  if (context.worktree && context.worktree !== "/") {
    return context.worktree;
  }

  return context.directory;
}

export const GaiaPlugin: Plugin = async () => {
  return {
    config: async (config) => {
      applyGaiaRuntimeConfig(config);
    },
    tool: {
      gaia_init: tool({
        description: "Create or refresh .gaia/gaia-init.md safely",
        args: {
          refresh: tool.schema.boolean().optional(),
          content: tool.schema.string().optional(),
          mission: tool.schema.string().optional(),
          productContext: tool.schema.array(tool.schema.string()).optional(),
          successSignals: tool.schema.array(tool.schema.string()).optional(),
          constraints: tool.schema.array(tool.schema.string()).optional(),
          nonGoals: tool.schema.array(tool.schema.string()).optional(),
          riskTolerance: tool.schema.enum(["low", "medium", "high"]).optional(),
          decisionModel: tool.schema.array(tool.schema.string()).optional(),
          qualityBar: tool.schema.array(tool.schema.string()).optional(),
          communicationContract: tool.schema.array(tool.schema.string()).optional(),
          notes: tool.schema.array(tool.schema.string()).optional(),
        },
        async execute(args, context) {
          const repoRoot = resolveRepoRoot(context);
          const config = await loadGaiaConfig({ repoRoot });

          const result = await runGaiaInit({
            repoRoot,
            mode: config.mode,
            ...(args.refresh !== undefined ? { refresh: args.refresh } : {}),
            ...(args.content ? { content: args.content } : {}),
            answers: {
              ...(args.mission ? { mission: args.mission } : {}),
              ...(args.productContext ? { productContext: args.productContext } : {}),
              ...(args.successSignals ? { successSignals: args.successSignals } : {}),
              ...(args.constraints ? { constraints: args.constraints } : {}),
              ...(args.nonGoals ? { nonGoals: args.nonGoals } : {}),
              ...(args.riskTolerance ? { riskTolerance: args.riskTolerance } : {}),
              ...(args.decisionModel ? { decisionModel: args.decisionModel } : {}),
              ...(args.qualityBar ? { qualityBar: args.qualityBar } : {}),
              ...(args.communicationContract
                ? { communicationContract: args.communicationContract }
                : {}),
              ...(args.notes ? { notes: args.notes } : {}),
            },
          });

          return JSON.stringify(result, null, 2);
        },
      }),
      delegate_gaia: tool({
        description: "Parse delegated GAIA contract output and persist .gaia work-unit artifacts",
        args: {
          workUnit: tool.schema.string().min(1),
          sessionId: tool.schema.string().min(1),
          modelUsed: tool.schema.string().min(1),
          agent: tool.schema.enum(LEAN_AGENTS),
          responseText: tool.schema.string().min(1),
          retryResponseText: tool.schema.string().optional(),
          plan: tool.schema.string().optional(),
          log: tool.schema.string().optional(),
          decisions: tool.schema.string().optional(),
        },
        async execute(args, context) {
          const repoRoot = resolveRepoRoot(context);
          const config = await loadGaiaConfig({ repoRoot });

          const result = await runDelegateGaiaTool({
            repoRoot,
            mode: config.mode,
            workUnit: args.workUnit,
            sessionId: args.sessionId,
            modelUsed: args.modelUsed,
            agent: args.agent,
            responseText: args.responseText,
            ...(args.retryResponseText
              ? { retry: async () => args.retryResponseText as string }
              : {}),
            artifacts: {
              ...(args.plan ? { plan: args.plan } : {}),
              ...(args.log ? { log: args.log } : {}),
              ...(args.decisions ? { decisions: args.decisions } : {}),
            },
          });

          return JSON.stringify(result, null, 2);
        },
      }),
    },
  };
};
