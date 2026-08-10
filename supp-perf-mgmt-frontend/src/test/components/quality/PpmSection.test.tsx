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

const usePpmDetail = vi.fn();
vi.mock('@/hooks', () => ({
  usePpmDetail: (...args: unknown[]) => usePpmDetail(...args),
}));

import PpmSection from '@/components/quality/PpmSection';
import type { PpmKpiDetail } from '@/types';

import { renderWithTheme } from '../../utils/renderWithTheme';

const monthly = Array.from({ length: 12 }, (_, i) => ({
  period: `2025-${String(i + 6).padStart(2, '0')}`,
  ppm: 180 + i,
  rejections: 200 + i,
}));

const detail: PpmKpiDetail = {
  kpiId: 'kpi-rejection-ppm',
  kpiName: 'Incoming Material PPM',
  category: 'QUALITY',
  region: 'GLOBAL',
  value: 210,
  unit: 'PPM',
  status: null,
  reportingPeriod: '2026-01',
  lastUpdated: '2026-02-02T06:00:00Z',
  totalRejections: 1240,
  totalUnitsInspected: 1_460_000,
  fy2025: 105,
  plan2026: 90,
  ytd2026: 146,
  rollingR3: 201,
  monthly,
  byPlant: [],
  byCommodity: [
    {
      dimension: 'Components',
      ppm: 191,
      rejections: 225,
      totalUnits: 1_178_000,
      fy2025: 225,
      plan2026: 191,
      ytd2026: 113,
      rollingR3: 118,
      monthly,
    },
  ],
  byRegion: [],
  offenders: [
    { supplierId: 'sup-rwb-forge', supplierName: 'RWB Forge', value: 1250 },
  ],
};

function mockState(state: Partial<ReturnType<typeof usePpmDetail>>) {
  usePpmDetail.mockReturnValue({
    data: undefined,
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
    ...state,
  });
}

describe('PpmSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the region and skeletons while loading', () => {
    mockState({ isLoading: true });
    const { container } = renderWithTheme(<PpmSection />);

    expect(
      screen.getByRole('region', { name: 'Incoming Material PPM' }),
    ).toBeInTheDocument();
    expect(
      container.querySelectorAll('.MuiSkeleton-root').length,
    ).toBeGreaterThan(0);
  });

  it('renders an error state with a working retry', async () => {
    const refetch = vi.fn();
    mockState({ isError: true, refetch });
    renderWithTheme(<PpmSection />);

    expect(
      screen.getByText('Unable to load Incoming Material PPM'),
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
    renderWithTheme(<PpmSection />);

    expect(
      screen.getByText('No Incoming Material PPM data'),
    ).toBeInTheDocument();
  });

  it('renders the aggregate row, breakdown rows, and offenders on success', () => {
    mockState({
      data: {
        data: detail,
        meta: { requestId: 'r', reportingPeriod: '2026-01' },
      },
    });
    renderWithTheme(<PpmSection />);

    expect(screen.getByText('Whirlpool')).toBeInTheDocument();
    expect(screen.getByText('Components')).toBeInTheDocument();
    expect(screen.getByText('RWB Forge')).toBeInTheDocument();
  });

  it('renders the reporting-period footer in each card on success', () => {
    mockState({
      data: {
        data: detail,
        meta: { requestId: 'r', reportingPeriod: '2026-01' },
      },
    });
    renderWithTheme(<PpmSection />);
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
    renderWithTheme(<PpmSection />);

    const action = screen.getByRole('button', { name: /deep dive/i });
    expect(action).toBeInTheDocument();
    expect(action).toBeDisabled();
  });

  it('titles both cards — the section metric and Top Offenders', () => {
    mockState({
      data: {
        data: detail,
        meta: { requestId: 'r', reportingPeriod: '2026-01' },
      },
    });
    renderWithTheme(<PpmSection />);

    expect(screen.getByText('Top Offenders')).toBeInTheDocument();
    // Section header + wide card header both carry the metric name.
    expect(screen.getAllByText('Incoming Material PPM')).toHaveLength(2);
  });

  it('forwards filters to the data hook', () => {
    mockState({
      data: {
        data: detail,
        meta: { requestId: 'r', reportingPeriod: '2026-01' },
      },
    });
    renderWithTheme(<PpmSection filters={{ region: 'NAR' }} />);
    expect(usePpmDetail).toHaveBeenCalledWith({ region: 'NAR' });
  });
});
