import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

const DATA_API =
  process.env.INTERNAL_API_BASE_URL ??
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  '';

export async function proxy(request: NextRequest) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const res = await fetch(`${DATA_API}/api/v1/auth/me`, {
      headers: { cookie: request.headers.get('cookie') ?? '' },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (res.status === 401) {
      return NextResponse.redirect(`${DATA_API}/api/v1/auth/login`);
    }
  } catch {
    clearTimeout(timeout);
    if (!DATA_API) {
      return NextResponse.redirect(new URL('/api/v1/auth/login', request.url));
    }
    return NextResponse.redirect(`${DATA_API}/api/v1/auth/login`);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|supplier-view|api/).*)'],
};
