import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

const MOCK_USER = {
  id: 'mock-usr-001',
  email: 'dev@whirlpool.com',
  displayName: 'Dev User',
  firstName: 'Dev',
  lastName: 'User',
};

export function GET(request: NextRequest) {
  const session = request.cookies.get('session');
  if (!session) {
    return NextResponse.json(
      {
        error: {
          code: 'UNAUTHORIZED',
          message: 'Not authenticated',
          requestId: 'mock',
        },
      },
      { status: 401 },
    );
  }
  return NextResponse.json({
    data: MOCK_USER,
    meta: { requestId: 'mock-req-001' },
  });
}
