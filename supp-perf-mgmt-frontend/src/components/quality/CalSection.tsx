'use client';

import { useCalDetail } from '@/hooks';
import { formatAsOfFooter, formatShortMonth } from '@/lib/format';
import type { FilterParams } from '@/types';

import type { QualityTrendSectionData } from './QualityTrendSection';
import QualityTrendSection from './QualityTrendSection';

const TITLE = 'CAL A/AA – PPM';
/** Aggregate row label — this system's own org, not part of the fetched detail. */
const AGGREGATE_LABEL = 'Whirlpool';

interface CalSectionProps {
  filters?: FilterParams;
}

export default function CalSection({ filters = {} }: CalSectionProps) {
  const { data, isLoading, isError, refetch } = useCalDetail(filters);
  const detail = data?.data;

  const sectionData: QualityTrendSectionData | null = detail
    ? {
        aggregate: {
          dimension: AGGREGATE_LABEL,
          fy2025: detail.fy2025,
          plan2026: detail.plan2026,
          ytd2026: detail.ytd2026,
          ytd2026Status: detail.ytd2026Status,
          rollingR3: detail.rollingR3,
          rollingR3Status: detail.rollingR3Status,
          monthly: detail.monthly.map((m) => m.calCount),
        },
        breakdown: detail.byRegion.map((row) => ({
          dimension: row.dimension,
          fy2025: row.fy2025,
          plan2026: row.plan2026,
          ytd2026: row.ytd2026,
          ytd2026Status: row.ytd2026Status,
          rollingR3: row.rollingR3,
          rollingR3Status: row.rollingR3Status,
          monthly: row.monthly.map((m) => m.calCount),
        })),
        offenders: detail.offenders,
        latestPeriodLabel: formatShortMonth(
          detail.monthly.at(-1)?.period ?? '',
        ),
      }
    : null;

  return (
    <QualityTrendSection
      title={TITLE}
      isLoading={isLoading}
      isError={isError}
      onRetry={() => refetch()}
      footer={formatAsOfFooter(data?.meta?.reportingPeriod)}
      data={sectionData}
      unit="PPM"
    />
  );
}
