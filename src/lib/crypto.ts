import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

// AES-256-GCM at-rest encryption for agency credential passwords.
// Key comes from env CREDENTIALS_KEY (32 bytes, base64-encoded).
// Stored format: base64(iv):base64(authTag):base64(ciphertext).

function getKey(): Buffer {
  const raw = process.env.CREDENTIALS_KEY;
  if (!raw) throw new Error('CREDENTIALS_KEY is not set');
  const key = Buffer.from(raw, 'base64');
  if (key.length !== 32) throw new Error('CREDENTIALS_KEY must be 32 bytes (base64-encoded)');
  return key;
}

export function encryptSecret(plaintext: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', getKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString('base64')}:${authTag.toString('base64')}:${ciphertext.toString('base64')}`;
}

export function decryptSecret(encoded: string): string {
  const [ivB64, tagB64, dataB64] = encoded.split(':');
  if (!ivB64 || !tagB64 || !dataB64) throw new Error('Malformed encrypted secret');
  const decipher = createDecipheriv('aes-256-gcm', getKey(), Buffer.from(ivB64, 'base64'));
  decipher.setAuthTag(Buffer.from(tagB64, 'base64'));
  return Buffer.concat([decipher.update(Buffer.from(dataB64, 'base64')), decipher.final()]).toString('utf8');
}
