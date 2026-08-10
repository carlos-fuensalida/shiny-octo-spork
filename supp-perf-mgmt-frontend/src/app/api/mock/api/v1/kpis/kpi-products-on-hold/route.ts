import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import type { ProductsOnHoldKpi, ProductsOnHoldMonthRow } from '@/types';

const REPORTING_PERIOD = '2026-05';
const LAST_UPDATED = '2026-06-02T06:00:00Z';

const base = {
  kpiId: 'kpi-products-on-hold',
  kpiName: 'Products on Hold',
  category: 'QUALITY',
  unit: 'COUNT',
  status: null,
  trendDirection: null,
  reportingPeriod: REPORTING_PERIOD,
  lastUpdated: LAST_UPDATED,
} as const;

function months(
  rows: [fullMonth: number, eom: number][],
): ProductsOnHoldMonthRow[] {
  const periods = ['2026-01', '2026-02', '2026-03', '2026-04', '2026-05'];
  return rows.map(([fullMonth, eom], i) => ({
    period: periods[i],
    fullMonth,
    eom,
  }));
}

/**
 * Mock Products on Hold detail — one entry per segment scope, each backing one
 * grouped-bar card. See
 * specs/features/SPM-128-quality-page/SPM-132-quality-cards-poh-exhibits.md.
 *
 * GLOBAL's figures are read bar-for-bar off Figma `804:26188` (the frame's
 * y-axis tops out at 100, and each bar's height is its inset from the top).
 * The frame draws the other three cards as untouched copies of that same
 * component instance, so reproducing them literally would render four
 * identical charts and read as a bug. Instead NAR and LAR split GLOBAL, and
 * FPS_ONLY is a smaller slice — same shape, plausible relationships.
 */
const PRODUCTS_ON_HOLD: ProductsOnHoldKpi[] = [
  {
    ...base,
    region: 'GLOBAL',
    segmentScope: 'GLOBAL',
    value: 57,
    carryOver2025: 52,
    byMonth: months([
      [22, 85],
      [98, 45],
      [88, 98],
      [68, 15],
      [84, 57],
    ]),
  },
  {
    ...base,
    region: 'NAR',
    segmentScope: 'NAR',
    value: 33,
    carryOver2025: 30,
    byMonth: months([
      [13, 49],
      [57, 26],
      [51, 57],
      [39, 9],
      [48, 33],
    ]),
  },
  {
    ...base,
    region: 'LAR',
    segmentScope: 'LAR',
    value: 24,
    carryOver2025: 22,
    byMonth: months([
      [9, 36],
      [41, 19],
      [37, 41],
      [29, 6],
      [36, 24],
    ]),
  },
  {
    ...base,
    region: 'GLOBAL',
    segmentScope: 'FPS_ONLY',
    value: 21,
    carryOver2025: 18,
    byMonth: months([
      [8, 31],
      [35, 17],
      [32, 36],
      [24, 5],
      [30, 21],
    ]),
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

  const data = state === 'empty' ? [] : PRODUCTS_ON_HOLD;

  return NextResponse.json({
    data,
    meta: {
      requestId: 'mock-req-kpi-products-on-hold',
      reportingPeriod: REPORTING_PERIOD,
      region: params.get('region') ?? 'GLOBAL',
      lastUpdated: LAST_UPDATED,
    },
  });
}
