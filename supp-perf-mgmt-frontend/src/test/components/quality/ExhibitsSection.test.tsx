import { screen, within } from '@testing-library/react';
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
    }) => React.cloneElement(children, { width: 200, height: 200 }),
  };
});

const useExhibits = vi.fn();
vi.mock('@/hooks', () => ({
  useExhibits: (...args: unknown[]) => useExhibits(...args),
}));

import ExhibitsSection from '@/components/quality/ExhibitsSection';
import type { QualityExhibitsKpi, Region } from '@/types';

import { renderWithTheme } from '../../utils/renderWithTheme';

/** Counts copied from Figma `804:26272`–`804:26274`. */
const COUNTS: Record<Region, [number, number, number, number, number]> = {
  GLOBAL: [11, 18, 8, 3, 14],
  NAR: [8, 9, 7, 0, 12],
  LAR: [3, 9, 1, 3, 2],
};

function card(region: Region): QualityExhibitsKpi {
  const [completed, ongoing, delayed, disposition, notStarted] = COUNTS[region];
  return {
    kpiId: 'kpi-exhibits',
    kpiName: 'Quality Exhibits',
    category: 'QUALITY',
    region,
    value: completed + ongoing + delayed + disposition + notStarted,
    unit: 'COUNT',
    status: null,
    reportingPeriod: '2026-05',
    lastUpdated: '2026-06-02T06:00:00Z',
    completed,
    ongoing,
    delayed,
    disposition,
    notStarted,
  };
}

const cards = (['GLOBAL', 'NAR', 'LAR'] as const).map(card);

function mockState(state: Partial<ReturnType<typeof useExhibits>>) {
  useExhibits.mockReturnValue({
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

describe('ExhibitsSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the region and card skeletons while loading', () => {
    mockState({ isLoading: true });
    const { container } = renderWithTheme(<ExhibitsSection />);

    expect(
      screen.getByRole('region', { name: 'Quality Exhibits' }),
    ).toBeInTheDocument();
    expect(
      container.querySelectorAll('.MuiSkeleton-root').length,
    ).toBeGreaterThan(0);
  });

  it('renders an error state with a working retry', async () => {
    const refetch = vi.fn();
    mockState({ isError: true, refetch });
    renderWithTheme(<ExhibitsSection />);

    expect(
      screen.getByText('Unable to load Quality Exhibits'),
    ).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /retry/i }));
    expect(refetch).toHaveBeenCalledOnce();
  });

  it('treats an empty list as empty, not as an error', () => {
    mockSuccess([]);
    renderWithTheme(<ExhibitsSection />);

    expect(screen.getByText('No Quality Exhibits data')).toBeInTheDocument();
  });

  it('renders one banded card per region on success', () => {
    mockSuccess();
    renderWithTheme(<ExhibitsSection />);

    expect(screen.getByText('GLOBAL')).toBeInTheDocument();
    expect(screen.getByText('NAR')).toBeInTheDocument();
    expect(screen.getByText('LAR')).toBeInTheDocument();
  });

  // Scoped per card: LAR's total (18) collides with GLOBAL's "On going" count,
  // so a page-wide text query would pass for the wrong reason.
  it("centers each card's derived total", () => {
    mockSuccess();
    renderWithTheme(<ExhibitsSection />);

    const totals: Record<Region, string> = {
      GLOBAL: '54',
      NAR: '36',
      LAR: '18',
    };

    for (const [region, total] of Object.entries(totals)) {
      const card = within(
        screen.getByRole('region', { name: `${region} exhibits` }),
      );
      expect(card.getByText(total)).toBeInTheDocument();
    }
  });

  it('renders the section header with its Deep Dive action', () => {
    mockSuccess();
    renderWithTheme(<ExhibitsSection />);

    const action = screen.getByRole('button', { name: /deep dive/i });
    expect(action).toBeInTheDocument();
    expect(action).toBeDisabled();
  });

  it('forwards filters to the data hook', () => {
    mockSuccess();
    renderWithTheme(<ExhibitsSection filters={{ region: 'NAR' }} />);
    expect(useExhibits).toHaveBeenCalledWith({ region: 'NAR' });
  });
});
