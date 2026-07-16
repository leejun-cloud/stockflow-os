import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentUser } from '@/lib/auth';
import { buildSubmissionArchive } from '@/lib/exporter';
import { createSubmission, getAssetByIdForUser } from '@/lib/repository';
import { saveExportObject } from '@/lib/storage';

export const runtime = 'nodejs';

const submitSchema = z.object({
  platform: z.enum(['adobe', 'shutterstock', 'alamy', 'getty']),
});

export async function POST(request: Request, context: { params: Promise<{ assetId: string }> }) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const { assetId } = await context.params;
  const parsed = submitSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid platform' }, { status: 400 });
  }

  const asset = await getAssetByIdForUser(user.id, assetId);
  if (!asset) {
    return NextResponse.json({ error: 'asset not found' }, { status: 404 });
  }

  const archive = await buildSubmissionArchive(parsed.data.platform, asset);
  const stored = await saveExportObject({
    ownerId: user.id,
    assetId: asset.id,
    platform: parsed.data.platform,
    fileName: archive.fileName,
    bytes: archive.bytes,
  });

  const submission = await createSubmission({
    assetId: asset.id,
    userId: user.id,
    platform: parsed.data.platform,
    status: 'exported',
    exportBackend: stored.backend,
    exportPath: stored.path,
    payloadJson: JSON.stringify(archive.payload),
  });

  return NextResponse.json({ submission, downloadUrl: `/api/submissions/${submission.id}/download` });
}
