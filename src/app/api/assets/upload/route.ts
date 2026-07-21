import { imageSize } from 'image-size';
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { createAsset } from '@/lib/repository';
import { saveUploadObject } from '@/lib/storage';
import { mediaTypeFromMime } from '@/lib/utils';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const formData = await request.formData();
  const uploaded = formData.get('file');

  if (!(uploaded instanceof File)) {
    return NextResponse.json({ error: 'file is required' }, { status: 400 });
  }

  const title = String(formData.get('title') || '').trim() || uploaded.name.replace(/\.[^.]+$/, '');
  const description = String(formData.get('description') || '').trim();
  const keywordText = String(formData.get('keywords') || '').trim();
  const releaseStatus = String(formData.get('releaseStatus') || 'none');
  const keywords = keywordText.split(',').map((item) => item.trim()).filter(Boolean);

  const bytes = Buffer.from(await uploaded.arrayBuffer());
  const mimeType = uploaded.type || 'application/octet-stream';
  const mediaType = mediaTypeFromMime(mimeType);
  const stored = await saveUploadObject({ ownerId: user.id, fileName: uploaded.name, mimeType, bytes });
  const dimensions = mediaType === 'image' ? imageSize(bytes) : { width: undefined, height: undefined };

  const asset = await createAsset({
    userId: user.id,
    originalFilename: uploaded.name,
    storageBackend: stored.backend,
    storagePath: stored.path,
    mimeType,
    mediaType,
    fileSize: uploaded.size,
    width: dimensions.width ?? null,
    height: dimensions.height ?? null,
    durationSeconds: null,
    title,
    description,
    keywords,
    releaseStatus: releaseStatus as 'none' | 'model_attached' | 'property_attached' | 'both_attached',
  });

  return NextResponse.json({ asset });
}
