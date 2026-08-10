'use client';

import Box from '@mui/material/Box';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';
import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts';

import EmptyState from './EmptyState';

/** Donut diameter in the Figma frame (`804:26272`, the PieChart node). */
const SIZE = 110;
/** Ring thickness — outer/inner radii as a share of the 110px box. */
const OUTER_RADIUS = SIZE / 2;
const INNER_RADIUS = 34;

export interface DonutSegment {
  label: string;
  value: number;
  /** Resolved CSS colour — callers read it from the theme, never hardcoded. */
  color: string;
}

interface DonutChartProps {
  segments: DonutSegment[];
  /**
   * Accessible name for the chart, e.g. "GLOBAL exhibits by status". Not
   * rendered — the card's own header carries the visible label.
   */
  label: string;
}

/**
 * Donut with its total in the center and a legend list beside it (Figma
 * `804:26272`). The total is **derived** as the sum of the segments rather than
 * taken as a prop, so the center figure can never disagree with the arcs.
 *
 * Chrome-free: the calling card supplies the surface, matching the
 * `OffenderBarChart` / `OffenderList` convention.
 */
export default function DonutChart({ segments, label }: DonutChartProps) {
  const total = segments.reduce((sum, segment) => sum + segment.value, 0);

  // A donut of zero-value segments would render no arcs at all — an empty
  // result, not an error (§14).
  if (segments.length === 0 || total === 0) {
    return (
      <EmptyState
        title="No data"
        description={`Nothing to break down for ${label}.`}
        minHeight={SIZE}
      />
    );
  }

  return (
    <Box
      display="flex"
      alignItems="center"
      justifyContent="center"
      gap={3}
      width="100%"
      // Recharts marks each sector focusable (`tabindex="-1"`), so clicking one
      // paints the browser's default focus ring — a black box over the slice.
      // The donut carries no interaction, so there is no focus state to convey
      // and suppressing it removes no keyboard affordance.
      sx={{
        '& .recharts-sector:focus, & .recharts-surface:focus': {
          outline: 'none',
        },
      }}
    >
      <Box position="relative" width={SIZE} height={SIZE} flexShrink={0}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart aria-label={label}>
            <Pie
              data={segments}
              dataKey="value"
              nameKey="label"
              cx="50%"
              cy="50%"
              innerRadius={INNER_RADIUS}
              outerRadius={OUTER_RADIUS}
              startAngle={90}
              endAngle={-270}
              paddingAngle={0}
              stroke="none"
              isAnimationActive={false}
            >
              {segments.map((segment) => (
                <Cell key={segment.label} fill={segment.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        {/* Centered over the ring's hole rather than inside the SVG, so it
            uses real theme typography instead of an SVG <text> node. */}
        <Box
          position="absolute"
          top={0}
          left={0}
          width="100%"
          height="100%"
          display="flex"
          alignItems="center"
          justifyContent="center"
          sx={{ pointerEvents: 'none' }}
        >
          <Typography variant="h2" color="primary.main">
            {total}
          </Typography>
        </Box>
      </Box>

      <Box
        component="ul"
        display="flex"
        flexDirection="column"
        gap={1.5}
        m={0}
        p={0}
        sx={{ listStyle: 'none' }}
      >
        {segments.map((segment) => (
          <Box
            key={segment.label}
            component="li"
            display="flex"
            alignItems="center"
            gap={1.5}
          >
            <Box
              width={8}
              height={8}
              borderRadius="50%"
              flexShrink={0}
              sx={{ bgcolor: segment.color }}
            />
            <Typography variant="body2" color="text.secondary" noWrap>
              {segment.label}
            </Typography>
            <Typography variant="body2" fontWeight={600} color="text.primary">
              {segment.value}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}

// ─── Skeleton ──────────────────────────────────────────────────────────────

interface DonutChartSkeletonProps {
  /** Legend rows to shape — defaults to the Exhibits status count. */
  segments?: number;
}

/**
 * Loading placeholder. Keeps the ring and legend footprint so the card doesn't
 * resize when data arrives (UI_REQUIREMENTS_SPEC §14).
 */
function DonutChartSkeleton({ segments = 5 }: DonutChartSkeletonProps) {
  return (
    <Box
      display="flex"
      alignItems="center"
      justifyContent="center"
      gap={3}
      width="100%"
    >
      <Skeleton variant="circular" width={SIZE} height={SIZE} />
      <Box display="flex" flexDirection="column" gap={1.5}>
        {Array.from({ length: segments }, (_, i) => (
          <Skeleton key={i} variant="text" width={96} />
        ))}
      </Box>
    </Box>
  );
}

DonutChart.Skeleton = DonutChartSkeleton;

export type { DonutChartProps };
