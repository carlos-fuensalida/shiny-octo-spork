'use client';

import { useQuery } from '@tanstack/react-query';

import { getCalDetail } from '@/services';
import type { FilterParams } from '@/types';

/**
 * Fetches the CAL A/AA – PPM section's detail. Backed by GET /kpis/kpi-cal —
 * served by the mock route handler until Backend A implements the contract
 * (see specs/features/SPM-128-quality-page/SPM-130-quality-ppm-cal.md).
 */
export function useCalDetail(filters: FilterParams = {}) {
  return useQuery({
    queryKey: ['kpis', 'kpi-cal', filters],
    queryFn: () => getCalDetail(filters),
  });
}
