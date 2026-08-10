import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/services/http', () => ({
  dataApi: {
    get: vi.fn(),
    post: vi.fn(),
  },
  HttpError: class HttpError extends Error {
    constructor(
      public readonly status: number,
      message: string,
      public readonly body?: unknown,
    ) {
      super(message);
      this.name = 'HttpError';
    }
  },
}));

import { getCurrentUser, logout } from '@/services/auth.service';
import { dataApi } from '@/services/http';

const mockApiUser = {
  data: {
    id: 'usr-1',
    email: 'jane@whirlpool.com',
    displayName: 'Jane Smith',
    firstName: 'Jane',
    lastName: 'Smith',
  },
  meta: { requestId: 'req-1' },
};

describe('getCurrentUser', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns the parsed user on success', async () => {
    vi.mocked(dataApi.get).mockResolvedValue(mockApiUser);
    const user = await getCurrentUser();
    expect(user).toEqual(mockApiUser.data);
  });

  it('includes optional fields when present', async () => {
    vi.mocked(dataApi.get).mockResolvedValue(mockApiUser);
    const user = await getCurrentUser();
    expect(user.firstName).toBe('Jane');
    expect(user.lastName).toBe('Smith');
  });

  it('succeeds without optional fields', async () => {
    vi.mocked(dataApi.get).mockResolvedValue({
      data: { id: 'usr-2', email: 'john@whirlpool.com', displayName: 'John' },
      meta: { requestId: 'req-2' },
    });
    const user = await getCurrentUser();
    expect(user).toMatchObject({ id: 'usr-2', email: 'john@whirlpool.com' });
    expect(user.firstName).toBeUndefined();
  });

  it('throws when the response is missing required fields', async () => {
    vi.mocked(dataApi.get).mockResolvedValue({
      data: { id: 'usr-3' },
      meta: {},
    });
    await expect(getCurrentUser()).rejects.toThrow();
  });

  it('propagates errors from the HTTP client', async () => {
    vi.mocked(dataApi.get).mockRejectedValue(new Error('Network error'));
    await expect(getCurrentUser()).rejects.toThrow('Network error');
  });
});

describe('logout', () => {
  beforeEach(() => vi.clearAllMocks());

  it('calls POST /auth/logout', async () => {
    vi.mocked(dataApi.post).mockResolvedValue(undefined);
    await logout();
    expect(dataApi.post).toHaveBeenCalledWith('/auth/logout', {});
  });
});
