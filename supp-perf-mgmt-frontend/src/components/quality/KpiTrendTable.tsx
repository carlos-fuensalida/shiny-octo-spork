'use client';

import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Box from '@mui/material/Box';
import Skeleton from '@mui/material/Skeleton';
import type { SxProps, Theme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';

import type { Column } from '@/components/ui';
import { DataTable, Sparkline } from '@/components/ui';
import { getMonthOverMonthTrend, getPlanVarianceStatus } from '@/lib/kpiTrend';
import type { KpiStatus, KpiUnit } from '@/types';

export interface TrendRow {
  dimension: string;
  fy2025: number;
  plan2026: number;
  ytd2026: number;
  /** Backend-owned RAG status; the placeholder rule fills in when absent. */
  ytd2026Status?: KpiStatus;
  rollingR3: number;
  rollingR3Status?: KpiStatus;
  /** Chronological monthly values (12 points); last entry is the latest month. */
  monthly: number[];
}

interface KpiTrendTableProps {
  aggregate: TrendRow;
  breakdown: TrendRow[];
  /** e.g. "May'26" — trailing column header, derived from the latest `monthly` period. */
  latestPeriodLabel: string;
  /**
   * Drives value formatting. `'PERCENT'` suffixes `%` (PIQ Maturity); every
   * other unit renders the bare localized number (PPM/CAL). Kept here rather
   * than in each caller so all five numeric cells stay consistent.
   */
  unit?: KpiUnit;
}

/** Shared by every numeric cell, including the Rolling and latest-month ones. */
function formatValue(value: number, unit: KpiUnit): string {
  const formatted = value.toLocaleString('en-US');
  return unit === 'PERCENT' ? `${formatted}%` : formatted;
}

/**
 * Status → palette slot. Each status pairs a soft surface tint (`light`) with
 * the matching border-and-text colour (`main`) — the design system's alert
 * pairing, reused for the highlighted variance cells.
 */
const VARIANCE_PALETTE: Record<
  Exclude<KpiStatus, 'NEUTRAL'>,
  { light: string; main: string }
> = {
  GREEN: { light: 'success.light', main: 'success.main' },
  YELLOW: { light: 'warning.light', main: 'warning.main' },
  RED: { light: 'error.light', main: 'error.main' },
};

/**
 * Fills the whole cell with the status tint and its 4px leading rule, and
 * colours the value to match. Applied via `Column.cellSx` (not to the rendered
 * content) so the tint covers the full row height, as in Figma.
 *
 * Uses the row's own status when the payload carries one — RAG thresholds are
 * a business rule the data owns, same as `KpiCard.status` — and only falls back
 * to the PLACEHOLDER derivation when it doesn't (see src/lib/kpiTrend.ts).
 */
function varianceCellSx(
  value: number,
  plan: number,
  status: KpiStatus = getPlanVarianceStatus(value, plan),
): SxProps<Theme> {
  if (status === 'NEUTRAL') return {};

  const { light, main } = VARIANCE_PALETTE[status];
  return {
    bgcolor: light,
    color: main,
    borderLeft: 4,
    borderLeftStyle: 'solid',
    borderLeftColor: main,
  };
}

function LatestMonthCell({
  monthly,
  unit,
}: {
  monthly: number[];
  unit: KpiUnit;
}) {
  const direction = getMonthOverMonthTrend(monthly);
  const latest = monthly.at(-1) ?? 0;
  // Direction only — up/down, not good/bad (see src/lib/kpiTrend.ts).
  const color = direction === 'DOWN' ? 'error.main' : 'success.main';

  // Icons keep MUI's default 24px — the size of the Figma icon frame. The
  // filled ExpandLess/ExpandMore glyphs match its vectors exactly.
  return (
    <Box display="flex" alignItems="center" justifyContent="center" gap={1}>
      {direction === 'UP' && (
        <ExpandLessIcon sx={{ color }} aria-label="Trending up" />
      )}
      {direction === 'DOWN' && (
        <ExpandMoreIcon sx={{ color }} aria-label="Trending down" />
      )}
      <Typography variant="body1">{formatValue(latest, unit)}</Typography>
    </Box>
  );
}

/**
 * The Quality page's shared trend table: an aggregate row plus its breakdown
 * rows in one **flat** table — every row is always visible, there is no
 * expand/collapse. Three sections render through it, differing only in what
 * feeds the rows and in `unit`:
 *
 * - Incoming Material PPM (`804:26162`) — aggregate "Whirlpool" + by commodity
 * - CAL A/AA PPM (`804:26172`) — aggregate + by region
 * - PIQ Maturity (`804:26198`) — "Global" + NAR/LAR, `unit="PERCENT"`
 *
 * Named `PpmCalTrendTable` until SPM-133 found PIQ Maturity renders the exact
 * same table (its frame is even still *named* "Incoming Material PPM table"),
 * at which point it was generalized rather than copied.
 *
 * Carries no card chrome. PPM/CAL wrap it in a `ContentCard`; PIQ deliberately
 * doesn't, so `DataTable`'s own bordered container is the visible panel there.
 *
 * The YTD/Rolling highlighting and the latest-month arrow are PLACEHOLDER
 * rules — src/lib/kpiTrend.ts.
 */
export default function KpiTrendTable({
  aggregate,
  breakdown,
  latestPeriodLabel,
  unit = 'PPM',
}: KpiTrendTableProps) {
  const columns: Column<TrendRow>[] = [
    {
      key: 'dimension',
      header: '',
      render: (row) => (
        <Typography variant="body1" fontWeight={700}>
          {row.dimension}
        </Typography>
      ),
    },
    {
      key: 'fy2025',
      header: '2025 FY',
      align: 'center',
      render: (row) => formatValue(row.fy2025, unit),
    },
    {
      key: 'plan2026',
      header: '2026 Plan',
      align: 'center',
      render: (row) => formatValue(row.plan2026, unit),
    },
    {
      key: 'ytd2026',
      header: '2026 YTD',
      align: 'center',
      render: (row) => formatValue(row.ytd2026, unit),
      cellSx: (row) =>
        varianceCellSx(row.ytd2026, row.plan2026, row.ytd2026Status),
    },
    {
      key: 'rollingR3',
      header: 'Rolling',
      align: 'center',
      render: (row) => `${formatValue(row.rollingR3, unit)} (R3)`,
      cellSx: (row) =>
        varianceCellSx(row.rollingR3, row.plan2026, row.rollingR3Status),
    },
    {
      key: 'monthly',
      header: '12M Trend',
      align: 'center',
      render: (row) => <Sparkline data={row.monthly} />,
    },
    {
      key: 'latest',
      header: latestPeriodLabel,
      align: 'center',
      render: (row) => <LatestMonthCell monthly={row.monthly} unit={unit} />,
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={[aggregate, ...breakdown]}
      getRowKey={(row) => row.dimension}
      size="medium"
    />
  );
}

// ─── Skeleton ──────────────────────────────────────────────────────────────

const SKELETON_HEADERS = [
  '',
  '2025 FY',
  '2026 Plan',
  '2026 YTD',
  'Rolling',
  '12M Trend',
  '',
];

/**
 * Loading placeholder. Preserves the header row and one row per expected data
 * row (aggregate + breakdown) so the table's footprint doesn't shift when data
 * arrives (UI_REQUIREMENTS_SPEC §14).
 */
function KpiTrendTableSkeleton({ rowCount = 4 }: { rowCount?: number }) {
  return (
    <Box border={1} borderColor="divider" borderRadius={2} overflow="hidden">
      <Box
        display="flex"
        gap={2}
        px={4}
        py={2}
        bgcolor="var(--color-gray-lightest)"
      >
        {SKELETON_HEADERS.map((header, i) => (
          <Box key={i} flex={1}>
            <Typography
              variant="body1"
              fontWeight={500}
              color="primary.main"
              lineHeight="24px"
            >
              {header}
            </Typography>
          </Box>
        ))}
      </Box>
      {Array.from({ length: rowCount }, (_, i) => (
        <Box
          key={i}
          display="flex"
          alignItems="center"
          gap={2}
          px={4}
          height={56}
          borderTop={1}
          sx={{ borderTopColor: 'var(--color-gray)' }}
        >
          {SKELETON_HEADERS.map((_, j) => (
            <Box key={j} flex={1}>
              <Skeleton variant="text" width={j === 0 ? '80%' : '60%'} />
            </Box>
          ))}
        </Box>
      ))}
    </Box>
  );
}

KpiTrendTable.Skeleton = KpiTrendTableSkeleton;

export type { KpiTrendTableProps };
