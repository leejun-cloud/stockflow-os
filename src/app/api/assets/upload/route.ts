import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { writeFile } from 'node:fs/promises';
import { imageSize } from 'image-size';
import { NextResponse } from 'next/server';
import { createAsset } from '@/lib/repository';
import { uploadsDir } from '@/lib/db';
import { sanitizeFilename } from '@/lib/utils';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const formData = await request.formData();
  const uploaded = formData.get('file');

  if (!(uploaded instanceof File)) {
    return NextResponse.json({ error: 'file is required' }, { status: 400 });
  }

  const title = String(formData.get('title') || '').trim() || uploaded.name.replace(/\.[^.]+$/, '');
  const description = String(formData.get('description') || '').trim();
  const keywordText = String(formData.get('keywords') || '').trim();
  const releaseStatus = String(formData.get('releaseStatus') || 'none');
  const keywords = keywordText
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

  const fileName = `${randomUUID()}-${sanitizeFilename(uploaded.name)}`;
  const storagePath = path.join(uploadsDir, fileName);
  const bytes = Buffer.from(await uploaded.arrayBuffer());
  await writeFile(storagePath, bytes);
  const dimensions = imageSize(bytes);

  const asset = createAsset({
    originalFilename: uploaded.name,
    storagePath,
    mimeType: uploaded.type || 'application/octet-stream',
    fileSize: uploaded.size,
    width: dimensions.width ?? null,
    height: dimensions.height ?? null,
    title,
    description,
    keywords,
    releaseStatus: releaseStatus as 'none' | 'model_attached' | 'property_attached' | 'both_attached',
  });

  return NextResponse.json({ asset });
}
