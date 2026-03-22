import crypto from 'crypto';
import { parse as parseCookie } from 'cookie';
import type { Request, Response } from 'express';

export const ADMIN_SESSION_COOKIE = 'hakji_admin_session';
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

function getSessionSecret() {
  return process.env.ADMIN_SESSION_SECRET || process.env.MEMBER_SESSION_SECRET || 'dev-admin-session-secret-change-me';
}

function getAdminCredentials() {
  return {
    username: process.env.ADMIN_USERNAME || '20253307',
    password: process.env.ADMIN_PASSWORD || '020406',
    name: process.env.ADMIN_NAME || '학생회실 관리자',
  };
}

function base64Url(input: Buffer | string) {
  return Buffer.from(input).toString('base64url');
}

function sign(payload: string) {
  return base64Url(crypto.createHmac('sha256', getSessionSecret()).update(payload).digest());
}

export type AdminSession = {
  username: string;
  name: string;
  role: 'admin';
  exp: number;
};

function isSecureRequest(req: Request) {
  if (req.protocol === 'https') return true;
  const forwardedProto = req.headers['x-forwarded-proto'];
  if (!forwardedProto) return false;
  const values = Array.isArray(forwardedProto) ? forwardedProto : forwardedProto.split(',');
  return values.some(v => v.trim().toLowerCase() === 'https');
}

function cookieOptions(req: Request) {
  return {
    httpOnly: true,
    path: '/',
    sameSite: 'lax' as const,
    secure: isSecureRequest(req),
    maxAge: SESSION_TTL_SECONDS,
  };
}

export function isValidAdminCredential(username: string, password: string) {
  const creds = getAdminCredentials();
  return username === creds.username && password === creds.password;
}

export function createAdminSessionToken() {
  const creds = getAdminCredentials();
  const payload: AdminSession = {
    username: creds.username,
    name: creds.name,
    role: 'admin',
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
  };
  const encodedPayload = base64Url(JSON.stringify(payload));
  const signature = sign(encodedPayload);
  return `${encodedPayload}.${signature}`;
}

export function verifyAdminSessionToken(token?: string | null): AdminSession | null {
  if (!token) return null;
  const [encodedPayload, signature] = token.split('.');
  if (!encodedPayload || !signature) return null;
  const expected = sign(encodedPayload);
  if (signature.length !== expected.length) return null;
  const valid = crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  if (!valid) return null;
  const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8')) as AdminSession;
  if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) return null;
  return payload;
}

export function setAdminSessionCookie(req: Request, res: Response) {
  res.cookie(ADMIN_SESSION_COOKIE, createAdminSessionToken(), cookieOptions(req));
}

export function clearAdminSessionCookie(req: Request, res: Response) {
  res.clearCookie(ADMIN_SESSION_COOKIE, { ...cookieOptions(req), maxAge: 0 });
}

export function readAdminSessionFromRequest(req: Request) {
  const cookies = parseCookie(req.headers.cookie || '');
  return verifyAdminSessionToken(cookies[ADMIN_SESSION_COOKIE]);
}

export function getAdminUserFromSession(req: Request) {
  const session = readAdminSessionFromRequest(req);
  if (!session) return null;
  return {
    id: 1,
    openId: `local-admin:${session.username}`,
    name: session.name,
    email: null,
    loginMethod: 'local-admin',
    role: 'admin' as const,
    createdAt: new Date(0),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };
}
