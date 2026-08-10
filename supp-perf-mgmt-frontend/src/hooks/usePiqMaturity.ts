'use client';

import { useQuery } from '@tanstack/react-query';

import { getPiqMaturityDetail } from '@/services';
import type { FilterParams } from '@/types';

/**
 * Fetches the PIQ Maturity (NPI Projects) section's detail. Backed by
 * GET /kpis/kpi-piq-maturity — served by the mock route handler until Backend A
 * implements the contract (see
 * specs/features/SPM-128-quality-page/SPM-133-quality-piq-maturity.md).
 */
export function usePiqMaturity(filters: FilterParams = {}) {
  return useQuery({
    queryKey: ['kpis', 'kpi-piq-maturity', filters],
    queryFn: () => getPiqMaturityDetail(filters),
  });
}
