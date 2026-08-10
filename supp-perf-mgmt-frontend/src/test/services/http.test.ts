import { beforeEach, describe, expect, it, vi } from 'vitest';

import { buildQuery, HttpError } from '@/services/http';

describe('buildQuery', () => {
  it('returns empty string for empty params', () => {
    expect(buildQuery({})).toBe('');
  });

  it('returns empty string when all values are undefined or null', () => {
    expect(buildQuery({ a: undefined, b: null })).toBe('');
  });

  it('serializes a string param', () => {
    expect(buildQuery({ region: 'NAR' })).toBe('?region=NAR');
  });

  it('serializes a numeric param', () => {
    expect(buildQuery({ year: 2026 })).toBe('?year=2026');
  });

  it('serializes a boolean param', () => {
    expect(buildQuery({ isFocusSupplier: true })).toBe('?isFocusSupplier=true');
  });

  it('serializes an array param as repeated keys', () => {
    expect(buildQuery({ plantIds: ['P1', 'P2'] })).toBe(
      '?plantIds=P1&plantIds=P2',
    );
  });

  it('omits undefined and null while keeping other values', () => {
    expect(buildQuery({ a: 'foo', b: undefined, c: null, d: 'bar' })).toBe(
      '?a=foo&d=bar',
    );
  });

  it('serializes multiple params in insertion order', () => {
    expect(buildQuery({ region: 'NAR', year: 2026, month: 3 })).toBe(
      '?region=NAR&year=2026&month=3',
    );
  });
});

describe('HttpError', () => {
  it('sets name, status, and message', () => {
    const err = new HttpError(401, 'Unauthorized');
    expect(err.name).toBe('HttpError');
    expect(err.status).toBe(401);
    expect(err.message).toBe('Unauthorized');
  });

  it('is instanceof Error', () => {
    expect(new HttpError(500, 'Server Error')).toBeInstanceOf(Error);
  });

  it('stores optional body', () => {
    const body = { error: { code: 'UNAUTHORIZED' } };
    const err = new HttpError(401, 'Unauthorized', body);
    expect(err.body).toBe(body);
  });
});

describe('dataApi request', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  it('throws HttpError on non-2xx response', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ error: { message: 'Not found' } }), {
        status: 404,
      }),
    );
    const { dataApi } = await import('@/services/http');
    await expect(dataApi.get('/kpis/summary')).rejects.toMatchObject({
      name: 'HttpError',
      status: 404,
    });
  });

  it('returns parsed JSON on success', async () => {
    const payload = { data: { kpiId: '1' }, meta: { requestId: 'r1' } };
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify(payload), { status: 200 }),
    );
    const { dataApi } = await import('@/services/http');
    await expect(dataApi.get('/kpis/summary')).resolves.toEqual(payload);
  });

  it('returns undefined for an empty body response', async () => {
    vi.mocked(fetch).mockResolvedValue(new Response('', { status: 200 }));
    const { dataApi } = await import('@/services/http');
    await expect(dataApi.post('/auth/logout', {})).resolves.toBeUndefined();
  });
});
