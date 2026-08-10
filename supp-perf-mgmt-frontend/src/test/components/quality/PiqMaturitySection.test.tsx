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

const usePiqMaturity = vi.fn();
vi.mock('@/hooks', () => ({
  usePiqMaturity: (...args: unknown[]) => usePiqMaturity(...args),
}));

import PiqMaturitySection from '@/components/quality/PiqMaturitySection';
import type { PiqMaturityKpi } from '@/types';

import { renderWithTheme } from '../../utils/renderWithTheme';

const TITLE = 'PIQ Maturity (NPI Projects)';

/** Values copied from Figma `804:26198`. */
const detail: PiqMaturityKpi = {
  kpiId: 'kpi-piq-maturity',
  kpiName: 'PIQ Maturity',
  category: 'QUALITY',
  region: 'GLOBAL',
  value: 91,
  unit: 'PERCENT',
  status: null,
  reportingPeriod: '2026-05',
  lastUpdated: '2026-06-02T06:00:00Z',
  fy2025: 88,
  plan2026: 90,
  ytd2026: 91,
  ytd2026Status: 'GREEN',
  rollingR3: 91,
  rollingR3Status: 'GREEN',
  monthly: [82, 83, 85, 84, 86, 87, 86, 88, 89, 88, 91, 90],
  byRegion: [
    {
      region: 'NAR',
      fy2025: 86,
      plan2026: 89,
      ytd2026: 90,
      ytd2026Status: 'GREEN',
      rollingR3: 90,
      rollingR3Status: 'GREEN',
      monthly: [81, 82, 84, 83, 85, 86, 85, 87, 88, 87, 90, 89],
    },
    {
      region: 'LAR',
      fy2025: 84,
      plan2026: 85,
      ytd2026: 82,
      ytd2026Status: 'RED',
      rollingR3: 81,
      rollingR3Status: 'RED',
      monthly: [78, 80, 83, 85, 86, 88, 87, 85, 80, 78, 83, 81],
    },
  ],
};

function mockState(state: Partial<ReturnType<typeof usePiqMaturity>>) {
  usePiqMaturity.mockReturnValue({
    data: undefined,
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
    ...state,
  });
}

function mockSuccess(data: PiqMaturityKpi | null = detail) {
  mockState({
    data: { data, meta: { requestId: 'r', reportingPeriod: '2026-05' } },
  });
}

describe('PiqMaturitySection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the section landmark and table skeleton while loading', () => {
    mockState({ isLoading: true });
    const { container } = renderWithTheme(<PiqMaturitySection />);

    expect(screen.getByRole('region', { name: TITLE })).toBeInTheDocument();
    // Headers stay rendered so the table doesn't reflow when data lands (§14).
    expect(screen.getByText('2026 YTD')).toBeInTheDocument();
    expect(
      container.querySelectorAll('.MuiSkeleton-root').length,
    ).toBeGreaterThan(0);
  });

  it('renders an error state with a working retry', async () => {
    const refetch = vi.fn();
    mockState({ isError: true, refetch });
    renderWithTheme(<PiqMaturitySection />);

    expect(screen.getByText(`Unable to load ${TITLE}`)).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /retry/i }));
    expect(refetch).toHaveBeenCalledOnce();
  });

  it('treats a null detail as empty, not as an error', () => {
    mockSuccess(null);
    renderWithTheme(<PiqMaturitySection />);

    expect(screen.getByText(`No ${TITLE} data`)).toBeInTheDocument();
  });

  it('renders Global as the aggregate row over the region rows', () => {
    mockSuccess();
    renderWithTheme(<PiqMaturitySection />);

    const rowLabels = screen
      .getAllByRole('row')
      .slice(1) // drop the header row
      .map((row) => row.querySelector('td')?.textContent);

    expect(rowLabels).toEqual(['Global', 'NAR', 'LAR']);
  });

  it('renders values as percentages', () => {
    mockSuccess();
    renderWithTheme(<PiqMaturitySection />);

    // Global's row, per Figma: 88% / 90% / 91% / 91% (R3) / 90%.
    expect(screen.getByText('88%')).toBeInTheDocument();
    expect(screen.getByText('91% (R3)')).toBeInTheDocument();
    // LAR's, which carries the red highlight.
    expect(screen.getByText('82%')).toBeInTheDocument();
    expect(screen.getByText('81% (R3)')).toBeInTheDocument();
  });

  it('labels the trailing column from the reporting period', () => {
    mockSuccess();
    renderWithTheme(<PiqMaturitySection />);

    expect(screen.getByText("May'26")).toBeInTheDocument();
  });

  it('carries each row status through to the cell colour', () => {
    mockSuccess();
    renderWithTheme(<PiqMaturitySection />);

    // LAR's 82 is *under* its 85 plan, which the shared placeholder rule would
    // call GREEN (lower is better for PPM). PIQ inverts that, so the explicit
    // RED status must win or the section silently diverges from Figma.
    expect(screen.getByText('82%')).toHaveStyle({ color: 'rgb(211, 47, 47)' });
    expect(screen.getByText('91%')).toHaveStyle({ color: 'rgb(46, 125, 50)' });
  });

  it('renders without card chrome — no title card, no "As of" footer', () => {
    mockSuccess();
    renderWithTheme(<PiqMaturitySection />);

    // The frame wraps the table in a bare bordered panel; a ContentCard would
    // add a repeated title heading and a footer that Figma doesn't draw.
    expect(screen.queryByText(/^As of/)).not.toBeInTheDocument();
    expect(screen.getAllByRole('heading', { name: TITLE })).toHaveLength(1);
  });

  it('renders the section header with its Deep Dive action', () => {
    mockSuccess();
    renderWithTheme(<PiqMaturitySection />);

    const action = screen.getByRole('button', { name: /deep dive/i });
    expect(action).toBeInTheDocument();
    expect(action).toBeDisabled();
  });

  it('forwards filters to the data hook', () => {
    mockSuccess();
    renderWithTheme(<PiqMaturitySection filters={{ region: 'NAR' }} />);
    expect(usePiqMaturity).toHaveBeenCalledWith({ region: 'NAR' });
  });
});
