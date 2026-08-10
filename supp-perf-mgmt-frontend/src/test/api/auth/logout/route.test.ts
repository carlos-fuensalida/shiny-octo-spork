// @vitest-environment node
import { NextRequest } from 'next/server';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { GET } from '@/app/api/auth/logout/route';

describe('GET /api/auth/logout', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => vi.unstubAllGlobals());

  it('calls POST /api/v1/auth/logout on the backend with forwarded cookies', async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(null, { status: 204 }));
    const req = new NextRequest('http://localhost:3000/api/auth/logout', {
      headers: { cookie: 'access_token=abc; refresh_token=xyz' },
    });
    await GET(req);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/auth/logout'),
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          cookie: 'access_token=abc; refresh_token=xyz',
        }),
      }),
    );
  });

  it('redirects to the frontend root after logout', async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(null, { status: 204 }));
    const req = new NextRequest('http://localhost:3000/api/auth/logout');
    const res = await GET(req);
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toBe('http://localhost:3000/');
  });

  it('forwards Set-Cookie clear headers from the backend to the browser', async () => {
    const headers = new Headers();
    headers.append('set-cookie', 'access_token=; Max-Age=0; Path=/; HttpOnly');
    headers.append('set-cookie', 'refresh_token=; Max-Age=0; Path=/; HttpOnly');
    vi.mocked(fetch).mockResolvedValue(
      new Response(null, { status: 204, headers }),
    );
    const req = new NextRequest('http://localhost:3000/api/auth/logout');
    const res = await GET(req);
    const setCookie = res.headers.getSetCookie();
    expect(setCookie.some((c) => c.startsWith('access_token='))).toBe(true);
    expect(setCookie.some((c) => c.startsWith('refresh_token='))).toBe(true);
  });

  it('still redirects to root when the backend is unreachable', async () => {
    vi.mocked(fetch).mockRejectedValue(new Error('ECONNREFUSED'));
    const req = new NextRequest('http://localhost:3000/api/auth/logout');
    const res = await GET(req);
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toBe('http://localhost:3000/');
  });
});
