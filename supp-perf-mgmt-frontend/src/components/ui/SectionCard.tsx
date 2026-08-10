import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';

import KpiCard from './KpiCard';

/**
 * Column counts per breakpoint. The design is a 6-column desktop grid; narrower
 * viewports (and an open chatbot panel) step down rather than squeeze.
 */
const COLUMNS = { xs: 2, md: 3, lg: 6 } as const;

// ─── Grid cell ─────────────────────────────────────────────────────────────

interface SectionCellProps {
  /** Columns this cell occupies in the 6-column grid. */
  span?: number;
  children: React.ReactNode;
}

/**
 * A single cell of the section grid. Its opaque background is what turns the
 * grid's 1px gaps into divider lines — see the container below.
 */
function SectionCell({ span = 1, children }: SectionCellProps) {
  return (
    <Box gridColumn={`span ${span}`} bgcolor="background.paper">
      {children}
    </Box>
  );
}

// ─── Component ─────────────────────────────────────────────────────────────

interface SectionCardProps {
  title: string;
  /** Footer line, e.g. "As of January, 2026". */
  footer?: string;
  /** Grid cells — use `SectionCard.Cell`. */
  children: React.ReactNode;
}

export default function SectionCard({
  title,
  footer,
  children,
}: SectionCardProps) {
  return (
    <Card component="section" aria-label={title}>
      <Box px={6} pt={6} pb={4}>
        <Typography variant="h2" color="primary.main">
          {title}
        </Typography>
      </Box>

      <Divider sx={{ mx: 6 }} />

      {/* Inset from the card edges so the internal grid lines (below) stop
          short of the card border instead of touching it. */}
      <Box px={6} bgcolor="background.paper">
        {/* 1px gaps over a divider-coloured backdrop render as grid lines.
            Cells supply their own opaque background. This keeps dividers correct
            for any mix of column spans without per-cell border bookkeeping. */}
        <Box
          display="grid"
          gap="1px"
          bgcolor="divider"
          gridTemplateColumns={{
            xs: `repeat(${COLUMNS.xs}, 1fr)`,
            md: `repeat(${COLUMNS.md}, 1fr)`,
            lg: `repeat(${COLUMNS.lg}, 1fr)`,
          }}
        >
          {children}
        </Box>
      </Box>

      {footer && (
        <>
          <Divider sx={{ mx: 6 }} />
          <Box px={6} py={4}>
            <Typography variant="body2" color="text.secondary">
              {footer}
            </Typography>
          </Box>
        </>
      )}
    </Card>
  );
}

SectionCard.Cell = SectionCell;

// ─── Skeleton ──────────────────────────────────────────────────────────────

interface SectionCardSkeletonProps {
  title: string;
  /** Column span of each placeholder cell — mirror the section's real layout. */
  spans?: number[];
  /** Metric columns to reserve inside each placeholder cell. */
  metricsPerCell?: number;
}

/**
 * Loading state. Keeps the section title and full grid shape so the layout
 * does not shift when data arrives (UI_REQUIREMENTS_SPEC §14).
 */
function SectionCardSkeleton({
  title,
  spans = [1, 1, 1, 1, 1, 1],
  metricsPerCell = 3,
}: SectionCardSkeletonProps) {
  return (
    <SectionCard title={title}>
      {spans.map((span, i) => (
        <SectionCell key={i} span={span}>
          <KpiCard.Skeleton variant="embedded" metrics={metricsPerCell} />
        </SectionCell>
      ))}
    </SectionCard>
  );
}

SectionCard.Skeleton = SectionCardSkeleton;

export type { SectionCardProps, SectionCellProps };
