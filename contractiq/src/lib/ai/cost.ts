/** GPT-4o list prices used for budgeting (USD per 1,000 tokens), as defined in the PRD. */
export const INPUT_COST_PER_1K = 0.005;
export const OUTPUT_COST_PER_1K = 0.015;

/** Per-analysis cost thresholds from the PRD. */
export const COST_WARN_USD = 0.2;
export const COST_ALERT_USD = 0.25;

export function calculateCostUsd(inputTokens: number, outputTokens: number): number {
  const cost = (inputTokens / 1000) * INPUT_COST_PER_1K + (outputTokens / 1000) * OUTPUT_COST_PER_1K;
  return Math.round(cost * 1_000_000) / 1_000_000;
}
