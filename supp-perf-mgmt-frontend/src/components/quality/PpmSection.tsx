'use client';

import { usePpmDetail } from '@/hooks';
import { formatAsOfFooter, formatShortMonth } from '@/lib/format';
import type { FilterParams } from '@/types';

import type { QualityTrendSectionData } from './QualityTrendSection';
import QualityTrendSection from './QualityTrendSection';

const TITLE = 'Incoming Material PPM';
/** Aggregate row label — this system's own org, not part of the fetched detail. */
const AGGREGATE_LABEL = 'Whirlpool';

interface PpmSectionProps {
  filters?: FilterParams;
}

export default function PpmSection({ filters = {} }: PpmSectionProps) {
  const { data, isLoading, isError, refetch } = usePpmDetail(filters);
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
          monthly: detail.monthly.map((m) => m.ppm),
        },
        breakdown: detail.byCommodity.map((row) => ({
          dimension: row.dimension,
          fy2025: row.fy2025,
          plan2026: row.plan2026,
          ytd2026: row.ytd2026,
          ytd2026Status: row.ytd2026Status,
          rollingR3: row.rollingR3,
          rollingR3Status: row.rollingR3Status,
          monthly: row.monthly.map((m) => m.ppm),
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
