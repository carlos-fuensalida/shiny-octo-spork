import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import type { PiqMaturityKpi } from '@/types';

/**
 * The latest month in `monthly`, and the source of the table's trailing column
 * header ("May'26"). PIQ's `monthly` is a bare `number[]` — unlike PPM's
 * `{ period, ppm }` rows — so the label is derived from here rather than from
 * the last data point.
 */
const REPORTING_PERIOD = '2026-05';
const LAST_UPDATED = '2026-06-02T06:00:00Z';

/**
 * Mock PIQ Maturity detail. Backs the single full-width table — the Global row
 * (these top-level values) plus one row per region in `byRegion`. See
 * specs/features/SPM-128-quality-page/SPM-133-quality-piq-maturity.md.
 *
 * Values and `*Status` flags are copied cell-for-cell from Figma `804:26198`.
 * The statuses are stated explicitly because they **cannot** be derived here:
 * PIQ colours green for `>= plan2026` (Global 91 vs 90 → green), the opposite
 * direction from PPM, so the shared `getPlanVarianceStatus` placeholder would
 * paint LAR's 82-vs-85 green instead of red. Backend A must own this.
 *
 * Each `monthly` series ends below its previous point, so the computed
 * month-over-month arrow comes out red ▼ on all three rows, as the frame draws
 * them.
 */
const PIQ_MATURITY_DETAIL: PiqMaturityKpi = {
  kpiId: 'kpi-piq-maturity',
  kpiName: 'PIQ Maturity',
  category: 'QUALITY',
  region: 'GLOBAL',
  value: 91,
  unit: 'PERCENT',
  status: null,
  trendDirection: null,
  reportingPeriod: REPORTING_PERIOD,
  lastUpdated: LAST_UPDATED,
  fy2025: 88,
  plan2026: 90,
  ytd2026: 91,
  ytd2026Status: 'GREEN',
  rollingR3: 91,
  rollingR3Status: 'GREEN',
  monthly: [82, 83, 85, 84, 86, 87, 86, 88, 89, 88, 91, 90],
  byRegion: [
    {
      region: 'NAR',
      fy2025: 86,
      plan2026: 89,
      ytd2026: 90,
      ytd2026Status: 'GREEN',
      rollingR3: 90,
      rollingR3Status: 'GREEN',
      monthly: [81, 82, 84, 83, 85, 86, 85, 87, 88, 87, 90, 89],
    },
    {
      region: 'LAR',
      fy2025: 84,
      plan2026: 85,
      ytd2026: 82,
      ytd2026Status: 'RED',
      rollingR3: 81,
      rollingR3Status: 'RED',
      monthly: [78, 80, 83, 85, 86, 88, 87, 85, 80, 78, 83, 81],
    },
  ],
};

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

  if (state === 'empty') {
    return NextResponse.json({
      data: null,
      meta: {
        requestId: 'mock-req-kpi-piq-maturity',
        reportingPeriod: REPORTING_PERIOD,
        region: params.get('region') ?? 'GLOBAL',
        lastUpdated: LAST_UPDATED,
      },
    });
  }

  return NextResponse.json({
    data: PIQ_MATURITY_DETAIL,
    meta: {
      requestId: 'mock-req-kpi-piq-maturity',
      reportingPeriod: REPORTING_PERIOD,
      region: params.get('region') ?? 'GLOBAL',
      lastUpdated: LAST_UPDATED,
    },
  });
}
