import { resolve } from "node:path";

import { bootstrapSandbox } from "./bootstrap.js";
import type { ExecFn, ExecResult } from "./exec.js";
import { runExec } from "./exec.js";
import { buildSandboxEnv, buildSandboxPaths } from "./paths.js";

export interface RunOpenCodeOptions {
  repoRoot: string;
  args: string[];
  cwd?: string;
  allowFailure?: boolean;
  stdio?: "pipe" | "inherit";
  timeoutMs?: number;
  idleTimeoutMs?: number;
  streamOutput?: boolean;
  heartbeatMs?: number;
  heartbeatLabel?: string;
  envOverrides?: NodeJS.ProcessEnv;
  exec?: ExecFn;
}

export async function runOpenCode(options: RunOpenCodeOptions): Promise<ExecResult> {
  const exec = options.exec ?? runExec;
  const repoRoot = resolve(options.repoRoot);
  const paths = buildSandboxPaths(repoRoot);

  await bootstrapSandbox({ repoRoot, exec });

  return exec("opencode", options.args, {
    cwd: options.cwd ?? repoRoot,
    ...(options.allowFailure !== undefined ? { allowFailure: options.allowFailure } : {}),
    ...(options.stdio ? { stdio: options.stdio } : {}),
    ...(options.timeoutMs !== undefined ? { timeoutMs: options.timeoutMs } : {}),
    ...(options.idleTimeoutMs !== undefined ? { idleTimeoutMs: options.idleTimeoutMs } : {}),
    ...(options.streamOutput !== undefined ? { streamOutput: options.streamOutput } : {}),
    ...(options.heartbeatMs !== undefined ? { heartbeatMs: options.heartbeatMs } : {}),
    ...(options.heartbeatLabel !== undefined ? { heartbeatLabel: options.heartbeatLabel } : {}),
    env: {
      ...buildSandboxEnv(paths),
      ...(options.envOverrides ?? {}),
    },
  });
}
