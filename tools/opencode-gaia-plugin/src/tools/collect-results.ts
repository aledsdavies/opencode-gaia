import type { DelegateGaiaResult } from "./delegate-gaia.js";

export interface CollectResultsSummary<TParsed> {
  total: number;
  success_count: number;
  failure_count: number;
  items: DelegateGaiaResult<TParsed>[];
}

export function collectResults<TParsed>(
  items: DelegateGaiaResult<TParsed>[],
): CollectResultsSummary<TParsed> {
  const successCount = items.filter((item) => item.status !== "parse_failed").length;

  return {
    total: items.length,
    success_count: successCount,
    failure_count: items.length - successCount,
    items,
  };
}
