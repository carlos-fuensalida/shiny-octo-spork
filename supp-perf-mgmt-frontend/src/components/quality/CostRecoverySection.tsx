'use client';

import { useCostRecovery } from '@/hooks';
import { formatMetricValue } from '@/lib/format';
import type { FilterParams } from '@/types';

import type { SectionMetric } from './MetricCardsSection';
import MetricCardsSection from './MetricCardsSection';

const TITLE = 'Cost Recovery';

interface CostRecoverySectionProps {
  filters?: FilterParams;
}

/**
 * Cost Recovery (Figma `1365:14366`). Card labels come from the frame, not the
 * payload — they name fixed fields of the KPI, the same call the other Quality
 * sections make for their titles.
 *
 * `globalConversion` renders as a plain count because the frame draws `24` with
 * no unit; see OQ-Q-2 in the ticket spec, which flags that Summary's Cost
 * Recovery tile shows conversion as a percentage instead.
 */
export default function CostRecoverySection({
  filters = {},
}: CostRecoverySectionProps) {
  const { data, isLoading, isError, refetch } = useCostRecovery(filters);
  const detail = data?.data;

  const metrics: SectionMetric[] | null = detail
    ? [
        {
          label: 'Global Conversion',
          value: formatMetricValue(detail.globalConversion, 'COUNT'),
        },
        {
          label: 'Total Recovered',
          value: formatMetricValue(detail.totalRecovered, 'USD'),
        },
        { label: 'On going', value: formatMetricValue(detail.ongoing, 'USD') },
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
