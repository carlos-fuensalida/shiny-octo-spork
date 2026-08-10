'use client';

import { useQuery } from '@tanstack/react-query';

import { getCostRecoveryDetail } from '@/services';
import type { FilterParams } from '@/types';

/**
 * Fetches the Quality page's Cost Recovery section. Backed by
 * GET /kpis/kpi-cost-recovery, served by the mock route handler until Backend A
 * implements the contract (see
 * specs/features/SPM-128-quality-page/SPM-135-quality-cost-focus.md).
 */
export function useCostRecovery(filters: FilterParams = {}) {
  return useQuery({
    queryKey: ['kpis', 'kpi-cost-recovery', filters],
    queryFn: () => getCostRecoveryDetail(filters),
  });
}
