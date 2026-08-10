import { NextResponse } from 'next/server';

export function POST() {
  const res = NextResponse.json({}, { status: 200 });
  res.cookies.delete('session');
  return res;
}
