import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import type { CalKpiDetail } from '@/types';

const REPORTING_PERIOD = '2026-01';
const LAST_UPDATED = '2026-02-02T06:00:00Z';

/**
 * Mock CAL A/AA – PPM detail. Backs the wide table (aggregate row + byRegion
 * breakdown, both carrying their own FY/Plan/YTD/Rolling/monthly trend) and
 * the narrow Top Offenders list. See
 * specs/features/SPM-128-quality-page/SPM-130-quality-ppm-cal.md.
 *
 * Figures *and* `*Status` flags are copied cell-for-cell from Figma
 * `804:26172`, so the page reproduces the frame exactly. The statuses have to
 * travel as data: the design's numbers can't yield its colours under any
 * threshold rule (NAR is 74% *under* plan yet amber, LAR is 33% *over* plan yet
 * green), and RAG status is a business judgement Backend A owns — the same one
 * `KpiCard.status` already carries.
 */
const CAL_DETAIL: CalKpiDetail = {
  kpiId: 'kpi-cal-ppm',
  kpiName: 'CAL A/AA – PPM',
  category: 'QUALITY',
  region: 'GLOBAL',
  value: 345,
  unit: 'PPM',
  status: null,
  trendDirection: null,
  reportingPeriod: REPORTING_PERIOD,
  lastUpdated: LAST_UPDATED,
  fy2025: 123,
  plan2026: 789,
  ytd2026: 12,
  ytd2026Status: 'GREEN',
  rollingR3: 456,
  rollingR3Status: 'GREEN',
  monthly: [
    { period: '2025-06', calCount: 260 },
    { period: '2025-07', calCount: 245 },
    { period: '2025-08', calCount: 270 },
    { period: '2025-09', calCount: 255 },
    { period: '2025-10', calCount: 280 },
    { period: '2025-11', calCount: 265 },
    { period: '2025-12', calCount: 290 },
    { period: '2026-01', calCount: 275 },
    { period: '2026-02', calCount: 300 },
    { period: '2026-03', calCount: 285 },
    { period: '2026-04', calCount: 310 },
    { period: '2026-05', calCount: 345 },
  ],
  byRegion: [
    {
      dimension: 'NAR',
      calCount: 901,
      statusCounts: {},
      fy2025: 678,
      plan2026: 901,
      ytd2026: 234,
      ytd2026Status: 'YELLOW',
      rollingR3: 118,
      rollingR3Status: 'GREEN',
      monthly: [
        { period: '2025-06', calCount: 820 },
        { period: '2025-07', calCount: 835 },
        { period: '2025-08', calCount: 810 },
        { period: '2025-09', calCount: 845 },
        { period: '2025-10', calCount: 825 },
        { period: '2025-11', calCount: 850 },
        { period: '2025-12', calCount: 830 },
        { period: '2026-01', calCount: 860 },
        { period: '2026-02', calCount: 840 },
        { period: '2026-03', calCount: 865 },
        { period: '2026-04', calCount: 870 },
        { period: '2026-05', calCount: 890 },
      ],
    },
    {
      dimension: 'LAR',
      calCount: 678,
      statusCounts: {},
      fy2025: 345,
      plan2026: 678,
      ytd2026: 901,
      ytd2026Status: 'GREEN',
      rollingR3: 276,
      rollingR3Status: 'GREEN',
      monthly: [
        { period: '2025-06', calCount: 500 },
        { period: '2025-07', calCount: 520 },
        { period: '2025-08', calCount: 495 },
        { period: '2025-09', calCount: 510 },
        { period: '2025-10', calCount: 480 },
        { period: '2025-11', calCount: 505 },
        { period: '2025-12', calCount: 490 },
        { period: '2026-01', calCount: 470 },
        { period: '2026-02', calCount: 485 },
        { period: '2026-03', calCount: 460 },
        { period: '2026-04', calCount: 490 },
        { period: '2026-05', calCount: 456 },
      ],
    },
  ],
  byPlant: [],
  byCommodity: [],
  offenders: [
    {
      supplierId: 'sup-rwb-forge',
      supplierName: 'RWB Forge',
      value: 1_250,
      caption: 'EMEA · top offender',
    },
    {
      supplierId: 'sup-acros-ltd',
      supplierName: 'Acros LTD',
      value: 980,
      caption: 'NAR',
    },
    {
      supplierId: 'sup-robert-forge',
      supplierName: 'Robert Forge',
      value: 820,
      caption: 'NAR · improving',
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
        requestId: 'mock-req-kpi-cal',
        reportingPeriod: REPORTING_PERIOD,
        region: params.get('region') ?? 'GLOBAL',
        lastUpdated: LAST_UPDATED,
      },
    });
  }

  return NextResponse.json({
    data: CAL_DETAIL,
    meta: {
      requestId: 'mock-req-kpi-cal',
      reportingPeriod: REPORTING_PERIOD,
      region: params.get('region') ?? 'GLOBAL',
      lastUpdated: LAST_UPDATED,
    },
  });
}
