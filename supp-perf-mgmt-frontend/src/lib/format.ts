import type { KpiUnit } from '@/types';

/** Rendered in place of a missing value, per UI_REQUIREMENTS_SPEC §14. */
export const NO_VALUE = '—';

/**
 * The product's single currency style: `US$340K`, `US$1.2M`, `US$950`.
 *
 * Taken from the Quality page's Cost Recovery cards (Figma `1365:14366`,
 * SPM-135). The older Summary tile frame still draws `$340k`, but Summary's
 * Cost Recovery figures are the *same metric* as that section's — two styles
 * for one number would be a defect, not a variation — so this is deliberately
 * the one rule for every caller. Don't split it back per-view.
 *
 * Formatting stays here rather than arriving pre-composed from Backend A
 * because one raw amount has to render several ways (card, chart axis,
 * tooltip, export) and must stay sortable. See OQ-Q-1 in
 * specs/features/SPM-128-quality-page/SPM-135-quality-cost-focus.md.
 */
function formatUsd(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `US$${trimZero(value / 1_000_000)}M`;
  if (abs >= 1_000) return `US$${trimZero(value / 1_000)}K`;
  return `US$${trimZero(value)}`;
}

/** 1.2 → "1.2", 340 → "340" — one decimal, but never a trailing ".0". */
function trimZero(value: number): string {
  return String(Number(value.toFixed(1)));
}

/**
 * Formats a KPI metric for display. Numbers are unit-aware; strings pass
 * through untouched so the backend can send pre-composed values such as
 * "Qty 145 / $1.2M".
 */
export function formatMetricValue(
  value: number | string | null | undefined,
  unit?: KpiUnit,
): string {
  if (value === null || value === undefined) return NO_VALUE;
  if (typeof value === 'string') return value;

  switch (unit) {
    case 'USD':
      return formatUsd(value);
    case 'PERCENT':
      return `${trimZero(value)}%`;
    default:
      return value.toLocaleString('en-US');
  }
}

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

/**
 * Formats a reporting period for display, e.g. "January, 2026" or "Q2 2026".
 * Accepts month-level ("2026-01") and quarter-level ("2026-Q2") periods —
 * the backend granularity is still unresolved (VIEW_DATA_MAP_SPEC gap).
 */
export function formatReportingPeriod(period?: string | null): string {
  if (!period) return '';

  const month = /^(\d{4})-(\d{2})$/.exec(period);
  if (month) {
    const name = MONTHS[Number(month[2]) - 1];
    if (name) return `${name}, ${month[1]}`;
  }

  const quarter = /^(\d{4})-(Q[1-4])$/.exec(period);
  if (quarter) return `${quarter[2]} ${quarter[1]}`;

  return period;
}

/**
 * Builds the "As of …" section/page footer from a reporting period, or
 * `undefined` when there's no period to show. Single source for the footer
 * every KPI section renders (Summary, Quality, Delivery, Top Offenders).
 */
export function formatAsOfFooter(period?: string | null): string | undefined {
  const formatted = formatReportingPeriod(period);
  return formatted ? `As of ${formatted}` : undefined;
}

const MONTHS_SHORT = MONTHS.map((name) => name.slice(0, 3));

/**
 * Formats a month-level period as the compact "May'26" label used by the
 * Quality PPM/CAL trend table's latest-month column header (Figma
 * `804:26162`/`804:26172`).
 */
export function formatShortMonth(period: string): string {
  const match = /^(\d{4})-(\d{2})$/.exec(period);
  if (!match) return period;
  const name = MONTHS_SHORT[Number(match[2]) - 1];
  return name ? `${name}'${match[1].slice(2)}` : period;
}
