import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const push = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }));

const useSummaryKpis = vi.fn();
vi.mock('@/hooks', () => ({
  useSummaryKpis: (...args: unknown[]) => useSummaryKpis(...args),
}));

import QualityPerformanceSection from '@/components/summary/QualityPerformanceSection';
import type { SummaryKpiCard } from '@/types';

import { renderWithTheme } from '../../utils/renderWithTheme';

const base = {
  category: 'QUALITY',
  region: 'GLOBAL',
  status: null,
  reportingPeriod: '2026-01',
  lastUpdated: '2026-02-02T06:00:00Z',
} as const;

const kpis: SummaryKpiCard[] = [
  {
    ...base,
    kpiId: 'kpi-rejection-ppm',
    kpiName: 'Rejection PPM',
    value: 850,
    detailRoute: '/quality/ppm',
    metrics: [
      { label: 'Global', value: 850 },
      { label: 'NAR', value: 620 },
      { label: 'LAR', value: 910 },
    ],
  },
  {
    ...base,
    kpiId: 'kpi-risk-rating-fps',
    kpiName: 'Risk Rating FPS (most updated)',
    value: 4,
    metrics: [
      { label: 'On Quality', value: 4 },
      { label: 'Not on Quality', value: 4 },
    ],
  },
];

function mockState(state: Partial<ReturnType<typeof useSummaryKpis>>) {
  useSummaryKpis.mockReturnValue({
    data: undefined,
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
    ...state,
  });
}

describe('QualityPerformanceSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the skeleton with the title intact while loading', () => {
    mockState({ isLoading: true });
    const { container } = renderWithTheme(<QualityPerformanceSection />);

    expect(screen.getByText('Quality Performance')).toBeInTheDocument();
    expect(
      container.querySelectorAll('.MuiSkeleton-root').length,
    ).toBeGreaterThan(0);
  });

  it('renders an error state with a working retry', async () => {
    const refetch = vi.fn();
    mockState({ isError: true, refetch });
    renderWithTheme(<QualityPerformanceSection />);

    expect(screen.getByText('Quality Performance')).toBeInTheDocument();
    expect(screen.getByText('Unable to load quality KPIs')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /retry/i }));
    expect(refetch).toHaveBeenCalledOnce();
  });

  it('treats data: [] as empty, not as an error', () => {
    mockState({
      data: { data: [], meta: { requestId: 'r', reportingPeriod: '2026-01' } },
    });
    renderWithTheme(<QualityPerformanceSection />);

    expect(screen.getByText('No quality KPIs')).toBeInTheDocument();
    expect(
      screen.queryByText('Unable to load quality KPIs'),
    ).not.toBeInTheDocument();
    expect(screen.getByText('As of January, 2026')).toBeInTheDocument();
  });

  it('renders each KPI with its metrics on success', () => {
    mockState({
      data: {
        data: kpis,
        meta: { requestId: 'r', reportingPeriod: '2026-01' },
      },
    });
    renderWithTheme(<QualityPerformanceSection />);

    expect(screen.getByText('Rejection PPM')).toBeInTheDocument();
    expect(screen.getByText('850')).toBeInTheDocument();
    expect(screen.getByText('620')).toBeInTheDocument();
    expect(
      screen.getByText('Risk Rating FPS (most updated)'),
    ).toBeInTheDocument();
    expect(screen.getByText('On Quality')).toBeInTheDocument();
    expect(screen.getByText('Not on Quality')).toBeInTheDocument();
  });

  it('renders the reporting period footer', () => {
    mockState({
      data: {
        data: kpis,
        meta: { requestId: 'r', reportingPeriod: '2026-01' },
      },
    });
    renderWithTheme(<QualityPerformanceSection />);
    expect(screen.getByText('As of January, 2026')).toBeInTheDocument();
  });

  it('excludes KPIs from other categories', () => {
    mockState({
      data: {
        data: [
          ...kpis,
          {
            ...base,
            category: 'DELIVERY',
            kpiId: 'kpi-otif',
            kpiName: 'OTIF',
            value: 94.2,
            metrics: [{ label: 'Global', value: 94.2, unit: 'PERCENT' }],
          } as SummaryKpiCard,
        ],
        meta: { requestId: 'r', reportingPeriod: '2026-01' },
      },
    });
    renderWithTheme(<QualityPerformanceSection />);

    expect(screen.queryByText('OTIF')).not.toBeInTheDocument();
  });

  it('navigates to the detail route when a tile with one is clicked', async () => {
    mockState({
      data: {
        data: kpis,
        meta: { requestId: 'r', reportingPeriod: '2026-01' },
      },
    });
    renderWithTheme(<QualityPerformanceSection />);

    await userEvent.click(
      screen.getByRole('button', { name: 'View Rejection PPM details' }),
    );
    expect(push).toHaveBeenCalledWith('/quality/ppm');
  });

  it('does not make tiles without a detail route clickable', () => {
    mockState({
      data: {
        data: kpis,
        meta: { requestId: 'r', reportingPeriod: '2026-01' },
      },
    });
    renderWithTheme(<QualityPerformanceSection />);

    expect(
      screen.queryByRole('button', { name: /Risk Rating FPS/ }),
    ).not.toBeInTheDocument();
  });

  it('forwards filters to the data hook', () => {
    mockState({
      data: {
        data: kpis,
        meta: { requestId: 'r', reportingPeriod: '2026-01' },
      },
    });
    renderWithTheme(<QualityPerformanceSection filters={{ region: 'NAR' }} />);

    expect(useSummaryKpis).toHaveBeenCalledWith({ region: 'NAR' });
  });
});
