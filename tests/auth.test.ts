import { beforeEach, describe, expect, it, vi } from 'vitest';

// Firebase Admin은 서비스계정/네트워크가 필요하므로 mock 한다.
const decoded = { uid: 'firebase-uid-123', email: 'tester@example.com' };
vi.mock('../src/lib/firebase/admin', () => ({
  verifyIdToken: vi.fn(async () => decoded),
  adminAuth: () => ({
    createSessionCookie: vi.fn(async () => 'session-cookie-value'),
    verifySessionCookie: vi.fn(async () => decoded),
  }),
}));

// next/headers cookie 저장소를 in-memory Map으로 대체.
const cookieStore = new Map<string, string>();
vi.mock('next/headers', () => ({
  cookies: async () => ({
    get: (key: string) => (cookieStore.has(key) ? { value: cookieStore.get(key) } : undefined),
    set: (key: string, value: string) => {
      if (value === '') cookieStore.delete(key);
      else cookieStore.set(key, value);
    },
  }),
}));

import { createSessionFromIdToken, getCurrentUser, logoutCurrentUser, SESSION_COOKIE } from '../src/lib/auth';

beforeEach(() => {
  cookieStore.clear();
});

describe('firebase auth', () => {
  it('creates a session cookie and lazily provisions the postgres/sqlite user', async () => {
    const user = await createSessionFromIdToken('id-token', 'Tester Name');
    expect(user.email).toBe('tester@example.com');
    expect(user.name).toBe('Tester Name');
    expect(cookieStore.get(SESSION_COOKIE)).toBe('session-cookie-value');
  });

  it('resolves the same user from the session cookie on getCurrentUser', async () => {
    const created = await createSessionFromIdToken('id-token', 'Tester Name');
    const current = await getCurrentUser();
    expect(current).not.toBeNull();
    expect(current!.id).toBe(created.id);
    expect(current!.email).toBe('tester@example.com');
  });

  it('returns null with no session cookie', async () => {
    expect(await getCurrentUser()).toBeNull();
  });

  it('clears the cookie on logout', async () => {
    await createSessionFromIdToken('id-token');
    await logoutCurrentUser();
    expect(cookieStore.has(SESSION_COOKIE)).toBe(false);
    expect(await getCurrentUser()).toBeNull();
  });
});
