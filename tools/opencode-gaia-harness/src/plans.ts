export type SuiteMode = "basic" | "plugin" | "locked" | "bug" | "full";
export type SuiteStep =
  | "bootstrap"
  | "list-free-models"
  | "smoke"
  | "gaia-init-smoke"
  | "locked-smoke"
  | "bug";

const SUITE_STEP_MAP: Record<SuiteMode, readonly SuiteStep[]> = {
  basic: ["bootstrap", "list-free-models", "smoke"],
  plugin: ["bootstrap", "gaia-init-smoke"],
  locked: ["bootstrap", "locked-smoke"],
  bug: ["bootstrap", "bug"],
  full: [
    "bootstrap",
    "list-free-models",
    "smoke",
    "gaia-init-smoke",
    "locked-smoke",
    "bug",
  ],
};

export function buildSuiteSteps(mode: string): readonly SuiteStep[] {
  if (mode in SUITE_STEP_MAP) {
    return SUITE_STEP_MAP[mode as SuiteMode];
  }

  throw new Error(`Unknown harness mode: ${mode}`);
}

export function getSmokePermission(): string {
  return '{"bash":"allow","read":"allow","edit":"deny","write":"deny"}';
}

export function getBugHarnessPermission(): string {
  return '{"bash":"allow","read":"allow","edit":"allow","write":"allow"}';
}
