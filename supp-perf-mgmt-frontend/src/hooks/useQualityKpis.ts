'use client';

import { useQuery } from '@tanstack/react-query';

import { getQualityKpis } from '@/services';
import type { FilterParams } from '@/types';

/**
 * Fetches the Quality view entry KPIs. Backed by GET /kpis/quality — served by
 * the mock route handler until Backend A implements the contract. Drives the
 * page-level loading/empty/error/success states and the "As of …" footer.
 */
export function useQualityKpis(filters: FilterParams = {}) {
  return useQuery({
    queryKey: ['kpis', 'quality', filters],
    queryFn: () => getQualityKpis(filters),
  });
}
