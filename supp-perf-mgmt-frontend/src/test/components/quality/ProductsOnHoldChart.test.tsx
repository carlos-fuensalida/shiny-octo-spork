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

import ProductsOnHoldChart from '@/components/quality/ProductsOnHoldChart';
import type { ProductsOnHoldMonthRow } from '@/types';

import { renderWithTheme } from '../../utils/renderWithTheme';

const byMonth: ProductsOnHoldMonthRow[] = [
  { period: '2026-01', fullMonth: 22, eom: 85 },
  { period: '2026-02', fullMonth: 98, eom: 45 },
  { period: '2026-03', fullMonth: 88, eom: 98 },
  { period: '2026-04', fullMonth: 68, eom: 15 },
  { period: '2026-05', fullMonth: 84, eom: 57 },
];

function renderChart(carryOver2025 = 52) {
  return renderWithTheme(
    <ProductsOnHoldChart byMonth={byMonth} carryOver2025={carryOver2025} />,
  );
}

describe('ProductsOnHoldChart', () => {
  it('renders the three named series in its legend', () => {
    renderChart();

    expect(screen.getByText('2025 Carry Over')).toBeInTheDocument();
    expect(screen.getByText('Full Month')).toBeInTheDocument();
    expect(screen.getByText('EOM')).toBeInTheDocument();
  });

  it("labels the x axis with each reported month, Figma's Jan'26 format", () => {
    renderChart();

    expect(screen.getByText("Jan'26")).toBeInTheDocument();
    expect(screen.getByText("May'26")).toBeInTheDocument();
  });

  /**
   * The frame draws carry-over as a bar in the opening month group only —
   * later groups leave the slot empty. Regression guard: a bar per month would
   * silently misrepresent a single 2025 figure as a monthly series.
   *
   * Recharts emits a `.recharts-bar-rectangle` wrapper for every data point
   * but only paints a `<path>` where there is a value, so the painted paths —
   * not the wrappers — are what's actually on screen.
   */
  it('paints the carry-over bar in the first month group only', () => {
    const { container } = renderChart();

    const [carryOver, fullMonth, eom] =
      container.querySelectorAll('.recharts-bar');

    expect(carryOver.querySelectorAll('path')).toHaveLength(1);
    expect(fullMonth.querySelectorAll('path')).toHaveLength(byMonth.length);
    expect(eom.querySelectorAll('path')).toHaveLength(byMonth.length);
  });

  /**
   * Recharts spreads bars to fill their category unless capped, which rendered
   * them ~36px wide against the frame's ~9.5px — and worse the wider the card.
   * The plot here is 400px, far wider than a real card, so an uncapped bar
   * would be well over the limit.
   */
  it('caps bar width so wide cards do not inflate the bars', () => {
    const { container } = renderChart();

    const bars = container.querySelectorAll('.recharts-rectangle');
    expect(bars.length).toBeGreaterThan(0);

    for (const bar of bars) {
      expect(Number(bar.getAttribute('width'))).toBeLessThanOrEqual(10);
    }
  });

  it('shows an empty state when no months are reported', () => {
    renderWithTheme(<ProductsOnHoldChart byMonth={[]} carryOver2025={52} />);
    expect(screen.getByText('No monthly data')).toBeInTheDocument();
  });

  it('shapes the plot while loading', () => {
    const { container } = renderWithTheme(<ProductsOnHoldChart.Skeleton />);
    expect(
      container.querySelectorAll('.MuiSkeleton-root').length,
    ).toBeGreaterThan(0);
  });
});
