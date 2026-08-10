import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export function GET(request: NextRequest) {
  const origin = new URL(request.url).origin;
  const res = NextResponse.redirect(new URL('/', origin));
  res.cookies.set('session', 'mock-session', {
    httpOnly: true,
    path: '/',
    maxAge: 60 * 60 * 8,
    sameSite: 'lax',
  });
  return res;
}
