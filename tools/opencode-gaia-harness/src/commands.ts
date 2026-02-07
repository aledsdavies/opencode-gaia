import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";

import { bootstrapSandbox } from "./bootstrap.js";
import type { ExecFn } from "./exec.js";
import { fileExists } from "./fs.js";
import { runOpenCode } from "./opencode.js";
import {
  buildSuiteSteps,
  getBugHarnessPermission,
  getSmokePermission,
  type SuiteMode,
} from "./plans.js";

const DEFAULT_MODEL = "opencode/kimi-k2.5-free";
const DEFAULT_BUG_REPORT = "doc/bug-report.example.md";
const DEFAULT_SMOKE_PROMPT =
  "Verify sandbox setup, list relevant files, and suggest one next coding unit.";
const DEFAULT_LIST_TIMEOUT_MS = 60_000;
const DEFAULT_SMOKE_TIMEOUT_MS = 180_000;
const DEFAULT_GAIA_INIT_TIMEOUT_MS = 180_000;
const DEFAULT_BUG_TIMEOUT_MS = 600_000;

function selectedModel(envName: string): string {
  return process.env[envName] ?? DEFAULT_MODEL;
}

function getPort(): string {
  return process.env.OPENCODE_PORT ?? "4096";
}

function parseTimeoutMs(value: string | undefined): number | undefined {
  if (!value) {
    return undefined;
  }

  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return undefined;
  }

  return parsed;
}

function timeoutMsFromEnv(envName: string, fallback: number): number {
  return parseTimeoutMs(process.env[envName]) ?? fallback;
}

function resolveBugReportPath(repoRoot: string, value: string | undefined): string {
  return resolve(repoRoot, value ?? DEFAULT_BUG_REPORT);
}

export interface CommandContext {
  repoRoot: string;
  exec?: ExecFn;
}

interface GaiaInitRunner {
  runGaiaInit: (args: { repoRoot: string; mode?: "supervised" | "autopilot" | "locked" }) => Promise<unknown>;
}

function withExec(exec: ExecFn | undefined): { exec?: ExecFn } {
  return exec ? { exec } : {};
}

function withTimeout(timeoutMs: number | undefined): { timeoutMs?: number } {
  return timeoutMs !== undefined ? { timeoutMs } : {};
}

export async function commandBootstrap(context: CommandContext): Promise<void> {
  await bootstrapSandbox({
    repoRoot: context.repoRoot,
    ...withExec(context.exec),
  });
}

export async function commandOpenCode(
  context: CommandContext,
  args: string[],
): Promise<void> {
  await runOpenCode({
    repoRoot: context.repoRoot,
    args,
    stdio: "inherit",
    ...withTimeout(parseTimeoutMs(process.env.OPENCODE_TIMEOUT_MS)),
    ...withExec(context.exec),
  });
}

export async function commandListFreeModels(context: CommandContext): Promise<void> {
  const result = await runOpenCode({
    repoRoot: context.repoRoot,
    args: ["models"],
    stdio: "pipe",
    timeoutMs: timeoutMsFromEnv("OPENCODE_LIST_TIMEOUT_MS", DEFAULT_LIST_TIMEOUT_MS),
    ...withExec(context.exec),
  });

  const lines = result.stdout
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.includes("-free"));

  for (const line of lines) {
    console.log(line);
  }
}

export async function commandSmoke(context: CommandContext, prompt?: string): Promise<void> {
  await runOpenCode({
    repoRoot: context.repoRoot,
    args: [
      "run",
      "--agent",
      "build",
      "--model",
      selectedModel("OPENCODE_SMOKE_MODEL"),
      prompt ?? DEFAULT_SMOKE_PROMPT,
    ],
    stdio: "inherit",
    timeoutMs: timeoutMsFromEnv("OPENCODE_SMOKE_TIMEOUT_MS", DEFAULT_SMOKE_TIMEOUT_MS),
    envOverrides: {
      OPENCODE_PERMISSION: process.env.OPENCODE_PERMISSION ?? getSmokePermission(),
    },
    ...withExec(context.exec),
  });
}

export async function commandBug(context: CommandContext, bugReport?: string): Promise<void> {
  const reportPath = resolveBugReportPath(context.repoRoot, bugReport);
  if (!(await fileExists(reportPath))) {
    throw new Error(`Bug report file not found: ${reportPath}`);
  }

  const prompt =
    "You are running a bug reproduction harness. Read the attached bug report and follow this flow exactly: " +
    "(1) write a failing reproducer test using real values and exact assertions, " +
    "(2) implement the minimal fix, (3) run tests, (4) summarize why the bug is now covered against regression. " +
    "Keep tests low-mock and low-orchestration.";

  await runOpenCode({
    repoRoot: context.repoRoot,
    args: [
      "run",
      "--agent",
      "build",
      "--model",
      selectedModel("OPENCODE_HARNESS_MODEL"),
      "-f",
      reportPath,
      prompt,
    ],
    stdio: "inherit",
    timeoutMs: timeoutMsFromEnv("OPENCODE_BUG_TIMEOUT_MS", DEFAULT_BUG_TIMEOUT_MS),
    envOverrides: {
      OPENCODE_PERMISSION: process.env.OPENCODE_PERMISSION ?? getBugHarnessPermission(),
    },
    ...withExec(context.exec),
  });
}

export async function commandGaiaInitSmoke(context: CommandContext): Promise<void> {
  await runOpenCode({
    repoRoot: context.repoRoot,
    args: [
      "run",
      "--agent",
      "build",
      "--model",
      selectedModel("OPENCODE_SMOKE_MODEL"),
      "Use the gaia_init tool now with refresh=false. Return only whether it succeeded.",
    ],
    stdio: "inherit",
    timeoutMs: timeoutMsFromEnv("OPENCODE_GAIA_INIT_TIMEOUT_MS", DEFAULT_GAIA_INIT_TIMEOUT_MS),
    envOverrides: {
      OPENCODE_PERMISSION: process.env.OPENCODE_PERMISSION ?? getBugHarnessPermission(),
    },
    ...withExec(context.exec),
  });

  const initPath = resolve(context.repoRoot, ".gaia/gaia-init.md");
  if (!(await fileExists(initPath))) {
    throw new Error(`gaia_init smoke failed: ${initPath} not found`);
  }

  console.log(`gaia_init smoke succeeded: ${initPath}`);
}

export async function commandLockedSmoke(context: CommandContext): Promise<void> {
  const tmpWorktree = await mkdtemp(resolve(tmpdir(), "gaia-locked-"));

  try {
    await mkdir(resolve(tmpWorktree, ".gaia"), { recursive: true });

    const gaiaModulePath = new URL("../../opencode-gaia-plugin/src/index.ts", import.meta.url).href;
    const gaiaModule = (await import(gaiaModulePath)) as GaiaInitRunner;

    await expectLockedError(async () => {
      await gaiaModule.runGaiaInit({
        repoRoot: tmpWorktree,
        mode: "locked",
      });
    });

    if (await fileExists(resolve(tmpWorktree, ".gaia/gaia-init.md"))) {
      throw new Error("locked smoke failed: gaia-init file was created in locked mode");
    }

    console.log("locked smoke succeeded: mutation blocked in locked mode");
  } finally {
    await rm(tmpWorktree, { recursive: true, force: true });
  }
}

async function expectLockedError(run: () => Promise<void>): Promise<void> {
  try {
    await run();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes("Locked mode blocks gaia_init")) {
      return;
    }

    throw new Error(`locked smoke failed: unexpected error\n${message}`);
  }

  throw new Error("locked smoke failed: expected locked-mode refusal");
}

export async function commandServeWeb(context: CommandContext): Promise<void> {
  await runOpenCode({
    repoRoot: context.repoRoot,
    args: ["web", "--hostname", "0.0.0.0", "--port", getPort()],
    stdio: "inherit",
    ...withExec(context.exec),
  });
}

export async function commandServeApi(context: CommandContext): Promise<void> {
  await runOpenCode({
    repoRoot: context.repoRoot,
    args: ["serve", "--hostname", "0.0.0.0", "--port", getPort()],
    stdio: "inherit",
    ...withExec(context.exec),
  });
}

export async function commandSuite(
  context: CommandContext,
  mode: string,
  bugReport?: string,
): Promise<void> {
  const steps = buildSuiteSteps(mode);

  for (const step of steps) {
    switch (step) {
      case "bootstrap":
        await commandBootstrap(context);
        break;
      case "list-free-models":
        await commandListFreeModels(context);
        break;
      case "smoke":
        await commandSmoke(
          context,
          "Agentic smoke test: confirm sandbox context and list exactly 3 repository files.",
        );
        break;
      case "gaia-init-smoke":
        await commandGaiaInitSmoke(context);
        break;
      case "locked-smoke":
        await commandLockedSmoke(context);
        break;
      case "bug":
        await commandBug(context, bugReport);
        break;
      default: {
        const unreachable: never = step;
        throw new Error(`Unsupported suite step: ${unreachable}`);
      }
    }
  }
}

export function suiteModesHelp(): SuiteMode[] {
  return ["basic", "plugin", "locked", "bug", "full"];
}
