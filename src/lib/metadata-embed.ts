import { randomUUID } from 'node:crypto';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { exiftool } from 'exiftool-vendored';

export type EmbedMetadata = {
  title: string;
  description: string;
  keywords: string[];
};

function isJpeg(bytes: Buffer) {
  return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
}

// Embeds title/description/keywords as IPTC + XMP (+ EXIF for JPEG) into the file bytes.
// Works for JPEG images and MP4/MOV video containers (video gets XMP only, which agencies read).
export async function embedMetadata(fileBytes: Buffer, metadata: EmbedMetadata): Promise<Buffer> {
  const jpeg = isJpeg(fileBytes);
  const dir = await mkdtemp(path.join(os.tmpdir(), 'stockflow-embed-'));
  const filePath = path.join(dir, `${randomUUID()}${jpeg ? '.jpg' : '.mp4'}`);

  try {
    await writeFile(filePath, fileBytes);

    const tags: Record<string, string | string[]> = {
      'XMP-dc:Title': metadata.title,
      'XMP-dc:Description': metadata.description,
      'XMP-dc:Subject': metadata.keywords,
    };

    if (jpeg) {
      tags['IPTC:ObjectName'] = metadata.title;
      tags['IPTC:Caption-Abstract'] = metadata.description;
      tags['IPTC:Keywords'] = metadata.keywords;
      tags['EXIF:ImageDescription'] = metadata.description;
    }

    await exiftool.write(filePath, tags, { writeArgs: ['-overwrite_original', '-codedcharacterset=utf8'] });

    return await readFile(filePath);
  } catch (error) {
    throw new Error(`Failed to embed metadata: ${(error as Error).message}`);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}
