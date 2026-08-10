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
    }) => React.cloneElement(children, { width: 400, height: 100 }),
  };
});

import Sparkline from '@/components/ui/Sparkline';

import { renderWithTheme } from '../../utils/renderWithTheme';

describe('Sparkline', () => {
  it('renders a line chart for two or more data points', () => {
    const { container } = renderWithTheme(
      <Sparkline data={[88, 90, 91, 89, 90]} />,
    );
    expect(container.querySelector('.recharts-line')).toBeInTheDocument();
  });

  it('renders a flat placeholder instead of a chart when given fewer than two points', () => {
    const { container } = renderWithTheme(<Sparkline data={[90]} />);
    expect(container.querySelector('.recharts-line')).not.toBeInTheDocument();
  });

  it('renders a flat placeholder for empty data', () => {
    const { container } = renderWithTheme(<Sparkline data={[]} />);
    expect(container.querySelector('.recharts-line')).not.toBeInTheDocument();
  });

  // Regression guard: as a fixed-width *block* it ignored its cell's
  // text-align and sat flush left, which only shows once the column is wider
  // than the line (wide monitor / chatbot collapsed). Both branches must stay
  // inline-level for `DataTable`'s Column.align to reach it.
  it('renders inline-level so it honours the parent text-align', () => {
    const { container } = renderWithTheme(
      <Sparkline data={[88, 90, 91, 89, 90]} />,
    );
    expect(container.firstElementChild).toHaveStyle({
      display: 'inline-block',
      verticalAlign: 'middle',
    });
  });

  it('keeps the short-data placeholder inline-level too', () => {
    const { container } = renderWithTheme(<Sparkline data={[90]} />);
    expect(container.firstElementChild).toHaveStyle({
      display: 'inline-flex',
      verticalAlign: 'middle',
    });
  });
});
