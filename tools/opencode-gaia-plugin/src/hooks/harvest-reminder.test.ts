import { describe, expect, test } from "bun:test";

import { buildHarvestReminderMessage, shouldTriggerHarvestReminder } from "./harvest-reminder";

describe("shouldTriggerHarvestReminder", () => {
  test("triggers on implementation and verification events", () => {
    expect(shouldTriggerHarvestReminder("implementation_completed")).toBe(true);
    expect(shouldTriggerHarvestReminder("verification_completed")).toBe(true);
  });

  test("does not trigger for unrelated events", () => {
    expect(shouldTriggerHarvestReminder("planning_started")).toBe(false);
  });
});

describe("buildHarvestReminderMessage", () => {
  test("includes work unit in reminder", () => {
    expect(buildHarvestReminderMessage("wave-3")).toBe(
      "Run DEMETER harvest for work unit wave-3.",
    );
  });
});
