export type HarvestTriggerEvent =
  | "implementation_completed"
  | "verification_completed"
  | "planning_started";

export function shouldTriggerHarvestReminder(event: HarvestTriggerEvent): boolean {
  return event === "implementation_completed" || event === "verification_completed";
}

export function buildHarvestReminderMessage(workUnit: string): string {
  return `Run DEMETER harvest for work unit ${workUnit}.`;
}
