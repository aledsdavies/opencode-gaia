import { collectResults, type CollectResultsSummary } from "../tools/collect-results.js";
import { delegateGaia, type DelegateGaiaResult } from "../tools/delegate-gaia.js";
import { type PlanGaiaPaths, writePlanGaia } from "../tools/plan-gaia.js";

export interface ProcessWorkUnitArgs<TParsed> {
  repoRoot: string;
  workUnit: string;
  sessionId: string;
  modelUsed: string;
  responseText: string;
  parse: (input: unknown) => TParsed;
  retry?: () => Promise<string>;
  plan: string;
  log: string;
  decisions: string;
}

export interface ProcessWorkUnitResult<TParsed> {
  delegation: DelegateGaiaResult<TParsed>;
  collection: CollectResultsSummary<TParsed>;
  paths: PlanGaiaPaths;
}

export async function processWorkUnit<TParsed>(
  args: ProcessWorkUnitArgs<TParsed>,
): Promise<ProcessWorkUnitResult<TParsed>> {
  const delegateArgs = {
    sessionId: args.sessionId,
    modelUsed: args.modelUsed,
    responseText: args.responseText,
    parse: args.parse,
    ...(args.retry ? { retry: args.retry } : {}),
  };

  const delegation = await delegateGaia({
    ...delegateArgs,
  });

  const collection = collectResults([delegation]);
  const paths = await writePlanGaia({
    repoRoot: args.repoRoot,
    workUnit: args.workUnit,
    plan: args.plan,
    log: args.log,
    decisions: args.decisions,
  });

  return {
    delegation,
    collection,
    paths,
  };
}
