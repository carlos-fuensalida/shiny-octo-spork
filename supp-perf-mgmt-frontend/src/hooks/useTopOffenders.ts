'use client';

import { useQuery } from '@tanstack/react-query';

import { getTopOffenders } from '@/services';
import type { FilterParams } from '@/types';

/**
 * Fetches the Summary view's Top Offenders charts. Backed by
 * GET /kpis/top-offenders — served by the mock route handler until Backend A
 * implements the contract (see specs/features/SPM-126-top-offenders.md).
 */
export function useTopOffenders(filters: FilterParams = {}) {
  return useQuery({
    queryKey: ['kpis', 'top-offenders', filters],
    queryFn: () => getTopOffenders(filters),
  });
}
