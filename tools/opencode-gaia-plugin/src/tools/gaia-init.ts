import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

import { assertMutationAllowed, type GaiaMode } from "../shared/mode.js";

export interface GaiaInitAnswers {
  mission?: string;
  productContext?: string[];
  successSignals?: string[];
  constraints?: string[];
  nonGoals?: string[];
  riskTolerance?: "low" | "medium" | "high";
  decisionModel?: string[];
  qualityBar?: string[];
  communicationContract?: string[];
  notes?: string[];
}

export interface EnsureGaiaInitArgs {
  repoRoot: string;
  mode?: GaiaMode;
  refresh?: boolean;
  content?: string;
  answers?: GaiaInitAnswers;
}

export interface EnsureGaiaInitResult {
  path: string;
  status: "created" | "updated" | "unchanged";
}

function sectionLines(title: string, items: string[]): string[] {
  return [
    `## ${title}`,
    ...items.map((item) => `- ${item}`),
    "",
  ];
}

function normalizeList(values: string[] | undefined, fallback: string[]): string[] {
  if (!values || values.length === 0) {
    return fallback;
  }

  const trimmed = values.map((value) => value.trim()).filter((value) => value.length > 0);
  return trimmed.length > 0 ? trimmed : fallback;
}

export function getDefaultGaiaInitTemplate(answers?: GaiaInitAnswers): string {
  const mission = answers?.mission?.trim() || "Define the current objective in one sentence.";
  const productContext = normalizeList(answers?.productContext, [
    "System style: human-in-the-loop orchestration.",
    "Scope includes product planning, implementation, and learning capture.",
  ]);
  const successSignals = normalizeList(answers?.successSignals, [
    "Define measurable success signals for this phase.",
  ]);
  const constraints = normalizeList(answers?.constraints, ["Record constraints that GAIA must enforce."]);
  const nonGoals = normalizeList(answers?.nonGoals, ["Record explicit non-goals to avoid scope creep."]);
  const decisionModel = normalizeList(answers?.decisionModel, [
    "Operator: interactive human steering session-level decisions.",
    "Owner: accountable human making final ship decisions.",
    "Use Context/Options/Recommendation/Action needed for decision hand-offs.",
  ]);
  const qualityBar = normalizeList(answers?.qualityBar, [
    "Use reproducer-first tests for bug reports (stack traces, logs, or repro steps).",
    "Prefer low-mock, low-orchestration tests with real values.",
    "Use exact assertions and avoid partial-response checks.",
  ]);
  const communicationContract = normalizeList(answers?.communicationContract, [
    "Work unit handoff fields: work_unit, objective, inputs, constraints, done_when, open_questions.",
    "Result fields: status, summary, evidence, risks, next_actions.",
  ]);
  const notes = normalizeList(answers?.notes, ["Add project-specific guidance as GAIA learnings evolve."]);
  const riskTolerance = answers?.riskTolerance ?? "medium";

  return [
    "# GAIA Init",
    "",
    "This file is GAIA-only orchestration context.",
    "It does not replace AGENTS.md or repository coding standards.",
    "",
    ...sectionLines("Mission", [mission]),
    ...sectionLines("Product Context", [
      ...productContext,
      ...successSignals.map((signal) => `Success signal: ${signal}`),
    ]),
    ...sectionLines("Constraints", constraints),
    ...sectionLines("Non-Goals", nonGoals),
    ...sectionLines("Risk Tolerance", [
      `Risk tolerance: ${riskTolerance}.`,
      "Require explicit Operator approval for medium/high-risk actions.",
    ]),
    ...sectionLines("Decision Model", decisionModel),
    ...sectionLines("Instructions for GAIA Delegation", [
      "Start with classify -> plan -> checkpoint -> delegate -> harvest.",
      "When specialist subsystems are missing, remain in base GAIA mode and keep scope tight.",
      "Keep work units small and require explicit done criteria before execution.",
      "Capture missing context as targeted questions before broad delegation.",
    ]),
    ...sectionLines("Quality Bar", qualityBar),
    ...sectionLines("Communication Contract", communicationContract),
    ...sectionLines("Project Notes", notes),
    "",
  ].join("\n");
}

async function fileExists(path: string): Promise<boolean> {
  try {
    await readFile(path, "utf8");
    return true;
  } catch {
    return false;
  }
}

export async function ensureGaiaInit(args: EnsureGaiaInitArgs): Promise<EnsureGaiaInitResult> {
  assertMutationAllowed(args.mode, "gaia_init");

  const gaiaDir = join(args.repoRoot, ".gaia");
  const initPath = join(gaiaDir, "gaia-init.md");
  const content = args.content ?? getDefaultGaiaInitTemplate(args.answers);

  await mkdir(gaiaDir, { recursive: true });

  const exists = await fileExists(initPath);
  if (!exists) {
    await writeFile(initPath, content, "utf8");
    return { path: initPath, status: "created" };
  }

  if (args.refresh) {
    await writeFile(initPath, content, "utf8");
    return { path: initPath, status: "updated" };
  }

  return { path: initPath, status: "unchanged" };
}
