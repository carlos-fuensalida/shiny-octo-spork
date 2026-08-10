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

const useCalDetail = vi.fn();
vi.mock('@/hooks', () => ({
  useCalDetail: (...args: unknown[]) => useCalDetail(...args),
}));

import CalSection from '@/components/quality/CalSection';
import type { CalKpiDetail } from '@/types';

import { renderWithTheme } from '../../utils/renderWithTheme';

const monthly = Array.from({ length: 12 }, (_, i) => ({
  period: `2025-${String(i + 6).padStart(2, '0')}`,
  calCount: 260 + i,
}));

const detail: CalKpiDetail = {
  kpiId: 'kpi-cal-ppm',
  kpiName: 'CAL A/AA – PPM',
  category: 'QUALITY',
  region: 'GLOBAL',
  value: 345,
  unit: 'PPM',
  status: null,
  reportingPeriod: '2026-01',
  lastUpdated: '2026-02-02T06:00:00Z',
  fy2025: 123,
  plan2026: 789,
  ytd2026: 12,
  rollingR3: 456,
  monthly,
  byRegion: [
    {
      dimension: 'NAR',
      calCount: 901,
      statusCounts: {},
      fy2025: 678,
      plan2026: 901,
      ytd2026: 234,
      rollingR3: 118,
      monthly,
    },
  ],
  byPlant: [],
  byCommodity: [],
  offenders: [
    { supplierId: 'sup-rwb-forge', supplierName: 'RWB Forge', value: 1250 },
  ],
};

function mockState(state: Partial<ReturnType<typeof useCalDetail>>) {
  useCalDetail.mockReturnValue({
    data: undefined,
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
    ...state,
  });
}

describe('CalSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the region and skeletons while loading', () => {
    mockState({ isLoading: true });
    const { container } = renderWithTheme(<CalSection />);

    expect(
      screen.getByRole('region', { name: 'CAL A/AA – PPM' }),
    ).toBeInTheDocument();
    expect(
      container.querySelectorAll('.MuiSkeleton-root').length,
    ).toBeGreaterThan(0);
  });

  it('renders an error state with a working retry', async () => {
    const refetch = vi.fn();
    mockState({ isError: true, refetch });
    renderWithTheme(<CalSection />);

    expect(
      screen.getByText('Unable to load CAL A/AA – PPM'),
    ).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /retry/i }));
    expect(refetch).toHaveBeenCalledOnce();
  });

  it('treats a missing detail as empty, not as an error', () => {
    mockState({
      data: {
        data: null,
        meta: { requestId: 'r', reportingPeriod: '2026-01' },
      },
    });
    renderWithTheme(<CalSection />);

    expect(screen.getByText('No CAL A/AA – PPM data')).toBeInTheDocument();
  });

  it('renders the aggregate row, breakdown rows, and offenders on success', () => {
    mockState({
      data: {
        data: detail,
        meta: { requestId: 'r', reportingPeriod: '2026-01' },
      },
    });
    renderWithTheme(<CalSection />);

    expect(screen.getByText('Whirlpool')).toBeInTheDocument();
    expect(screen.getByText('NAR')).toBeInTheDocument();
    expect(screen.getByText('RWB Forge')).toBeInTheDocument();
  });

  it('renders the reporting-period footer in each card on success', () => {
    mockState({
      data: {
        data: detail,
        meta: { requestId: 'r', reportingPeriod: '2026-01' },
      },
    });
    renderWithTheme(<CalSection />);
    // One per card — the trend table and the Top Offenders list each carry
    // their own footer, as in Figma.
    expect(screen.getAllByText('As of January, 2026')).toHaveLength(2);
  });

  it('renders the section header with its Deep Dive action', () => {
    mockState({
      data: {
        data: detail,
        meta: { requestId: 'r', reportingPeriod: '2026-01' },
      },
    });
    renderWithTheme(<CalSection />);

    const action = screen.getByRole('button', { name: /deep dive/i });
    expect(action).toBeInTheDocument();
    expect(action).toBeDisabled();
  });

  it('forwards filters to the data hook', () => {
    mockState({
      data: {
        data: detail,
        meta: { requestId: 'r', reportingPeriod: '2026-01' },
      },
    });
    renderWithTheme(<CalSection filters={{ region: 'NAR' }} />);
    expect(useCalDetail).toHaveBeenCalledWith({ region: 'NAR' });
  });
});
