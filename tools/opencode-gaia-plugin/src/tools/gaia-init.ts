import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

export interface GaiaInitAnswers {
  mission?: string;
  constraints?: string[];
  nonGoals?: string[];
  riskTolerance?: "low" | "medium" | "high";
  notes?: string[];
}

export interface EnsureGaiaInitArgs {
  repoRoot: string;
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
  const constraints = normalizeList(answers?.constraints, ["Record constraints that GAIA must enforce."]);
  const nonGoals = normalizeList(answers?.nonGoals, ["Record explicit non-goals to avoid scope creep."]);
  const notes = normalizeList(answers?.notes, ["Add project-specific guidance as GAIA learnings evolve."]);
  const riskTolerance = answers?.riskTolerance ?? "medium";

  return [
    "# GAIA Init",
    "",
    "This file is GAIA-only orchestration context.",
    "It does not replace AGENTS.md or repository coding standards.",
    "",
    ...sectionLines("Mission", [mission]),
    ...sectionLines("Constraints", constraints),
    ...sectionLines("Non-Goals", nonGoals),
    ...sectionLines("Roles", [
      "Operator: interactive human steering session-level decisions.",
      "Owner: accountable human making final ship decisions.",
    ]),
    ...sectionLines("Instructions for GAIA Delegation", [
      "Feed this context into specialist prompts for MINERVA, HEPHAESTUS, and DEMETER.",
      "Enforce small, test-backed work units with explicit checkpoints.",
      "Use Context/Options/Recommendation/Action-needed when asking Operator decisions.",
      `Risk tolerance: ${riskTolerance}.`,
    ]),
    ...sectionLines("Testing Expectations", [
      "Use reproducer-first tests for bug reports (stack traces, logs, or repro steps).",
      "Prefer low-mock, low-orchestration tests with real values.",
      "Use exact assertions and avoid partial-response checks.",
    ]),
    ...sectionLines("Notes", notes),
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
