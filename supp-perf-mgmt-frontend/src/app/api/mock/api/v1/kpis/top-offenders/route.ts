import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import type { TopOffenderChart } from '@/types';

const REPORTING_PERIOD = '2026-01';
const LAST_UPDATED = '2026-02-02T06:00:00Z';

/**
 * Mock Top Offenders dataset — five charts, each the five worst-performing
 * suppliers for one delivery/quality metric, pre-ranked descending (highest
 * value = worst offender, first). The ranking rule is a stand-in for the
 * unresolved OQ-MAP-7 business decision; the real GET /kpis/top-offenders
 * contract is still owed by Backend A. See
 * specs/features/SPM-126-top-offenders.md.
 */
/**
 * Suppliers are shown with generic "Offender N" labels (matching the Figma
 * design) rather than real names — the real endpoint will supply actual
 * supplier names. Each chart is pre-ranked descending, so Offender 1 is always
 * the worst.
 */
function offenders(
  values: [number, number, number, number, number],
): TopOffenderChart['offenders'] {
  return values.map((value, i) => ({
    supplierId: `off-${i + 1}`,
    supplierName: `Offender ${i + 1}`,
    value,
  }));
}

const TOP_OFFENDERS: TopOffenderChart[] = [
  {
    metricId: 'expedites',
    metricName: 'Expedites — ($ Value)',
    unit: 'USD',
    offenders: offenders([1_240_000, 980_000, 760_000, 540_000, 310_000]),
  },
  {
    metricId: 'production-lost',
    metricName: 'Production Lost — Units Lost',
    unit: 'COUNT',
    offenders: offenders([8_400, 6_150, 5_020, 3_780, 2_490]),
  },
  {
    metricId: 'dtc',
    metricName: 'DTC — Units Lost',
    unit: 'COUNT',
    offenders: offenders([7_300, 5_640, 4_210, 3_120, 1_950]),
  },
  {
    metricId: 'vmi',
    metricName: 'VMI — % Non-Compliant',
    unit: 'PERCENT',
    offenders: offenders([42, 35, 28, 19, 12]),
  },
  {
    metricId: 'otif',
    metricName: 'OTIF — % of Delivery',
    unit: 'PERCENT',
    offenders: offenders([46, 38, 29, 21, 14]),
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

  const data = state === 'empty' ? [] : TOP_OFFENDERS;

  return NextResponse.json({
    data,
    meta: {
      requestId: 'mock-req-top-offenders',
      reportingPeriod: REPORTING_PERIOD,
      region: params.get('region') ?? 'GLOBAL',
      lastUpdated: LAST_UPDATED,
    },
  });
}
