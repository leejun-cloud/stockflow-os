import path from 'node:path';
import { mkdirSync, readFileSync } from 'node:fs';
import Database from 'better-sqlite3';

const dataDir = path.join(process.cwd(), '.data');
const uploadsDir = path.join(dataDir, 'uploads');
const exportsDir = path.join(dataDir, 'exports');
const dbPath = path.join(dataDir, 'stockflow.db');
const schemaPath = path.join(process.cwd(), 'db', 'schema.sql');

mkdirSync(uploadsDir, { recursive: true });
mkdirSync(exportsDir, { recursive: true });

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');
db.exec(readFileSync(schemaPath, 'utf8'));

export { db, dataDir, uploadsDir, exportsDir };
