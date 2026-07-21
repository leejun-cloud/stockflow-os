import { randomBytes } from 'node:crypto';
import { beforeAll, describe, expect, it } from 'vitest';
import { decryptSecret, encryptSecret } from '../src/lib/crypto';

beforeAll(() => {
  process.env.CREDENTIALS_KEY = randomBytes(32).toString('base64');
});

describe('credential crypto', () => {
  it('round-trips encrypt then decrypt', () => {
    const plaintext = 'super-secret-ftp-password';
    const encrypted = encryptSecret(plaintext);
    expect(decryptSecret(encrypted)).toBe(plaintext);
  });

  it('produces ciphertext that differs from the plaintext', () => {
    const plaintext = 'another-password';
    const encrypted = encryptSecret(plaintext);
    expect(encrypted).not.toContain(plaintext);
    expect(encrypted.split(':')).toHaveLength(3);
  });
});
