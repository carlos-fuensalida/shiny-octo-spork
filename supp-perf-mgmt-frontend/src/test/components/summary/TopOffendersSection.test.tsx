import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

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

const useTopOffenders = vi.fn();
vi.mock('@/hooks', () => ({
  useTopOffenders: (...args: unknown[]) => useTopOffenders(...args),
}));

import TopOffendersSection from '@/components/summary/TopOffendersSection';
import type { TopOffenderChart } from '@/types';

import { renderWithTheme } from '../../utils/renderWithTheme';

const charts: TopOffenderChart[] = [
  {
    metricId: 'expedites',
    metricName: 'Expedites — ($ Value)',
    unit: 'USD',
    offenders: [
      {
        supplierId: 'sup-001',
        supplierName: 'Meridian Forge Co.',
        value: 1240000,
      },
    ],
  },
  {
    metricId: 'production-lost',
    metricName: 'Production Lost — Units Lost',
    unit: 'COUNT',
    offenders: [
      { supplierId: 'sup-002', supplierName: 'Apex Steel Works', value: 8400 },
    ],
  },
  {
    metricId: 'dtc',
    metricName: 'DTC — Units Lost',
    unit: 'COUNT',
    offenders: [
      {
        supplierId: 'sup-003',
        supplierName: 'Titan Castings Ltd.',
        value: 7300,
      },
    ],
  },
];

function mockState(state: Partial<ReturnType<typeof useTopOffenders>>) {
  useTopOffenders.mockReturnValue({
    data: undefined,
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
    ...state,
  });
}

describe('TopOffendersSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the skeleton with the title intact while loading', () => {
    mockState({ isLoading: true });
    const { container } = renderWithTheme(<TopOffendersSection />);

    expect(screen.getByText('Top Offenders')).toBeInTheDocument();
    expect(
      container.querySelectorAll('.MuiSkeleton-root').length,
    ).toBeGreaterThan(0);
  });

  it('renders an error state with a working retry', async () => {
    const refetch = vi.fn();
    mockState({ isError: true, refetch });
    renderWithTheme(<TopOffendersSection />);

    expect(screen.getByText('Top Offenders')).toBeInTheDocument();
    expect(
      screen.getByText('Unable to load top offenders'),
    ).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /retry/i }));
    expect(refetch).toHaveBeenCalledOnce();
  });

  it('treats data: [] as empty, not as an error', () => {
    mockState({
      data: { data: [], meta: { requestId: 'r', reportingPeriod: '2026-01' } },
    });
    renderWithTheme(<TopOffendersSection />);

    expect(screen.getByText('No top offenders')).toBeInTheDocument();
    expect(
      screen.queryByText('Unable to load top offenders'),
    ).not.toBeInTheDocument();
  });

  it('renders every chart title in the success state', () => {
    mockState({
      data: {
        data: charts,
        meta: { requestId: 'r', reportingPeriod: '2026-01' },
      },
    });
    renderWithTheme(<TopOffendersSection />);

    expect(screen.getByText('Expedites — ($ Value)')).toBeInTheDocument();
    expect(
      screen.getByText('Production Lost — Units Lost'),
    ).toBeInTheDocument();
    expect(screen.getByText('DTC — Units Lost')).toBeInTheDocument();
  });

  it('renders the reporting period footer', () => {
    mockState({
      data: {
        data: charts,
        meta: { requestId: 'r', reportingPeriod: '2026-01' },
      },
    });
    renderWithTheme(<TopOffendersSection />);
    expect(screen.getByText('As of January, 2026')).toBeInTheDocument();
  });

  it('forwards filters to the data hook', () => {
    mockState({
      data: {
        data: charts,
        meta: { requestId: 'r', reportingPeriod: '2026-01' },
      },
    });
    renderWithTheme(<TopOffendersSection filters={{ region: 'NAR' }} />);

    expect(useTopOffenders).toHaveBeenCalledWith({ region: 'NAR' });
  });
});
