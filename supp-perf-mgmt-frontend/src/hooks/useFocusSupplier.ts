'use client';

import { useQuery } from '@tanstack/react-query';

import { getFocusSupplierDetail } from '@/services';
import type { FilterParams } from '@/types';

/**
 * Fetches the Quality page's Focus Supplier section. Backed by
 * GET /kpis/kpi-focus-supplier, served by the mock route handler until Backend A
 * implements the contract (see
 * specs/features/SPM-128-quality-page/SPM-135-quality-cost-focus.md).
 */
export function useFocusSupplier(filters: FilterParams = {}) {
  return useQuery({
    queryKey: ['kpis', 'kpi-focus-supplier', filters],
    queryFn: () => getFocusSupplierDetail(filters),
  });
}
