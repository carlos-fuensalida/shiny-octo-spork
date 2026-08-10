// @vitest-environment node
import { NextRequest } from 'next/server';

import { describe, expect, it } from 'vitest';

import { GET } from '@/app/api/mock/api/v1/kpis/kpi-cal/route';

const URL = 'http://localhost:3000/api/mock/api/v1/kpis/kpi-cal';
const AUTHED = { headers: { cookie: 'session=mock-session' } };

function authedRequest(query = '') {
  return new NextRequest(`${URL}${query}`, AUTHED);
}

describe('GET /api/mock/api/v1/kpis/kpi-cal', () => {
  it('returns 401 when no session cookie is present', async () => {
    const res = await GET(new NextRequest(URL));
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error.code).toBe('UNAUTHORIZED');
  });

  it('returns the CAL detail in an ApiResponse envelope', async () => {
    const res = await GET(authedRequest());
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.data.kpiId).toBe('kpi-cal-ppm');
    expect(body.meta.requestId).toBeDefined();
    expect(body.meta.reportingPeriod).toBe('2026-01');
  });

  it('carries the aggregate row fields and a 12-point monthly trend', async () => {
    const res = await GET(authedRequest());
    const body = await res.json();

    expect(body.data).toMatchObject({
      fy2025: expect.any(Number),
      plan2026: expect.any(Number),
      ytd2026: expect.any(Number),
      rollingR3: expect.any(Number),
    });
    expect(body.data.monthly).toHaveLength(12);
  });

  it('carries breakdown rows by region, each with their own trend', async () => {
    const res = await GET(authedRequest());
    const body = await res.json();

    expect(body.data.byRegion.length).toBeGreaterThan(0);
    for (const row of body.data.byRegion) {
      expect(row).toMatchObject({
        dimension: expect.any(String),
        fy2025: expect.any(Number),
        plan2026: expect.any(Number),
        ytd2026: expect.any(Number),
        rollingR3: expect.any(Number),
      });
      expect(row.monthly).toHaveLength(12);
    }
  });

  it('carries the cell statuses that reproduce the Figma highlights', async () => {
    const res = await GET(authedRequest());
    const body = await res.json();

    // Figma 804:26172: Whirlpool green/green, NAR amber/green, LAR green/green.
    // NAR's amber is the case no value-vs-plan rule can derive (234 against a
    // 901 plan is 74% under), so it must travel as data.
    expect(body.data.ytd2026Status).toBe('GREEN');
    expect(body.data.rollingR3Status).toBe('GREEN');

    const byDimension = Object.fromEntries(
      body.data.byRegion.map((r: { dimension: string }) => [r.dimension, r]),
    );
    expect(byDimension.NAR.ytd2026Status).toBe('YELLOW');
    expect(byDimension.NAR.rollingR3Status).toBe('GREEN');
    expect(byDimension.LAR.ytd2026Status).toBe('GREEN');
    expect(byDimension.LAR.rollingR3Status).toBe('GREEN');
  });

  it('carries the narrow card offenders list', async () => {
    const res = await GET(authedRequest());
    const body = await res.json();

    expect(body.data.offenders.length).toBeGreaterThan(0);
    expect(body.data.offenders[0]).toMatchObject({
      supplierId: expect.any(String),
      supplierName: expect.any(String),
      value: expect.any(Number),
    });
  });

  it('echoes the requested region in meta', async () => {
    const res = await GET(authedRequest('?region=NAR'));
    const body = await res.json();
    expect(body.meta.region).toBe('NAR');
  });

  it('returns data: null with HTTP 200 for _state=empty', async () => {
    const res = await GET(authedRequest('?_state=empty'));
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.data).toBeNull();
    expect(body.meta).toBeDefined();
  });

  it('returns 500 for _state=error', async () => {
    const res = await GET(authedRequest('?_state=error'));
    expect(res.status).toBe(500);

    const body = await res.json();
    expect(body.error.code).toBe('INTERNAL_ERROR');
  });
});
