import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import type { KpiCard } from '@/types';

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
 * Mock Quality entry dataset. The `/quality` page drives its page-level state
 * and "As of …" footer off this list; each section fetches its own richer
 * detail (PPM, GSIR, PIQ, …) from its own endpoint. Base `KpiCard` shape per
 * the specced `GET /kpis/quality` contract — replaced by Backend A later.
 * See specs/features/SPM-128-quality-page/README.md §Data strategy.
 */
const QUALITY_KPIS: KpiCard[] = [
  {
    ...base,
    kpiId: 'kpi-rejection-ppm',
    kpiName: 'Incoming Material PPM',
    value: 850,
    unit: 'PPM',
  },
  {
    ...base,
    kpiId: 'kpi-cal-ppm',
    kpiName: 'CAL A/AA – PPM',
    value: 410,
    unit: 'PPM',
  },
  {
    ...base,
    kpiId: 'kpi-gsir',
    kpiName: 'GSIR',
    value: 42,
    unit: 'COUNT',
  },
  {
    ...base,
    kpiId: 'kpi-products-on-hold',
    kpiName: 'Products on Hold',
    value: 17,
    unit: 'COUNT',
  },
  {
    ...base,
    kpiId: 'kpi-piq-maturity',
    kpiName: 'PIQ Maturity',
    value: 74,
    unit: 'PERCENT',
  },
  {
    ...base,
    kpiId: 'kpi-exhibits',
    kpiName: 'Quality Exhibits',
    value: 12,
    unit: 'COUNT',
  },
  {
    ...base,
    kpiId: 'kpi-risk-rating-components',
    kpiName: 'Risk Rating',
    value: 10,
    unit: 'COUNT',
  },
  {
    ...base,
    kpiId: 'kpi-8d-capa',
    kpiName: '8Ds',
    value: 38,
    unit: 'COUNT',
  },
  {
    ...base,
    kpiId: 'kpi-cost-recovery',
    kpiName: 'Cost Recovery',
    value: 340000,
    unit: 'USD',
  },
];

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

  const data = state === 'empty' ? [] : QUALITY_KPIS;

  return NextResponse.json({
    data,
    meta: {
      requestId: 'mock-req-quality',
      reportingPeriod: REPORTING_PERIOD,
      region: params.get('region') ?? 'GLOBAL',
      lastUpdated: LAST_UPDATED,
    },
  });
}
