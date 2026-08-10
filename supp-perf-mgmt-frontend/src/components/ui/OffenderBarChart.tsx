'use client';

import Box from '@mui/material/Box';
import Skeleton from '@mui/material/Skeleton';
import { useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from 'recharts';

import { formatMetricValue } from '@/lib/format';
import type { KpiUnit, TopOffenderBar } from '@/types';

import EmptyState from './EmptyState';

/** Fixed plot height — five bars sit comfortably; mirrors the Figma chart card. */
const CHART_HEIGHT = 176;
/** Left gutter reserved for supplier-name category labels. */
const CATEGORY_WIDTH = 72;

interface OffenderBarChartProps {
  title: string;
  /** Bars in the order they should render — already ranked worst-first. */
  offenders: TopOffenderBar[];
  unit: KpiUnit;
}

/**
 * Horizontal bar chart of the worst-performing suppliers for a single metric,
 * used by the Summary view's Top Offenders section. Bars render in the order
 * received (the caller/endpoint owns ranking) — see
 * specs/features/SPM-126-top-offenders.md.
 */
export default function OffenderBarChart({
  title,
  offenders,
  unit,
}: OffenderBarChartProps) {
  const theme = useTheme();
  const barColor = theme.palette.secondary.main;
  const trackColor = theme.palette.background.default;
  const labelColor = theme.palette.text.secondary;

  const format = (value: number | string) => formatMetricValue(value, unit);

  return (
    <Box p={4} display="flex" flexDirection="column" gap={4} height="100%">
      <Typography variant="body1" fontWeight={500} color="primary.main">
        {title}
      </Typography>

      {offenders.length === 0 ? (
        <EmptyState
          title="No offenders"
          description="No suppliers to rank for this metric."
          minHeight={CHART_HEIGHT}
        />
      ) : (
        <Box height={CHART_HEIGHT}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              layout="vertical"
              data={offenders}
              margin={{ top: 4, right: 48, bottom: 4, left: 0 }}
              barCategoryGap="28%"
            >
              {/* Dashed separators across the plot, matching the Figma
                  design: one at each category boundary plus the top and
                  bottom edges. Recharts' default horizontal grid sits at each
                  bar's centre (hidden behind the track), so the line positions
                  are generated here. The bottom edge line stands in for the X
                  axis baseline, which is why the X axis line is disabled. */}
              <CartesianGrid
                horizontal
                vertical={false}
                strokeDasharray="3 3"
                stroke={theme.palette.divider}
                horizontalCoordinatesGenerator={({ offset }) => {
                  const top = offset?.top ?? 0;
                  const height = offset?.height ?? 0;
                  const n = offenders.length;
                  return Array.from(
                    { length: n + 1 },
                    (_, i) => top + (height * i) / n,
                  );
                }}
              />
              <XAxis
                type="number"
                tickFormatter={format}
                tick={{ fontSize: 8, fill: labelColor }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                type="category"
                dataKey="supplierName"
                width={CATEGORY_WIDTH}
                tick={{ fontSize: 12, fill: labelColor }}
                tickLine={false}
                axisLine={{ stroke: labelColor, strokeWidth: 1.5 }}
              />
              <Bar
                dataKey="value"
                fill={barColor}
                background={{ fill: trackColor, fillOpacity: 0.8 }}
                radius={[0, 10, 10, 0]}
                isAnimationActive={false}
              >
                <LabelList
                  dataKey="value"
                  position="right"
                  formatter={format}
                  style={{ fontSize: 12, fill: labelColor }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Box>
      )}
    </Box>
  );
}

// ─── Skeleton ──────────────────────────────────────────────────────────────

/**
 * Loading placeholder. Keeps the title bar and five bar rows so the chart's
 * footprint doesn't shift when data arrives (UI_REQUIREMENTS_SPEC §14).
 */
function OffenderBarChartSkeleton() {
  // Descending widths echo the ranked-bar shape without implying real values.
  const widths = ['90%', '72%', '58%', '44%', '30%'];

  return (
    <Box p={4} display="flex" flexDirection="column" gap={4} height="100%">
      <Skeleton width={160} />
      <Box
        height={CHART_HEIGHT}
        display="flex"
        flexDirection="column"
        justifyContent="space-around"
      >
        {widths.map((width, i) => (
          <Skeleton key={i} variant="rounded" width={width} height={16} />
        ))}
      </Box>
    </Box>
  );
}

OffenderBarChart.Skeleton = OffenderBarChartSkeleton;

export type { OffenderBarChartProps };
