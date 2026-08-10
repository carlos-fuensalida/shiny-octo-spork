import { describe, expect, it } from 'vitest';

import { getMonthOverMonthTrend, getPlanVarianceStatus } from '@/lib/kpiTrend';

describe('getPlanVarianceStatus', () => {
  it('is GREEN at or under plan', () => {
    expect(getPlanVarianceStatus(90, 100)).toBe('GREEN');
    expect(getPlanVarianceStatus(100, 100)).toBe('GREEN');
  });

  it('is YELLOW moderately over plan', () => {
    expect(getPlanVarianceStatus(120, 100)).toBe('YELLOW');
    expect(getPlanVarianceStatus(130, 100)).toBe('YELLOW');
  });

  it('is RED well over plan', () => {
    expect(getPlanVarianceStatus(131, 100)).toBe('RED');
    expect(getPlanVarianceStatus(300, 100)).toBe('RED');
  });

  it('is NEUTRAL when plan is zero or negative', () => {
    expect(getPlanVarianceStatus(50, 0)).toBe('NEUTRAL');
    expect(getPlanVarianceStatus(50, -10)).toBe('NEUTRAL');
  });
});

describe('getMonthOverMonthTrend', () => {
  it('is UP when the latest value rose', () => {
    expect(getMonthOverMonthTrend([100, 120])).toBe('UP');
  });

  it('is DOWN when the latest value fell', () => {
    expect(getMonthOverMonthTrend([120, 100])).toBe('DOWN');
  });

  it('is FLAT when the latest value is unchanged', () => {
    expect(getMonthOverMonthTrend([100, 100])).toBe('FLAT');
  });

  it('is FLAT with fewer than two points', () => {
    expect(getMonthOverMonthTrend([100])).toBe('FLAT');
    expect(getMonthOverMonthTrend([])).toBe('FLAT');
  });
});
