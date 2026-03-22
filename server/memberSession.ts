import crypto from 'crypto';
import { parse as parseCookie, serialize } from 'cookie';
import type { Request, Response } from 'express';
import type { Member } from '../drizzle/schema';

export const MEMBER_SESSION_COOKIE = 'hakji_member_session';
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

function getSessionSecret() {
  return process.env.MEMBER_SESSION_SECRET || process.env.JWT_SECRET || 'dev-member-session-secret-change-me';
}

function base64Url(input: Buffer | string) {
  return Buffer.from(input).toString('base64url');
}

function sign(payload: string) {
  return base64Url(crypto.createHmac('sha256', getSessionSecret()).update(payload).digest());
}

export type MemberSession = {
  memberId: number;
  username: string;
  name: string;
  exp: number;
};

export function createMemberSessionToken(member: Pick<Member, 'id' | 'username' | 'name'>) {
  const payload: MemberSession = {
    memberId: member.id,
    username: member.username,
    name: member.name,
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
  };

  const encodedPayload = base64Url(JSON.stringify(payload));
  const signature = sign(encodedPayload);
  return `${encodedPayload}.${signature}`;
}

export function verifyMemberSessionToken(token?: string | null): MemberSession | null {
  if (!token) return null;
  const [encodedPayload, signature] = token.split('.');
  if (!encodedPayload || !signature) return null;

  const expected = sign(encodedPayload);
  if (signature.length !== expected.length) return null;
  const valid = crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  if (!valid) return null;

  const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8')) as MemberSession;
  if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) return null;
  return payload;
}

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

export function setMemberSessionCookie(req: Request, res: Response, member: Pick<Member, 'id' | 'username' | 'name'>) {
  res.cookie(MEMBER_SESSION_COOKIE, createMemberSessionToken(member), cookieOptions(req));
}

export function clearMemberSessionCookie(req: Request, res: Response) {
  res.clearCookie(MEMBER_SESSION_COOKIE, { ...cookieOptions(req), maxAge: 0 });
}

export function readMemberSessionFromRequest(req: Request) {
  const cookies = parseCookie(req.headers.cookie || '');
  return verifyMemberSessionToken(cookies[MEMBER_SESSION_COOKIE]);
}
