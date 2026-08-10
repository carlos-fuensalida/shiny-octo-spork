'use client';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

import { EmptyState, ErrorState } from '@/components/ui';
import { useQualityKpis } from '@/hooks';
import { formatAsOfFooter } from '@/lib/format';
import type { FilterParams } from '@/types';

import CalSection from './CalSection';
import CostRecoverySection from './CostRecoverySection';
import ExhibitsSection from './ExhibitsSection';
import FocusSupplierSection from './FocusSupplierSection';
import PiqMaturitySection from './PiqMaturitySection';
import PpmSection from './PpmSection';
import ProductsOnHoldSection from './ProductsOnHoldSection';
import SectionPlaceholder from './SectionPlaceholder';

/**
 * Quality page section stack, top → bottom (Figma frame 804:26132). Titles and
 * order are a layout concern, deliberately kept out of the API payload — each
 * section's data is fetched by its own ticket (T3–T8). PPM/CAL (SPM-130),
 * Products on Hold / Exhibits (SPM-132), PIQ Maturity (SPM-133) and Cost
 * Recovery / Focus Supplier (SPM-135) are built; the rest still render
 * placeholders until their own tickets land.
 *
 * GSIR sits between CAL and Products on Hold and keeps its placeholder —
 * SPM-131 was skipped while its design is reworked.
 */
const PLACEHOLDER_BEFORE_POH = [{ id: 'gsir', title: 'GSIR' }] as const;

const PLACEHOLDER_AFTER_EXHIBITS = [
  { id: 'risk-rating', title: 'Risk Rating' },
  { id: '8ds', title: '8Ds' },
] as const;

/** Every placeholder still on the page — drives the page-level loading state. */
const PLACEHOLDER_SECTIONS = [
  ...PLACEHOLDER_BEFORE_POH,
  ...PLACEHOLDER_AFTER_EXHIBITS,
];

interface QualitySectionsProps {
  filters?: FilterParams;
}

export default function QualitySections({
  filters = {},
}: QualitySectionsProps) {
  const { data, isLoading, isError, refetch } = useQualityKpis(filters);

  if (isLoading) {
    return (
      <Box display="flex" flexDirection="column" gap={6}>
        {PLACEHOLDER_SECTIONS.map((section) => (
          <SectionPlaceholder.Skeleton key={section.id} />
        ))}
      </Box>
    );
  }

  if (isError) {
    return (
      <ErrorState
        title="Unable to load the Quality page"
        description="Something went wrong fetching this view."
        onRetry={() => refetch()}
        minHeight={320}
      />
    );
  }

  const kpis = data?.data ?? [];
  const footer = formatAsOfFooter(data?.meta?.reportingPeriod);

  // data: [] with HTTP 200 is an empty result, never an error (§14).
  if (kpis.length === 0) {
    return (
      <EmptyState
        title="No quality data"
        description="No data matches the active filters."
        minHeight={320}
      />
    );
  }

  return (
    <Box display="flex" flexDirection="column" gap={6}>
      <PpmSection filters={filters} />
      <CalSection filters={filters} />
      {PLACEHOLDER_BEFORE_POH.map((section) => (
        <SectionPlaceholder key={section.id} title={section.title} />
      ))}
      <ProductsOnHoldSection filters={filters} />
      <PiqMaturitySection filters={filters} />
      <ExhibitsSection filters={filters} />
      {PLACEHOLDER_AFTER_EXHIBITS.map((section) => (
        <SectionPlaceholder key={section.id} title={section.title} />
      ))}
      <HalfWidthRow>
        <CostRecoverySection filters={filters} />
        <FocusSupplierSection filters={filters} />
      </HalfWidthRow>
      {footer && (
        <Typography variant="body2" color="text.secondary">
          {footer}
        </Typography>
      )}
    </Box>
  );
}

/**
 * The two sections share a line in **both** Figma frames — 680.5px each with
 * the chatbot closed (`1377:14559`), 470.5px with it open (`1423:14642`) — so
 * this is not a stacking point at either drawn width; the narrowing is absorbed
 * inside each card, which flips to a stacked layout.
 *
 * 960px is where the *narrower* of those two frames stops fitting: chat-open
 * draws 470.5 + 24 + 470.5 = 965px of content. The chatbot panel is
 * user-resizable, so dragging it past its Figma width leaves a column no frame
 * covers — and continuing to halve it there squeezes each card under 100px.
 * Below this the sections stack and each gets the full column back, which keeps
 * the cards at a readable width instead of shrinking them indefinitely.
 */
const TWO_COLUMN_MIN = 960;

/**
 * The page's only two-up row (Figma `1377:14559` / `1423:14642`): Cost Recovery
 * and Focus Supplier side by side, 24px apart. Container query rather than a
 * media query — the chatbot panel, not the viewport, drives this column's
 * width.
 */
function HalfWidthRow({ children }: { children: React.ReactNode }) {
  return (
    <Box sx={{ containerType: 'inline-size' }}>
      <Box
        display="grid"
        gap={6}
        gridTemplateColumns="1fr"
        sx={{
          [`@container (min-width: ${TWO_COLUMN_MIN}px)`]: {
            gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
          },
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
