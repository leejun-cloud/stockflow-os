import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentUser } from '@/lib/auth';
import { encryptSecret } from '@/lib/crypto';
import { listAgencyCredentials, upsertAgencyCredential } from '@/lib/repository';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const schema = z.object({
  platform: z.enum(['adobe', 'shutterstock', 'alamy', 'getty']),
  protocol: z.enum(['ftp', 'ftps', 'sftp']),
  host: z.string().min(1),
  port: z.number().int().positive(),
  username: z.string().min(1),
  password: z.string().min(1),
});

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  return NextResponse.json({ credentials: await listAgencyCredentials(user.id) });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid payload' }, { status: 400 });
  }
  const { password, ...rest } = parsed.data;
  const credential = await upsertAgencyCredential({ userId: user.id, ...rest, encryptedPassword: encryptSecret(password) });
  const { encryptedPassword: _encryptedPassword, ...safe } = credential;
  return NextResponse.json({ credential: safe });
}
