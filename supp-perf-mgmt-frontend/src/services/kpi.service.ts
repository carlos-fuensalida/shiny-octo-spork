import type {
  ApiListResponse,
  ApiResponse,
  CalKpiDetail,
  CostRecoveryKpi,
  FilterParams,
  FocusSupplierKpi,
  GsirKpiDetail,
  KpiCard,
  OpenActionsKpi,
  PiqMaturityKpi,
  PpmKpiDetail,
  ProductsOnHoldKpi,
  QualityExhibitsKpi,
  RiskRatingComponentsKpi,
  RiskRatingFpsKpi,
  SummaryKpiCard,
  SupplierComparisonRow,
  TopOffenderChart,
} from '@/types';

import { buildQuery, dataApi } from './http';

function filtersToQuery(f: FilterParams): string {
  return buildQuery(f as Record<string, unknown>);
}

export async function getSummaryKpis(
  filters: FilterParams = {},
): Promise<ApiListResponse<SummaryKpiCard>> {
  return dataApi.get<ApiListResponse<SummaryKpiCard>>(
    `/kpis/summary${filtersToQuery(filters)}`,
  );
}

export async function getTopOffenders(
  filters: FilterParams = {},
): Promise<ApiListResponse<TopOffenderChart>> {
  return dataApi.get<ApiListResponse<TopOffenderChart>>(
    `/kpis/top-offenders${filtersToQuery(filters)}`,
  );
}

export async function getQualityKpis(
  filters: FilterParams = {},
): Promise<ApiListResponse<KpiCard>> {
  return dataApi.get<ApiListResponse<KpiCard>>(
    `/kpis/quality${filtersToQuery(filters)}`,
  );
}

export async function getDeliveryKpis(
  filters: FilterParams = {},
): Promise<ApiListResponse<KpiCard>> {
  return dataApi.get<ApiListResponse<KpiCard>>(
    `/kpis/delivery${filtersToQuery(filters)}`,
  );
}

export async function getPpmDetail(
  filters: FilterParams = {},
): Promise<ApiResponse<PpmKpiDetail>> {
  return dataApi.get<ApiResponse<PpmKpiDetail>>(
    `/kpis/kpi-ppm${filtersToQuery(filters)}`,
  );
}

export async function getCalDetail(
  filters: FilterParams = {},
): Promise<ApiResponse<CalKpiDetail>> {
  return dataApi.get<ApiResponse<CalKpiDetail>>(
    `/kpis/kpi-cal${filtersToQuery(filters)}`,
  );
}

export async function getGsirDetail(
  filters: FilterParams = {},
): Promise<ApiResponse<GsirKpiDetail>> {
  return dataApi.get<ApiResponse<GsirKpiDetail>>(
    `/kpis/kpi-gsir${filtersToQuery(filters)}`,
  );
}

/**
 * One entry per segment scope (GLOBAL / NAR / LAR / FPS_ONLY) — the Quality
 * page's Products on Hold section renders a card per entry (SPM-132).
 */
export async function getProductsOnHoldDetail(
  filters: FilterParams = {},
): Promise<ApiListResponse<ProductsOnHoldKpi>> {
  return dataApi.get<ApiListResponse<ProductsOnHoldKpi>>(
    `/kpis/kpi-products-on-hold${filtersToQuery(filters)}`,
  );
}

export async function getPiqMaturityDetail(
  filters: FilterParams = {},
): Promise<ApiResponse<PiqMaturityKpi>> {
  return dataApi.get<ApiResponse<PiqMaturityKpi>>(
    `/kpis/kpi-piq-maturity${filtersToQuery(filters)}`,
  );
}

/**
 * One entry per region (GLOBAL / NAR / LAR) — the Quality page's Exhibits
 * section renders a donut card per entry. Deliberately *not* `OpenActionsKpi`:
 * that shape belongs to the 8Ds table, which the Exhibits frame doesn't share
 * (SPM-132).
 */
export async function getExhibitsDetail(
  filters: FilterParams = {},
): Promise<ApiListResponse<QualityExhibitsKpi>> {
  return dataApi.get<ApiListResponse<QualityExhibitsKpi>>(
    `/kpis/kpi-exhibits${filtersToQuery(filters)}`,
  );
}

export async function get8dCapaDetail(
  filters: FilterParams = {},
): Promise<ApiResponse<OpenActionsKpi>> {
  return dataApi.get<ApiResponse<OpenActionsKpi>>(
    `/kpis/kpi-8d-capa${filtersToQuery(filters)}`,
  );
}

export async function getRiskRatingComponentsDetail(
  filters: FilterParams = {},
): Promise<ApiResponse<RiskRatingComponentsKpi>> {
  return dataApi.get<ApiResponse<RiskRatingComponentsKpi>>(
    `/kpis/kpi-risk-rating-components${filtersToQuery(filters)}`,
  );
}

export async function getRiskRatingFpsDetail(
  filters: FilterParams = {},
): Promise<ApiResponse<RiskRatingFpsKpi>> {
  return dataApi.get<ApiResponse<RiskRatingFpsKpi>>(
    `/kpis/kpi-risk-rating-fps${filtersToQuery(filters)}`,
  );
}

export async function getFocusSupplierDetail(
  filters: FilterParams = {},
): Promise<ApiResponse<FocusSupplierKpi>> {
  return dataApi.get<ApiResponse<FocusSupplierKpi>>(
    `/kpis/kpi-focus-supplier${filtersToQuery(filters)}`,
  );
}

export async function getCostRecoveryDetail(
  filters: FilterParams = {},
): Promise<ApiResponse<CostRecoveryKpi>> {
  return dataApi.get<ApiResponse<CostRecoveryKpi>>(
    `/kpis/kpi-cost-recovery${filtersToQuery(filters)}`,
  );
}

export async function getSupplierKpis(
  supplierId: string,
  filters: FilterParams = {},
): Promise<ApiListResponse<KpiCard>> {
  return dataApi.get<ApiListResponse<KpiCard>>(
    `/kpis/supplier/${supplierId}${filtersToQuery(filters)}`,
  );
}

export async function getComparisonKpis(
  supplierIds: string[],
  filters: FilterParams = {},
): Promise<ApiListResponse<SupplierComparisonRow>> {
  return dataApi.get<ApiListResponse<SupplierComparisonRow>>(
    `/kpis/comparison${filtersToQuery({ ...filters, supplierIds })}`,
  );
}

export async function getSupplierLinkData(
  linkId: string,
): Promise<ApiListResponse<KpiCard>> {
  return dataApi.get<ApiListResponse<KpiCard>>(
    `/supplier-links/${linkId}/data`,
  );
}
