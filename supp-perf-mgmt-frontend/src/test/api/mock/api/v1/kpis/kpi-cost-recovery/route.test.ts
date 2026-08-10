// @vitest-environment node
import { NextRequest } from 'next/server';

import { describe, expect, it } from 'vitest';

import { GET } from '@/app/api/mock/api/v1/kpis/kpi-cost-recovery/route';

const URL = 'http://localhost:3000/api/mock/api/v1/kpis/kpi-cost-recovery';
const AUTHED = { headers: { cookie: 'session=mock-session' } };

function authedRequest(query = '') {
  return new NextRequest(`${URL}${query}`, AUTHED);
}

describe('GET /api/mock/api/v1/kpis/kpi-cost-recovery', () => {
  it('returns 401 when no session cookie is present', async () => {
    const res = await GET(new NextRequest(URL));
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error.code).toBe('UNAUTHORIZED');
  });

  it('returns the Cost Recovery detail in an ApiResponse envelope', async () => {
    const res = await GET(authedRequest());
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.data.kpiId).toBe('kpi-cost-recovery');
    expect(body.data.unit).toBe('USD');
    expect(body.meta.requestId).toBeDefined();
    expect(body.meta.reportingPeriod).toBe('2026-05');
  });

  it('carries the three card figures from Figma 1365:14366', async () => {
    const res = await GET(authedRequest());
    const body = await res.json();

    expect(body.data).toMatchObject({
      globalConversion: 24,
      totalRecovered: 15_000,
      ongoing: 24_000_000,
    });
  });

  it('sends raw amounts, not pre-formatted strings', async () => {
    const res = await GET(authedRequest());
    const body = await res.json();

    // The section renders "US$15K"/"US$24M" itself. If the transport ever
    // switches to a composed string or a {value, magnitude} pair, this is the
    // assertion that should fail first (OQ-Q-1).
    expect(typeof body.data.totalRecovered).toBe('number');
    expect(typeof body.data.ongoing).toBe('number');
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
