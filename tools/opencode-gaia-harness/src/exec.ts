import { spawn } from "node:child_process";

export interface ExecResult {
  exitCode: number;
  stdout: string;
  stderr: string;
}

export interface ExecOptions {
  cwd?: string;
  env?: NodeJS.ProcessEnv;
  allowFailure?: boolean;
  stdio?: "pipe" | "inherit";
  timeoutMs?: number;
}

export type ExecFn = (
  command: string,
  args: string[],
  options?: ExecOptions,
) => Promise<ExecResult>;

export const runExec: ExecFn = (command, args, options = {}) => {
  return new Promise<ExecResult>((resolve, reject) => {
    const stdio = options.stdio ?? "pipe";

    const child = spawn(command, args, {
      cwd: options.cwd,
      env: options.env,
      stdio,
      shell: false,
    });

    let stdout = "";
    let stderr = "";
    let timedOut = false;

    const timeoutMs = options.timeoutMs;
    const timeoutHandle =
      typeof timeoutMs === "number" && timeoutMs > 0
        ? setTimeout(() => {
            timedOut = true;
            child.kill("SIGTERM");

            setTimeout(() => {
              child.kill("SIGKILL");
            }, 2000).unref();
          }, timeoutMs)
        : undefined;

    if (stdio === "pipe") {
      child.stdout?.on("data", (data: Buffer | string) => {
        stdout += data.toString();
      });

      child.stderr?.on("data", (data: Buffer | string) => {
        stderr += data.toString();
      });
    }

    child.on("error", (error) => {
      if (timeoutHandle) {
        clearTimeout(timeoutHandle);
      }

      reject(error);
    });

    child.on("close", (code) => {
      if (timeoutHandle) {
        clearTimeout(timeoutHandle);
      }

      const exitCode = code ?? 1;

      if (timedOut) {
        reject(
          new Error(
            `Command timed out after ${timeoutMs}ms: ${command} ${args.join(" ")}`,
          ),
        );
        return;
      }

      if (exitCode !== 0 && !options.allowFailure) {
        reject(
          new Error(
            `Command failed (${exitCode}): ${command} ${args.join(" ")}\n${stdout}${stderr}`,
          ),
        );
        return;
      }

      resolve({
        exitCode,
        stdout,
        stderr,
      });
    });
  });
};
