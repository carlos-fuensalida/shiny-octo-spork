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
    }) => React.cloneElement(children, { width: 200, height: 200 }),
  };
});

import type { DonutSegment } from '@/components/ui/DonutChart';
import DonutChart from '@/components/ui/DonutChart';

import { renderWithTheme } from '../../utils/renderWithTheme';

const segments: DonutSegment[] = [
  { label: 'Completed', value: 11, color: '#2e7d32' },
  { label: 'On going', value: 18, color: '#00a0dd' },
  { label: 'Delayed', value: 8, color: '#d32f2f' },
  { label: 'Disposition', value: 3, color: '#ef6c00' },
  { label: 'Not started', value: 14, color: '#dee0e3' },
];

describe('DonutChart', () => {
  it('renders every segment in the legend with its value', () => {
    renderWithTheme(<DonutChart segments={segments} label="GLOBAL exhibits" />);

    for (const segment of segments) {
      expect(screen.getByText(segment.label)).toBeInTheDocument();
    }
    expect(screen.getByText('18')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  // The center figure is derived rather than passed in, precisely so it can
  // never disagree with the arcs (SPM-132).
  it('derives the center total from the segments', () => {
    renderWithTheme(<DonutChart segments={segments} label="GLOBAL exhibits" />);
    expect(screen.getByText('54')).toBeInTheDocument();
  });

  it('recomputes the total when the segments change', () => {
    renderWithTheme(
      <DonutChart segments={segments.slice(0, 2)} label="NAR exhibits" />,
    );
    expect(screen.getByText('29')).toBeInTheDocument();
  });

  it('names the chart for assistive technology', () => {
    renderWithTheme(<DonutChart segments={segments} label="GLOBAL exhibits" />);
    expect(screen.getByLabelText('GLOBAL exhibits')).toBeInTheDocument();
  });

  it('shows an empty state rather than an empty ring when there is no data', () => {
    renderWithTheme(<DonutChart segments={[]} label="LAR exhibits" />);
    expect(screen.getByText('No data')).toBeInTheDocument();
  });

  it('treats all-zero segments as empty', () => {
    const zeroed = segments.map((s) => ({ ...s, value: 0 }));
    renderWithTheme(<DonutChart segments={zeroed} label="LAR exhibits" />);
    expect(screen.getByText('No data')).toBeInTheDocument();
  });

  it('shapes the ring and legend while loading', () => {
    const { container } = renderWithTheme(<DonutChart.Skeleton />);
    expect(
      container.querySelectorAll('.MuiSkeleton-root').length,
    ).toBeGreaterThan(0);
  });
});
