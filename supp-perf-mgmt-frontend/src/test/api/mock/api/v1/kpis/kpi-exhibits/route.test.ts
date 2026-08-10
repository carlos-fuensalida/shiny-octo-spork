// @vitest-environment node
import { NextRequest } from 'next/server';

import { describe, expect, it } from 'vitest';

import { GET } from '@/app/api/mock/api/v1/kpis/kpi-exhibits/route';

const URL = 'http://localhost:3000/api/mock/api/v1/kpis/kpi-exhibits';
const AUTHED = { headers: { cookie: 'session=mock-session' } };

function authedRequest(query = '') {
  return new NextRequest(`${URL}${query}`, AUTHED);
}

describe('GET /api/mock/api/v1/kpis/kpi-exhibits', () => {
  it('returns 401 when no session cookie is present', async () => {
    const res = await GET(new NextRequest(URL));
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error.code).toBe('UNAUTHORIZED');
  });

  it('returns one entry per region in an ApiListResponse envelope', async () => {
    const res = await GET(authedRequest());
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.data.map((c: { region: string }) => c.region)).toEqual([
      'GLOBAL',
      'NAR',
      'LAR',
    ]);
    expect(body.meta.requestId).toBeDefined();
    expect(body.meta.reportingPeriod).toBe('2026-05');
  });

  it('carries the five status counts on every card', async () => {
    const res = await GET(authedRequest());
    const body = await res.json();

    for (const card of body.data) {
      expect(card).toMatchObject({
        completed: expect.any(Number),
        ongoing: expect.any(Number),
        delayed: expect.any(Number),
        disposition: expect.any(Number),
        notStarted: expect.any(Number),
      });
    }
  });

  // Copied from Figma 804:26272–804:26274.
  it('reproduces the frame counts, whose totals equal the sum of the statuses', async () => {
    const res = await GET(authedRequest());
    const body = await res.json();

    const byRegion = Object.fromEntries(
      body.data.map((c: { region: string }) => [c.region, c]),
    );
    expect(byRegion.GLOBAL).toMatchObject({
      completed: 11,
      ongoing: 18,
      delayed: 8,
      disposition: 3,
      notStarted: 14,
    });

    for (const card of body.data) {
      const sum =
        card.completed +
        card.ongoing +
        card.delayed +
        card.disposition +
        card.notStarted;
      expect(sum).toBe(card.value);
    }
  });

  it('echoes the requested region in meta', async () => {
    const res = await GET(authedRequest('?region=LAR'));
    const body = await res.json();
    expect(body.meta.region).toBe('LAR');
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
