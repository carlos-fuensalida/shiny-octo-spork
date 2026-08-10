'use client';

import Box from '@mui/material/Box';

import {
  EmptyState,
  ErrorState,
  HighlightCard,
  SectionHeader,
} from '@/components/ui';

import { DEEP_DIVE } from './deepDive';

/** One card: what it measures, and the already-formatted figure. */
export interface SectionMetric {
  label: string;
  value: string;
}

/** Cards drawn per section in Figma `1365:14445` / `1365:14534`. */
const CARD_COUNT = 3;

/**
 * The three cards stay on one line in **both** Figma frames — 221.5px wide with
 * the chatbot closed (`1365:14445`), 151.5px with it open (`1423:14650`) — so
 * the row doesn't break at either drawn width; the cards themselves switch to a
 * stacked layout instead (see `HighlightCard`).
 *
 * 460px is just under the narrower of the two rows (3 × 151.5 + 16 = 470.5),
 * which is also about the point where a card stops fitting its longest label
 * ("Global Conversion", 116px, plus 32px of padding). Below it the cards go one
 * per line and get the full width back, rather than shrinking past legibility
 * when the resizable chatbot panel takes more room than any frame assumes.
 */
const STACK_BELOW = 460;

interface MetricCardsSectionProps {
  title: string;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  metrics: SectionMetric[] | null;
}

/**
 * Shared layout for the Quality page's Cost Recovery and Focus Supplier
 * sections (Figma `1365:14366` / `1365:14287`): a `SectionHeader` with a DEEP
 * DIVE action over a row of `HighlightCard`s.
 *
 * The two sections are structurally identical and differ only in which detail
 * hook feeds them and how its fields map to three labelled figures; that
 * mapping stays in the thin `CostRecoverySection`/`FocusSupplierSection`
 * wrappers while the shared JSX and all four §14 states live here — the same
 * split `QualityTrendSection` uses for PPM and CAL.
 */
export default function MetricCardsSection({
  title,
  isLoading,
  isError,
  onRetry,
  metrics,
}: MetricCardsSectionProps) {
  if (isLoading) {
    return (
      <Section title={title}>
        <SectionHeader.Skeleton title={title} action />
        <CardRow>
          {Array.from({ length: CARD_COUNT }, (_, i) => (
            <HighlightCard.Skeleton key={i} />
          ))}
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
          minHeight={64}
        />
      </Section>
    );
  }

  // data: null (no detail for the active filters) is an empty result, never an
  // error (§14) — the single-object equivalent of `data: []` on list endpoints.
  if (!metrics || metrics.length === 0) {
    return (
      <Section title={title}>
        <SectionHeader title={title} action={DEEP_DIVE} />
        <EmptyState
          title={`No ${title} data`}
          description="No data matches the active filters."
          minHeight={64}
        />
      </Section>
    );
  }

  return (
    <Section title={title}>
      <SectionHeader title={title} action={DEEP_DIVE} />
      <CardRow>
        {metrics.map((metric) => (
          <HighlightCard
            key={metric.label}
            label={metric.label}
            value={metric.value}
          />
        ))}
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
 * Equal-width cards in one row, stacking on a narrow container. Container query
 * rather than a media query for the same reason as every other Quality section
 * — the chatbot panel, not the viewport, drives this column's width.
 */
function CardRow({ children }: { children: React.ReactNode }) {
  return (
    <Box sx={{ containerType: 'inline-size' }}>
      <Box
        display="grid"
        gap={2}
        gridTemplateColumns="1fr"
        sx={{
          [`@container (min-width: ${STACK_BELOW}px)`]: {
            gridTemplateColumns: `repeat(${CARD_COUNT}, minmax(0, 1fr))`,
          },
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
