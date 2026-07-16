import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import JSZip from 'jszip';
import type { AssetRecord, PlatformKey } from './domain';
import { buildPlatformPayload } from './adapters';
import { sanitizeFilename } from './utils';

export async function createSubmissionPackage(platform: PlatformKey, asset: AssetRecord, outputDir: string) {
  await mkdir(outputDir, { recursive: true });

  const payload = buildPlatformPayload(platform, asset);
  const zip = new JSZip();
  const originalName = sanitizeFilename(asset.originalFilename);
  const sourceBytes = await readFile(asset.storagePath);

  zip.file(originalName, sourceBytes);
  zip.file('metadata.json', JSON.stringify(payload, null, 2));
  zip.file('README.txt', payload.instructions.join('\n'));

  const platformFile = `${platform}-payload.json`;
  zip.file(platformFile, JSON.stringify(payload.metadata, null, 2));

  const zipBytes = await zip.generateAsync({ type: 'nodebuffer' });
  const zipPath = path.join(outputDir, `${payload.exportBaseName}.zip`);
  await writeFile(zipPath, zipBytes);
  return zipPath;
}
