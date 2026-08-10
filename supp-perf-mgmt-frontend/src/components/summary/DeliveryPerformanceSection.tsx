'use client';

import { useRouter } from 'next/navigation';

import { EmptyState, ErrorState, KpiCard, SectionCard } from '@/components/ui';
import { useSummaryKpis } from '@/hooks';
import { formatAsOfFooter } from '@/lib/format';
import type { FilterParams, SummaryKpiCard, SummaryMetric } from '@/types';

const TITLE = 'Delivery Performance';

/** Region display order for the three tiles. */
const REGIONS = ['Global', 'NAR', 'LAR'] as const;

/** Three region tiles fill the 6-column grid evenly: 3 × 2 = 6. */
const REGION_SPAN = 2;
const SKELETON_SPANS = [REGION_SPAN, REGION_SPAN, REGION_SPAN];

/**
 * No per-KPI detail pages exist under src/app/(dashboard)/delivery/ yet, so
 * every tile shares the top-level Delivery view route rather than a KPI-
 * specific one (see OQ-D3, specs/features/SPM-114-summary-shell-delivery.md).
 */
const DELIVERY_ROUTE = '/delivery';

interface DeliveryPerformanceSectionProps {
  filters?: FilterParams;
}

export default function DeliveryPerformanceSection({
  filters = {},
}: DeliveryPerformanceSectionProps) {
  const router = useRouter();
  const { data, isLoading, isError, refetch } = useSummaryKpis(filters);

  if (isLoading) {
    return (
      <SectionCard.Skeleton
        title={TITLE}
        spans={SKELETON_SPANS}
        metricsPerCell={4}
      />
    );
  }

  if (isError) {
    return (
      <SectionCard title={TITLE}>
        <SectionCard.Cell span={6}>
          <ErrorState
            title="Unable to load delivery KPIs"
            description="Something went wrong fetching this section."
            onRetry={() => refetch()}
            minHeight={200}
          />
        </SectionCard.Cell>
      </SectionCard>
    );
  }

  const kpis: SummaryKpiCard[] = (data?.data ?? []).filter(
    (kpi) => kpi.category === 'DELIVERY',
  );
  const footer = formatAsOfFooter(data?.meta?.reportingPeriod);

  // data: [] with HTTP 200 is an empty result, never an error (§14).
  if (kpis.length === 0) {
    return (
      <SectionCard title={TITLE} footer={footer}>
        <SectionCard.Cell span={6}>
          <EmptyState
            title="No delivery KPIs"
            description="No data matches the active filters."
            minHeight={200}
          />
        </SectionCard.Cell>
      </SectionCard>
    );
  }

  return (
    <SectionCard title={TITLE} footer={footer}>
      {REGIONS.map((region) => {
        const rows = groupByRegion(kpis, region);
        if (rows.length === 0) return null;

        return (
          <SectionCard.Cell key={region} span={REGION_SPAN}>
            <KpiCard
              variant="embedded"
              title={region}
              metricRows={rows}
              onClick={() => router.push(DELIVERY_ROUTE)}
            />
          </SectionCard.Cell>
        );
      })}
    </SectionCard>
  );
}

/**
 * Row shape per region — how many of the pivoted (ordered: Expedite,
 * Production Loss, DTC, VMI, OTIF) metrics land on each row. Global stacks
 * Expedite and Production Loss on their own rows (their combined values run
 * longer — "Qty 145 / $1.2M" plus "22,500"), while NAR/LAR keep them
 * side by side; all three then group the remaining percentage-style KPIs
 * (DTC + whichever of VMI/OTIF apply) onto one row. This is a fixed design
 * grouping, not a width-driven wrap, so it's expressed explicitly per region
 * rather than left to `flex-wrap`.
 */
const ROW_SIZES: Record<(typeof REGIONS)[number], number[]> = {
  Global: [1, 1, 3],
  NAR: [2, 2],
  LAR: [2, 2],
};

/**
 * Pivots the KPI-centric mock rows (one per Delivery KPI, each with metrics
 * keyed by region) into a single region's tile: one entry per KPI that has a
 * metric for that region, chunked into that region's row shape. This is what
 * drops VMI out of the LAR tile and OTIF out of the NAR tile, matching
 * DATA_MODEL_SPEC's region-availability table.
 */
function groupByRegion(
  kpis: SummaryKpiCard[],
  region: (typeof REGIONS)[number],
): SummaryMetric[][] {
  const pivoted: SummaryMetric[] = kpis.flatMap((kpi) => {
    const metric = kpi.metrics.find((m) => m.label === region);
    if (!metric) return [];

    return [
      {
        label: kpi.kpiName,
        value: metric.value,
        unit: metric.unit,
        caption: metric.caption,
      },
    ];
  });

  const rows: SummaryMetric[][] = [];
  let index = 0;
  for (const size of ROW_SIZES[region]) {
    const row = pivoted.slice(index, index + size);
    if (row.length > 0) rows.push(row);
    index += size;
  }
  return rows;
}
