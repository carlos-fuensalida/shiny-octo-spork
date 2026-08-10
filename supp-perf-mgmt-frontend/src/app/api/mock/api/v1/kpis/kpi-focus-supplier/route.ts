import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import type { FocusSupplierKpi } from '@/types';

const REPORTING_PERIOD = '2026-05';
const LAST_UPDATED = '2026-06-02T06:00:00Z';

/**
 * Mock Focus Supplier detail — the three highlight cards in Figma `1365:14287`.
 * Counts are copied from the frame; `value` is the global figure, which the
 * frame shows as the Global card.
 * See specs/features/SPM-128-quality-page/SPM-135-quality-cost-focus.md.
 */
const FOCUS_SUPPLIER: FocusSupplierKpi = {
  kpiId: 'kpi-focus-supplier',
  kpiName: 'Focus Supplier',
  category: 'QUALITY',
  region: 'GLOBAL',
  value: 24,
  unit: 'COUNT',
  status: null,
  trendDirection: null,
  reportingPeriod: REPORTING_PERIOD,
  lastUpdated: LAST_UPDATED,
  countGlobal: 24,
  countNar: 15,
  countLar: 9,
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

  // Single-object endpoint, so "no data" is `null` with HTTP 200 — the
  // equivalent of `data: []` on the list endpoints, never an error (§14).
  const data = state === 'empty' ? null : FOCUS_SUPPLIER;

  return NextResponse.json({
    data,
    meta: {
      requestId: 'mock-req-kpi-focus-supplier',
      reportingPeriod: REPORTING_PERIOD,
      region: params.get('region') ?? 'GLOBAL',
      lastUpdated: LAST_UPDATED,
    },
  });
}
