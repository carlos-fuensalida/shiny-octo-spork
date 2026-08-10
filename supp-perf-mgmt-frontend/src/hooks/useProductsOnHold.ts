'use client';

import { useQuery } from '@tanstack/react-query';

import { getProductsOnHoldDetail } from '@/services';
import type { FilterParams } from '@/types';

/**
 * Fetches the Products on Hold section — one entry per segment scope. Backed by
 * GET /kpis/kpi-products-on-hold, served by the mock route handler until
 * Backend A implements the contract (see
 * specs/features/SPM-128-quality-page/SPM-132-quality-cards-poh-exhibits.md).
 */
export function useProductsOnHold(filters: FilterParams = {}) {
  return useQuery({
    queryKey: ['kpis', 'kpi-products-on-hold', filters],
    queryFn: () => getProductsOnHoldDetail(filters),
  });
}
