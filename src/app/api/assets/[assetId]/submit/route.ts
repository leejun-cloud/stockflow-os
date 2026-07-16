import path from 'node:path';
import { mkdir } from 'node:fs/promises';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getAssetById, createSubmission } from '@/lib/repository';
import { createSubmissionPackage } from '@/lib/exporter';
import { exportsDir } from '@/lib/db';
import { buildPlatformPayload } from '@/lib/adapters';

export const runtime = 'nodejs';

const submitSchema = z.object({
  platform: z.enum(['adobe', 'shutterstock', 'alamy', 'getty']),
});

export async function POST(request: Request, context: { params: Promise<{ assetId: string }> }) {
  const { assetId } = await context.params;
  const parsed = submitSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid platform' }, { status: 400 });
  }

  const asset = getAssetById(assetId);
  if (!asset) {
    return NextResponse.json({ error: 'asset not found' }, { status: 404 });
  }

  const outputDir = path.join(exportsDir, asset.id, parsed.data.platform);
  await mkdir(outputDir, { recursive: true });
  const zipPath = await createSubmissionPackage(parsed.data.platform, asset, outputDir);
  const payload = buildPlatformPayload(parsed.data.platform, asset);
  const submission = createSubmission({
    assetId: asset.id,
    platform: parsed.data.platform,
    status: 'exported',
    exportPath: zipPath,
    payloadJson: JSON.stringify(payload),
  });

  return NextResponse.json({
    submission,
    downloadUrl: `/api/submissions/${submission.id}/download`,
  });
}
