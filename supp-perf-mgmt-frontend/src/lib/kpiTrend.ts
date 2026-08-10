import type { KpiStatus, TrendDirection } from '@/types';

/**
 * PLACEHOLDER RULE — not a confirmed business rule (SPM-130), and deliberately
 * only a **fallback**. Rows carry their own `ytd2026Status`/`rollingR3Status`
 * and the trend table prefers those; this fills in when a payload omits them.
 *
 * It can't be the primary source for two reasons. Practically, the design's
 * sample colours aren't reproducible by any value-vs-plan rule — CAL's LAR row
 * is 33% *over* plan and shown green while NAR is 74% *under* plan and shown
 * amber, which no monotonic function of (value, plan) satisfies. Structurally,
 * RAG thresholds vary per KPI and reset yearly, and the same judgement feeds
 * the chatbot, alerts, and exports — so it belongs with the data, like the
 * `KpiCard.status` the backend already sends.
 *
 * Swap the body when the real rule lands — every derivation reads through here.
 */
export function getPlanVarianceStatus(value: number, plan: number): KpiStatus {
  if (plan <= 0) return 'NEUTRAL';
  const ratio = value / plan;
  if (ratio <= 1) return 'GREEN';
  if (ratio <= 1.3) return 'YELLOW';
  return 'RED';
}

/**
 * PLACEHOLDER RULE — not a confirmed business rule (SPM-130). Encodes the
 * latest-month arrow's *direction* only (value rose or fell vs. the prior
 * month) — not whether that direction is good or bad, which depends on each
 * KPI's target direction and isn't defined yet either.
 */
export function getMonthOverMonthTrend(monthly: number[]): TrendDirection {
  if (monthly.length < 2) return 'FLAT';
  const [previous, latest] = monthly.slice(-2);
  if (latest > previous) return 'UP';
  if (latest < previous) return 'DOWN';
  return 'FLAT';
}
