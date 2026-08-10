// @vitest-environment node
import { NextRequest } from 'next/server';

import { describe, expect, it } from 'vitest';

import { GET } from '@/app/api/mock/api/v1/kpis/kpi-products-on-hold/route';

const URL = 'http://localhost:3000/api/mock/api/v1/kpis/kpi-products-on-hold';
const AUTHED = { headers: { cookie: 'session=mock-session' } };

function authedRequest(query = '') {
  return new NextRequest(`${URL}${query}`, AUTHED);
}

describe('GET /api/mock/api/v1/kpis/kpi-products-on-hold', () => {
  it('returns 401 when no session cookie is present', async () => {
    const res = await GET(new NextRequest(URL));
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error.code).toBe('UNAUTHORIZED');
  });

  it('returns one entry per segment scope in an ApiListResponse envelope', async () => {
    const res = await GET(authedRequest());
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(
      body.data.map((c: { segmentScope: string }) => c.segmentScope),
    ).toEqual(['GLOBAL', 'NAR', 'LAR', 'FPS_ONLY']);
    expect(body.meta.requestId).toBeDefined();
    expect(body.meta.reportingPeriod).toBe('2026-05');
  });

  it('carries a carry-over figure and monthly rows on every card', async () => {
    const res = await GET(authedRequest());
    const body = await res.json();

    for (const card of body.data) {
      expect(card.carryOver2025).toEqual(expect.any(Number));
      expect(card.byMonth.length).toBeGreaterThan(0);
      for (const row of card.byMonth) {
        expect(row).toMatchObject({
          period: expect.any(String),
          fullMonth: expect.any(Number),
          eom: expect.any(Number),
        });
      }
    }
  });

  // Read bar-for-bar off Figma 804:26188, whose y-axis tops out at 100.
  it('reproduces the GLOBAL card figures from the frame', async () => {
    const res = await GET(authedRequest());
    const body = await res.json();

    const global = body.data.find(
      (c: { segmentScope: string }) => c.segmentScope === 'GLOBAL',
    );
    expect(global.carryOver2025).toBe(52);
    expect(global.byMonth[0]).toMatchObject({
      period: '2026-01',
      fullMonth: 22,
      eom: 85,
    });
  });

  it('echoes the requested region in meta', async () => {
    const res = await GET(authedRequest('?region=NAR'));
    const body = await res.json();
    expect(body.meta.region).toBe('NAR');
  });

  it('returns data: [] with HTTP 200 for _state=empty', async () => {
    const res = await GET(authedRequest('?_state=empty'));
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.data).toEqual([]);
    expect(body.meta).toBeDefined();
  });

  it('returns 500 for _state=error', async () => {
    const res = await GET(authedRequest('?_state=error'));
    expect(res.status).toBe(500);

    const body = await res.json();
    expect(body.error.code).toBe('INTERNAL_ERROR');
  });
});
