import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const useFocusSupplier = vi.fn();
vi.mock('@/hooks', () => ({
  useFocusSupplier: (...args: unknown[]) => useFocusSupplier(...args),
}));

import FocusSupplierSection from '@/components/quality/FocusSupplierSection';
import type { FocusSupplierKpi } from '@/types';

import { renderWithTheme } from '../../utils/renderWithTheme';

const TITLE = 'Focus Supplier';

/** Values copied from Figma `1365:14287`. */
const detail: FocusSupplierKpi = {
  kpiId: 'kpi-focus-supplier',
  kpiName: 'Focus Supplier',
  category: 'QUALITY',
  region: 'GLOBAL',
  value: 24,
  unit: 'COUNT',
  status: null,
  reportingPeriod: '2026-05',
  lastUpdated: '2026-06-02T06:00:00Z',
  countGlobal: 24,
  countNar: 15,
  countLar: 9,
};

function mockState(state: Partial<ReturnType<typeof useFocusSupplier>>) {
  useFocusSupplier.mockReturnValue({
    data: undefined,
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
    ...state,
  });
}

function mockSuccess(data: FocusSupplierKpi | null = detail) {
  mockState({
    data: { data, meta: { requestId: 'r', reportingPeriod: '2026-05' } },
  });
}

describe('FocusSupplierSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('maps the payload to one card per region', () => {
    mockSuccess();
    renderWithTheme(<FocusSupplierSection />);

    expect(screen.getByRole('region', { name: TITLE })).toBeInTheDocument();
    expect(screen.getByText('Global')).toBeInTheDocument();
    expect(screen.getByText('24')).toBeInTheDocument();
    expect(screen.getByText('NAR')).toBeInTheDocument();
    expect(screen.getByText('15')).toBeInTheDocument();
    expect(screen.getByText('LAR')).toBeInTheDocument();
    expect(screen.getByText('9')).toBeInTheDocument();
  });

  it('renders card skeletons while loading', () => {
    mockState({ isLoading: true });
    const { container } = renderWithTheme(<FocusSupplierSection />);

    expect(
      container.querySelectorAll('.MuiSkeleton-root').length,
    ).toBeGreaterThan(0);
  });

  it('renders an error state with a working retry', async () => {
    const refetch = vi.fn();
    mockState({ isError: true, refetch });
    renderWithTheme(<FocusSupplierSection />);

    expect(screen.getByText(`Unable to load ${TITLE}`)).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /retry/i }));
    expect(refetch).toHaveBeenCalledOnce();
  });

  it('treats a null detail as empty, not as an error', () => {
    mockSuccess(null);
    renderWithTheme(<FocusSupplierSection />);

    expect(screen.getByText(`No ${TITLE} data`)).toBeInTheDocument();
  });

  it('forwards filters to the data hook', () => {
    mockSuccess();
    renderWithTheme(<FocusSupplierSection filters={{ region: 'LAR' }} />);

    expect(useFocusSupplier).toHaveBeenCalledWith({ region: 'LAR' });
  });
});
