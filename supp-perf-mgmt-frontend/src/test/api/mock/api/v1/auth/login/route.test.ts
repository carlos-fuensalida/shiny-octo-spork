// @vitest-environment node
import { NextRequest } from 'next/server';

import { describe, expect, it } from 'vitest';

import { GET } from '@/app/api/mock/api/v1/auth/login/route';

const BASE = 'http://localhost:3000';

describe('GET /api/mock/api/v1/auth/login', () => {
  it('redirects to the app root', async () => {
    const req = new NextRequest(`${BASE}/api/mock/api/v1/auth/login`);
    const res = await GET(req);
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toBe(`${BASE}/`);
  });

  it('sets an httpOnly session cookie', async () => {
    const req = new NextRequest(`${BASE}/api/mock/api/v1/auth/login`);
    const res = await GET(req);
    const setCookie = res.headers.get('set-cookie') ?? '';
    expect(setCookie).toContain('session=mock-session');
    expect(setCookie.toLowerCase()).toContain('httponly');
  });
});
