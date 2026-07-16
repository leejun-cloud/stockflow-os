import { NextResponse } from 'next/server';
import { getCurrentUser, logoutCurrentUser } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const user = await getCurrentUser();
  return NextResponse.json({ user });
}

export async function DELETE() {
  await logoutCurrentUser();
  return NextResponse.json({ ok: true });
}
