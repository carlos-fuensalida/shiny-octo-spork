// @vitest-environment node
import { NextRequest } from 'next/server';

import { describe, expect, it } from 'vitest';

import { GET } from '@/app/api/mock/api/v1/kpis/top-offenders/route';

const URL = 'http://localhost:3000/api/mock/api/v1/kpis/top-offenders';
const AUTHED = { headers: { cookie: 'session=mock-session' } };

function authedRequest(query = '') {
  return new NextRequest(`${URL}${query}`, AUTHED);
}

describe('GET /api/mock/api/v1/kpis/top-offenders', () => {
  it('returns 401 when no session cookie is present', async () => {
    const res = await GET(new NextRequest(URL));
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error.code).toBe('UNAUTHORIZED');
  });

  it('returns five charts in an ApiListResponse envelope', async () => {
    const res = await GET(authedRequest());
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.data).toHaveLength(5);
    expect(body.meta.requestId).toBeDefined();
    expect(body.meta.reportingPeriod).toBe('2026-01');
  });

  it('shapes every chart to the TopOffenderChart contract', async () => {
    const res = await GET(authedRequest());
    const body = await res.json();

    for (const chart of body.data) {
      expect(chart).toMatchObject({
        metricId: expect.any(String),
        metricName: expect.any(String),
        unit: expect.any(String),
      });
      expect(chart.offenders).toHaveLength(5);
      for (const offender of chart.offenders) {
        expect(offender).toMatchObject({
          supplierId: expect.any(String),
          supplierName: expect.any(String),
          value: expect.any(Number),
        });
      }
    }
  });

  it('pre-ranks each chart descending by value (worst first)', async () => {
    const res = await GET(authedRequest());
    const body = await res.json();

    for (const chart of body.data) {
      const values = chart.offenders.map(
        (o: { value: number }) => o.value,
      ) as number[];
      const sorted = [...values].sort((a, b) => b - a);
      expect(values).toEqual(sorted);
    }
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
