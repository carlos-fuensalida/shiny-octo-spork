// @vitest-environment node
import { describe, expect, it } from 'vitest';

import { POST } from '@/app/api/mock/api/v1/auth/logout/route';

describe('POST /api/mock/api/v1/auth/logout', () => {
  it('returns 200', async () => {
    const res = await POST();
    expect(res.status).toBe(200);
  });

  it('clears the session cookie', async () => {
    const res = await POST();
    const setCookie = res.headers.get('set-cookie') ?? '';
    expect(setCookie).toMatch(/session=;|session=$/i);
  });
});
