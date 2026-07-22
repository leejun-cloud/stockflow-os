import { cookies } from 'next/headers';
import type { UserRecord } from './domain';
import { adminAuth, verifyIdToken } from './firebase/admin';
import { createUserFromFirebase, getUserByFirebaseUid } from './repository';

export const SESSION_COOKIE = 'stockflow_session';
const SESSION_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 14; // 14 days

async function resolveUser(uid: string, email: string, name?: string): Promise<UserRecord> {
  const existing = await getUserByFirebaseUid(uid);
  if (existing) return existing;
  return createUserFromFirebase({
    uid,
    email,
    name: name?.trim() || email.split('@')[0] || 'User',
  });
}

export async function createSessionFromIdToken(idToken: string, name?: string): Promise<UserRecord> {
  const decoded = await verifyIdToken(idToken);
  const sessionCookie = await adminAuth().createSessionCookie(idToken, { expiresIn: SESSION_MAX_AGE_MS });
  const jar = await cookies();
  jar.set(SESSION_COOKIE, sessionCookie, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.COOKIE_SECURE === 'true' || Boolean(process.env.VERCEL),
    path: '/',
    maxAge: Math.floor(SESSION_MAX_AGE_MS / 1000),
  });
  return resolveUser(decoded.uid, decoded.email ?? '', name);
}

export async function logoutCurrentUser() {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, '', { path: '/', maxAge: 0 });
}

export async function getCurrentUser(): Promise<UserRecord | null> {
  const jar = await cookies();
  const cookie = jar.get(SESSION_COOKIE)?.value;
  if (!cookie) return null;
  try {
    const decoded = await adminAuth().verifySessionCookie(cookie, true);
    return resolveUser(decoded.uid, decoded.email ?? '');
  } catch {
    return null;
  }
}
