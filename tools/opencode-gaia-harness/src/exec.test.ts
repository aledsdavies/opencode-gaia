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
});
