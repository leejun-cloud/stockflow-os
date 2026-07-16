import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';
import { createSession, createUser, deleteSession, findUserByEmail, findUserBySessionToken } from './repository';

export const SESSION_COOKIE = 'stockflow_session';

function hashPassword(password: string, salt = randomBytes(16).toString('hex')) {
  const hash = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, encoded: string) {
  const [salt, original] = encoded.split(':');
  const derived = scryptSync(password, salt, 64);
  return timingSafeEqual(Buffer.from(original, 'hex'), derived);
}

export async function registerUser(input: { email: string; password: string; name: string }) {
  const existing = await findUserByEmail(input.email);
  if (existing) throw new Error('이미 가입된 이메일입니다.');
  const user = await createUser({
    email: input.email.toLowerCase().trim(),
    name: input.name.trim(),
    passwordHash: hashPassword(input.password),
  });
  await createSessionForUser(user.id);
  return user;
}

export async function loginUser(input: { email: string; password: string }) {
  const user = await findUserByEmail(input.email.toLowerCase().trim());
  if (!user || !('passwordHash' in user) || !verifyPassword(input.password, user.passwordHash as string)) {
    throw new Error('이메일 또는 비밀번호가 올바르지 않습니다.');
  }
  await createSessionForUser(user.id);
  return user;
}

export async function createSessionForUser(userId: string) {
  const token = randomBytes(32).toString('hex');
  await createSession(userId, token);
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.COOKIE_SECURE === 'true' || Boolean(process.env.VERCEL),
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function logoutCurrentUser() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) await deleteSession(token);
  jar.set(SESSION_COOKIE, '', { path: '/', maxAge: 0 });
}

export async function getCurrentUser() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return findUserBySessionToken(token);
}
