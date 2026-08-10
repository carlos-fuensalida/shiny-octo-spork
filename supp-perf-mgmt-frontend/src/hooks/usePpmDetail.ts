'use client';

import { useQuery } from '@tanstack/react-query';

import { getPpmDetail } from '@/services';
import type { FilterParams } from '@/types';

/**
 * Fetches the Incoming Material PPM section's detail. Backed by
 * GET /kpis/kpi-ppm — served by the mock route handler until Backend A
 * implements the contract (see
 * specs/features/SPM-128-quality-page/SPM-130-quality-ppm-cal.md).
 */
export function usePpmDetail(filters: FilterParams = {}) {
  return useQuery({
    queryKey: ['kpis', 'kpi-ppm', filters],
    queryFn: () => getPpmDetail(filters),
  });
}
