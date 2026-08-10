import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const useQualityKpis = vi.fn();
const usePpmDetail = vi.fn();
const useCalDetail = vi.fn();
const useProductsOnHold = vi.fn();
const useExhibits = vi.fn();
const usePiqMaturity = vi.fn();
const useCostRecovery = vi.fn();
const useFocusSupplier = vi.fn();
vi.mock('@/hooks', () => ({
  useQualityKpis: (...args: unknown[]) => useQualityKpis(...args),
  usePpmDetail: (...args: unknown[]) => usePpmDetail(...args),
  useCalDetail: (...args: unknown[]) => useCalDetail(...args),
  useProductsOnHold: (...args: unknown[]) => useProductsOnHold(...args),
  useExhibits: (...args: unknown[]) => useExhibits(...args),
  usePiqMaturity: (...args: unknown[]) => usePiqMaturity(...args),
  useCostRecovery: (...args: unknown[]) => useCostRecovery(...args),
  useFocusSupplier: (...args: unknown[]) => useFocusSupplier(...args),
}));

import QualitySections from '@/components/quality/QualitySections';

import { renderWithTheme } from '../../utils/renderWithTheme';

const okData = {
  data: [
    {
      kpiId: 'kpi-gsir',
      kpiName: 'GSIR',
      category: 'QUALITY',
      region: 'GLOBAL',
      value: 42,
      unit: 'COUNT',
      status: null,
      reportingPeriod: '2026-01',
      lastUpdated: '2026-02-02T06:00:00Z',
    },
  ],
  meta: { requestId: 'r', reportingPeriod: '2026-01' },
};

function mockState(state: Partial<ReturnType<typeof useQualityKpis>>) {
  useQualityKpis.mockReturnValue({
    data: undefined,
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
    ...state,
  });
}

describe('QualitySections', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // The built sections each fetch independently of useQualityKpis — default
    // them all to a settled "no data" state so mounting doesn't crash and these
    // tests can focus on the page-level scaffold. See PpmSection.test.tsx /
    // CalSection.test.tsx / ProductsOnHoldSection.test.tsx /
    // ExhibitsSection.test.tsx / PiqMaturitySection.test.tsx for their own
    // state coverage.
    const settled = {
      data: undefined,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    };
    usePpmDetail.mockReturnValue(settled);
    useCalDetail.mockReturnValue(settled);
    useProductsOnHold.mockReturnValue(settled);
    useExhibits.mockReturnValue(settled);
    usePiqMaturity.mockReturnValue(settled);
    useCostRecovery.mockReturnValue(settled);
    useFocusSupplier.mockReturnValue(settled);
  });

  it('renders section-placeholder skeletons while loading', () => {
    mockState({ isLoading: true });
    const { container } = renderWithTheme(<QualitySections />);

    expect(
      container.querySelectorAll('.MuiSkeleton-root').length,
    ).toBeGreaterThan(0);
  });

  it('renders an error state with a working retry', async () => {
    const refetch = vi.fn();
    mockState({ isError: true, refetch });
    renderWithTheme(<QualitySections />);

    expect(
      screen.getByText('Unable to load the Quality page'),
    ).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /retry/i }));
    expect(refetch).toHaveBeenCalledOnce();
  });

  it('treats data: [] as empty, not as an error', () => {
    mockState({
      data: { data: [], meta: { requestId: 'r', reportingPeriod: '2026-01' } },
    });
    renderWithTheme(<QualitySections />);

    expect(screen.getByText('No quality data')).toBeInTheDocument();
    expect(
      screen.queryByText('Unable to load the Quality page'),
    ).not.toBeInTheDocument();
  });

  it('renders every section in Figma order on success', () => {
    mockState({ data: okData });
    renderWithTheme(<QualitySections />);

    const titles = [
      'Incoming Material PPM',
      'CAL A/AA – PPM',
      'GSIR',
      'Products on Hold',
      'PIQ Maturity (NPI Projects)',
      'Quality Exhibits',
      'Risk Rating',
      '8Ds',
      // The page's one two-up row: two sections sharing a line, not one
      // combined section (Figma 1377:14559).
      'Cost Recovery',
      'Focus Supplier',
    ];
    for (const title of titles) {
      expect(screen.getByRole('region', { name: title })).toBeInTheDocument();
    }
  });

  it('renders the reporting-period footer on success', () => {
    mockState({ data: okData });
    renderWithTheme(<QualitySections />);
    expect(screen.getByText('As of January, 2026')).toBeInTheDocument();
  });

  it('forwards filters to the data hook', () => {
    mockState({ data: okData });
    renderWithTheme(<QualitySections filters={{ region: 'NAR' }} />);
    expect(useQualityKpis).toHaveBeenCalledWith({ region: 'NAR' });
  });
});
