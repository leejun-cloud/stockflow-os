import { randomUUID } from 'node:crypto';
import type { AgencyCredentialRecord, AssetRecord, ContributorAddress, ContributorPayment, ContributorProfile, ContributorTax, FtpProtocol, MediaType, PlatformKey, ReleaseStatus, StorageBackend, SubmissionRecord, UserRecord } from './domain';
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

type UserWithPassword = UserRecord & { passwordHash: string };

function mapAssetRow(row: Record<string, unknown>): AssetRecord {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    originalFilename: String(row.original_filename),
    storageBackend: String(row.storage_backend) as StorageBackend,
    storagePath: String(row.storage_path),
    mimeType: String(row.mime_type),
    mediaType: String(row.media_type) as MediaType,
    fileSize: Number(row.file_size),
    width: row.width === null ? null : Number(row.width),
    height: row.height === null ? null : Number(row.height),
    durationSeconds: row.duration_seconds === null || row.duration_seconds === undefined ? null : Number(row.duration_seconds),
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

function mapAgencyCredentialRow(row: Record<string, unknown>): AgencyCredentialRecord {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    platform: String(row.platform) as PlatformKey,
    protocol: String(row.protocol) as FtpProtocol,
    host: String(row.host),
    port: Number(row.port),
    username: String(row.username),
    encryptedPassword: String(row.encrypted_password),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

function mapUserRow(row: Record<string, unknown>): UserWithPassword {
  return {
    id: String(row.id),
    email: String(row.email),
    name: String(row.name),
    passwordHash: row.password_hash == null ? '' : String(row.password_hash),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

function stripPassword(user: UserWithPassword | null): UserRecord | null {
  if (!user) return null;
  const { passwordHash: _passwordHash, ...safe } = user;
  return safe;
}

export async function getUserByFirebaseUid(firebaseUid: string): Promise<UserRecord | null> {
  await ensureDatabase();
  if (usingPostgres()) {
    const sql = getPg();
    const rows = await sql<Record<string, unknown>[]>`SELECT * FROM users WHERE firebase_uid = ${firebaseUid} LIMIT 1`;
    return rows[0] ? stripPassword(mapUserRow(rows[0])) : null;
  }
  const row = getSqlite().prepare('SELECT * FROM users WHERE firebase_uid = ? LIMIT 1').get(firebaseUid) as Record<string, unknown> | undefined;
  return row ? stripPassword(mapUserRow(row)) : null;
}

export async function createUserFromFirebase(input: { uid: string; email: string; name: string }): Promise<UserRecord> {
  await ensureDatabase();
  const id = randomUUID();
  const now = nowIso();

  if (usingPostgres()) {
    const sql = getPg();
    const rows = await sql<Record<string, unknown>[]>`
      INSERT INTO users (id, firebase_uid, email, name, created_at, updated_at)
      VALUES (${id}, ${input.uid}, ${input.email}, ${input.name}, ${now}, ${now})
      ON CONFLICT (firebase_uid) DO UPDATE SET email = EXCLUDED.email, updated_at = EXCLUDED.updated_at
      RETURNING *
    `;
    return stripPassword(mapUserRow(rows[0]))!;
  }

  getSqlite()
    .prepare('INSERT INTO users (id, firebase_uid, email, name, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)')
    .run(id, input.uid, input.email, input.name, now, now);
  return (await getUserByFirebaseUid(input.uid))!;
}

export async function createAsset(input: AssetInsert): Promise<AssetRecord> {
  await ensureDatabase();
  const id = randomUUID();
  const now = nowIso();

  if (usingPostgres()) {
    const sql = getPg();
    const rows = await sql<Record<string, unknown>[]>`
      INSERT INTO assets (
        id, user_id, original_filename, storage_backend, storage_path, mime_type, media_type, duration_seconds,
        file_size, width, height, title, description, keywords_json, release_status, created_at, updated_at
      ) VALUES (
        ${id}, ${input.userId}, ${input.originalFilename}, ${input.storageBackend}, ${input.storagePath}, ${input.mimeType}, ${input.mediaType}, ${input.durationSeconds},
        ${input.fileSize}, ${input.width}, ${input.height}, ${input.title}, ${input.description}, ${JSON.stringify(input.keywords)}::jsonb,
        ${input.releaseStatus}, ${now}, ${now}
      ) RETURNING *
    `;
    return mapAssetRow(rows[0]);
  }

  const db = getSqlite();
  db.prepare(
    `INSERT INTO assets (
      id, user_id, original_filename, storage_backend, storage_path, mime_type, media_type, duration_seconds, file_size, width, height,
      title, description, keywords_json, release_status, created_at, updated_at
    ) VALUES (
      @id, @user_id, @original_filename, @storage_backend, @storage_path, @mime_type, @media_type, @duration_seconds, @file_size, @width, @height,
      @title, @description, @keywords_json, @release_status, @created_at, @updated_at
    )`,
  ).run({
    id,
    user_id: input.userId,
    original_filename: input.originalFilename,
    storage_backend: input.storageBackend,
    storage_path: input.storagePath,
    mime_type: input.mimeType,
    media_type: input.mediaType,
    duration_seconds: input.durationSeconds,
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

export async function updateAssetMetadata(
  userId: string,
  assetId: string,
  metadata: { title: string; description: string; keywords: string[] },
): Promise<AssetRecord | null> {
  await ensureDatabase();
  const now = nowIso();
  const keywordsJson = JSON.stringify(metadata.keywords);

  if (usingPostgres()) {
    const sql = getPg();
    const rows = await sql<Record<string, unknown>[]>`
      UPDATE assets
      SET title = ${metadata.title}, description = ${metadata.description}, keywords_json = ${keywordsJson}::jsonb, updated_at = ${now}
      WHERE id = ${assetId} AND user_id = ${userId}
      RETURNING *
    `;
    return rows[0] ? mapAssetRow(rows[0]) : null;
  }

  getSqlite()
    .prepare(
      `UPDATE assets SET title = @title, description = @description, keywords_json = @keywords_json, updated_at = @updated_at
       WHERE id = @id AND user_id = @user_id`,
    )
    .run({
      id: assetId,
      user_id: userId,
      title: metadata.title,
      description: metadata.description,
      keywords_json: keywordsJson,
      updated_at: now,
    });
  return getAssetByIdForUser(userId, assetId);
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

type AgencyCredentialInsert = {
  userId: string;
  platform: PlatformKey;
  protocol: FtpProtocol;
  host: string;
  port: number;
  username: string;
  encryptedPassword: string;
};

export async function upsertAgencyCredential(input: AgencyCredentialInsert): Promise<AgencyCredentialRecord> {
  await ensureDatabase();
  const id = randomUUID();
  const now = nowIso();

  if (usingPostgres()) {
    const sql = getPg();
    const rows = await sql<Record<string, unknown>[]>`
      INSERT INTO agency_credentials (id, user_id, platform, protocol, host, port, username, encrypted_password, created_at, updated_at)
      VALUES (${id}, ${input.userId}, ${input.platform}, ${input.protocol}, ${input.host}, ${input.port}, ${input.username}, ${input.encryptedPassword}, ${now}, ${now})
      ON CONFLICT (user_id, platform) DO UPDATE SET
        protocol = EXCLUDED.protocol, host = EXCLUDED.host, port = EXCLUDED.port,
        username = EXCLUDED.username, encrypted_password = EXCLUDED.encrypted_password, updated_at = EXCLUDED.updated_at
      RETURNING *
    `;
    return mapAgencyCredentialRow(rows[0]);
  }

  const db = getSqlite();
  db.prepare(
    `INSERT INTO agency_credentials (id, user_id, platform, protocol, host, port, username, encrypted_password, created_at, updated_at)
     VALUES (@id, @user_id, @platform, @protocol, @host, @port, @username, @encrypted_password, @created_at, @updated_at)
     ON CONFLICT(user_id, platform) DO UPDATE SET
       protocol = excluded.protocol, host = excluded.host, port = excluded.port,
       username = excluded.username, encrypted_password = excluded.encrypted_password, updated_at = excluded.updated_at`,
  ).run({
    id,
    user_id: input.userId,
    platform: input.platform,
    protocol: input.protocol,
    host: input.host,
    port: input.port,
    username: input.username,
    encrypted_password: input.encryptedPassword,
    created_at: now,
    updated_at: now,
  });
  return (await getAgencyCredential(input.userId, input.platform))!;
}

export async function getAgencyCredential(userId: string, platform: PlatformKey): Promise<AgencyCredentialRecord | null> {
  await ensureDatabase();
  if (usingPostgres()) {
    const sql = getPg();
    const rows = await sql<Record<string, unknown>[]>`SELECT * FROM agency_credentials WHERE user_id = ${userId} AND platform = ${platform} LIMIT 1`;
    return rows[0] ? mapAgencyCredentialRow(rows[0]) : null;
  }
  const row = getSqlite().prepare('SELECT * FROM agency_credentials WHERE user_id = ? AND platform = ? LIMIT 1').get(userId, platform) as Record<string, unknown> | undefined;
  return row ? mapAgencyCredentialRow(row) : null;
}

// Never returns the (encrypted) password — decryption happens only in the upload worker via getAgencyCredential.
export async function listAgencyCredentials(userId: string): Promise<Omit<AgencyCredentialRecord, 'encryptedPassword'>[]> {
  await ensureDatabase();
  let rows: Record<string, unknown>[] = [];
  if (usingPostgres()) {
    const sql = getPg();
    rows = await sql<Record<string, unknown>[]>`SELECT * FROM agency_credentials WHERE user_id = ${userId} ORDER BY platform`;
  } else {
    rows = getSqlite().prepare('SELECT * FROM agency_credentials WHERE user_id = ? ORDER BY platform').all(userId) as Record<string, unknown>[];
  }
  return rows.map((row) => {
    const { encryptedPassword: _encryptedPassword, ...safe } = mapAgencyCredentialRow(row);
    return safe;
  });
}

function parseJsonColumn<T>(value: unknown, fallback: T): T {
  if (value === null || value === undefined) return fallback;
  if (typeof value === 'string') return value ? (JSON.parse(value) as T) : fallback;
  return value as T;
}

function mapContributorProfileRow(row: Record<string, unknown>): ContributorProfile {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    identity: {
      legalNameFull: String(row.legal_name_full),
      displayName: String(row.display_name),
      country: String(row.country),
      phone: String(row.phone ?? ''),
    },
    address: parseJsonColumn<ContributorAddress>(row.address_json, { line1: '', line2: '', city: '', region: '', postalCode: '', country: '' }),
    tax: parseJsonColumn<ContributorTax>(row.tax_json, { foreignTin: '', usTin: '' }),
    payment: parseJsonColumn<ContributorPayment>(row.payment_json, { method: '', payoutEmail: '' }),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

type ContributorProfileInsert = {
  userId: string;
  legalNameFull: string;
  displayName: string;
  country: string;
  phone: string;
  address: ContributorAddress;
  tax: ContributorTax;
  payment: ContributorPayment;
};

export async function getContributorProfile(userId: string): Promise<ContributorProfile | null> {
  await ensureDatabase();
  if (usingPostgres()) {
    const sql = getPg();
    const rows = await sql<Record<string, unknown>[]>`SELECT * FROM contributor_profiles WHERE user_id = ${userId} LIMIT 1`;
    return rows[0] ? mapContributorProfileRow(rows[0]) : null;
  }
  const row = getSqlite().prepare('SELECT * FROM contributor_profiles WHERE user_id = ? LIMIT 1').get(userId) as Record<string, unknown> | undefined;
  return row ? mapContributorProfileRow(row) : null;
}

export async function upsertContributorProfile(input: ContributorProfileInsert): Promise<ContributorProfile> {
  await ensureDatabase();
  const id = randomUUID();
  const now = nowIso();
  const addressJson = JSON.stringify(input.address);
  const taxJson = JSON.stringify(input.tax);
  const paymentJson = JSON.stringify(input.payment);

  if (usingPostgres()) {
    const sql = getPg();
    const rows = await sql<Record<string, unknown>[]>`
      INSERT INTO contributor_profiles (id, user_id, legal_name_full, display_name, country, address_json, phone, tax_json, payment_json, created_at, updated_at)
      VALUES (${id}, ${input.userId}, ${input.legalNameFull}, ${input.displayName}, ${input.country}, ${addressJson}::jsonb, ${input.phone}, ${taxJson}::jsonb, ${paymentJson}::jsonb, ${now}, ${now})
      ON CONFLICT (user_id) DO UPDATE SET
        legal_name_full = EXCLUDED.legal_name_full, display_name = EXCLUDED.display_name, country = EXCLUDED.country,
        address_json = EXCLUDED.address_json, phone = EXCLUDED.phone, tax_json = EXCLUDED.tax_json,
        payment_json = EXCLUDED.payment_json, updated_at = EXCLUDED.updated_at
      RETURNING *
    `;
    return mapContributorProfileRow(rows[0]);
  }

  getSqlite()
    .prepare(
      `INSERT INTO contributor_profiles (id, user_id, legal_name_full, display_name, country, address_json, phone, tax_json, payment_json, created_at, updated_at)
       VALUES (@id, @user_id, @legal_name_full, @display_name, @country, @address_json, @phone, @tax_json, @payment_json, @created_at, @updated_at)
       ON CONFLICT(user_id) DO UPDATE SET
         legal_name_full = excluded.legal_name_full, display_name = excluded.display_name, country = excluded.country,
         address_json = excluded.address_json, phone = excluded.phone, tax_json = excluded.tax_json,
         payment_json = excluded.payment_json, updated_at = excluded.updated_at`,
    )
    .run({
      id,
      user_id: input.userId,
      legal_name_full: input.legalNameFull,
      display_name: input.displayName,
      country: input.country,
      address_json: addressJson,
      phone: input.phone,
      tax_json: taxJson,
      payment_json: paymentJson,
      created_at: now,
      updated_at: now,
    });
  return (await getContributorProfile(input.userId))!;
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
