import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import type { SectionMetric } from '@/components/quality/MetricCardsSection';
import MetricCardsSection from '@/components/quality/MetricCardsSection';

import { renderWithTheme } from '../../utils/renderWithTheme';

const TITLE = 'Cost Recovery';

const metrics: SectionMetric[] = [
  { label: 'Global Conversion', value: '24' },
  { label: 'Total Recovered', value: 'US$15K' },
  { label: 'On going', value: 'US$24M' },
];

function render(
  props: Partial<React.ComponentProps<typeof MetricCardsSection>>,
) {
  return renderWithTheme(
    <MetricCardsSection
      title={TITLE}
      isLoading={false}
      isError={false}
      onRetry={vi.fn()}
      metrics={metrics}
      {...props}
    />,
  );
}

describe('MetricCardsSection', () => {
  it('renders one card per metric', () => {
    render({});

    expect(screen.getByRole('region', { name: TITLE })).toBeInTheDocument();
    for (const metric of metrics) {
      expect(screen.getByText(metric.label)).toBeInTheDocument();
      expect(screen.getByText(metric.value)).toBeInTheDocument();
    }
  });

  it('renders the section header with its Deep Dive action', () => {
    render({});

    const action = screen.getByRole('button', { name: /deep dive/i });
    expect(action).toBeInTheDocument();
    expect(action).toBeDisabled();
  });

  it('renders card skeletons while loading, keeping the title visible', () => {
    const { container } = render({ isLoading: true, metrics: null });

    // Section titles are page structure, known before the fetch (§14).
    expect(screen.getByRole('heading', { name: TITLE })).toBeInTheDocument();
    expect(screen.queryByText('US$15K')).not.toBeInTheDocument();
    expect(
      container.querySelectorAll('.MuiSkeleton-root').length,
    ).toBeGreaterThan(0);
  });

  it('renders an error state with a working retry', async () => {
    const onRetry = vi.fn();
    render({ isError: true, onRetry });

    expect(screen.getByText(`Unable to load ${TITLE}`)).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /retry/i }));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it('treats null metrics as empty, not as an error', () => {
    render({ metrics: null });

    expect(screen.getByText(`No ${TITLE} data`)).toBeInTheDocument();
    expect(screen.queryByText(/Unable to load/)).not.toBeInTheDocument();
  });

  it('treats an empty metrics list as empty too', () => {
    render({ metrics: [] });

    expect(screen.getByText(`No ${TITLE} data`)).toBeInTheDocument();
  });

  it('keeps the header rendered in every state', () => {
    for (const props of [
      { isLoading: true, metrics: null },
      { isError: true },
      { metrics: null },
      {},
    ]) {
      const { unmount } = render(props);
      expect(screen.getByRole('heading', { name: TITLE })).toBeInTheDocument();
      unmount();
    }
  });
});
