import path from 'node:path';
import type { MediaType } from './domain';

export function mediaTypeFromMime(mimeType: string): MediaType {
  return mimeType.startsWith('video/') ? 'video' : 'image';
}

export function nowIso() {
  return new Date().toISOString();
}

export function sanitizeFilename(filename: string) {
  return filename.replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/-+/g, '-');
}

export function unique<T>(values: T[]) {
  return Array.from(new Set(values));
}

export function basenameWithoutExt(filename: string) {
  return path.parse(filename).name;
}

export function trimText(value: string, max: number) {
  return value.length <= max ? value : `${value.slice(0, max - 1).trim()}…`;
}
