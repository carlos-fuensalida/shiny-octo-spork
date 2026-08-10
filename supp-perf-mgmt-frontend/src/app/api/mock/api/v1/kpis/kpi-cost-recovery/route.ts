import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import type { CostRecoveryKpi } from '@/types';

const REPORTING_PERIOD = '2026-05';
const LAST_UPDATED = '2026-06-02T06:00:00Z';

/**
 * Mock Cost Recovery detail — the three highlight cards in Figma `1365:14366`.
 * Amounts are raw USD; the section formats them (`15_000` → `US$15K`). `value`
 * carries the section's headline figure, the total recovered.
 * See specs/features/SPM-128-quality-page/SPM-135-quality-cost-focus.md.
 */
const COST_RECOVERY: CostRecoveryKpi = {
  kpiId: 'kpi-cost-recovery',
  kpiName: 'Cost Recovery',
  category: 'QUALITY',
  region: 'GLOBAL',
  value: 15_000,
  unit: 'USD',
  status: null,
  trendDirection: null,
  reportingPeriod: REPORTING_PERIOD,
  lastUpdated: LAST_UPDATED,
  globalConversion: 24,
  totalRecovered: 15_000,
  ongoing: 24_000_000,
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
  const data = state === 'empty' ? null : COST_RECOVERY;

  return NextResponse.json({
    data,
    meta: {
      requestId: 'mock-req-kpi-cost-recovery',
      reportingPeriod: REPORTING_PERIOD,
      region: params.get('region') ?? 'GLOBAL',
      lastUpdated: LAST_UPDATED,
    },
  });
}
