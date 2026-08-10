'use client';

import Box from '@mui/material/Box';
import { useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';

import type { DonutSegment } from '@/components/ui';
import { CardSurface, DonutChart } from '@/components/ui';
import type { QualityExhibitsKpi, Region } from '@/types';

interface ExhibitsCardProps {
  exhibits: QualityExhibitsKpi;
}

/**
 * One Quality Exhibits card (Figma `804:26272`–`804:26274`): a full-bleed
 * `secondary.main` band carrying the region, then the donut breakdown.
 *
 * The band is why this card doesn't reuse `ContentCard` — it replaces the
 * title-over-a-divider chrome entirely. Both share `CardSurface`.
 */
export default function ExhibitsCard({ exhibits }: ExhibitsCardProps) {
  const theme = useTheme();

  // Recharts needs resolved colour strings, so the status ramp is read from
  // the theme here rather than hardcoded (the `OffenderBarChart` convention).
  // "Not started" is the neutral divider grey, matching the frame.
  const segments: DonutSegment[] = [
    {
      label: 'Completed',
      value: exhibits.completed,
      color: theme.palette.success.main,
    },
    {
      label: 'On going',
      value: exhibits.ongoing,
      color: theme.palette.secondary.main,
    },
    {
      label: 'Delayed',
      value: exhibits.delayed,
      color: theme.palette.error.main,
    },
    {
      label: 'Disposition',
      value: exhibits.disposition,
      color: theme.palette.warning.main,
    },
    {
      label: 'Not started',
      value: exhibits.notStarted,
      color: theme.palette.divider,
    },
  ];

  return (
    <CardSurface
      component="section"
      aria-label={`${exhibits.region} exhibits`}
      display="flex"
      flexDirection="column"
      height="100%"
      overflow="hidden"
    >
      <RegionBand region={exhibits.region} />
      <Box
        px={4}
        pt={3}
        pb={4}
        flex={1}
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <DonutChart
          segments={segments}
          label={`${exhibits.region} exhibits by status`}
        />
      </Box>
    </CardSurface>
  );
}

/**
 * Full-bleed header band. Sits inside the surface's rounded corners via the
 * parent's `overflow="hidden"`, so it clips rather than needing its own radius.
 */
function RegionBand({ region }: { region: Region }) {
  return (
    <Box px={4} py={2} bgcolor="secondary.main">
      <Typography variant="h3" fontWeight={400} color="secondary.contrastText">
        {region}
      </Typography>
    </Box>
  );
}

// ─── Skeleton ──────────────────────────────────────────────────────────────

interface ExhibitsCardSkeletonProps {
  /** Region is page structure (one card per region, known up front), so the
   * band renders for real and only the donut is shaped. */
  region: Region;
}

function ExhibitsCardSkeleton({ region }: ExhibitsCardSkeletonProps) {
  return (
    <CardSurface
      component="section"
      aria-label={`${region} exhibits`}
      display="flex"
      flexDirection="column"
      height="100%"
      overflow="hidden"
    >
      <RegionBand region={region} />
      <Box
        px={4}
        pt={3}
        pb={4}
        flex={1}
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <DonutChart.Skeleton />
      </Box>
    </CardSurface>
  );
}

ExhibitsCard.Skeleton = ExhibitsCardSkeleton;

export type { ExhibitsCardProps };
