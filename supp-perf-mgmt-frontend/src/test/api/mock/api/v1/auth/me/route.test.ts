// @vitest-environment node
import { NextRequest } from 'next/server';

import { describe, expect, it } from 'vitest';

import { GET } from '@/app/api/mock/api/v1/auth/me/route';

const URL = 'http://localhost:3000/api/mock/api/v1/auth/me';

describe('GET /api/mock/api/v1/auth/me', () => {
  it('returns 401 when no session cookie is present', async () => {
    const req = new NextRequest(URL);
    const res = await GET(req);
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error.code).toBe('UNAUTHORIZED');
  });

  it('returns the mock user wrapped in an ApiResponse envelope when authenticated', async () => {
    const req = new NextRequest(URL, {
      headers: { cookie: 'session=mock-session' },
    });
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toMatchObject({
      id: expect.any(String),
      email: expect.any(String),
      displayName: expect.any(String),
    });
    expect(body.meta.requestId).toBeDefined();
  });

  it('returns firstName and lastName for use by UserAvatar', async () => {
    const req = new NextRequest(URL, {
      headers: { cookie: 'session=mock-session' },
    });
    const res = await GET(req);
    const { data } = await res.json();
    expect(data.firstName).toBeDefined();
    expect(data.lastName).toBeDefined();
  });
});
