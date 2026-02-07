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
  idleTimeoutMs?: number;
  streamOutput?: boolean;
  heartbeatMs?: number;
  heartbeatLabel?: string;
}

export type ExecFn = (
  command: string,
  args: string[],
  options?: ExecOptions,
) => Promise<ExecResult>;

export const runExec: ExecFn = (command, args, options = {}) => {
  return new Promise<ExecResult>((resolve, reject) => {
    const stdio = options.stdio ?? "pipe";
    const streamOutput = options.streamOutput ?? false;

    const child = spawn(command, args, {
      cwd: options.cwd,
      env: options.env,
      stdio,
      shell: false,
    });

    let stdout = "";
    let stderr = "";
    let timedOut = false;
    let idleTimedOut = false;

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

    const heartbeatMs = options.heartbeatMs;
    const heartbeatLabel = options.heartbeatLabel ?? `${command} ${args.join(" ")}`;
    const startTime = Date.now();
    const heartbeatHandle =
      typeof heartbeatMs === "number" && heartbeatMs > 0
        ? setInterval(() => {
            const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
            process.stderr.write(
              `[harness] still running ${heartbeatLabel} (${elapsedSeconds}s)\n`,
            );
          }, heartbeatMs)
        : undefined;

    const idleTimeoutMs = options.idleTimeoutMs;
    const enableIdleTimeout = stdio === "pipe" && typeof idleTimeoutMs === "number" && idleTimeoutMs > 0;
    let idleTimeoutHandle: ReturnType<typeof setTimeout> | undefined;

    const resetIdleTimer = () => {
      if (!enableIdleTimeout) {
        return;
      }

      if (idleTimeoutHandle) {
        clearTimeout(idleTimeoutHandle);
      }

      idleTimeoutHandle = setTimeout(() => {
        idleTimedOut = true;
        child.kill("SIGTERM");

        setTimeout(() => {
          child.kill("SIGKILL");
        }, 2000).unref();
      }, idleTimeoutMs);
    };

    resetIdleTimer();

    if (stdio === "pipe") {
      child.stdout?.on("data", (data: Buffer | string) => {
        const chunk = data.toString();
        stdout += chunk;
        resetIdleTimer();

        if (streamOutput) {
          process.stdout.write(chunk);
        }
      });

      child.stderr?.on("data", (data: Buffer | string) => {
        const chunk = data.toString();
        stderr += chunk;
        resetIdleTimer();

        if (streamOutput) {
          process.stderr.write(chunk);
        }
      });
    }

    child.on("error", (error) => {
      if (timeoutHandle) {
        clearTimeout(timeoutHandle);
      }
      if (idleTimeoutHandle) {
        clearTimeout(idleTimeoutHandle);
      }
      if (heartbeatHandle) {
        clearInterval(heartbeatHandle);
      }

      reject(error);
    });

    child.on("close", (code) => {
      if (timeoutHandle) {
        clearTimeout(timeoutHandle);
      }
      if (idleTimeoutHandle) {
        clearTimeout(idleTimeoutHandle);
      }
      if (heartbeatHandle) {
        clearInterval(heartbeatHandle);
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

      if (idleTimedOut) {
        reject(
          new Error(
            `Command idle timeout after ${idleTimeoutMs}ms: ${command} ${args.join(" ")}`,
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
