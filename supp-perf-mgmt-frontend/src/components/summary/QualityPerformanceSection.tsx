'use client';

import { useRouter } from 'next/navigation';

import { EmptyState, ErrorState, KpiCard, SectionCard } from '@/components/ui';
import { useSummaryKpis } from '@/hooks';
import { formatAsOfFooter } from '@/lib/format';
import type { FilterParams, SummaryKpiCard } from '@/types';

const TITLE = 'Quality Performance';

/**
 * Column span per KPI. A layout concern, deliberately kept out of the API
 * payload: the design puts six single-width tiles on the first row and three
 * double-width tiles on the second.
 */
const SPANS: Record<string, number> = {
  'kpi-8d-capa': 2,
  'kpi-risk-rating-components': 2,
  'kpi-risk-rating-fps': 2,
};

const DEFAULT_SPAN = 1;

/** KPIs whose metrics must always stack vertically, never side-by-side (V-3). */
const STACK_METRICS = new Set(['kpi-cost-recovery']);

/** Mirrors the real layout so the loading state does not shift on data arrival. */
const SKELETON_SPANS = [1, 1, 1, 1, 1, 1, 2, 2, 2];

interface QualityPerformanceSectionProps {
  filters?: FilterParams;
}

export default function QualityPerformanceSection({
  filters = {},
}: QualityPerformanceSectionProps) {
  const router = useRouter();
  const { data, isLoading, isError, refetch } = useSummaryKpis(filters);

  if (isLoading) {
    return <SectionCard.Skeleton title={TITLE} spans={SKELETON_SPANS} />;
  }

  if (isError) {
    return (
      <SectionCard title={TITLE}>
        <SectionCard.Cell span={6}>
          <ErrorState
            title="Unable to load quality KPIs"
            description="Something went wrong fetching this section."
            onRetry={() => refetch()}
            minHeight={200}
          />
        </SectionCard.Cell>
      </SectionCard>
    );
  }

  const kpis: SummaryKpiCard[] = (data?.data ?? []).filter(
    (kpi) => kpi.category === 'QUALITY',
  );
  const footer = formatAsOfFooter(data?.meta?.reportingPeriod);

  // data: [] with HTTP 200 is an empty result, never an error (§14).
  if (kpis.length === 0) {
    return (
      <SectionCard title={TITLE} footer={footer}>
        <SectionCard.Cell span={6}>
          <EmptyState
            title="No quality KPIs"
            description="No data matches the active filters."
            minHeight={200}
          />
        </SectionCard.Cell>
      </SectionCard>
    );
  }

  return (
    <SectionCard title={TITLE} footer={footer}>
      {kpis.map((kpi) => (
        <SectionCard.Cell
          key={kpi.kpiId}
          span={SPANS[kpi.kpiId] ?? DEFAULT_SPAN}
        >
          <KpiCard
            variant="embedded"
            kpi={kpi}
            metrics={kpi.metrics}
            stackMetrics={STACK_METRICS.has(kpi.kpiId)}
            onClick={
              kpi.detailRoute
                ? () => router.push(kpi.detailRoute as string)
                : undefined
            }
          />
        </SectionCard.Cell>
      ))}
    </SectionCard>
  );
}
