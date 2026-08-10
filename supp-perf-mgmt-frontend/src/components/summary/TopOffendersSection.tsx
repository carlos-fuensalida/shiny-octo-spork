'use client';

import Box from '@mui/material/Box';
import type { SxProps, Theme } from '@mui/material/styles';

import {
  EmptyState,
  ErrorState,
  OffenderBarChart,
  SectionCard,
} from '@/components/ui';
import { useTopOffenders } from '@/hooks';
import { formatAsOfFooter } from '@/lib/format';
import type { FilterParams, TopOffenderChart } from '@/types';

const TITLE = 'Top Offenders';

const SKELETON_COUNT = 5;

/**
 * Columns per row, keyed by the section's own width (a container query, not a
 * viewport breakpoint) so the grid gains columns when the chatbot panel
 * collapses and the content area widens — three across with the chatbot open,
 * all five in one row once there's room. Ordered narrowest-first.
 */
const COLUMN_TIERS = [
  { minWidth: 0, columns: 1 },
  { minWidth: 720, columns: 3 },
  { minWidth: 1200, columns: 5 },
] as const;

interface TopOffendersSectionProps {
  filters?: FilterParams;
}

export default function TopOffendersSection({
  filters = {},
}: TopOffendersSectionProps) {
  const { data, isLoading, isError, refetch } = useTopOffenders(filters);

  if (isLoading) {
    return (
      <SectionCard title={TITLE}>
        <SectionCard.Cell span={6}>
          <ChartGrid>
            {Array.from({ length: SKELETON_COUNT }, (_, i) => (
              <OffenderBarChart.Skeleton key={i} />
            ))}
          </ChartGrid>
        </SectionCard.Cell>
      </SectionCard>
    );
  }

  if (isError) {
    return (
      <SectionCard title={TITLE}>
        <SectionCard.Cell span={6}>
          <ErrorState
            title="Unable to load top offenders"
            description="Something went wrong fetching this section."
            onRetry={() => refetch()}
            minHeight={200}
          />
        </SectionCard.Cell>
      </SectionCard>
    );
  }

  const charts: TopOffenderChart[] = data?.data ?? [];
  const footer = formatAsOfFooter(data?.meta?.reportingPeriod);

  // data: [] with HTTP 200 is an empty result, never an error (§14).
  if (charts.length === 0) {
    return (
      <SectionCard title={TITLE} footer={footer}>
        <SectionCard.Cell span={6}>
          <EmptyState
            title="No top offenders"
            description="No data matches the active filters."
            minHeight={200}
          />
        </SectionCard.Cell>
      </SectionCard>
    );
  }

  return (
    <SectionCard title={TITLE} footer={footer}>
      <SectionCard.Cell span={6}>
        <ChartGrid>
          {charts.map((chart) => (
            <OffenderBarChart
              key={chart.metricId}
              title={chart.metricName}
              offenders={chart.offenders}
              unit={chart.unit}
            />
          ))}
        </ChartGrid>
      </SectionCard.Cell>
    </SectionCard>
  );
}

/**
 * Lays the chart tiles out in a responsive grid whose column count follows the
 * section's own width (see `COLUMN_TIERS`), so closing the chatbot reflows the
 * charts rather than just stretching them. Reuses SectionCard's divider
 * technique: a `divider`-coloured backdrop shows through 1px gaps between opaque
 * `background.paper` cells. The number of empty trailing slots differs per tier,
 * so each filler cell toggles its own visibility per container width — keeping
 * the last row full at every column count so no divider bleeds into a gap.
 */
function ChartGrid({ children }: { children: React.ReactNode[] }) {
  const n = children.length;
  const fillersPerTier = COLUMN_TIERS.map(
    ({ columns }) => (columns - (n % columns)) % columns,
  );
  const maxFillers = Math.max(...fillersPerTier);

  const containerQuery = (minWidth: number) =>
    `@container (min-width: ${minWidth}px)`;

  const columnsSx: Record<string, unknown> = {};
  COLUMN_TIERS.forEach(({ minWidth, columns }, i) => {
    const value = `repeat(${columns}, 1fr)`;
    if (i === 0) columnsSx.gridTemplateColumns = value;
    else columnsSx[containerQuery(minWidth)] = { gridTemplateColumns: value };
  });

  const fillerSx = (index: number): Record<string, unknown> => {
    const sx: Record<string, unknown> = {};
    COLUMN_TIERS.forEach(({ minWidth }, i) => {
      const display = index < fillersPerTier[i] ? 'block' : 'none';
      if (i === 0) sx.display = display;
      else sx[containerQuery(minWidth)] = { display };
    });
    return sx;
  };

  return (
    <Box sx={{ containerType: 'inline-size' }}>
      <Box
        display="grid"
        gap="1px"
        bgcolor="divider"
        sx={columnsSx as SxProps<Theme>}
      >
        {children.map((child, i) => (
          <Box key={i} bgcolor="background.paper">
            {child}
          </Box>
        ))}
        {Array.from({ length: maxFillers }, (_, i) => (
          <Box
            key={`filler-${i}`}
            bgcolor="background.paper"
            sx={fillerSx(i) as SxProps<Theme>}
          />
        ))}
      </Box>
    </Box>
  );
}
