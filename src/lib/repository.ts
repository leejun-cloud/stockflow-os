import { randomUUID } from 'node:crypto';
import type { AssetRecord, PlatformKey, ReleaseStatus, StorageBackend, SubmissionRecord, UserRecord } from './domain';
import { ensureDatabase, getPg, getSqlite, usingPostgres } from './db';
import { nowIso } from './utils';

type AssetInsert = Omit<AssetRecord, 'id' | 'createdAt' | 'updatedAt'>;
type SubmissionInsert = {
  assetId: string;
  userId: string;
  platform: PlatformKey;
  status: 'exported' | 'failed';
  exportBackend: StorageBackend;
  exportPath: string;
  payloadJson: string;
};

type UserInsert = {
  email: string;
  name: string;
  passwordHash: string;
};

type UserWithPassword = UserRecord & { passwordHash: string };

function mapAssetRow(row: Record<string, unknown>): AssetRecord {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    originalFilename: String(row.original_filename),
    storageBackend: String(row.storage_backend) as StorageBackend,
    storagePath: String(row.storage_path),
    mimeType: String(row.mime_type),
    fileSize: Number(row.file_size),
    width: row.width === null ? null : Number(row.width),
    height: row.height === null ? null : Number(row.height),
    title: String(row.title),
    description: String(row.description),
    keywords: Array.isArray(row.keywords_json) ? (row.keywords_json as string[]) : JSON.parse(String(row.keywords_json)),
    releaseStatus: String(row.release_status) as ReleaseStatus,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

function mapSubmissionRow(row: Record<string, unknown>): SubmissionRecord {
  return {
    id: String(row.id),
    assetId: String(row.asset_id),
    userId: String(row.user_id),
    platform: String(row.platform) as PlatformKey,
    status: String(row.status) as 'exported' | 'failed',
    exportBackend: String(row.export_backend) as StorageBackend,
    exportPath: String(row.export_path),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

function mapUserRow(row: Record<string, unknown>): UserWithPassword {
  return {
    id: String(row.id),
    email: String(row.email),
    name: String(row.name),
    passwordHash: String(row.password_hash),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

function stripPassword(user: UserWithPassword | null): UserRecord | null {
  if (!user) return null;
  const { passwordHash: _passwordHash, ...safe } = user;
  return safe;
}

export async function createUser(input: UserInsert): Promise<UserRecord> {
  await ensureDatabase();
  const id = randomUUID();
  const now = nowIso();

  if (usingPostgres()) {
    const sql = getPg();
    const rows = await sql<Record<string, unknown>[]>`
      INSERT INTO users (id, email, password_hash, name, created_at, updated_at)
      VALUES (${id}, ${input.email}, ${input.passwordHash}, ${input.name}, ${now}, ${now})
      RETURNING *
    `;
    return stripPassword(mapUserRow(rows[0]))!;
  }

  const db = getSqlite();
  db.prepare(
    `INSERT INTO users (id, email, password_hash, name, created_at, updated_at)
     VALUES (@id, @email, @password_hash, @name, @created_at, @updated_at)`,
  ).run({ id, email: input.email, password_hash: input.passwordHash, name: input.name, created_at: now, updated_at: now });
  return stripPassword((await findUserByEmail(input.email))!)!;
}

export async function findUserByEmail(email: string): Promise<UserWithPassword | null> {
  await ensureDatabase();
  if (usingPostgres()) {
    const sql = getPg();
    const rows = await sql<Record<string, unknown>[]>`SELECT * FROM users WHERE email = ${email} LIMIT 1`;
    return rows[0] ? mapUserRow(rows[0]) : null;
  }
  const row = getSqlite().prepare('SELECT * FROM users WHERE email = ? LIMIT 1').get(email) as Record<string, unknown> | undefined;
  return row ? mapUserRow(row) : null;
}

export async function createSession(userId: string, sessionToken: string) {
  await ensureDatabase();
  const id = randomUUID();
  const now = nowIso();
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString();

  if (usingPostgres()) {
    const sql = getPg();
    await sql`INSERT INTO sessions (id, user_id, session_token, expires_at, created_at)
              VALUES (${id}, ${userId}, ${sessionToken}, ${expiresAt}, ${now})`;
    return;
  }

  getSqlite()
    .prepare('INSERT INTO sessions (id, user_id, session_token, expires_at, created_at) VALUES (?, ?, ?, ?, ?)')
    .run(id, userId, sessionToken, expiresAt, now);
}

export async function deleteSession(sessionToken: string) {
  await ensureDatabase();
  if (usingPostgres()) {
    const sql = getPg();
    await sql`DELETE FROM sessions WHERE session_token = ${sessionToken}`;
    return;
  }
  getSqlite().prepare('DELETE FROM sessions WHERE session_token = ?').run(sessionToken);
}

export async function findUserBySessionToken(sessionToken: string): Promise<UserRecord | null> {
  await ensureDatabase();
  if (usingPostgres()) {
    const sql = getPg();
    const rows = await sql<Record<string, unknown>[]>`
      SELECT u.*
      FROM sessions s
      JOIN users u ON u.id = s.user_id
      WHERE s.session_token = ${sessionToken} AND s.expires_at > NOW()
      LIMIT 1
    `;
    return rows[0] ? stripPassword(mapUserRow(rows[0])) : null;
  }
  const row = getSqlite()
    .prepare(
      `SELECT u.* FROM sessions s
       JOIN users u ON u.id = s.user_id
       WHERE s.session_token = ? AND s.expires_at > ?
       LIMIT 1`,
    )
    .get(sessionToken, nowIso()) as Record<string, unknown> | undefined;
  return row ? stripPassword(mapUserRow(row)) : null;
}

export async function createAsset(input: AssetInsert): Promise<AssetRecord> {
  await ensureDatabase();
  const id = randomUUID();
  const now = nowIso();

  if (usingPostgres()) {
    const sql = getPg();
    const rows = await sql<Record<string, unknown>[]>`
      INSERT INTO assets (
        id, user_id, original_filename, storage_backend, storage_path, mime_type,
        file_size, width, height, title, description, keywords_json, release_status, created_at, updated_at
      ) VALUES (
        ${id}, ${input.userId}, ${input.originalFilename}, ${input.storageBackend}, ${input.storagePath}, ${input.mimeType},
        ${input.fileSize}, ${input.width}, ${input.height}, ${input.title}, ${input.description}, ${JSON.stringify(input.keywords)}::jsonb,
        ${input.releaseStatus}, ${now}, ${now}
      ) RETURNING *
    `;
    return mapAssetRow(rows[0]);
  }

  const db = getSqlite();
  db.prepare(
    `INSERT INTO assets (
      id, user_id, original_filename, storage_backend, storage_path, mime_type, file_size, width, height,
      title, description, keywords_json, release_status, created_at, updated_at
    ) VALUES (
      @id, @user_id, @original_filename, @storage_backend, @storage_path, @mime_type, @file_size, @width, @height,
      @title, @description, @keywords_json, @release_status, @created_at, @updated_at
    )`,
  ).run({
    id,
    user_id: input.userId,
    original_filename: input.originalFilename,
    storage_backend: input.storageBackend,
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
  return (await getAssetByIdForUser(input.userId, id))!;
}

export async function listAssetsForUser(userId: string) {
  await ensureDatabase();
  let assetRows: Record<string, unknown>[] = [];
  let submissionRows: Record<string, unknown>[] = [];

  if (usingPostgres()) {
    const sql = getPg();
    assetRows = await sql<Record<string, unknown>[]>`SELECT * FROM assets WHERE user_id = ${userId} ORDER BY created_at DESC`;
    submissionRows = await sql<Record<string, unknown>[]>`SELECT * FROM submissions WHERE user_id = ${userId} ORDER BY created_at DESC`;
  } else {
    const db = getSqlite();
    assetRows = db.prepare('SELECT * FROM assets WHERE user_id = ? ORDER BY created_at DESC').all(userId) as Record<string, unknown>[];
    submissionRows = db.prepare('SELECT * FROM submissions WHERE user_id = ? ORDER BY created_at DESC').all(userId) as Record<string, unknown>[];
  }

  const grouped = new Map<string, SubmissionRecord[]>();
  for (const row of submissionRows) {
    const submission = mapSubmissionRow(row);
    const list = grouped.get(submission.assetId) ?? [];
    list.push(submission);
    grouped.set(submission.assetId, list);
  }

  return assetRows.map((row) => ({
    ...mapAssetRow(row),
    submissions: grouped.get(String(row.id)) ?? [],
  }));
}

export async function getAssetByIdForUser(userId: string, assetId: string) {
  await ensureDatabase();
  if (usingPostgres()) {
    const sql = getPg();
    const rows = await sql<Record<string, unknown>[]>`SELECT * FROM assets WHERE id = ${assetId} AND user_id = ${userId} LIMIT 1`;
    return rows[0] ? mapAssetRow(rows[0]) : null;
  }
  const row = getSqlite().prepare('SELECT * FROM assets WHERE id = ? AND user_id = ? LIMIT 1').get(assetId, userId) as Record<string, unknown> | undefined;
  return row ? mapAssetRow(row) : null;
}

export async function createSubmission(input: SubmissionInsert) {
  await ensureDatabase();
  const id = randomUUID();
  const now = nowIso();

  if (usingPostgres()) {
    const sql = getPg();
    const rows = await sql<Record<string, unknown>[]>`
      INSERT INTO submissions (id, asset_id, user_id, platform, status, export_backend, export_path, payload_json, created_at, updated_at)
      VALUES (${id}, ${input.assetId}, ${input.userId}, ${input.platform}, ${input.status}, ${input.exportBackend}, ${input.exportPath}, ${input.payloadJson}::jsonb, ${now}, ${now})
      RETURNING *
    `;
    await sql`INSERT INTO submission_attempts (id, submission_id, step, status, message, created_at)
              VALUES (${randomUUID()}, ${id}, 'export', ${input.status}, ${input.status === 'exported' ? 'Package created' : 'Package failed'}, ${now})`;
    return mapSubmissionRow(rows[0]);
  }

  const db = getSqlite();
  db.prepare(
    `INSERT INTO submissions (id, asset_id, user_id, platform, status, export_backend, export_path, payload_json, created_at, updated_at)
     VALUES (@id, @asset_id, @user_id, @platform, @status, @export_backend, @export_path, @payload_json, @created_at, @updated_at)`,
  ).run({
    id,
    asset_id: input.assetId,
    user_id: input.userId,
    platform: input.platform,
    status: input.status,
    export_backend: input.exportBackend,
    export_path: input.exportPath,
    payload_json: input.payloadJson,
    created_at: now,
    updated_at: now,
  });
  db.prepare(
    `INSERT INTO submission_attempts (id, submission_id, step, status, message, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
  ).run(randomUUID(), id, 'export', input.status, input.status === 'exported' ? 'Package created' : 'Package failed', now);
  return (await getSubmissionByIdForUser(input.userId, id))!;
}

export async function getSubmissionByIdForUser(userId: string, submissionId: string) {
  await ensureDatabase();
  if (usingPostgres()) {
    const sql = getPg();
    const rows = await sql<Record<string, unknown>[]>`SELECT * FROM submissions WHERE id = ${submissionId} AND user_id = ${userId} LIMIT 1`;
    return rows[0] ? mapSubmissionRow(rows[0]) : null;
  }
  const row = getSqlite().prepare('SELECT * FROM submissions WHERE id = ? AND user_id = ? LIMIT 1').get(submissionId, userId) as Record<string, unknown> | undefined;
  return row ? mapSubmissionRow(row) : null;
}
