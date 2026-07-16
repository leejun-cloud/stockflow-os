import { randomUUID } from 'node:crypto';
import type { AssetRecord, PlatformKey, ReleaseStatus, SubmissionRecord } from './domain';
import { db } from './db';
import { nowIso } from './utils';

type AssetInsert = Omit<AssetRecord, 'id' | 'createdAt' | 'updatedAt'>;

type SubmissionInsert = {
  assetId: string;
  platform: PlatformKey;
  status: 'exported' | 'failed';
  exportPath: string;
  payloadJson: string;
};

function mapAssetRow(row: Record<string, unknown>): AssetRecord {
  return {
    id: String(row.id),
    originalFilename: String(row.original_filename),
    storagePath: String(row.storage_path),
    mimeType: String(row.mime_type),
    fileSize: Number(row.file_size),
    width: row.width === null ? null : Number(row.width),
    height: row.height === null ? null : Number(row.height),
    title: String(row.title),
    description: String(row.description),
    keywords: JSON.parse(String(row.keywords_json)),
    releaseStatus: String(row.release_status) as ReleaseStatus,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

function mapSubmissionRow(row: Record<string, unknown>): SubmissionRecord {
  return {
    id: String(row.id),
    assetId: String(row.asset_id),
    platform: String(row.platform) as PlatformKey,
    status: String(row.status) as 'exported' | 'failed',
    exportPath: String(row.export_path),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

export function createAsset(input: AssetInsert): AssetRecord {
  const id = randomUUID();
  const now = nowIso();
  db.prepare(
    `INSERT INTO assets (
      id, original_filename, storage_path, mime_type, file_size, width, height,
      title, description, keywords_json, release_status, created_at, updated_at
    ) VALUES (
      @id, @original_filename, @storage_path, @mime_type, @file_size, @width, @height,
      @title, @description, @keywords_json, @release_status, @created_at, @updated_at
    )`,
  ).run({
    id,
    original_filename: input.originalFilename,
    storage_path: input.storagePath,
    mime_type: input.mimeType,
    file_size: input.fileSize,
    width: input.width,
    height: input.height,
    title: input.title,
    description: input.description,
    keywords_json: JSON.stringify(input.keywords),
    release_status: input.releaseStatus,
    created_at: now,
    updated_at: now,
  });

  return getAssetById(id)!;
}

export function listAssets() {
  const assets = db.prepare('SELECT * FROM assets ORDER BY created_at DESC').all() as Record<string, unknown>[];
  const submissionsByAsset = db
    .prepare(
      `SELECT asset_id, platform, status, export_path, id, created_at, updated_at
       FROM submissions
       ORDER BY created_at DESC`,
    )
    .all() as Record<string, unknown>[];

  const grouped = new Map<string, SubmissionRecord[]>();
  for (const row of submissionsByAsset) {
    const submission = mapSubmissionRow(row);
    const list = grouped.get(submission.assetId) ?? [];
    list.push(submission);
    grouped.set(submission.assetId, list);
  }

  return assets.map((row) => ({
    ...mapAssetRow(row),
    submissions: grouped.get(String(row.id)) ?? [],
  }));
}

export function getAssetById(id: string) {
  const row = db.prepare('SELECT * FROM assets WHERE id = ?').get(id) as Record<string, unknown> | undefined;
  return row ? mapAssetRow(row) : null;
}

export function createSubmission(input: SubmissionInsert) {
  const id = randomUUID();
  const now = nowIso();
  db.prepare(
    `INSERT INTO submissions (id, asset_id, platform, status, export_path, payload_json, created_at, updated_at)
     VALUES (@id, @asset_id, @platform, @status, @export_path, @payload_json, @created_at, @updated_at)`,
  ).run({
    id,
    asset_id: input.assetId,
    platform: input.platform,
    status: input.status,
    export_path: input.exportPath,
    payload_json: input.payloadJson,
    created_at: now,
    updated_at: now,
  });

  db.prepare(
    `INSERT INTO submission_attempts (id, submission_id, step, status, message, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
  ).run(randomUUID(), id, 'export', input.status, input.status === 'exported' ? 'Package created' : 'Package failed', now);

  return getSubmissionById(id)!;
}

export function getSubmissionById(id: string) {
  const row = db.prepare('SELECT * FROM submissions WHERE id = ?').get(id) as Record<string, unknown> | undefined;
  return row ? mapSubmissionRow(row) : null;
}
