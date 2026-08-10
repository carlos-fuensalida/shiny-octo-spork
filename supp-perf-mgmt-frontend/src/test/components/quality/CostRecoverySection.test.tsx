import { screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const useCostRecovery = vi.fn();
vi.mock('@/hooks', () => ({
  useCostRecovery: (...args: unknown[]) => useCostRecovery(...args),
}));

import CostRecoverySection from '@/components/quality/CostRecoverySection';
import type { CostRecoveryKpi } from '@/types';

import { renderWithTheme } from '../../utils/renderWithTheme';

const TITLE = 'Cost Recovery';

/** Values copied from Figma `1365:14366`. */
const detail: CostRecoveryKpi = {
  kpiId: 'kpi-cost-recovery',
  kpiName: 'Cost Recovery',
  category: 'QUALITY',
  region: 'GLOBAL',
  value: 15_000,
  unit: 'USD',
  status: null,
  reportingPeriod: '2026-05',
  lastUpdated: '2026-06-02T06:00:00Z',
  globalConversion: 24,
  totalRecovered: 15_000,
  ongoing: 24_000_000,
};

function mockSuccess(data: CostRecoveryKpi | null = detail) {
  useCostRecovery.mockReturnValue({
    data: { data, meta: { requestId: 'r', reportingPeriod: '2026-05' } },
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  });
}

describe('CostRecoverySection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('maps the payload to the three cards drawn in Figma', () => {
    mockSuccess();
    renderWithTheme(<CostRecoverySection />);

    expect(screen.getByText('Global Conversion')).toBeInTheDocument();
    expect(screen.getByText('Total Recovered')).toBeInTheDocument();
    expect(screen.getByText('On going')).toBeInTheDocument();
  });

  it('formats the two amounts as currency and conversion as a plain count', () => {
    mockSuccess();
    renderWithTheme(<CostRecoverySection />);

    // Raw amounts arrive from the API; the frame draws them compacted.
    expect(screen.getByText('US$15K')).toBeInTheDocument();
    expect(screen.getByText('US$24M')).toBeInTheDocument();
    // The frame shows `24` with no unit — not a percentage (OQ-Q-2).
    expect(screen.getByText('24')).toBeInTheDocument();
    expect(screen.queryByText('24%')).not.toBeInTheDocument();
  });

  it('treats a null detail as empty, not as an error', () => {
    mockSuccess(null);
    renderWithTheme(<CostRecoverySection />);

    expect(screen.getByText(`No ${TITLE} data`)).toBeInTheDocument();
  });

  it('forwards filters to the data hook', () => {
    mockSuccess();
    renderWithTheme(<CostRecoverySection filters={{ region: 'NAR' }} />);

    expect(useCostRecovery).toHaveBeenCalledWith({ region: 'NAR' });
  });
});
