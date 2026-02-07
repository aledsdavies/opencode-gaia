import { describe, expect, test } from "bun:test";

import { runExec } from "./exec.js";

describe("runExec", () => {
  test("returns stdout for successful command", async () => {
    const result = await runExec("node", ["-e", 'process.stdout.write("ok")']);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toBe("ok");
  });

  test("times out long-running command", async () => {
    await expect(
      runExec("node", ["-e", "setTimeout(() => {}, 10000)"], {
        timeoutMs: 50,
      }),
    ).rejects.toThrow("Command timed out");
  });

  test("fails fast on idle output timeout", async () => {
    await expect(
      runExec("node", ["-e", "setTimeout(() => {}, 10000)"], {
        idleTimeoutMs: 50,
        timeoutMs: 2000,
      }),
    ).rejects.toThrow("Command idle timeout");
  });

  test("does not fail when output stays active", async () => {
    const result = await runExec(
      "node",
      [
        "-e",
        "let i=0;const t=setInterval(()=>{process.stdout.write('x');if(++i===4){clearInterval(t);process.exit(0)}},20)",
      ],
      {
        idleTimeoutMs: 200,
        timeoutMs: 2000,
      },
    );

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toBe("xxxx");
  });
});
