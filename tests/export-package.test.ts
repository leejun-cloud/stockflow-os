import { mkdtemp, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import JSZip from 'jszip';
import type { AssetRecord } from '../src/lib/domain';
import { buildSubmissionArchive } from '../src/lib/exporter';

const asset: AssetRecord = {
  id: 'asset-zip',
  userId: 'user-1',
  originalFilename: 'sample.jpg',
  storageBackend: 'local',
  storagePath: '',
  mimeType: 'image/jpeg',
  fileSize: 12,
  width: 200,
  height: 100,
  title: 'Library class scene',
  description: 'Students learning together.',
  keywords: ['library', 'students'],
  releaseStatus: 'none',
  createdAt: '2026-07-16T00:00:00.000Z',
  updatedAt: '2026-07-16T00:00:00.000Z',
};

describe('submission package exporter', () => {
  it('creates a zip that includes the original file and metadata json', async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), 'stockflow-test-'));
    const sourceFile = path.join(dir, 'sample.jpg');
    await writeFile(sourceFile, 'fake-image-content');

    const archive = await buildSubmissionArchive('adobe', { ...asset, storagePath: sourceFile });
    const zip = await JSZip.loadAsync(archive.bytes);
    const files = Object.keys(zip.files).sort();

    expect(files).toContain('metadata.json');
    expect(files).toContain('sample.jpg');
    expect(archive.fileName).toContain('adobe');

    const metadata = JSON.parse(await zip.file('metadata.json')!.async('string'));
    expect(metadata.platform).toBe('adobe');
    expect(metadata.assetId).toBe('asset-zip');
  });
});
