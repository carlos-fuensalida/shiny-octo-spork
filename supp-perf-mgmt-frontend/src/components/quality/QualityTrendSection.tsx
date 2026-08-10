'use client';

import Box from '@mui/material/Box';

import {
  ContentCard,
  EmptyState,
  ErrorState,
  OffenderList,
  SectionHeader,
} from '@/components/ui';
import type { KpiUnit, TopOffenderBar } from '@/types';

import { DEEP_DIVE } from './deepDive';
import type { TrendRow } from './KpiTrendTable';
import KpiTrendTable from './KpiTrendTable';

/** Below this container width the two cards stack instead of sitting side by side. */
const STACK_BELOW = 720;
/** Narrow card's fixed width in the Figma frame (`804:26161`, 290 of 1385px). */
const OFFENDERS_WIDTH = 290;

const OFFENDERS_TITLE = 'Top Offenders';

export interface QualityTrendSectionData {
  aggregate: TrendRow;
  breakdown: TrendRow[];
  offenders: TopOffenderBar[];
  latestPeriodLabel: string;
}

interface QualityTrendSectionProps {
  title: string;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  footer?: string;
  data: QualityTrendSectionData | null;
  unit: KpiUnit;
}

/**
 * Shared layout for the PPM and CAL sections (Figma `804:26153`/`804:26163`):
 * a `SectionHeader` with a DEEP DIVE action, then a row of two `ContentCard`s —
 * the wide trend table and the narrow Top Offenders list, each with its own
 * "As of …" footer.
 *
 * The two sections are structurally identical and differ only in which detail
 * hook feeds them and how its rows map to `TrendRow`; that mapping stays in the
 * thin `PpmSection`/`CalSection` wrappers while the shared JSX (and all four
 * §14 states) lives here, so they aren't two near-duplicate files.
 */
export default function QualityTrendSection({
  title,
  isLoading,
  isError,
  onRetry,
  footer,
  data,
  unit,
}: QualityTrendSectionProps) {
  if (isLoading) {
    return (
      <Section title={title}>
        <SectionHeader.Skeleton title={title} action />
        <CardRow>
          <ContentCard.Skeleton title={title}>
            <KpiTrendTable.Skeleton />
          </ContentCard.Skeleton>
          <ContentCard.Skeleton title={OFFENDERS_TITLE}>
            <OffenderList.Skeleton />
          </ContentCard.Skeleton>
        </CardRow>
      </Section>
    );
  }

  if (isError) {
    return (
      <Section title={title}>
        <SectionHeader title={title} action={DEEP_DIVE} />
        <ErrorState
          title={`Unable to load ${title}`}
          description="Something went wrong fetching this section."
          onRetry={onRetry}
          minHeight={240}
        />
      </Section>
    );
  }

  // data: null (no detail for the active filters) is an empty result, never an
  // error (§14) — the single-object equivalent of `data: []` on list endpoints.
  if (!data) {
    return (
      <Section title={title}>
        <SectionHeader title={title} action={DEEP_DIVE} />
        <EmptyState
          title={`No ${title} data`}
          description="No data matches the active filters."
          minHeight={240}
        />
      </Section>
    );
  }

  return (
    <Section title={title}>
      <SectionHeader title={title} action={DEEP_DIVE} />
      <CardRow>
        <ContentCard title={title} footer={footer}>
          <KpiTrendTable
            aggregate={data.aggregate}
            breakdown={data.breakdown}
            latestPeriodLabel={data.latestPeriodLabel}
            unit={unit}
          />
        </ContentCard>
        <ContentCard title={OFFENDERS_TITLE} footer={footer}>
          <OffenderList offenders={data.offenders} unit={unit} />
        </ContentCard>
      </CardRow>
    </Section>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Box
      component="section"
      aria-label={title}
      display="flex"
      flexDirection="column"
      gap={4}
    >
      {children}
    </Box>
  );
}

/**
 * Trend table (flexible) + offender list (fixed 290px) side by side, stacking
 * on a narrow container. Keyed off the section's own width via a container
 * query — same technique as `TopOffendersSection`'s `ChartGrid` — because it's
 * the chatbot panel toggling that changes this column's width, not the viewport.
 */
function CardRow({ children }: { children: React.ReactNode }) {
  return (
    <Box sx={{ containerType: 'inline-size' }}>
      <Box
        display="grid"
        gap={4}
        gridTemplateColumns="1fr"
        sx={{
          [`@container (min-width: ${STACK_BELOW}px)`]: {
            gridTemplateColumns: `minmax(0, 1fr) ${OFFENDERS_WIDTH}px`,
          },
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
