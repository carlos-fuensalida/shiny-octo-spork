'use client';

import { useFocusSupplier } from '@/hooks';
import { formatMetricValue } from '@/lib/format';
import type { FilterParams } from '@/types';

import type { SectionMetric } from './MetricCardsSection';
import MetricCardsSection from './MetricCardsSection';

const TITLE = 'Focus Supplier';

interface FocusSupplierSectionProps {
  filters?: FilterParams;
}

/**
 * Focus Supplier (Figma `1365:14287`): focus-supplier counts by region. The
 * three regions are fixed fields on `FocusSupplierKpi` rather than a list, so
 * the labels come from the frame like the other Quality section titles.
 */
export default function FocusSupplierSection({
  filters = {},
}: FocusSupplierSectionProps) {
  const { data, isLoading, isError, refetch } = useFocusSupplier(filters);
  const detail = data?.data;

  const metrics: SectionMetric[] | null = detail
    ? [
        {
          label: 'Global',
          value: formatMetricValue(detail.countGlobal, 'COUNT'),
        },
        { label: 'NAR', value: formatMetricValue(detail.countNar, 'COUNT') },
        { label: 'LAR', value: formatMetricValue(detail.countLar, 'COUNT') },
      ]
    : null;

  return (
    <MetricCardsSection
      title={TITLE}
      isLoading={isLoading}
      isError={isError}
      onRetry={() => refetch()}
      metrics={metrics}
    />
  );
}
