import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentUser } from '@/lib/auth';
import { uploadToAgencies } from '@/lib/ftp/uploader';
import { createSubmission, getAssetByIdForUser } from '@/lib/repository';
import { readStoredObject } from '@/lib/storage';

export const runtime = 'nodejs';

const schema = z.object({
  platforms: z.array(z.enum(['adobe', 'shutterstock', 'alamy', 'getty'])).min(1),
});

export async function POST(request: Request, context: { params: Promise<{ assetId: string }> }) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const { assetId } = await context.params;
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid payload' }, { status: 400 });
  }

  const asset = await getAssetByIdForUser(user.id, assetId);
  if (!asset) {
    return NextResponse.json({ error: 'asset not found' }, { status: 404 });
  }

  const fileBytes = await readStoredObject(asset.storageBackend, asset.storagePath);
  const results = await uploadToAgencies({ userId: user.id, asset, fileBytes, platforms: parsed.data.platforms });

  for (const result of results) {
    await createSubmission({
      assetId: asset.id,
      userId: user.id,
      platform: result.platform,
      status: result.status === 'uploaded' ? 'exported' : 'failed',
      exportBackend: asset.storageBackend,
      exportPath: result.remotePath,
      payloadJson: JSON.stringify(result),
    });
  }

  return NextResponse.json({ results });
}
