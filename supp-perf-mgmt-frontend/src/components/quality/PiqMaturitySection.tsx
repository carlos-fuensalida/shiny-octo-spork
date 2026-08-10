'use client';

import Box from '@mui/material/Box';

import { EmptyState, ErrorState, SectionHeader } from '@/components/ui';
import { usePiqMaturity } from '@/hooks';
import { formatShortMonth } from '@/lib/format';
import type { FilterParams } from '@/types';

import { DEEP_DIVE } from './deepDive';
import type { TrendRow } from './KpiTrendTable';
import KpiTrendTable from './KpiTrendTable';

const TITLE = 'PIQ Maturity (NPI Projects)';

/** Aggregate row label — Figma `804:26219`. Not a `byRegion` entry. */
const AGGREGATE_LABEL = 'Global';

/** Global + NAR + LAR, so the skeleton reserves the real table's height. */
const ROW_COUNT = 3;

interface PiqMaturitySectionProps {
  filters?: FilterParams;
}

/**
 * PIQ Maturity (Figma `804:26192`): one full-width trend table, Global over
 * NAR/LAR.
 *
 * The only Quality section with **no card chrome** — the frame wraps the table
 * in a plain 8px-radius bordered panel, which is exactly what `DataTable`'s own
 * container already draws, and there is no card title and no "As of …" footer.
 * So no `ContentCard` here; see the epic README's card-chrome note.
 *
 * The table itself is `KpiTrendTable`, shared with PPM/CAL — the PIQ frame is a
 * copy of the PPM one (it is still *named* "Incoming Material PPM table"), and
 * differs only in carrying percentages.
 */
export default function PiqMaturitySection({
  filters = {},
}: PiqMaturitySectionProps) {
  const { data, isLoading, isError, refetch } = usePiqMaturity(filters);
  const detail = data?.data;

  if (isLoading) {
    return (
      <Section>
        <SectionHeader.Skeleton title={TITLE} action />
        <KpiTrendTable.Skeleton rowCount={ROW_COUNT} />
      </Section>
    );
  }

  if (isError) {
    return (
      <Section>
        <SectionHeader title={TITLE} action={DEEP_DIVE} />
        <ErrorState
          title={`Unable to load ${TITLE}`}
          description="Something went wrong fetching this section."
          onRetry={() => refetch()}
          minHeight={240}
        />
      </Section>
    );
  }

  // data: null (no detail for the active filters) is an empty result, never an
  // error (§14) — the single-object equivalent of `data: []` on list endpoints.
  if (!detail) {
    return (
      <Section>
        <SectionHeader title={TITLE} action={DEEP_DIVE} />
        <EmptyState
          title={`No ${TITLE} data`}
          description="No data matches the active filters."
          minHeight={240}
        />
      </Section>
    );
  }

  const aggregate: TrendRow = {
    dimension: AGGREGATE_LABEL,
    fy2025: detail.fy2025,
    plan2026: detail.plan2026,
    ytd2026: detail.ytd2026,
    ytd2026Status: detail.ytd2026Status,
    rollingR3: detail.rollingR3,
    rollingR3Status: detail.rollingR3Status,
    monthly: detail.monthly,
  };

  const breakdown: TrendRow[] = detail.byRegion.map((row) => ({
    dimension: row.region,
    fy2025: row.fy2025,
    plan2026: row.plan2026,
    ytd2026: row.ytd2026,
    ytd2026Status: row.ytd2026Status,
    rollingR3: row.rollingR3,
    rollingR3Status: row.rollingR3Status,
    monthly: row.monthly,
  }));

  return (
    <Section>
      <SectionHeader title={TITLE} action={DEEP_DIVE} />
      <KpiTrendTable
        aggregate={aggregate}
        breakdown={breakdown}
        // PIQ's `monthly` is a bare number[], so the trailing column header
        // comes from the reporting period rather than the last data point.
        latestPeriodLabel={formatShortMonth(detail.reportingPeriod)}
        unit="PERCENT"
      />
    </Section>
  );
}

function Section({ children }: { children: React.ReactNode }) {
  return (
    <Box
      component="section"
      aria-label={TITLE}
      display="flex"
      flexDirection="column"
      gap={4}
    >
      {children}
    </Box>
  );
}
