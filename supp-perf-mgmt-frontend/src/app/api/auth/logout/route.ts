import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

const DATA_API =
  process.env.INTERNAL_API_BASE_URL ??
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  '';

export async function GET(request: NextRequest) {
  let cookieHeaders: string[] = [];

  try {
    const res = await fetch(`${DATA_API}/api/v1/auth/logout`, {
      method: 'POST',
      headers: { cookie: request.headers.get('cookie') ?? '' },
    });
    cookieHeaders = res.headers.getSetCookie();
  } catch {
    // Backend unreachable — proceed with redirect regardless
  }

  const response = NextResponse.redirect(new URL('/', request.url));
  cookieHeaders.forEach((c) => response.headers.append('Set-Cookie', c));
  return response;
}
