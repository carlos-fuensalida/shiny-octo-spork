// @vitest-environment node
import { NextRequest } from 'next/server';

import { describe, expect, it } from 'vitest';

import { GET } from '@/app/api/mock/api/v1/kpis/summary/route';

const URL = 'http://localhost:3000/api/mock/api/v1/kpis/summary';
const AUTHED = { headers: { cookie: 'session=mock-session' } };

function authedRequest(query = '') {
  return new NextRequest(`${URL}${query}`, AUTHED);
}

describe('GET /api/mock/api/v1/kpis/summary', () => {
  it('returns 401 when no session cookie is present', async () => {
    const res = await GET(new NextRequest(URL));
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error.code).toBe('UNAUTHORIZED');
  });

  it('returns the full quality and delivery dataset in an ApiListResponse envelope', async () => {
    const res = await GET(authedRequest());
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.data).toHaveLength(14);
    expect(
      body.data.filter((k: { category: string }) => k.category === 'QUALITY'),
    ).toHaveLength(9);
    expect(
      body.data.filter((k: { category: string }) => k.category === 'DELIVERY'),
    ).toHaveLength(5);
    expect(body.meta.requestId).toBeDefined();
    expect(body.meta.reportingPeriod).toBe('2026-01');
  });

  it('shapes every KPI to the SummaryKpiCard contract', async () => {
    const res = await GET(authedRequest());
    const body = await res.json();

    for (const kpi of body.data) {
      expect(kpi).toMatchObject({
        kpiId: expect.any(String),
        kpiName: expect.any(String),
        category: expect.stringMatching(/^(QUALITY|DELIVERY)$/),
        reportingPeriod: expect.any(String),
      });
      expect(Array.isArray(kpi.metrics)).toBe(true);
      expect(kpi.metrics.length).toBeGreaterThan(0);
      for (const metric of kpi.metrics) {
        expect(metric.label).toEqual(expect.any(String));
        expect(metric).toHaveProperty('value');
      }
    }
  });

  it('drops delivery KPIs that have no metric for the requested region', async () => {
    const res = await GET(authedRequest('?region=LAR'));
    const body = await res.json();

    const vmi = body.data.find(
      (k: { kpiId: string }) => k.kpiId === 'kpi-vmi-compliance',
    );
    expect(vmi.metrics).toEqual([]);

    const otif = body.data.find(
      (k: { kpiId: string }) => k.kpiId === 'kpi-otif',
    );
    expect(otif.metrics).toEqual([
      { label: 'LAR', value: 93.5, unit: 'PERCENT' },
    ]);
  });

  it('narrows regional tiles to the requested region', async () => {
    const res = await GET(authedRequest('?region=NAR'));
    const body = await res.json();

    const ppm = body.data.find(
      (k: { kpiId: string }) => k.kpiId === 'kpi-rejection-ppm',
    );
    expect(ppm.metrics).toEqual([{ label: 'NAR', value: 620 }]);
  });

  it('leaves non-regional tiles untouched when a region is requested', async () => {
    const res = await GET(authedRequest('?region=LAR'));
    const body = await res.json();

    const eightDs = body.data.find(
      (k: { kpiId: string }) => k.kpiId === 'kpi-8d-capa',
    );
    expect(eightDs.metrics).toHaveLength(3);
    expect(eightDs.metrics[0].label).toBe('Total Open 2026');
  });

  it('returns the full dataset for region=GLOBAL', async () => {
    const res = await GET(authedRequest('?region=GLOBAL'));
    const body = await res.json();

    const ppm = body.data.find(
      (k: { kpiId: string }) => k.kpiId === 'kpi-rejection-ppm',
    );
    expect(ppm.metrics).toHaveLength(3);
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
