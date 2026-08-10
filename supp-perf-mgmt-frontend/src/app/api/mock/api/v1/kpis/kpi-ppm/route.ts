import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import type { PpmKpiDetail } from '@/types';

const REPORTING_PERIOD = '2026-01';
const LAST_UPDATED = '2026-02-02T06:00:00Z';

/**
 * Mock Incoming Material PPM detail. Backs the wide table (aggregate row +
 * byCommodity breakdown, both carrying their own FY/Plan/YTD/Rolling/monthly
 * trend) and the narrow Top Offenders list. See
 * specs/features/SPM-128-quality-page/SPM-130-quality-ppm-cal.md.
 *
 * Values and `*Status` flags are copied cell-for-cell from Figma `804:26162`.
 * These happen to agree with the placeholder threshold rule, but they're stated
 * explicitly anyway so the rendering never depends on it (see the CAL mock,
 * where the design's colours can't be derived at all).
 */
const PPM_DETAIL: PpmKpiDetail = {
  kpiId: 'kpi-rejection-ppm',
  kpiName: 'Incoming Material PPM',
  category: 'QUALITY',
  region: 'GLOBAL',
  value: 210,
  unit: 'PPM',
  status: null,
  trendDirection: null,
  reportingPeriod: REPORTING_PERIOD,
  lastUpdated: LAST_UPDATED,
  totalRejections: 1_240,
  totalUnitsInspected: 1_460_000,
  fy2025: 105,
  plan2026: 90,
  ytd2026: 146,
  ytd2026Status: 'RED',
  rollingR3: 201,
  rollingR3Status: 'RED',
  monthly: [
    { period: '2025-06', ppm: 180, rejections: 210 },
    { period: '2025-07', ppm: 165, rejections: 195 },
    { period: '2025-08', ppm: 190, rejections: 225 },
    { period: '2025-09', ppm: 175, rejections: 205 },
    { period: '2025-10', ppm: 200, rejections: 235 },
    { period: '2025-11', ppm: 185, rejections: 215 },
    { period: '2025-12', ppm: 210, rejections: 245 },
    { period: '2026-01', ppm: 195, rejections: 228 },
    { period: '2026-02', ppm: 220, rejections: 255 },
    { period: '2026-03', ppm: 205, rejections: 240 },
    { period: '2026-04', ppm: 195, rejections: 230 },
    { period: '2026-05', ppm: 210, rejections: 245 },
  ],
  byPlant: [],
  byCommodity: [
    {
      dimension: 'Components',
      ppm: 191,
      rejections: 225,
      totalUnits: 1_178_000,
      fy2025: 225,
      plan2026: 191,
      ytd2026: 113,
      ytd2026Status: 'GREEN',
      rollingR3: 118,
      rollingR3Status: 'GREEN',
      monthly: [
        { period: '2025-06', ppm: 130, rejections: 150 },
        { period: '2025-07', ppm: 120, rejections: 140 },
        { period: '2025-08', ppm: 135, rejections: 158 },
        { period: '2025-09', ppm: 125, rejections: 146 },
        { period: '2025-10', ppm: 128, rejections: 150 },
        { period: '2025-11', ppm: 118, rejections: 138 },
        { period: '2025-12', ppm: 122, rejections: 143 },
        { period: '2026-01', ppm: 112, rejections: 132 },
        { period: '2026-02', ppm: 119, rejections: 140 },
        { period: '2026-03', ppm: 110, rejections: 129 },
        { period: '2026-04', ppm: 108, rejections: 127 },
        { period: '2026-05', ppm: 115, rejections: 135 },
      ],
    },
    {
      dimension: 'Raw Materials',
      ppm: 97,
      rejections: 110,
      totalUnits: 149_000,
      fy2025: 110,
      plan2026: 97,
      ytd2026: 191,
      ytd2026Status: 'RED',
      rollingR3: 276,
      rollingR3Status: 'RED',
      monthly: [
        { period: '2025-06', ppm: 160, rejections: 185 },
        { period: '2025-07', ppm: 175, rejections: 200 },
        { period: '2025-08', ppm: 165, rejections: 190 },
        { period: '2025-09', ppm: 180, rejections: 208 },
        { period: '2025-10', ppm: 170, rejections: 196 },
        { period: '2025-11', ppm: 185, rejections: 214 },
        { period: '2025-12', ppm: 178, rejections: 205 },
        { period: '2026-01', ppm: 190, rejections: 220 },
        { period: '2026-02', ppm: 182, rejections: 211 },
        { period: '2026-03', ppm: 195, rejections: 226 },
        { period: '2026-04', ppm: 150, rejections: 174 },
        { period: '2026-05', ppm: 135, rejections: 156 },
      ],
    },
    {
      dimension: 'Bulk',
      ppm: 62,
      rejections: 74,
      totalUnits: 134_000,
      fy2025: 74,
      plan2026: 62,
      ytd2026: 105,
      ytd2026Status: 'RED',
      rollingR3: 141,
      rollingR3Status: 'RED',
      monthly: [
        { period: '2025-06', ppm: 250, rejections: 290 },
        { period: '2025-07', ppm: 260, rejections: 300 },
        { period: '2025-08', ppm: 255, rejections: 295 },
        { period: '2025-09', ppm: 270, rejections: 310 },
        { period: '2025-10', ppm: 265, rejections: 305 },
        { period: '2025-11', ppm: 280, rejections: 320 },
        { period: '2025-12', ppm: 275, rejections: 315 },
        { period: '2026-01', ppm: 290, rejections: 330 },
        { period: '2026-02', ppm: 285, rejections: 325 },
        { period: '2026-03', ppm: 295, rejections: 335 },
        { period: '2026-04', ppm: 300, rejections: 340 },
        { period: '2026-05', ppm: 330, rejections: 372 },
      ],
    },
  ],
  byRegion: [],
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
        requestId: 'mock-req-kpi-ppm',
        reportingPeriod: REPORTING_PERIOD,
        region: params.get('region') ?? 'GLOBAL',
        lastUpdated: LAST_UPDATED,
      },
    });
  }

  return NextResponse.json({
    data: PPM_DETAIL,
    meta: {
      requestId: 'mock-req-kpi-ppm',
      reportingPeriod: REPORTING_PERIOD,
      region: params.get('region') ?? 'GLOBAL',
      lastUpdated: LAST_UPDATED,
    },
  });
}
