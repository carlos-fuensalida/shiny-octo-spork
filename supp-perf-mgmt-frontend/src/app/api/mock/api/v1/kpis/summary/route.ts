import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import type { SummaryKpiCard } from '@/types';

const REPORTING_PERIOD = '2026-01';
const LAST_UPDATED = '2026-02-02T06:00:00Z';

const base = {
  category: 'QUALITY',
  region: 'GLOBAL',
  status: null,
  trendDirection: null,
  reportingPeriod: REPORTING_PERIOD,
  lastUpdated: LAST_UPDATED,
} as const;

/**
 * Mock Quality Performance dataset, mirroring the Summary design.
 * Replaced by Backend A once GET /kpis/summary implements the metrics[]
 * contract — see specs/features/SPM-104-summary-shell-quality.md.
 */
const QUALITY_KPIS: SummaryKpiCard[] = [
  {
    ...base,
    kpiId: 'kpi-rejection-ppm',
    kpiName: 'Rejection PPM',
    value: 850,
    unit: 'PPM',
    detailRoute: '/quality/ppm',
    metrics: [
      { label: 'Global', value: 850 },
      { label: 'NAR', value: 620 },
      { label: 'LAR', value: 910 },
    ],
  },
  {
    ...base,
    kpiId: 'kpi-cal-ppm',
    kpiName: 'CAL/PPM',
    value: 410,
    unit: 'PPM',
    detailRoute: '/quality/cal',
    metrics: [
      { label: 'Global', value: 410 },
      { label: 'NAR', value: 350 },
      { label: 'LAR', value: 480 },
    ],
  },
  {
    ...base,
    kpiId: 'kpi-gsir',
    kpiName: 'GSIR',
    value: 42,
    unit: 'COUNT',
    detailRoute: '/quality/gsir',
    metrics: [{ label: 'Global', value: 42 }],
  },
  {
    ...base,
    kpiId: 'kpi-products-on-hold',
    kpiName: 'Products on Hold',
    value: 17,
    unit: 'COUNT',
    detailRoute: '/quality/products-on-hold',
    metrics: [{ label: 'Global', value: 17 }],
  },
  {
    ...base,
    kpiId: 'kpi-cost-recovery',
    kpiName: 'Cost Recovery',
    value: 340000,
    unit: 'USD',
    metrics: [
      { label: 'Global YTD', value: 340000, unit: 'USD' },
      { label: 'Global Conversion', value: 68, unit: 'PERCENT' },
    ],
  },
  {
    ...base,
    kpiId: 'kpi-piq-maturity',
    kpiName: 'PIQ Maturity',
    value: 74,
    unit: 'PERCENT',
    detailRoute: '/quality/piq-maturity',
    metrics: [{ label: 'Global', value: 74, unit: 'PERCENT' }],
  },
  {
    ...base,
    kpiId: 'kpi-8d-capa',
    kpiName: '8Ds',
    value: 38,
    unit: 'COUNT',
    detailRoute: '/quality/8d-capa',
    metrics: [
      { label: 'Total Open 2026', value: 38 },
      { label: 'Open > 90 Days', value: 9 },
      { label: 'Open > 45 Days', value: 15 },
    ],
  },
  {
    ...base,
    kpiId: 'kpi-risk-rating-components',
    kpiName: 'Risk Rating Components (most updated)',
    value: 10,
    unit: 'COUNT',
    detailRoute: '/quality/risk-rating-components',
    metrics: [
      { label: 'Preferred', value: 10 },
      { label: 'Not Preferred', value: 6 },
      { label: 'New Business on Hold', value: 3 },
    ],
  },
  {
    ...base,
    kpiId: 'kpi-risk-rating-fps',
    kpiName: 'Risk Rating FPS (most updated)',
    value: 4,
    unit: 'COUNT',
    metrics: [
      { label: 'On Quality', value: 4 },
      { label: 'Not on Quality', value: 4 },
    ],
  },
];

/**
 * Mock Delivery Performance dataset. KPI-centric, like the Quality set above —
 * each KPI's `metrics[]` is keyed by region so the existing `applyRegion`
 * narrowing works unmodified. The section groups these into region columns at
 * render time; see specs/features/SPM-114-summary-shell-delivery.md.
 */
const DELIVERY_KPIS: SummaryKpiCard[] = [
  {
    ...base,
    category: 'DELIVERY',
    kpiId: 'kpi-expedite',
    kpiName: 'Expedite (Supplier Caused)',
    value: 'Qty 145 / $1.2M',
    metrics: [
      { label: 'Global', value: 'Qty 145 / $1.2M' },
      { label: 'NAR', value: 'Qty 62 / $450k' },
      { label: 'LAR', value: 'Qty 55 / $380k' },
    ],
  },
  {
    ...base,
    category: 'DELIVERY',
    kpiId: 'kpi-production-loss',
    kpiName: 'Production Loss',
    value: 22500,
    unit: 'COUNT',
    metrics: [
      { label: 'Global', value: 22500, unit: 'COUNT', caption: 'Total Units' },
      { label: 'NAR', value: 9100, unit: 'COUNT', caption: 'Total Units' },
      { label: 'LAR', value: 10200, unit: 'COUNT', caption: 'Total Units' },
    ],
  },
  {
    ...base,
    category: 'DELIVERY',
    kpiId: 'kpi-dtc',
    kpiName: 'DTC',
    value: 91.2,
    unit: 'PERCENT',
    metrics: [
      {
        label: 'Global',
        value: 91.2,
        unit: 'PERCENT',
        caption: '19,800 Units',
      },
      { label: 'NAR', value: 8800, unit: 'COUNT', caption: 'Total Units' },
      { label: 'LAR', value: 90.1, unit: 'PERCENT', caption: '9,400 Units' },
    ],
  },
  {
    ...base,
    category: 'DELIVERY',
    kpiId: 'kpi-vmi-compliance',
    kpiName: 'VMI',
    value: 88,
    unit: 'PERCENT',
    metrics: [
      { label: 'Global', value: 88, unit: 'PERCENT', caption: '% Compliant' },
      { label: 'NAR', value: 85, unit: 'PERCENT', caption: '% Compliant' },
    ],
  },
  {
    ...base,
    category: 'DELIVERY',
    kpiId: 'kpi-otif',
    kpiName: 'OTIF',
    value: 94.2,
    unit: 'PERCENT',
    metrics: [
      { label: 'Global', value: 94.2, unit: 'PERCENT' },
      { label: 'LAR', value: 93.5, unit: 'PERCENT' },
    ],
  },
];

/** Regional metric labels, used to narrow tiles when a region filter is set. */
const REGION_LABELS = ['Global', 'NAR', 'LAR'];

/**
 * Narrows each KPI's metrics to the requested region. Non-regional tiles
 * (8Ds, Cost Recovery, Risk Rating) have no regional breakdown and pass
 * through untouched. Regional KPIs without an entry for the requested region
 * (e.g. VMI has no LAR) correctly narrow to an empty array rather than
 * falling back to the unfiltered set.
 */
function applyRegion(
  kpis: SummaryKpiCard[],
  region: string | null,
): SummaryKpiCard[] {
  if (!region || region === 'GLOBAL') return kpis;

  return kpis.map((kpi) => {
    const isRegional = kpi.metrics.every((m) =>
      REGION_LABELS.includes(m.label),
    );
    if (!isRegional) return kpi;

    return { ...kpi, metrics: kpi.metrics.filter((m) => m.label === region) };
  });
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function GET(request: NextRequest) {
  if (!request.cookies.get('session')) {
    return NextResponse.json(
      {
        error: {
          code: 'UNAUTHORIZED',
          message: 'Not authenticated',
          requestId: 'mock',
        },
      },
      { status: 401 },
    );
  }

  const params = request.nextUrl.searchParams;

  // Dev-only escape hatch for exercising the four §14 states in the browser.
  const state = params.get('_state');

  if (state === 'error') {
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Mock failure',
          requestId: 'mock',
        },
      },
      { status: 500 },
    );
  }

  if (state === 'slow') await delay(2000);

  const data =
    state === 'empty'
      ? []
      : applyRegion([...QUALITY_KPIS, ...DELIVERY_KPIS], params.get('region'));

  return NextResponse.json({
    data,
    meta: {
      requestId: 'mock-req-summary',
      reportingPeriod: REPORTING_PERIOD,
      region: params.get('region') ?? 'GLOBAL',
      lastUpdated: LAST_UPDATED,
    },
  });
}
