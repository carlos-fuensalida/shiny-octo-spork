import type {
  ApiListResponse,
  ApiResponse,
  FilterParams,
  Supplier,
} from '@/types';

import { buildQuery, dataApi } from './http';

export async function getSuppliers(
  filters: FilterParams = {},
): Promise<ApiListResponse<Supplier>> {
  const qs = buildQuery(filters as Record<string, unknown>);
  return dataApi.get<ApiListResponse<Supplier>>(`/suppliers${qs}`);
}

export async function getSupplier(
  supplierId: string,
): Promise<ApiResponse<Supplier>> {
  return dataApi.get<ApiResponse<Supplier>>(`/suppliers/${supplierId}`);
}
