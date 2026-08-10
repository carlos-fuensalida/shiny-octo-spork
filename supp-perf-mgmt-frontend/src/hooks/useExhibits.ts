'use client';

import { useQuery } from '@tanstack/react-query';

import { getExhibitsDetail } from '@/services';
import type { FilterParams } from '@/types';

/**
 * Fetches the Quality Exhibits section — one entry per region. Backed by
 * GET /kpis/kpi-exhibits, served by the mock route handler until Backend A
 * implements the contract (see
 * specs/features/SPM-128-quality-page/SPM-132-quality-cards-poh-exhibits.md).
 */
export function useExhibits(filters: FilterParams = {}) {
  return useQuery({
    queryKey: ['kpis', 'kpi-exhibits', filters],
    queryFn: () => getExhibitsDetail(filters),
  });
}
