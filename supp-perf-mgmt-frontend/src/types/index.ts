// ─── Primitive types ───────────────────────────────────────────────────────

export type Region = 'GLOBAL' | 'LAR' | 'NAR';
export type KpiCategory = 'DELIVERY' | 'QUALITY';
export type KpiUnit = 'PPM' | 'PERCENT' | 'COUNT' | 'DAYS' | 'USD' | 'INDEX';
export type KpiStatus = 'GREEN' | 'YELLOW' | 'RED' | 'NEUTRAL';
export type TrendDirection = 'UP' | 'DOWN' | 'FLAT';
export type SupplierStatus = 'ACTIVE' | 'INACTIVE' | 'WATCH';
export type FiscalQuarter = 'Q1' | 'Q2' | 'Q3' | 'Q4';
export type ProductSegment = 'MDA' | 'SDA' | 'FPS';
export type ProductRegionSegment =
  'GLOBAL_OVERALL' | 'NAR_MDA' | 'LAR_MDA' | 'SDA' | 'FPS';

// ─── User ──────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  displayName: string;
  firstName?: string;
  lastName?: string;
  createdAt?: string;
  lastLoginAt?: string;
}

// ─── Filters ───────────────────────────────────────────────────────────────

export interface DateRange {
  from: string; // "YYYY-MM"
  to: string;
}

export interface SavedFilterPreference {
  id: string;
  userId: string;
  name: string;
  region: Region;
  supplierIds: string[];
  createdAt: string;
  updatedAt: string;
  businessUnit?: string;
  commodity?: string;
  subcommodity?: string;
  category?: string;
  dateRange?: DateRange;
  month?: number;
  plantId?: string;
  supplierLocation?: string;
  isFocusSupplier?: boolean;
  scorecardType?: string;
  isDefault?: boolean;
  isShared?: boolean;
}

export interface FilterParams {
  region?: Region;
  year?: number;
  month?: number;
  plantIds?: string[];
  commodity?: string;
  subcommodity?: string;
  supplierIds?: string[];
  supplierCode?: string;
  supplierLocation?: string;
  category?: string;
  isFocusSupplier?: boolean;
  page?: number;
  pageSize?: number;
}

export interface FilterMetadata {
  regions: Region[];
  years: number[];
  months: number[];
  plants: Plant[];
  commodities: string[];
  subcommodities: string[];
  categories: string[];
  supplierLocations: string[];
}

// ─── Supplier ──────────────────────────────────────────────────────────────

export interface Supplier {
  supplierId: string;
  supplierName: string;
  region: Region;
  supplierCode?: string;
  supplierStatus?: SupplierStatus;
  category?: string;
  commodity?: string;
  subcommodity?: string;
  supplierLocation?: string;
  isFocusSupplier?: boolean;
  parentSupplierId?: string;
}

// ─── Plant ─────────────────────────────────────────────────────────────────

export interface Plant {
  plantId: string;
  plantName: string;
  region: Region;
  country?: string;
}

// ─── Spend ─────────────────────────────────────────────────────────────────

export interface GlobalSpend {
  totalSpend: number;
  region: Region;
  fiscalYear: number;
  fiscalQuarter: FiscalQuarter;
  currency: string;
  spendBySupplier?: SpendBreakdown[];
  spendByCommodity?: SpendBreakdown[];
  spendTrend?: SpendTrendPoint[];
}

export interface SpendBreakdown {
  label: string;
  value: number;
  currency: string;
}

export interface SpendTrendPoint {
  period: string;
  value: number;
  currency: string;
}

// ─── KPI base ──────────────────────────────────────────────────────────────

export interface KpiCard {
  kpiId: string;
  kpiName: string;
  category: KpiCategory;
  region: Region;
  value: number | string | null;
  unit?: KpiUnit;
  target?: number | null;
  status?: KpiStatus | null;
  trendDirection?: TrendDirection | null;
  reportingPeriod: string;
  lastUpdated: string;
}

/** A single labelled figure inside a summary KPI tile. */
export interface SummaryMetric {
  label: string;
  value: number | string | null;
  unit?: KpiUnit;
  /** Sub-label rendered under the value, e.g. "Total Units". */
  caption?: string;
}

/**
 * Summary-view KPI card. Extends KpiCard with a metrics array so a single tile
 * can carry several labelled figures — the flat `value` field cannot express
 * cards like 8Ds (three counts) or Cost Recovery (currency + percentage).
 */
export interface SummaryKpiCard extends KpiCard {
  metrics: SummaryMetric[];
  /** Detail page this tile navigates to. Omitted when no detail page exists. */
  detailRoute?: string;
}

/** One supplier's bar within a Top Offenders chart. */
export interface TopOffenderBar {
  supplierId: string;
  supplierName: string;
  value: number;
  /**
   * Region/status line shown under the value in list presentations (SPM-130
   * `OffenderListCard`, e.g. "NAR · improving"). Optional — bar presentations
   * (`OffenderBarChart`) ignore it.
   */
  caption?: string;
}

/**
 * One Top Offenders chart: a delivery/quality metric and its worst-performing
 * suppliers, pre-ranked descending (highest value = worst offender, first).
 * `value` is number-only (unlike KpiCard.value) because bars must be plotted.
 */
export interface TopOffenderChart {
  metricId: string;
  metricName: string;
  unit: KpiUnit;
  offenders: TopOffenderBar[];
}

export interface KpiHistoricalPoint {
  kpiId: string;
  period: string;
  value: number | string | null;
  region: Region;
}

export interface SupplierKpiResult {
  supplierId: string;
  kpiId: string;
  kpiName: string;
  category: KpiCategory;
  region: Region;
  value: number | string | null;
  unit?: KpiUnit;
  status?: KpiStatus | null;
  reportingPeriod: string;
  lastUpdated: string;
}

// ─── KPI detail interfaces ─────────────────────────────────────────────────

/**
 * The 8Ds / CAPA table's shape (`804:26275`). Quality Exhibits was originally
 * specced to share it, but the Figma frame shows a status breakdown instead —
 * see `QualityExhibitsKpi` (SPM-132).
 */
export interface OpenActionsKpi extends KpiCard {
  totalOpen2026: number;
  openOver90Days: number;
  openOver45Days: number;
}

/**
 * One Quality Exhibits donut card (Figma `804:26272`–`804:26274`) — the open
 * exhibits for a region, split by progress status. `KpiCard.region` carries the
 * card's scope (GLOBAL / NAR / LAR), so no separate scope field is needed, and
 * the donut's center total is the sum of the five counts (derived in the UI so
 * the label can never disagree with the arcs).
 */
export interface QualityExhibitsKpi extends KpiCard {
  completed: number;
  ongoing: number;
  delayed: number;
  disposition: number;
  notStarted: number;
}

export interface RiskRatingComponentsKpi extends KpiCard {
  qtyPreferred: number;
  qtyNotPreferred: number;
  qtyNewBusinessOnHold: number;
}

export interface RiskRatingFpsKpi extends KpiCard {
  qtyOnQuality: number;
  qtyNotOnQuality: number;
}

export interface FocusSupplierKpi extends KpiCard {
  countGlobal: number;
  countNar: number;
  countLar: number;
}

/**
 * SPM-135: the three Cost Recovery highlight cards (Figma `1365:14366`).
 * Amounts are raw USD — the frontend formats them (`15_000` → `US$15K`), same
 * as every other KPI value. See the ticket's OQ-Q-1/OQ-Q-2 for the open
 * questions on amount transport and whether `globalConversion` is a count or a
 * rate; it is a count here because the frame draws `24` with no unit.
 */
export interface CostRecoveryKpi extends KpiCard {
  globalConversion: number;
  totalRecovered: number;
  ongoing: number;
}

/**
 * SPM-133: the top-level `fy2025/plan2026/ytd2026/rollingR3` are the **Global**
 * row's own values; `byRegion` carries only NAR and LAR, so no row is stated
 * twice. Same aggregate-plus-breakdown shape as `PpmKpiDetail`.
 */
export interface PiqMaturityKpi extends KpiCard {
  fy2025: number;
  plan2026: number;
  ytd2026: number;
  ytd2026Status?: KpiStatus;
  rollingR3: number;
  rollingR3Status?: KpiStatus;
  /** Chronological 12M maturity percentages; last entry is the latest month. */
  monthly: number[];
  byRegion: PiqMaturityRegionRow[];
}

export interface PiqMaturityRegionRow {
  region: Region;
  fy2025: number;
  plan2026: number;
  ytd2026: number;
  ytd2026Status?: KpiStatus;
  rollingR3: number;
  rollingR3Status?: KpiStatus;
  /** Each region carries its own trend, independent of the Global row. */
  monthly: number[];
}

/**
 * SPM-130: `fy2025/plan2026/ytd2026/rollingR3` mirror `PiqMaturityRegionRow` —
 * the wide PPM card turned out to be a table (matching that column set), not a
 * chart. `offenders` backs the narrow card's Top Offenders list.
 */
export interface PpmKpiDetail extends KpiCard {
  totalRejections: number;
  totalUnitsInspected: number;
  fy2025: number;
  plan2026: number;
  ytd2026: number;
  /**
   * RAG assessment of this figure, owned by the backend like `KpiCard.status`
   * — thresholds vary per KPI and reset yearly, and the same judgement feeds
   * the chatbot, alerts, and exports. Optional while the Backend A contract is
   * still open; `getPlanVarianceStatus` is the stand-in when it's absent.
   */
  ytd2026Status?: KpiStatus;
  rollingR3: number;
  rollingR3Status?: KpiStatus;
  monthly: PpmMonthlyRow[];
  byPlant: PpmBreakdownRow[];
  byCommodity: PpmBreakdownRow[];
  byRegion: PpmBreakdownRow[];
  offenders: TopOffenderBar[];
}

export interface PpmBreakdownRow {
  dimension: string;
  ppm: number;
  rejections: number;
  totalUnits: number;
  fy2025: number;
  plan2026: number;
  ytd2026: number;
  ytd2026Status?: KpiStatus;
  rollingR3: number;
  rollingR3Status?: KpiStatus;
  monthly: PpmMonthlyRow[];
}

export interface PpmMonthlyRow {
  period: string;
  ppm: number;
  rejections: number;
}

/** SPM-130: same extension as PpmKpiDetail, mirrored for CAL. */
export interface CalKpiDetail extends KpiCard {
  fy2025: number;
  plan2026: number;
  ytd2026: number;
  ytd2026Status?: KpiStatus;
  rollingR3: number;
  rollingR3Status?: KpiStatus;
  monthly: CalMonthlyRow[];
  byRegion: CalBreakdownRow[];
  byPlant: CalBreakdownRow[];
  byCommodity: CalBreakdownRow[];
  offenders: TopOffenderBar[];
}

export interface CalBreakdownRow {
  dimension: string;
  calCount: number;
  statusCounts: Record<string, number>;
  fy2025: number;
  plan2026: number;
  ytd2026: number;
  ytd2026Status?: KpiStatus;
  rollingR3: number;
  rollingR3Status?: KpiStatus;
  monthly: CalMonthlyRow[];
}

export interface CalMonthlyRow {
  period: string;
  calCount: number;
}

/**
 * One Products on Hold card (Figma `804:26188`–`804:26191`) — a grouped bar
 * chart of one segment scope over the reported months. `carryOver2025` is a
 * single scalar, not a monthly series: the frame draws it as a bar in the first
 * month group only.
 */
export interface ProductsOnHoldKpi extends KpiCard {
  carryOver2025: number;
  segmentScope: ProductsOnHoldScope;
  byMonth: ProductsOnHoldMonthRow[];
}

export type ProductsOnHoldScope = 'GLOBAL' | 'NAR' | 'LAR' | 'FPS_ONLY';

export interface ProductsOnHoldMonthRow {
  period: string;
  fullMonth: number;
  eom: number;
}

export interface GsirKpiDetail extends KpiCard {
  volumeKUnits: number;
  exitRateR18: number;
  exitRateDec25: number;
  baseline2025: number;
  ytdTarget: number;
  currentResult: number;
  currentVsPriorPeriod: number;
  yeTarget: number;
  levelOfService: number;
  bySegment?: GsirSegmentRow[];
  tcq?: GsirTcqRow[];
  byCommodity?: GsirCommodityRow[];
}

export interface GsirSegmentRow {
  segment: ProductRegionSegment;
  volumeKUnits: number;
  currentResult: number;
  ytdTarget: number;
  baseline2025: number;
}

export interface GsirTcqRow {
  segment: ProductRegionSegment;
  ytd2025: number;
  ytdPlan: number;
  ytd2026: number;
  bwVsPlan: number;
  bwVsPY: number;
}

export interface GsirCommodityRow {
  commodity: string;
  volumeKUnits: number;
  currentResult: number;
}

// ─── API envelopes ─────────────────────────────────────────────────────────

export interface ResponseMeta {
  requestId: string;
  reportingPeriod?: string;
  region?: Region;
  lastUpdated?: string;
}

export interface Pagination {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  data: T;
  meta: ResponseMeta;
}

export interface ApiListResponse<T> {
  data: T[];
  meta: ResponseMeta;
  pagination?: Pagination;
}

export interface ApiError {
  error: {
    code: string;
    message: string;
    requestId: string;
    details?: unknown;
  };
}

// ─── Chat (Backend B) ──────────────────────────────────────────────────────

export type ChatScope = 'GLOBAL' | 'CURRENT_VIEW';

export interface ChatSource {
  label: string;
  sql?: string;
  dataAsOf?: string;
}

export interface ChatMessage {
  sessionId: string;
  message: string;
  scope: ChatScope;
  viewContext?: Record<string, unknown>;
}

export interface ChatReply {
  reply: string;
  sources?: ChatSource[];
  generativeUi?: unknown;
}

export interface ChatSession {
  sessionId: string;
}

// ─── Supplier comparison ───────────────────────────────────────────────────

export interface SupplierComparisonRow {
  kpiId: string;
  kpiName: string;
  category: KpiCategory;
  results: SupplierKpiResult[];
}
