'use client';

import Box from '@mui/material/Box';
import Skeleton from '@mui/material/Skeleton';
import { useTheme } from '@mui/material/styles';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from 'recharts';

import { EmptyState } from '@/components/ui';
import { formatShortMonth } from '@/lib/format';
import type { ProductsOnHoldMonthRow } from '@/types';

/** Plot height in the Figma card (`804:26188`, the BarLineChart node). */
const CHART_HEIGHT = 198;

/**
 * Bar width cap, measured off the frame: the 334px card leaves a ~251px plot,
 * so each of the 5 month groups gets ~50px, less 9px padding a side, leaving
 * ~32px for 3 bars and their 2px gaps — about 9.5px each.
 *
 * Without this cap Recharts spreads bars to fill the category (they rendered
 * ~36px wide, four times the design), and the wider the card the worse it got.
 */
const MAX_BAR_WIDTH = 10;

/** Gutter for the 0/50/100 axis labels — Figma's yAxisLeft is ~29px. */
const Y_AXIS_WIDTH = 32;

interface ChartRow {
  month: string;
  carryOver?: number;
  fullMonth: number;
  eom: number;
}

interface ProductsOnHoldChartProps {
  /** Monthly rows in reporting order, oldest first. */
  byMonth: ProductsOnHoldMonthRow[];
  /** Single 2025 carry-over figure — drawn in the first month group only. */
  carryOver2025: number;
}

/**
 * Grouped bar chart behind each Products on Hold card (Figma `804:26188`–
 * `804:26191`): three series per month — 2025 Carry Over, Full Month, EOM.
 *
 * Deliberately **not** a generic `GroupedBarChart`. The series are fixed and
 * named, and carry-over is a single scalar the frame draws only in the first
 * month group, so a generic component would be a thin Recharts wrapper with a
 * section-specific quirk bolted onto it. If a second grouped-bar section ever
 * appears, generalise then.
 *
 * Chrome-free — the card supplies the surface, same as `OffenderBarChart`.
 */
export default function ProductsOnHoldChart({
  byMonth,
  carryOver2025,
}: ProductsOnHoldChartProps) {
  const theme = useTheme();
  const axisColor = theme.palette.text.secondary;

  if (byMonth.length === 0) {
    return (
      <EmptyState
        title="No monthly data"
        description="No months reported for this scope."
        minHeight={CHART_HEIGHT}
      />
    );
  }

  // Carry-over belongs to the opening month only; leaving it undefined on the
  // rest makes Recharts skip the bar entirely rather than draw a zero-height
  // one, matching the frame's empty BarBlocks.
  const data: ChartRow[] = byMonth.map((row, i) => ({
    month: formatShortMonth(row.period),
    carryOver: i === 0 ? carryOver2025 : undefined,
    fullMonth: row.fullMonth,
    eom: row.eom,
  }));

  return (
    <Box height={CHART_HEIGHT}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 4, right: 4, bottom: 0, left: 0 }}
          barGap={2}
          barCategoryGap="20%"
          maxBarSize={MAX_BAR_WIDTH}
        >
          <CartesianGrid
            horizontal
            vertical={false}
            strokeDasharray="3 3"
            stroke={theme.palette.divider}
          />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 12, fill: axisColor }}
            tickLine={false}
            axisLine={{ stroke: theme.palette.divider }}
          />
          <YAxis
            width={Y_AXIS_WIDTH}
            tick={{ fontSize: 12, fill: axisColor }}
            tickLine={false}
            axisLine={false}
          />
          <Legend
            verticalAlign="bottom"
            iconType="square"
            iconSize={12}
            wrapperStyle={{ fontSize: 10, color: axisColor }}
          />
          <Bar
            dataKey="carryOver"
            name="2025 Carry Over"
            fill="var(--color-yellow-mid)"
            radius={[200, 200, 0, 0]}
            isAnimationActive={false}
          />
          <Bar
            dataKey="fullMonth"
            name="Full Month"
            fill={theme.palette.primary.main}
            radius={[200, 200, 0, 0]}
            isAnimationActive={false}
          />
          <Bar
            dataKey="eom"
            name="EOM"
            fill={theme.palette.secondary.main}
            radius={[200, 200, 0, 0]}
            isAnimationActive={false}
          />
        </BarChart>
      </ResponsiveContainer>
    </Box>
  );
}

// ─── Skeleton ──────────────────────────────────────────────────────────────

/**
 * Loading placeholder — five month groups of bars at the chart's real height,
 * so the card keeps its footprint (UI_REQUIREMENTS_SPEC §14).
 */
function ProductsOnHoldChartSkeleton() {
  // Varied heights read as a bar chart without implying real figures.
  const heights = ['60%', '85%', '45%', '70%', '55%'];

  return (
    <Box
      height={CHART_HEIGHT}
      display="flex"
      alignItems="flex-end"
      justifyContent="space-between"
      gap={2}
      pb={6}
    >
      {heights.map((height, i) => (
        <Skeleton key={i} variant="rounded" width="100%" height={height} />
      ))}
    </Box>
  );
}

ProductsOnHoldChart.Skeleton = ProductsOnHoldChartSkeleton;

export type { ProductsOnHoldChartProps };
