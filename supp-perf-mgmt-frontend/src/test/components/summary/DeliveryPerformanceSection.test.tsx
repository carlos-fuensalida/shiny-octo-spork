import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const push = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }));

const useSummaryKpis = vi.fn();
vi.mock('@/hooks', () => ({
  useSummaryKpis: (...args: unknown[]) => useSummaryKpis(...args),
}));

import DeliveryPerformanceSection from '@/components/summary/DeliveryPerformanceSection';
import type { SummaryKpiCard } from '@/types';

import { renderWithTheme } from '../../utils/renderWithTheme';

const base = {
  category: 'DELIVERY',
  region: 'GLOBAL',
  status: null,
  reportingPeriod: '2026-01',
  lastUpdated: '2026-02-02T06:00:00Z',
} as const;

const kpis: SummaryKpiCard[] = [
  {
    ...base,
    kpiId: 'kpi-expedite',
    kpiName: 'Expedite (Supplier Caused)',
    value: 'Qty 145 / $1.2M',
    metrics: [
      { label: 'Global', value: 'Qty 145 / $1.2M' },
      { label: 'NAR', value: 'Qty 62 / $450k' },
      { label: 'LAR', value: 'Qty 55 / $380k' },
    ],
  },
  {
    ...base,
    kpiId: 'kpi-production-loss',
    kpiName: 'Production Loss',
    value: 22500,
    unit: 'COUNT',
    metrics: [
      { label: 'Global', value: 22500, unit: 'COUNT', caption: 'Total Units' },
      { label: 'NAR', value: 9100, unit: 'COUNT', caption: 'Total Units' },
      { label: 'LAR', value: 10200, unit: 'COUNT', caption: 'Total Units' },
    ],
  },
  {
    ...base,
    kpiId: 'kpi-vmi-compliance',
    kpiName: 'VMI',
    value: 88,
    unit: 'PERCENT',
    metrics: [
      { label: 'Global', value: 88, unit: 'PERCENT', caption: '% Compliant' },
      { label: 'NAR', value: 85, unit: 'PERCENT', caption: '% Compliant' },
    ],
  },
  {
    ...base,
    kpiId: 'kpi-otif',
    kpiName: 'OTIF',
    value: 94.2,
    unit: 'PERCENT',
    metrics: [
      { label: 'Global', value: 94.2, unit: 'PERCENT' },
      { label: 'LAR', value: 93.5, unit: 'PERCENT' },
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

describe('DeliveryPerformanceSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the skeleton with the title intact while loading', () => {
    mockState({ isLoading: true });
    const { container } = renderWithTheme(<DeliveryPerformanceSection />);

    expect(screen.getByText('Delivery Performance')).toBeInTheDocument();
    expect(
      container.querySelectorAll('.MuiSkeleton-root').length,
    ).toBeGreaterThan(0);
  });

  it('renders an error state with a working retry', async () => {
    const refetch = vi.fn();
    mockState({ isError: true, refetch });
    renderWithTheme(<DeliveryPerformanceSection />);

    expect(screen.getByText('Delivery Performance')).toBeInTheDocument();
    expect(
      screen.getByText('Unable to load delivery KPIs'),
    ).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /retry/i }));
    expect(refetch).toHaveBeenCalledOnce();
  });

  it('treats data: [] as empty, not as an error', () => {
    mockState({
      data: { data: [], meta: { requestId: 'r', reportingPeriod: '2026-01' } },
    });
    renderWithTheme(<DeliveryPerformanceSection />);

    expect(screen.getByText('No delivery KPIs')).toBeInTheDocument();
    expect(
      screen.queryByText('Unable to load delivery KPIs'),
    ).not.toBeInTheDocument();
  });

  it('excludes KPIs from other categories', () => {
    mockState({
      data: {
        data: [
          ...kpis,
          {
            category: 'QUALITY',
            region: 'GLOBAL',
            status: null,
            reportingPeriod: '2026-01',
            lastUpdated: '2026-02-02T06:00:00Z',
            kpiId: 'kpi-gsir',
            kpiName: 'GSIR',
            value: 42,
            metrics: [{ label: 'Global', value: 42 }],
          } as SummaryKpiCard,
        ],
        meta: { requestId: 'r', reportingPeriod: '2026-01' },
      },
    });
    renderWithTheme(<DeliveryPerformanceSection />);

    expect(screen.queryByText('GSIR')).not.toBeInTheDocument();
  });

  it('groups metrics into region tiles, one KPI-labelled entry per region', () => {
    mockState({
      data: {
        data: kpis,
        meta: { requestId: 'r', reportingPeriod: '2026-01' },
      },
    });
    renderWithTheme(<DeliveryPerformanceSection />);

    expect(screen.getByText('Global')).toBeInTheDocument();
    expect(screen.getByText('NAR')).toBeInTheDocument();
    expect(screen.getByText('LAR')).toBeInTheDocument();
    expect(screen.getAllByText('Expedite (Supplier Caused)')).toHaveLength(3);
  });

  it('stacks Expedite above Production Loss in Global, but keeps them side by side in NAR/LAR', () => {
    mockState({
      data: {
        data: kpis,
        meta: { requestId: 'r', reportingPeriod: '2026-01' },
      },
    });
    renderWithTheme(<DeliveryPerformanceSection />);

    const [globalExpedite, narExpedite] = screen.getAllByText(
      'Expedite (Supplier Caused)',
    );

    const globalRow = globalExpedite.closest('div')?.parentElement;
    expect(globalRow?.textContent).not.toContain('Production Loss');

    const narRow = narExpedite.closest('div')?.parentElement;
    expect(narRow?.textContent).toContain('Production Loss');
  });

  it('drops a region tile entry for a KPI with no metric in that region', () => {
    mockState({
      data: {
        data: kpis,
        meta: { requestId: 'r', reportingPeriod: '2026-01' },
      },
    });
    renderWithTheme(<DeliveryPerformanceSection />);

    // VMI has no LAR metric and OTIF has no NAR metric.
    expect(screen.getAllByText('VMI')).toHaveLength(2);
    expect(screen.getAllByText('OTIF')).toHaveLength(2);
  });

  it('renders the reporting period footer', () => {
    mockState({
      data: {
        data: kpis,
        meta: { requestId: 'r', reportingPeriod: '2026-01' },
      },
    });
    renderWithTheme(<DeliveryPerformanceSection />);
    expect(screen.getByText('As of January, 2026')).toBeInTheDocument();
  });

  it('navigates every region tile to the Delivery view', async () => {
    mockState({
      data: {
        data: kpis,
        meta: { requestId: 'r', reportingPeriod: '2026-01' },
      },
    });
    renderWithTheme(<DeliveryPerformanceSection />);

    await userEvent.click(
      screen.getByRole('button', { name: 'View Global details' }),
    );
    expect(push).toHaveBeenCalledWith('/delivery');

    await userEvent.click(
      screen.getByRole('button', { name: 'View NAR details' }),
    );
    expect(push).toHaveBeenCalledWith('/delivery');
  });

  it('forwards filters to the data hook', () => {
    mockState({
      data: {
        data: kpis,
        meta: { requestId: 'r', reportingPeriod: '2026-01' },
      },
    });
    renderWithTheme(<DeliveryPerformanceSection filters={{ region: 'NAR' }} />);

    expect(useSummaryKpis).toHaveBeenCalledWith({ region: 'NAR' });
  });
});
