import { describe, expect, it } from 'vitest';
import { buildPlatformPayload } from '../src/lib/adapters';
import type { AssetRecord } from '../src/lib/domain';

const baseAsset: AssetRecord = {
  id: 'asset-1',
  originalFilename: 'sample.jpg',
  storagePath: '/tmp/sample.jpg',
  mimeType: 'image/jpeg',
  fileSize: 12345,
  width: 6000,
  height: 4000,
  title: 'Children reading together in a bright library classroom',
  description: 'A documentary-style education photo showing children reading together in a bright Korean classroom.',
  keywords: ['children', 'education', 'library', 'reading', 'classroom', 'korea'],
  releaseStatus: 'none',
  createdAt: '2026-07-16T00:00:00.000Z',
  updatedAt: '2026-07-16T00:00:00.000Z',
};

describe('platform adapters', () => {
  it('keeps only 49 keywords for Adobe and preserves order', () => {
    const keywords = Array.from({ length: 60 }, (_, index) => `kw-${index + 1}`);
    const payload = buildPlatformPayload('adobe', {
      ...baseAsset,
      keywords,
    });

    expect(payload.platform).toBe('adobe');
    expect(payload.metadata.keywords).toHaveLength(49);
    expect(payload.metadata.keywords[0]).toBe('kw-1');
    expect(payload.metadata.keywords.at(-1)).toBe('kw-49');
  });

  it('marks Shutterstock export as editorial when releases are missing', () => {
    const payload = buildPlatformPayload('shutterstock', baseAsset);
    expect(payload.platform).toBe('shutterstock');
    expect(payload.metadata.licenseMode).toBe('editorial');
  });

  it('marks Adobe export as commercial when a release is attached', () => {
    const payload = buildPlatformPayload('adobe', {
      ...baseAsset,
      releaseStatus: 'model_attached',
    });

    expect(payload.metadata.licenseMode).toBe('commercial');
  });
});
