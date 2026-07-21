import JSZip from 'jszip';
import type { AssetRecord, PlatformKey } from './domain';
import { buildPlatformPayload } from './adapters';
import { readStoredObject } from './storage';
import { embedMetadata } from './metadata-embed';
import { sanitizeFilename } from './utils';

export async function buildSubmissionArchive(platform: PlatformKey, asset: AssetRecord) {
  const payload = buildPlatformPayload(platform, asset);
  const zip = new JSZip();
  const originalName = sanitizeFilename(asset.originalFilename);
  const sourceBytes = await readStoredObject(asset.storageBackend, asset.storagePath);
  const embeddedBytes = await embedMetadata(sourceBytes, {
    title: asset.title,
    description: asset.description,
    keywords: asset.keywords,
  });

  zip.file(originalName, embeddedBytes);
  zip.file('metadata.json', JSON.stringify(payload, null, 2));
  zip.file('README.txt', payload.instructions.join('\n'));
  zip.file(`${platform}-payload.json`, JSON.stringify(payload.metadata, null, 2));

  const bytes = await zip.generateAsync({ type: 'nodebuffer' });
  return {
    bytes,
    payload,
    fileName: `${payload.exportBaseName}.zip`,
  };
}
