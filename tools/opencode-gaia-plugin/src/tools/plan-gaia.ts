import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const WORK_UNIT_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;

export interface PlanGaiaPaths {
  base_dir: string;
  plan_path: string;
  log_path: string;
  decisions_path: string;
}

export interface PlanGaiaWriteArgs {
  repoRoot: string;
  workUnit: string;
  plan: string;
  log: string;
  decisions: string;
}

export interface PlanGaiaReadArgs {
  repoRoot: string;
  workUnit: string;
}

export interface PlanGaiaReadResult {
  plan: string;
  log: string;
  decisions: string;
}

function validateWorkUnit(workUnit: string): void {
  if (!WORK_UNIT_PATTERN.test(workUnit)) {
    throw new Error(`Invalid work unit: ${workUnit}`);
  }
}

export function getPlanGaiaPaths(repoRoot: string, workUnit: string): PlanGaiaPaths {
  validateWorkUnit(workUnit);

  const baseDir = join(repoRoot, ".gaia", workUnit);
  return {
    base_dir: baseDir,
    plan_path: join(baseDir, "plan.md"),
    log_path: join(baseDir, "log.md"),
    decisions_path: join(baseDir, "decisions.md"),
  };
}

export async function writePlanGaia(args: PlanGaiaWriteArgs): Promise<PlanGaiaPaths> {
  const paths = getPlanGaiaPaths(args.repoRoot, args.workUnit);
  await mkdir(paths.base_dir, { recursive: true });

  await Promise.all([
    writeFile(paths.plan_path, args.plan, "utf8"),
    writeFile(paths.log_path, args.log, "utf8"),
    writeFile(paths.decisions_path, args.decisions, "utf8"),
  ]);

  return paths;
}

export async function readPlanGaia(args: PlanGaiaReadArgs): Promise<PlanGaiaReadResult> {
  const paths = getPlanGaiaPaths(args.repoRoot, args.workUnit);
  const [plan, log, decisions] = await Promise.all([
    readFile(paths.plan_path, "utf8"),
    readFile(paths.log_path, "utf8"),
    readFile(paths.decisions_path, "utf8"),
  ]);

  return { plan, log, decisions };
}
