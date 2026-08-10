import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import KpiCard from '@/components/ui/KpiCard';
import type { KpiCard as KpiCardType, SummaryMetric } from '@/types';

import { renderWithTheme } from '../../utils/renderWithTheme';

const kpi: KpiCardType = {
  kpiId: 'kpi-8d-capa',
  kpiName: '8Ds',
  category: 'QUALITY',
  region: 'GLOBAL',
  value: 38,
  unit: 'COUNT',
  status: null,
  reportingPeriod: '2026-01',
  lastUpdated: '2026-02-02T06:00:00Z',
};

const metrics: SummaryMetric[] = [
  { label: 'Total Open 2026', value: 38 },
  { label: 'Open > 90 Days', value: 9 },
  { label: 'Open > 45 Days', value: 15 },
];

describe('KpiCard metrics rendering', () => {
  it('renders every metric label and value', () => {
    renderWithTheme(<KpiCard kpi={kpi} metrics={metrics} />);

    for (const metric of metrics) {
      expect(screen.getByText(metric.label)).toBeInTheDocument();
      expect(screen.getByText(String(metric.value))).toBeInTheDocument();
    }
  });

  it('formats metric values by unit', () => {
    renderWithTheme(
      <KpiCard
        kpi={{ ...kpi, kpiName: 'Cost Recovery' }}
        metrics={[
          { label: 'Global YTD', value: 340000, unit: 'USD' },
          { label: 'Global Conversion', value: 68, unit: 'PERCENT' },
        ]}
      />,
    );

    expect(screen.getByText('US$340K')).toBeInTheDocument();
    expect(screen.getByText('68%')).toBeInTheDocument();
  });

  it('renders an em dash for a null metric value', () => {
    renderWithTheme(
      <KpiCard kpi={kpi} metrics={[{ label: 'Global', value: null }]} />,
    );
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('renders an optional caption under the value', () => {
    renderWithTheme(
      <KpiCard
        kpi={kpi}
        metrics={[
          {
            label: 'DTC',
            value: 91.2,
            unit: 'PERCENT',
            caption: '19,800 Units',
          },
        ]}
      />,
    );
    expect(screen.getByText('19,800 Units')).toBeInTheDocument();
  });

  it('supersedes the tiles/values path when metrics are provided', () => {
    renderWithTheme(
      <KpiCard
        kpi={kpi}
        tiles="3"
        values={{ global: 999 }}
        metrics={metrics}
      />,
    );

    expect(screen.queryByText('999')).not.toBeInTheDocument();
    expect(screen.queryByText('NAR')).not.toBeInTheDocument();
    expect(screen.getByText('Total Open 2026')).toBeInTheDocument();
  });
});

describe('KpiCard metricRows rendering', () => {
  const rows: SummaryMetric[][] = [
    [
      { label: 'Expedite', value: 'Qty 145 / $1.2M' },
      { label: 'Production Loss', value: 22500 },
    ],
    [
      { label: 'DTC', value: 91.2, unit: 'PERCENT' },
      { label: 'VMI', value: 88, unit: 'PERCENT' },
    ],
  ];

  it('renders every row and every metric within it', () => {
    renderWithTheme(<KpiCard metricRows={rows} />);

    expect(screen.getByText('Expedite')).toBeInTheDocument();
    expect(screen.getByText('Production Loss')).toBeInTheDocument();
    expect(screen.getByText('DTC')).toBeInTheDocument();
    expect(screen.getByText('91.2%')).toBeInTheDocument();
    expect(screen.getByText('88%')).toBeInTheDocument();
  });

  it('supersedes metrics when both are provided', () => {
    renderWithTheme(<KpiCard metricRows={rows} metrics={metrics} />);

    expect(screen.getByText('Expedite')).toBeInTheDocument();
    expect(screen.queryByText('Total Open 2026')).not.toBeInTheDocument();
  });

  it('keeps each row a separate flex container', () => {
    const { container } = renderWithTheme(<KpiCard metricRows={rows} />);
    const rowContainer = screen
      .getByText('Expedite')
      .closest('div')?.parentElement;
    // Each row box should hold exactly the metrics for that row, not all four.
    expect(rowContainer?.textContent).toContain('Production Loss');
    expect(rowContainer?.textContent).not.toContain('DTC');
    expect(container.querySelectorAll('.MuiSkeleton-root')).toHaveLength(0);
  });
});

describe('KpiCard variants', () => {
  it('renders Card chrome by default', () => {
    const { container } = renderWithTheme(
      <KpiCard kpi={kpi} metrics={metrics} />,
    );
    expect(container.querySelector('.MuiCard-root')).toBeInTheDocument();
  });

  it('renders no Card chrome when embedded', () => {
    const { container } = renderWithTheme(
      <KpiCard variant="embedded" kpi={kpi} metrics={metrics} />,
    );
    expect(container.querySelector('.MuiCard-root')).not.toBeInTheDocument();
    expect(screen.getByText('8Ds')).toBeInTheDocument();
  });

  it('is not a button when embedded without onClick', () => {
    renderWithTheme(<KpiCard variant="embedded" kpi={kpi} metrics={metrics} />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('fires onClick from an embedded tile', async () => {
    const onClick = vi.fn();
    renderWithTheme(
      <KpiCard
        variant="embedded"
        kpi={kpi}
        metrics={metrics}
        onClick={onClick}
      />,
    );

    await userEvent.click(
      screen.getByRole('button', { name: 'View 8Ds details' }),
    );
    expect(onClick).toHaveBeenCalledOnce();
  });
});

describe('KpiCard title override', () => {
  it('renders title instead of kpi.kpiName when provided', () => {
    renderWithTheme(<KpiCard title="Global" kpi={kpi} metrics={metrics} />);
    expect(screen.getByText('Global')).toBeInTheDocument();
    expect(screen.queryByText('8Ds')).not.toBeInTheDocument();
  });

  it('renders no status chip when using title without a kpi', () => {
    renderWithTheme(<KpiCard title="Global" metrics={metrics} />);
    expect(screen.queryByText('At Risk')).not.toBeInTheDocument();
    expect(screen.queryByText('On Track')).not.toBeInTheDocument();
  });

  it('uses title in the clickable tile aria-label when there is no kpi', async () => {
    const onClick = vi.fn();
    renderWithTheme(
      <KpiCard
        variant="embedded"
        title="Global"
        metrics={metrics}
        onClick={onClick}
      />,
    );

    await userEvent.click(
      screen.getByRole('button', { name: 'View Global details' }),
    );
    expect(onClick).toHaveBeenCalledOnce();
  });
});

describe('KpiCard states', () => {
  it('shows an error message instead of metrics', () => {
    renderWithTheme(<KpiCard kpi={kpi} metrics={metrics} error />);
    expect(screen.getByText('Unable to load')).toBeInTheDocument();
    expect(screen.queryByText('Total Open 2026')).not.toBeInTheDocument();
  });

  it('hides metrics while loading', () => {
    renderWithTheme(<KpiCard kpi={kpi} metrics={metrics} loading />);
    expect(screen.queryByText('Total Open 2026')).not.toBeInTheDocument();
  });

  it('renders a StatusChip only when a status is present', () => {
    renderWithTheme(<KpiCard kpi={kpi} metrics={metrics} />);
    expect(screen.queryByText('At Risk')).not.toBeInTheDocument();

    renderWithTheme(
      <KpiCard kpi={{ ...kpi, status: 'RED' }} metrics={metrics} />,
    );
    expect(screen.getByText('At Risk')).toBeInTheDocument();
  });
});

describe('KpiCard.Skeleton', () => {
  it('reserves the requested number of metric columns', () => {
    const { container } = renderWithTheme(<KpiCard.Skeleton metrics={3} />);
    // 1 title skeleton + 2 per metric column
    expect(container.querySelectorAll('.MuiSkeleton-root')).toHaveLength(7);
  });

  it('drops Card chrome in the embedded variant', () => {
    const { container } = renderWithTheme(
      <KpiCard.Skeleton variant="embedded" metrics={2} />,
    );
    expect(container.querySelector('.MuiCard-root')).not.toBeInTheDocument();
  });
});
