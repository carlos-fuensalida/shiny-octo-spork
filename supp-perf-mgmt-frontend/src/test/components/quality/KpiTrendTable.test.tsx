import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

// Recharts' ResponsiveContainer measures its parent, which is 0×0 in jsdom.
vi.mock('recharts', async (importOriginal) => {
  const actual = await importOriginal<typeof import('recharts')>();
  const React = await import('react');
  return {
    ...actual,
    ResponsiveContainer: ({
      children,
    }: {
      children: React.ReactElement<Record<string, unknown>>;
    }) => React.cloneElement(children, { width: 400, height: 300 }),
  };
});

import type { TrendRow } from '@/components/quality/KpiTrendTable';
import KpiTrendTable from '@/components/quality/KpiTrendTable';

import { renderWithTheme } from '../../utils/renderWithTheme';

const aggregate: TrendRow = {
  dimension: 'Whirlpool',
  fy2025: 105,
  plan2026: 90,
  ytd2026: 146,
  rollingR3: 201,
  monthly: [180, 165, 190, 175, 200, 185, 210, 195, 220, 205, 195, 210],
};

const breakdown: TrendRow[] = [
  {
    dimension: 'Components',
    fy2025: 225,
    plan2026: 191,
    ytd2026: 113,
    rollingR3: 118,
    monthly: [130, 120, 135, 125, 128, 118, 122, 112, 119, 110, 108, 115],
  },
  {
    dimension: 'Raw Materials',
    fy2025: 110,
    plan2026: 97,
    ytd2026: 191,
    rollingR3: 276,
    monthly: [160, 175, 165, 180, 170, 185, 178, 190, 182, 195, 150, 135],
  },
];

describe('KpiTrendTable', () => {
  it('renders the aggregate row and every breakdown row', () => {
    renderWithTheme(
      <KpiTrendTable
        aggregate={aggregate}
        breakdown={breakdown}
        latestPeriodLabel="May'26"
      />,
    );

    expect(screen.getByText('Whirlpool')).toBeInTheDocument();
    expect(screen.getByText('Components')).toBeInTheDocument();
    expect(screen.getByText('Raw Materials')).toBeInTheDocument();
  });

  it('renders the FY/Plan/YTD/Rolling column headers and latest-period label', () => {
    renderWithTheme(
      <KpiTrendTable
        aggregate={aggregate}
        breakdown={breakdown}
        latestPeriodLabel="May'26"
      />,
    );

    expect(screen.getByText('2025 FY')).toBeInTheDocument();
    expect(screen.getByText('2026 Plan')).toBeInTheDocument();
    expect(screen.getByText('2026 YTD')).toBeInTheDocument();
    expect(screen.getByText('Rolling')).toBeInTheDocument();
    expect(screen.getByText('12M Trend')).toBeInTheDocument();
    expect(screen.getByText("May'26")).toBeInTheDocument();
  });

  it('shows the Rolling value with its (R3) suffix', () => {
    renderWithTheme(
      <KpiTrendTable
        aggregate={aggregate}
        breakdown={breakdown}
        latestPeriodLabel="May'26"
      />,
    );

    expect(screen.getByText(/201\s*\(R3\)/)).toBeInTheDocument();
  });

  it('paints the variance highlight on the cell itself, not an inner box', () => {
    renderWithTheme(
      <KpiTrendTable
        aggregate={aggregate}
        breakdown={breakdown}
        latestPeriodLabel="May'26"
      />,
    );

    // Whirlpool YTD 146 vs plan 90 is well over plan → red tint filling the
    // whole cell, so the highlight must land on the <td>.
    const overPlan = screen.getByText('146');
    expect(overPlan.tagName).toBe('TD');
    expect(overPlan).toHaveStyle({ borderLeftWidth: '4px' });
  });

  it('honours an explicit row status over the derived fallback', () => {
    // The CAL/NAR case: 234 against a 901 plan is 74% *under* plan, so the
    // fallback rule would derive GREEN — but the design shows amber. An
    // explicit status must win, or the page silently diverges from Figma.
    const nar: TrendRow = {
      dimension: 'NAR',
      fy2025: 678,
      plan2026: 901,
      ytd2026: 234,
      ytd2026Status: 'YELLOW',
      rollingR3: 118,
      rollingR3Status: 'GREEN',
      monthly: [820, 835, 810, 845, 825, 850, 830, 860, 840, 865, 870, 890],
    };

    renderWithTheme(
      <KpiTrendTable
        aggregate={aggregate}
        breakdown={[nar]}
        latestPeriodLabel="May'26"
      />,
    );

    expect(screen.getByText('234')).toHaveStyle({ color: 'rgb(239, 108, 0)' });
    expect(screen.getByText('118 (R3)')).toHaveStyle({
      color: 'rgb(46, 125, 50)',
    });
  });

  it('colours the highlighted values to match their status', () => {
    renderWithTheme(
      <KpiTrendTable
        aggregate={aggregate}
        breakdown={breakdown}
        latestPeriodLabel="May'26"
      />,
    );

    // Regression guard: the theme's MuiTableCell body colour must not outrank
    // the per-cell sx, or these values silently fall back to charcoal.
    // Components YTD 113 is under its 191 plan → green; Whirlpool's 146 is
    // over its 90 plan → red.
    expect(screen.getByText('113')).toHaveStyle({ color: 'rgb(46, 125, 50)' });
    expect(screen.getByText('146')).toHaveStyle({ color: 'rgb(211, 47, 47)' });
  });

  it('suffixes every numeric cell with % when unit is PERCENT', () => {
    // PIQ Maturity's case (SPM-133). The rest of this suite exercises the
    // default (PPM/CAL) formatting, so the two paths are both pinned.
    const piqGlobal: TrendRow = {
      dimension: 'Global',
      fy2025: 88,
      plan2026: 90,
      ytd2026: 91,
      ytd2026Status: 'GREEN',
      rollingR3: 91,
      rollingR3Status: 'GREEN',
      monthly: [82, 83, 85, 84, 86, 87, 86, 88, 89, 88, 91, 90],
    };

    renderWithTheme(
      <KpiTrendTable
        aggregate={piqGlobal}
        breakdown={[]}
        latestPeriodLabel="May'26"
        unit="PERCENT"
      />,
    );

    expect(screen.getByText('88%')).toBeInTheDocument();
    expect(screen.getByText('91%')).toBeInTheDocument();
    expect(screen.getByText('91% (R3)')).toBeInTheDocument();
    // Twice: the 2026 Plan column, and the latest-month cell — which reads the
    // last `monthly` point rather than a column field, and formats identically.
    expect(screen.getAllByText('90%')).toHaveLength(2);
  });

  it('renders the skeleton variant preserving the header row', () => {
    const { container } = renderWithTheme(<KpiTrendTable.Skeleton />);
    expect(screen.getByText('2025 FY')).toBeInTheDocument();
    expect(
      container.querySelectorAll('.MuiSkeleton-root').length,
    ).toBeGreaterThan(0);
  });
});
