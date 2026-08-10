import { describe, expect, it } from 'vitest';

import {
  formatAsOfFooter,
  formatMetricValue,
  formatReportingPeriod,
  formatShortMonth,
  NO_VALUE,
} from '@/lib/format';

describe('formatMetricValue', () => {
  it('renders the em dash for null and undefined', () => {
    expect(formatMetricValue(null)).toBe(NO_VALUE);
    expect(formatMetricValue(undefined)).toBe(NO_VALUE);
  });

  it('keeps zero rather than treating it as missing', () => {
    expect(formatMetricValue(0, 'COUNT')).toBe('0');
    expect(formatMetricValue(0, 'PERCENT')).toBe('0%');
  });

  it('passes pre-composed strings through untouched', () => {
    expect(formatMetricValue('Qty 145 / $1.2M')).toBe('Qty 145 / $1.2M');
  });

  // One currency style product-wide, taken from the Quality page's Cost
  // Recovery cards (SPM-135): `US$` prefix, uppercase magnitude. The Summary
  // tile's frame still draws `$340k`, but it shows the same metric, so the two
  // deliberately don't diverge. See the comment on formatUsd.
  it('formats USD in compact notation', () => {
    expect(formatMetricValue(340000, 'USD')).toBe('US$340K');
    expect(formatMetricValue(1200000, 'USD')).toBe('US$1.2M');
    expect(formatMetricValue(450000, 'USD')).toBe('US$450K');
    expect(formatMetricValue(950, 'USD')).toBe('US$950');
    // The two Cost Recovery figures exactly as Figma 1365:14366 draws them.
    expect(formatMetricValue(15000, 'USD')).toBe('US$15K');
    expect(formatMetricValue(24000000, 'USD')).toBe('US$24M');
  });

  it('formats percentages without a trailing .0', () => {
    expect(formatMetricValue(74, 'PERCENT')).toBe('74%');
    expect(formatMetricValue(91.2, 'PERCENT')).toBe('91.2%');
  });

  it('formats counts and PPM with thousands separators', () => {
    expect(formatMetricValue(22500, 'COUNT')).toBe('22,500');
    expect(formatMetricValue(850, 'PPM')).toBe('850');
    expect(formatMetricValue(19800)).toBe('19,800');
  });

  it('handles negative currency', () => {
    expect(formatMetricValue(-1200000, 'USD')).toBe('US$-1.2M');
  });
});

describe('formatReportingPeriod', () => {
  it('formats a month-level period', () => {
    expect(formatReportingPeriod('2026-01')).toBe('January, 2026');
    expect(formatReportingPeriod('2026-12')).toBe('December, 2026');
  });

  it('formats a quarter-level period', () => {
    expect(formatReportingPeriod('2026-Q2')).toBe('Q2 2026');
  });

  it('returns an empty string when the period is missing', () => {
    expect(formatReportingPeriod(undefined)).toBe('');
    expect(formatReportingPeriod(null)).toBe('');
    expect(formatReportingPeriod('')).toBe('');
  });

  it('passes an unrecognised period through unchanged', () => {
    expect(formatReportingPeriod('rolling-3m')).toBe('rolling-3m');
    expect(formatReportingPeriod('2026-13')).toBe('2026-13');
  });
});

describe('formatShortMonth', () => {
  it('formats a month-level period as "May\'26"', () => {
    expect(formatShortMonth('2026-05')).toBe("May'26");
    expect(formatShortMonth('2025-12')).toBe("Dec'25");
  });

  it('passes an unrecognised period through unchanged', () => {
    expect(formatShortMonth('rolling-3m')).toBe('rolling-3m');
    expect(formatShortMonth('')).toBe('');
  });
});

describe('formatAsOfFooter', () => {
  it('prefixes a formatted period with "As of "', () => {
    expect(formatAsOfFooter('2026-01')).toBe('As of January, 2026');
    expect(formatAsOfFooter('2026-Q2')).toBe('As of Q2 2026');
  });

  it('returns undefined when there is no period to show', () => {
    expect(formatAsOfFooter(undefined)).toBeUndefined();
    expect(formatAsOfFooter(null)).toBeUndefined();
    expect(formatAsOfFooter('')).toBeUndefined();
  });
});
