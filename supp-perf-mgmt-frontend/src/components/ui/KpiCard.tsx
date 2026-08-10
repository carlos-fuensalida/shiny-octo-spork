import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import CardContent from '@mui/material/CardContent';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';

import { formatMetricValue, NO_VALUE } from '@/lib/format';
import type {
  KpiCard as KpiCardType,
  KpiStatus,
  Region,
  SummaryMetric,
} from '@/types';

import StatusChip from './StatusChip';

// ─── KPI value column ──────────────────────────────────────────────────────

interface MetricColumnProps {
  label: string;
  value: string | number | null;
  unit?: string;
  caption?: string;
}

function MetricColumn({ label, value, unit, caption }: MetricColumnProps) {
  return (
    <Box
      flex="1 1 0"
      minWidth={72}
      display="flex"
      flexDirection="column"
      gap={0.5}
    >
      <Typography variant="caption" color="secondary.main">
        {label}
      </Typography>
      <Typography variant="h5">
        {value !== null ? `${value}${unit ? ` ${unit}` : ''}` : NO_VALUE}
      </Typography>
      {caption && (
        <Typography variant="caption" color="text.secondary">
          {caption}
        </Typography>
      )}
    </Box>
  );
}

// ─── Tiles config ──────────────────────────────────────────────────────────

type Tiles = '1' | '2' | '3';

interface TilesConfig {
  columns: Array<{ label: string; regionKey: Region | 'global' }>;
}

const TILES_CONFIG: Record<Tiles, TilesConfig> = {
  '1': { columns: [{ label: 'Global', regionKey: 'global' }] },
  '2': {
    columns: [
      { label: 'Global', regionKey: 'global' },
      { label: 'NAR', regionKey: 'NAR' },
    ],
  },
  '3': {
    columns: [
      { label: 'Global', regionKey: 'global' },
      { label: 'NAR', regionKey: 'NAR' },
      { label: 'LAR', regionKey: 'LAR' },
    ],
  },
};

// ─── Component ─────────────────────────────────────────────────────────────

type KpiCardVariant = 'card' | 'embedded';

interface KpiCardProps {
  kpi?: KpiCardType;
  /** Override the displayed value (e.g. regional breakdowns from parent) */
  values?: Partial<Record<Region | 'global', number | string | null>>;
  /**
   * Labelled figures to render. When provided, supersedes `tiles` / `values` —
   * the only way to render non-regional labels such as "Open > 90 Days".
   */
  metrics?: SummaryMetric[];
  /**
   * Explicit row grouping for `metrics`, superseding it when provided. Use
   * when the design groups metrics into fixed rows regardless of available
   * width — plain `metrics` relies on `flex-wrap` breaking a row only when it
   * runs out of horizontal space, which doesn't reproduce a fixed grouping on
   * a wide tile (e.g. Delivery's region tiles, SPM-114).
   */
  metricRows?: SummaryMetric[][];
  tiles?: Tiles;
  subtitle?: string;
  /**
   * Overrides the header text with a group-label style (Open Sans SemiBold,
   * `primary.main`) instead of the default KPI-name style. Use when the tile
   * isn't scoped to one KPI — e.g. a region name grouping several KPIs'
   * metrics (see Delivery Performance, SPM-114). Never paired with a status
   * chip: that still only renders from `kpi?.status`.
   */
  title?: string;
  /** `'embedded'` drops the Card chrome so the tile can sit in a SectionCard grid. */
  variant?: KpiCardVariant;
  /** Force `metrics` to stack vertically instead of wrapping by available width. */
  stackMetrics?: boolean;
  loading?: boolean;
  error?: boolean;
  onClick?: () => void;
}

export default function KpiCard({
  kpi,
  values,
  metrics,
  metricRows,
  tiles = '3',
  subtitle,
  title,
  variant = 'card',
  stackMetrics = false,
  loading = false,
  error = false,
  onClick,
}: KpiCardProps) {
  const cfg = TILES_CONFIG[tiles];
  const isEmbedded = variant === 'embedded';

  const body = (
    <>
      {/* Header row */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="flex-start"
        mb={1.5}
      >
        {title ? (
          <Typography variant="subtitle2" color="primary.main">
            {title}
          </Typography>
        ) : (
          <Typography variant="body1" fontWeight={500}>
            {loading ? <Skeleton width={120} /> : (kpi?.kpiName ?? NO_VALUE)}
          </Typography>
        )}

        {!loading && kpi?.status && (
          <StatusChip status={kpi.status as KpiStatus} />
        )}
      </Box>

      {/* Metric columns */}
      {loading ? (
        <Skeleton variant="rectangular" height={40} />
      ) : error ? (
        <Typography variant="body2" color="error">
          Unable to load
        </Typography>
      ) : metricRows ? (
        <Box display="flex" flexDirection="column" gap={4}>
          {metricRows.map((row, i) => (
            <Box key={i} display="flex" flexWrap="wrap" gap={3} rowGap={4}>
              {row.map((metric) => (
                <MetricColumn
                  key={metric.label}
                  label={metric.label}
                  value={formatMetricValue(metric.value, metric.unit)}
                  caption={metric.caption}
                />
              ))}
            </Box>
          ))}
        </Box>
      ) : metrics ? (
        <Box
          display="flex"
          sx={
            stackMetrics
              ? { flexDirection: 'column', gap: 4 }
              : { flexWrap: 'wrap', gap: 3, rowGap: 4 }
          }
        >
          {metrics.map((metric) => (
            <MetricColumn
              key={metric.label}
              label={metric.label}
              value={formatMetricValue(metric.value, metric.unit)}
              caption={metric.caption}
            />
          ))}
        </Box>
      ) : (
        <Box display="flex" gap={2}>
          {cfg.columns.map(({ label, regionKey }) => {
            const val = values?.[regionKey] ?? kpi?.value ?? null;
            return (
              <MetricColumn
                key={regionKey}
                label={label}
                value={val}
                unit={tiles === '1' ? undefined : kpi?.unit}
              />
            );
          })}
        </Box>
      )}

      {/* Subtitle (tiles="1" variant) */}
      {tiles === '1' && subtitle && !loading && (
        <Typography variant="body2" color="text.secondary" mt={1}>
          {subtitle}
        </Typography>
      )}
    </>
  );

  if (isEmbedded) {
    // The parent grid owns borders and dividers — no Card chrome here.
    if (!onClick) {
      return (
        <Box p={4} height="100%" display="flex" flexDirection="column">
          {body}
        </Box>
      );
    }

    return (
      <ButtonBase
        onClick={onClick}
        aria-label={`View ${title ?? kpi?.kpiName} details`}
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'stretch',
          justifyContent: 'flex-start',
          width: '100%',
          height: '100%',
          p: 4,
          textAlign: 'left',
          '&:hover, &.Mui-focusVisible': { bgcolor: 'action.hover' },
        }}
      >
        {body}
      </ButtonBase>
    );
  }

  const cardContent = (
    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>{body}</CardContent>
  );

  return (
    <Card>
      {onClick ? (
        <CardActionArea
          onClick={onClick}
          aria-label={`View ${title ?? kpi?.kpiName} details`}
        >
          {cardContent}
        </CardActionArea>
      ) : (
        cardContent
      )}
    </Card>
  );
}

// ─── Skeleton ──────────────────────────────────────────────────────────────

interface KpiCardSkeletonProps {
  /** Number of metric columns to reserve space for. */
  metrics?: number;
  variant?: KpiCardVariant;
}

function KpiCardSkeleton({
  metrics = 3,
  variant = 'card',
}: KpiCardSkeletonProps) {
  const body = (
    <>
      <Box mb={1.5}>
        <Skeleton width={120} />
      </Box>
      <Box display="flex" flexWrap="wrap" gap={3} rowGap={4}>
        {Array.from({ length: metrics }, (_, i) => (
          <Box key={i} flex="1 1 0" minWidth={72}>
            <Skeleton width="60%" height={16} />
            <Skeleton variant="rectangular" height={28} />
          </Box>
        ))}
      </Box>
    </>
  );

  if (variant === 'embedded') {
    return (
      <Box p={4} height="100%" display="flex" flexDirection="column">
        {body}
      </Box>
    );
  }

  return (
    <Card>
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>{body}</CardContent>
    </Card>
  );
}

KpiCard.Skeleton = KpiCardSkeleton;
