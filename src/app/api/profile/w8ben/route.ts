import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getContributorProfile } from '@/lib/repository';
import { computeW8Ben } from '@/lib/tax/w8ben';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  const profile = await getContributorProfile(user.id);
  if (!profile) {
    return NextResponse.json({ error: 'profile not found' }, { status: 404 });
  }
  return NextResponse.json({ w8ben: computeW8Ben(profile) });
}
