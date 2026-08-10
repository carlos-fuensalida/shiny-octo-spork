'use client';

import Typography from '@mui/material/Typography';

import { CardSurface } from '@/components/ui';
import type { ProductsOnHoldMonthRow, ProductsOnHoldScope } from '@/types';

import ProductsOnHoldChart from './ProductsOnHoldChart';

/**
 * Card titles as drawn in Figma `804:26188`–`804:26191`. Derived from
 * `segmentScope` rather than carried in the payload — card labels are a layout
 * concern, the same call `QualitySections` makes for section titles.
 */
const SCOPE_LABELS: Record<ProductsOnHoldScope, string> = {
  GLOBAL: 'Global (FPS & Components)',
  NAR: 'NAR (FPS & Components)',
  LAR: 'LAR (FPS & Components)',
  FPS_ONLY: 'FPS',
};

interface ProductsOnHoldCardProps {
  scope: ProductsOnHoldScope;
  byMonth: ProductsOnHoldMonthRow[];
  carryOver2025: number;
}

/**
 * One Products on Hold card: `CardSurface` + a plain scope label + the grouped
 * bar chart. No divider and no footer — unlike the PPM/CAL `ContentCard`, this
 * card's Figma frame is just a titled panel around the plot.
 */
export default function ProductsOnHoldCard({
  scope,
  byMonth,
  carryOver2025,
}: ProductsOnHoldCardProps) {
  return (
    <CardSurface
      p={4}
      display="flex"
      flexDirection="column"
      gap={3}
      height="100%"
    >
      <Typography variant="body1" fontWeight={500} color="primary.main">
        {SCOPE_LABELS[scope]}
      </Typography>
      <ProductsOnHoldChart byMonth={byMonth} carryOver2025={carryOver2025} />
    </CardSurface>
  );
}

// ─── Skeleton ──────────────────────────────────────────────────────────────

interface ProductsOnHoldCardSkeletonProps {
  /** Scope labels are page structure, known before the fetch, so they render
   * for real — only the chart gets a placeholder shape (the convention
   * `ContentCard.Skeleton` and `SectionHeader.Skeleton` already follow). */
  scope: ProductsOnHoldScope;
}

function ProductsOnHoldCardSkeleton({
  scope,
}: ProductsOnHoldCardSkeletonProps) {
  return (
    <CardSurface
      p={4}
      display="flex"
      flexDirection="column"
      gap={3}
      height="100%"
    >
      <Typography variant="body1" fontWeight={500} color="primary.main">
        {SCOPE_LABELS[scope]}
      </Typography>
      <ProductsOnHoldChart.Skeleton />
    </CardSurface>
  );
}

ProductsOnHoldCard.Skeleton = ProductsOnHoldCardSkeleton;

export { SCOPE_LABELS };
export type { ProductsOnHoldCardProps };
