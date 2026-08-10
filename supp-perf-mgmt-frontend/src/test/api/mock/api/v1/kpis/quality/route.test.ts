// @vitest-environment node
import { NextRequest } from 'next/server';

import { describe, expect, it } from 'vitest';

import { GET } from '@/app/api/mock/api/v1/kpis/quality/route';

const URL = 'http://localhost:3000/api/mock/api/v1/kpis/quality';
const AUTHED = { headers: { cookie: 'session=mock-session' } };

function authedRequest(query = '') {
  return new NextRequest(`${URL}${query}`, AUTHED);
}

describe('GET /api/mock/api/v1/kpis/quality', () => {
  it('returns 401 when no session cookie is present', async () => {
    const res = await GET(new NextRequest(URL));
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error.code).toBe('UNAUTHORIZED');
  });

  it('returns the quality dataset in an ApiListResponse envelope', async () => {
    const res = await GET(authedRequest());
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.data).toHaveLength(9);
    expect(body.meta.requestId).toBeDefined();
    expect(body.meta.reportingPeriod).toBe('2026-01');
  });

  it('shapes every KPI to the KpiCard contract, all QUALITY', async () => {
    const res = await GET(authedRequest());
    const body = await res.json();

    for (const kpi of body.data) {
      expect(kpi).toMatchObject({
        kpiId: expect.any(String),
        kpiName: expect.any(String),
        category: 'QUALITY',
        reportingPeriod: expect.any(String),
      });
      expect(kpi).toHaveProperty('value');
    }
  });

  it('echoes the requested region in meta', async () => {
    const res = await GET(authedRequest('?region=NAR'));
    const body = await res.json();
    expect(body.meta.region).toBe('NAR');
  });

  it('defaults meta.region to GLOBAL when unspecified', async () => {
    const res = await GET(authedRequest());
    const body = await res.json();
    expect(body.meta.region).toBe('GLOBAL');
  });

  it('returns an empty data array with HTTP 200 for _state=empty', async () => {
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
