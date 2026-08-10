import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import type { QualityExhibitsKpi } from '@/types';

const REPORTING_PERIOD = '2026-05';
const LAST_UPDATED = '2026-06-02T06:00:00Z';

const base = {
  kpiId: 'kpi-exhibits',
  kpiName: 'Quality Exhibits',
  category: 'QUALITY',
  unit: 'COUNT',
  status: null,
  trendDirection: null,
  reportingPeriod: REPORTING_PERIOD,
  lastUpdated: LAST_UPDATED,
} as const;

/**
 * Mock Quality Exhibits detail — one entry per region, each backing one donut
 * card. Counts are copied from Figma `804:26272`–`804:26274`; `value` is the
 * card's total, which in the frame is exactly the sum of the five statuses
 * (the donut re-derives it rather than reading this field, so the center
 * figure can't drift from the arcs). See
 * specs/features/SPM-128-quality-page/SPM-132-quality-cards-poh-exhibits.md.
 */
const EXHIBITS: QualityExhibitsKpi[] = [
  {
    ...base,
    region: 'GLOBAL',
    value: 54,
    completed: 11,
    ongoing: 18,
    delayed: 8,
    disposition: 3,
    notStarted: 14,
  },
  {
    ...base,
    region: 'NAR',
    value: 36,
    completed: 8,
    ongoing: 9,
    delayed: 7,
    disposition: 0,
    notStarted: 12,
  },
  {
    ...base,
    region: 'LAR',
    value: 18,
    completed: 3,
    ongoing: 9,
    delayed: 1,
    disposition: 3,
    notStarted: 2,
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

  const data = state === 'empty' ? [] : EXHIBITS;

  return NextResponse.json({
    data,
    meta: {
      requestId: 'mock-req-kpi-exhibits',
      reportingPeriod: REPORTING_PERIOD,
      region: params.get('region') ?? 'GLOBAL',
      lastUpdated: LAST_UPDATED,
    },
  });
}
