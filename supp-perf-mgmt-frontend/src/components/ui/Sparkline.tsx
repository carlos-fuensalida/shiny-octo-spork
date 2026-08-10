'use client';

import Box from '@mui/material/Box';
import { useTheme } from '@mui/material/styles';
import { Line, LineChart, ResponsiveContainer } from 'recharts';

interface SparklineProps {
  /** Values in chronological order, e.g. 12 monthly points. */
  data: number[];
  width?: number | string;
  height?: number | string;
}

/**
 * Minimal inline trend line — no axes, grid, or tooltip. Used as a `DataTable`
 * cell renderer (e.g. PIQ Maturity's "12M Trend" column, SPM-133) but not
 * DataTable-specific; reusable anywhere a compact trend needs showing.
 *
 * Renders **inline-block** rather than block so it honours its parent's
 * `text-align` — which is how `DataTable`'s `Column.align` positions cell
 * content. As a fixed-width block it would ignore alignment entirely and sit
 * flush left, leaving all the slack on the right; only visible once the column
 * grows wider than the line (wide monitor, or the chatbot panel collapsed).
 * `verticalAlign: middle` keeps the inline box off the text baseline, so no
 * descender gap shifts it within the row.
 */
export default function Sparkline({
  data,
  width = 114,
  height = 24,
}: SparklineProps) {
  const theme = useTheme();

  if (data.length < 2) {
    return (
      <Box
        width={width}
        height={height}
        display="inline-flex"
        alignItems="center"
        sx={{ verticalAlign: 'middle' }}
      >
        <Box width="100%" height="1.3px" bgcolor="text.secondary" />
      </Box>
    );
  }

  const points = data.map((value, index) => ({ index, value }));

  return (
    <Box
      width={width}
      height={height}
      display="inline-block"
      sx={{ verticalAlign: 'middle' }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={points}
          margin={{ top: 2, right: 1, bottom: 2, left: 1 }}
        >
          <Line
            type="linear"
            dataKey="value"
            stroke={theme.palette.text.primary}
            strokeWidth={1.3}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </Box>
  );
}

export type { SparklineProps };
