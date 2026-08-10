'use client';

import { useQuery } from '@tanstack/react-query';

import { getSummaryKpis } from '@/services';
import type { FilterParams } from '@/types';

/**
 * Fetches the Summary view KPI cards. Backed by GET /kpis/summary — served by
 * the mock route handler until Backend A implements the metrics[] contract.
 */
export function useSummaryKpis(filters: FilterParams = {}) {
  return useQuery({
    queryKey: ['kpis', 'summary', filters],
    queryFn: () => getSummaryKpis(filters),
  });
}
