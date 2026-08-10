'use client';

import Box from '@mui/material/Box';

import { EmptyState, ErrorState, SectionHeader } from '@/components/ui';
import { useProductsOnHold } from '@/hooks';
import type { FilterParams, ProductsOnHoldScope } from '@/types';

import ProductsOnHoldCard from './ProductsOnHoldCard';

const TITLE = 'Products on Hold';

/**
 * Scope order as drawn in Figma `804:26187`, left → right. Also drives the
 * loading state, so the skeleton row matches the real row card-for-card.
 */
const SCOPE_ORDER: ProductsOnHoldScope[] = ['GLOBAL', 'NAR', 'LAR', 'FPS_ONLY'];

interface ProductsOnHoldSectionProps {
  filters?: FilterParams;
}

/**
 * Products on Hold (Figma `804:26181`): four grouped-bar cards, one per segment
 * scope. Unlike every other Quality section its header carries **no** action
 * button — `804:26182` is divider–title–divider only.
 */
export default function ProductsOnHoldSection({
  filters = {},
}: ProductsOnHoldSectionProps) {
  const { data, isLoading, isError, refetch } = useProductsOnHold(filters);

  if (isLoading) {
    return (
      <Section>
        <SectionHeader.Skeleton title={TITLE} />
        <CardRow>
          {SCOPE_ORDER.map((scope) => (
            <ProductsOnHoldCard.Skeleton key={scope} scope={scope} />
          ))}
        </CardRow>
      </Section>
    );
  }

  if (isError) {
    return (
      <Section>
        <SectionHeader title={TITLE} />
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
        <SectionHeader title={TITLE} />
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
      <SectionHeader title={TITLE} />
      <CardRow>
        {cards.map((card) => (
          <ProductsOnHoldCard
            key={card.segmentScope}
            scope={card.segmentScope}
            byMonth={card.byMonth}
            carryOver2025={card.carryOver2025}
          />
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
 * Four cards across, dropping to two then one. Keyed off the section's own
 * width via a container query rather than the viewport — it's the chatbot panel
 * toggling that changes this column's width (the `QualityTrendSection`
 * technique).
 *
 * The 1000px threshold is sized from the real content width, which is the
 * viewport less the chat panel and the page padding:
 *
 *   1440px laptop → 1440 - 360 - 24 = 1056px  → 4 across
 *   1920px screen → 1920 - 440 - 64 = 1416px  → 4 across
 *   1280px laptop → 1280 - 360 - 24 =  896px  → 2 across
 *
 * At 1056px each card is ~252px against Figma's 334px, which the bar-width cap
 * in `ProductsOnHoldChart` keeps legible. Below ~1000px four charts would be
 * too cramped to read, so the row wraps instead.
 */
const FOUR_COLUMN_MIN = 1000;
const TWO_COLUMN_MIN = 560;

function CardRow({ children }: { children: React.ReactNode }) {
  return (
    <Box sx={{ containerType: 'inline-size' }}>
      <Box
        display="grid"
        gap={4}
        gridTemplateColumns="1fr"
        sx={{
          [`@container (min-width: ${TWO_COLUMN_MIN}px)`]: {
            gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
          },
          [`@container (min-width: ${FOUR_COLUMN_MIN}px)`]: {
            gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
          },
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
