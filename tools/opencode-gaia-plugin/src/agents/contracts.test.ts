import { describe, expect, test } from "bun:test";

import {
  parseDemeterOutput,
  parseHephaestusOutput,
  parseLeanAgentOutput,
  parseMinervaOutput,
} from "./contracts";

describe("lean contract parsers", () => {
  test("parses valid MINERVA output", () => {
    const parsed = parseMinervaOutput({
      contract_version: "1.0",
      agent: "minerva",
      work_unit: "wave-2",
      session_id: "s1",
      vcs_type: "jj",
      ok: true,
      data: {
        repo_map: "tools/opencode-gaia-plugin/src",
        vcs_type: "jj",
        plan: ["find entry points"],
        risk_list: ["missing parser"],
        suggested_agents: ["hephaestus"],
      },
      errors: [],
    });

    expect(parsed.agent).toBe("minerva");
    expect(parsed.data.vcs_type).toBe("jj");
  });

  test("rejects mismatched agent payload", () => {
    expect(() => {
      parseHephaestusOutput({
        contract_version: "1.0",
        agent: "demeter",
        work_unit: "wave-2",
        session_id: "s2",
        ok: true,
        data: {
          diff_summary: "updated files",
          files_modified: ["src/index.ts"],
          revision_ids: ["abc123"],
          notes: [],
          refactoring_done: [],
          known_issues: [],
        },
        errors: [],
      });
    }).toThrow();
  });

  test("routes parser by agent key", () => {
    const parsed = parseLeanAgentOutput("demeter", {
      contract_version: "1.0",
      agent: "demeter",
      work_unit: "wave-2",
      session_id: "s3",
      ok: true,
      data: {
        log_entry: "Completed wave",
        decisions: [
          {
            type: "question",
            question: "Which runner?",
            answer: "bun test",
            impact: "No Vitest dependency",
          },
        ],
        learnings: ["keep prompts lean"],
        plan_updates: ["wave-2 in progress"],
        session_summary: "Done",
      },
      errors: [],
    });

    expect(parsed.agent).toBe("demeter");
    expect(parsed.data.decisions[0]?.answer).toBe("bun test");
  });

  test("rejects bad envelope shape", () => {
    expect(() => {
      parseMinervaOutput({
        contract_version: "2.0",
      });
    }).toThrow();
  });
});
