'use client';

import Box from '@mui/material/Box';

import { EmptyState, ErrorState, SectionHeader } from '@/components/ui';
import { useExhibits } from '@/hooks';
import type { FilterParams, Region } from '@/types';

import { DEEP_DIVE } from './deepDive';
import ExhibitsCard from './ExhibitsCard';

const TITLE = 'Quality Exhibits';

/** Region order as drawn in Figma `804:26271`, left → right. */
const REGION_ORDER: Region[] = ['GLOBAL', 'NAR', 'LAR'];

interface ExhibitsSectionProps {
  filters?: FilterParams;
}

/**
 * Quality Exhibits (Figma `804:26265`): three donut cards, one per region.
 */
export default function ExhibitsSection({
  filters = {},
}: ExhibitsSectionProps) {
  const { data, isLoading, isError, refetch } = useExhibits(filters);

  if (isLoading) {
    return (
      <Section>
        <SectionHeader.Skeleton title={TITLE} action />
        <CardRow>
          {REGION_ORDER.map((region) => (
            <ExhibitsCard.Skeleton key={region} region={region} />
          ))}
        </CardRow>
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

  const cards = data?.data ?? [];

  // data: [] with HTTP 200 is an empty result, never an error (§14).
  if (cards.length === 0) {
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

  return (
    <Section>
      <SectionHeader title={TITLE} action={DEEP_DIVE} />
      <CardRow>
        {cards.map((card) => (
          <ExhibitsCard key={card.region} exhibits={card} />
        ))}
      </CardRow>
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

/**
 * Three cards across, collapsing to one on a narrow container. Container query
 * rather than a media query for the same reason as the other Quality sections —
 * the chatbot panel, not the viewport, drives this column's width.
 *
 * 800px is where a card still fits its contents: the 110px ring, a 12px gap,
 * the legend's longest row ("Not started 14"), and 32px of padding come to
 * roughly 260px, so three of those plus gaps need ~800px. A 1280px laptop
 * (896px of content) clears it; anything narrower stacks.
 */
const THREE_COLUMN_MIN = 800;

function CardRow({ children }: { children: React.ReactNode }) {
  return (
    <Box sx={{ containerType: 'inline-size' }}>
      <Box
        display="grid"
        gap={4}
        gridTemplateColumns="1fr"
        sx={{
          [`@container (min-width: ${THREE_COLUMN_MIN}px)`]: {
            gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
          },
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
