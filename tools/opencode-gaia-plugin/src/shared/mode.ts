export type GaiaMode = "supervised" | "autopilot" | "locked";

export function assertMutationAllowed(mode: GaiaMode | undefined, operation: string): void {
  if (mode === "locked") {
    throw new Error(`Locked mode blocks ${operation}`);
  }
}
