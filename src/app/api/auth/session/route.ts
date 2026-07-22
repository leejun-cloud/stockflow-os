import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createSessionFromIdToken, getCurrentUser, logoutCurrentUser } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const schema = z.object({
  idToken: z.string().min(1),
  name: z.string().optional(),
});

export async function GET() {
  const user = await getCurrentUser();
  return NextResponse.json({ user });
}

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid payload' }, { status: 400 });
  }
  try {
    const user = await createSessionFromIdToken(parsed.data.idToken, parsed.data.name);
    return NextResponse.json({ user });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : '인증 실패' }, { status: 401 });
  }
}

export async function DELETE() {
  await logoutCurrentUser();
  return NextResponse.json({ ok: true });
}
