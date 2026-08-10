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

const useProductsOnHold = vi.fn();
vi.mock('@/hooks', () => ({
  useProductsOnHold: (...args: unknown[]) => useProductsOnHold(...args),
}));

import ProductsOnHoldSection from '@/components/quality/ProductsOnHoldSection';
import type { ProductsOnHoldKpi, ProductsOnHoldScope } from '@/types';

import { renderWithTheme } from '../../utils/renderWithTheme';

function card(scope: ProductsOnHoldScope): ProductsOnHoldKpi {
  return {
    kpiId: 'kpi-products-on-hold',
    kpiName: 'Products on Hold',
    category: 'QUALITY',
    region: 'GLOBAL',
    value: 57,
    unit: 'COUNT',
    status: null,
    reportingPeriod: '2026-05',
    lastUpdated: '2026-06-02T06:00:00Z',
    segmentScope: scope,
    carryOver2025: 52,
    byMonth: [
      { period: '2026-01', fullMonth: 22, eom: 85 },
      { period: '2026-02', fullMonth: 98, eom: 45 },
    ],
  };
}

const cards = (['GLOBAL', 'NAR', 'LAR', 'FPS_ONLY'] as const).map(card);

function mockState(state: Partial<ReturnType<typeof useProductsOnHold>>) {
  useProductsOnHold.mockReturnValue({
    data: undefined,
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
    ...state,
  });
}

function mockSuccess(data = cards) {
  mockState({
    data: { data, meta: { requestId: 'r', reportingPeriod: '2026-05' } },
  });
}

describe('ProductsOnHoldSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the region and card skeletons while loading', () => {
    mockState({ isLoading: true });
    const { container } = renderWithTheme(<ProductsOnHoldSection />);

    expect(
      screen.getByRole('region', { name: 'Products on Hold' }),
    ).toBeInTheDocument();
    expect(
      container.querySelectorAll('.MuiSkeleton-root').length,
    ).toBeGreaterThan(0);
  });

  it('keeps the full row of scope labels in the loading state', () => {
    mockState({ isLoading: true });
    renderWithTheme(<ProductsOnHoldSection />);

    expect(screen.getByText('Global (FPS & Components)')).toBeInTheDocument();
    expect(screen.getByText('FPS')).toBeInTheDocument();
  });

  it('renders an error state with a working retry', async () => {
    const refetch = vi.fn();
    mockState({ isError: true, refetch });
    renderWithTheme(<ProductsOnHoldSection />);

    expect(
      screen.getByText('Unable to load Products on Hold'),
    ).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /retry/i }));
    expect(refetch).toHaveBeenCalledOnce();
  });

  it('treats an empty list as empty, not as an error', () => {
    mockSuccess([]);
    renderWithTheme(<ProductsOnHoldSection />);

    expect(screen.getByText('No Products on Hold data')).toBeInTheDocument();
  });

  it('renders one card per segment scope on success', () => {
    mockSuccess();
    renderWithTheme(<ProductsOnHoldSection />);

    expect(screen.getByText('Global (FPS & Components)')).toBeInTheDocument();
    expect(screen.getByText('NAR (FPS & Components)')).toBeInTheDocument();
    expect(screen.getByText('LAR (FPS & Components)')).toBeInTheDocument();
    expect(screen.getByText('FPS')).toBeInTheDocument();
  });

  /**
   * Figma `804:26182` is divider–title–divider only — this is the one Quality
   * section without a DEEP DIVE action, so an added button would be drift.
   */
  it('renders no action button in its section header', () => {
    mockSuccess();
    renderWithTheme(<ProductsOnHoldSection />);

    expect(
      screen.queryByRole('button', { name: /deep dive/i }),
    ).not.toBeInTheDocument();
  });

  it('forwards filters to the data hook', () => {
    mockSuccess();
    renderWithTheme(<ProductsOnHoldSection filters={{ region: 'NAR' }} />);
    expect(useProductsOnHold).toHaveBeenCalledWith({ region: 'NAR' });
  });
});
