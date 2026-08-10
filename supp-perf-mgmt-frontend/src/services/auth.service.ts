import { z } from 'zod';

import type { ApiResponse, User } from '@/types';

import { dataApi } from './http';

const UserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  displayName: z.string(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  createdAt: z.string().optional(),
  lastLoginAt: z.string().optional(),
});

export async function getCurrentUser(): Promise<User> {
  const res = await dataApi.get<ApiResponse<User>>('/auth/me');
  return UserSchema.parse(res.data);
}

export async function logout(): Promise<void> {
  await dataApi.post('/auth/logout', {});
}
