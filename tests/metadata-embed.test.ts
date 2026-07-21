import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { exiftool } from 'exiftool-vendored';
import { embedMetadata } from '../src/lib/metadata-embed';
import { tinyJpeg } from './tiny-jpeg';

afterAll(async () => {
  await exiftool.end();
});

describe('metadata embed engine', () => {
  it('embeds title and keywords into a JPEG and reads them back', async () => {
    const embedded = await embedMetadata(tinyJpeg, {
      title: 'Library class scene',
      description: 'Students learning together.',
      keywords: ['library', 'students', 'education'],
    });

    const dir = await mkdtemp(path.join(os.tmpdir(), 'stockflow-embed-test-'));
    const filePath = path.join(dir, 'embedded.jpg');
    try {
      await writeFile(filePath, embedded);
      const tags = await exiftool.read(filePath);

      expect(tags.Title).toBe('Library class scene');
      expect(tags['Caption-Abstract']).toBe('Students learning together.');
      const keywords = Array.isArray(tags.Keywords) ? tags.Keywords : [tags.Keywords];
      expect(keywords).toContain('library');
      expect(keywords).toContain('education');
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});
