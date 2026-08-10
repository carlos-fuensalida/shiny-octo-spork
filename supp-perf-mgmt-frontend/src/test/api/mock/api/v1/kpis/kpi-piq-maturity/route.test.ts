// @vitest-environment node
import { NextRequest } from 'next/server';

import { describe, expect, it } from 'vitest';

import { GET } from '@/app/api/mock/api/v1/kpis/kpi-piq-maturity/route';

const URL = 'http://localhost:3000/api/mock/api/v1/kpis/kpi-piq-maturity';
const AUTHED = { headers: { cookie: 'session=mock-session' } };

function authedRequest(query = '') {
  return new NextRequest(`${URL}${query}`, AUTHED);
}

describe('GET /api/mock/api/v1/kpis/kpi-piq-maturity', () => {
  it('returns 401 when no session cookie is present', async () => {
    const res = await GET(new NextRequest(URL));
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error.code).toBe('UNAUTHORIZED');
  });

  it('returns the PIQ Maturity detail in an ApiResponse envelope', async () => {
    const res = await GET(authedRequest());
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.data.kpiId).toBe('kpi-piq-maturity');
    expect(body.data.unit).toBe('PERCENT');
    expect(body.meta.requestId).toBeDefined();
    // Drives the table's trailing "May'26" column header.
    expect(body.meta.reportingPeriod).toBe('2026-05');
  });

  it('carries the Global row values from Figma 804:26217', async () => {
    const res = await GET(authedRequest());
    const body = await res.json();

    expect(body.data).toMatchObject({
      fy2025: 88,
      plan2026: 90,
      ytd2026: 91,
      rollingR3: 91,
    });
    expect(body.data.monthly).toHaveLength(12);
  });

  it('carries NAR and LAR as breakdown rows, each with its own trend', async () => {
    const res = await GET(authedRequest());
    const body = await res.json();

    // Global is the top-level aggregate, never a byRegion entry — otherwise
    // the row would be stated twice (SPM-133).
    expect(body.data.byRegion.map((r: { region: string }) => r.region)).toEqual(
      ['NAR', 'LAR'],
    );

    for (const row of body.data.byRegion) {
      expect(row).toMatchObject({
        fy2025: expect.any(Number),
        plan2026: expect.any(Number),
        ytd2026: expect.any(Number),
        rollingR3: expect.any(Number),
      });
      expect(row.monthly).toHaveLength(12);
    }
  });

  it('states statuses explicitly, since PIQ inverts the placeholder rule', async () => {
    const res = await GET(authedRequest());
    const body = await res.json();

    // Figma 804:26198: Global green/green, NAR green/green, LAR red/red.
    // Note LAR's 82 is *under* its 85 plan — the shared placeholder
    // getPlanVarianceStatus would call that GREEN, because PPM counts lower as
    // better. PIQ is the opposite, so the payload has to own this.
    expect(body.data.ytd2026Status).toBe('GREEN');
    expect(body.data.rollingR3Status).toBe('GREEN');

    const byRegion = Object.fromEntries(
      body.data.byRegion.map((r: { region: string }) => [r.region, r]),
    );
    expect(byRegion.NAR.ytd2026Status).toBe('GREEN');
    expect(byRegion.LAR.ytd2026Status).toBe('RED');
    expect(byRegion.LAR.rollingR3Status).toBe('RED');
  });

  it('ends every monthly series below its previous point', async () => {
    const res = await GET(authedRequest());
    const body = await res.json();

    // The frame draws a red ▼ on all three rows; the arrow is derived from the
    // last two points, so the mock data has to actually fall for the render to
    // match Figma.
    const series: number[][] = [
      body.data.monthly,
      ...body.data.byRegion.map((r: { monthly: number[] }) => r.monthly),
    ];

    for (const monthly of series) {
      expect(monthly.at(-1)!).toBeLessThan(monthly.at(-2)!);
    }
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
