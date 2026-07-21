import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentUser } from '@/lib/auth';
import { getContributorProfile, upsertContributorProfile } from '@/lib/repository';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const schema = z.object({
  legalNameFull: z.string().min(1),
  displayName: z.string().min(1),
  country: z.string().min(2).default('KR'),
  phone: z.string().default(''),
  address: z.object({
    line1: z.string().default(''),
    line2: z.string().default(''),
    city: z.string().default(''),
    region: z.string().default(''),
    postalCode: z.string().default(''),
    country: z.string().default(''),
  }),
  tax: z.object({
    foreignTin: z.string().default(''),
    usTin: z.string().default(''),
  }),
  payment: z.object({
    method: z.string().default(''),
    payoutEmail: z.string().default(''),
  }),
});

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  return NextResponse.json({ profile: await getContributorProfile(user.id) });
}

export async function PUT(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid payload' }, { status: 400 });
  }
  const profile = await upsertContributorProfile({ userId: user.id, ...parsed.data });
  return NextResponse.json({ profile });
}
