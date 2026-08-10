import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

// Recharts' ResponsiveContainer measures its parent, which is 0×0 in jsdom.
// Clone the chart child with explicit dimensions so it renders without warnings.
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

import OffenderBarChart from '@/components/ui/OffenderBarChart';
import type { TopOffenderBar } from '@/types';

import { renderWithTheme } from '../../utils/renderWithTheme';

const offenders: TopOffenderBar[] = [
  { supplierId: 'sup-001', supplierName: 'Meridian Forge Co.', value: 1240000 },
  { supplierId: 'sup-002', supplierName: 'Apex Steel Works', value: 980000 },
  { supplierId: 'sup-003', supplierName: 'Titan Castings Ltd.', value: 760000 },
];

describe('OffenderBarChart', () => {
  it('renders the chart title', () => {
    renderWithTheme(
      <OffenderBarChart
        title="Expedites — ($ Value)"
        offenders={offenders}
        unit="USD"
      />,
    );
    expect(screen.getByText('Expedites — ($ Value)')).toBeInTheDocument();
  });

  it('renders a per-chart empty state when there are no offenders', () => {
    renderWithTheme(
      <OffenderBarChart
        title="OTIF — % of Delivery"
        offenders={[]}
        unit="PERCENT"
      />,
    );
    expect(screen.getByText('No offenders')).toBeInTheDocument();
  });

  it('renders the skeleton variant with placeholder bars', () => {
    const { container } = renderWithTheme(<OffenderBarChart.Skeleton />);
    expect(
      container.querySelectorAll('.MuiSkeleton-root').length,
    ).toBeGreaterThan(0);
  });
});
