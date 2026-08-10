'use client';

import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';

import { formatMetricValue } from '@/lib/format';
import type { KpiUnit, TopOffenderBar } from '@/types';

import EmptyState from './EmptyState';

const LIST_HEIGHT = 176;
const SKELETON_ROWS = 3;

/**
 * Rank marker colours, worst-first, straight from the Figma narrow card:
 * red → orange → sky blue. A fixed positional ramp, not `KpiStatus` — the
 * payload carries a ranking, not a per-supplier status.
 */
const RANK_COLORS = [
  'var(--color-red-dark)',
  'var(--color-orange)',
  'secondary.main',
];

interface OffenderListProps {
  offenders: TopOffenderBar[];
  unit: KpiUnit;
}

/**
 * Ranked list of worst-performing suppliers for one metric — rank dot, name,
 * value, optional region/status caption (Figma `804:26161`/`804:26171`).
 *
 * Shares `OffenderBarChart`'s data shape (`TopOffenderBar`) but not its bar
 * layout, so it's a sibling rather than a variant. Like `OffenderBarChart` it
 * carries no card chrome — the parent supplies it (here, `ContentCard`).
 */
export default function OffenderList({ offenders, unit }: OffenderListProps) {
  if (offenders.length === 0) {
    return (
      <EmptyState
        title="No offenders"
        description="No suppliers to rank for this metric."
        minHeight={LIST_HEIGHT}
      />
    );
  }

  return (
    <Box display="flex" flexDirection="column">
      {offenders.map((offender, index) => (
        <Box key={offender.supplierId}>
          {index > 0 && <Divider />}
          <Box
            display="flex"
            alignItems="flex-start"
            justifyContent="space-between"
            gap={2}
            py={3}
          >
            <Box display="flex" alignItems="center" gap={2.5}>
              <Box
                width={8}
                height={8}
                borderRadius="50%"
                flexShrink={0}
                bgcolor={RANK_COLORS[index % RANK_COLORS.length]}
              />
              <Typography variant="body1" fontWeight={500}>
                {offender.supplierName}
              </Typography>
            </Box>
            <Box display="flex" flexDirection="column" alignItems="flex-end">
              <Typography variant="body1" fontWeight={500}>
                {formatMetricValue(offender.value, unit)}
                {unit === 'PPM' ? ' PPM' : ''}
              </Typography>
              {offender.caption && (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  textAlign="right"
                >
                  {offender.caption}
                </Typography>
              )}
            </Box>
          </Box>
        </Box>
      ))}
    </Box>
  );
}

// ─── Skeleton ──────────────────────────────────────────────────────────────

/**
 * Loading placeholder. Keeps the row rhythm so the list's footprint doesn't
 * shift when data arrives (UI_REQUIREMENTS_SPEC §14).
 */
function OffenderListSkeleton() {
  return (
    <Box display="flex" flexDirection="column">
      {Array.from({ length: SKELETON_ROWS }, (_, i) => (
        <Box key={i}>
          {i > 0 && <Divider />}
          <Box
            display="flex"
            alignItems="center"
            justifyContent="space-between"
            py={3}
          >
            <Box display="flex" alignItems="center" gap={2.5}>
              <Skeleton variant="circular" width={8} height={8} />
              <Skeleton variant="text" width={100} />
            </Box>
            <Skeleton variant="text" width={64} />
          </Box>
        </Box>
      ))}
    </Box>
  );
}

OffenderList.Skeleton = OffenderListSkeleton;

export type { OffenderListProps };
