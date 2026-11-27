import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';
import { createHmac, randomBytes, randomInt, timingSafeEqual } from 'node:crypto';
import { db, dbConfigured, getSetting, setSetting, setSettingIfMissing } from './db';

export type Role = 'couple' | 'supplier' | 'admin';
export type User = { id: string; email: string; name: string; role: Role; status: string };

const SESSION = 'ast_session';
const GATE = 'ast_gate';
const YEAR = 60 * 60 * 24 * 365;

/* ---------------- secret (generated once, stored in the database) ---------------- */
let secretCache: Uint8Array | null = null;
async function secret(): Promise<Uint8Array> {
  if (secretCache) return secretCache;
  let s = process.env.AUTH_SECRET || (await getSetting('auth_secret'));
  if (!s) { await setSettingIfMissing('auth_secret', randomBytes(32).toString('hex')); s = (await getSetting('auth_secret'))!; }
  secretCache = new TextEncoder().encode(s);
  return secretCache;
}
async function sign(payload: Record<string, unknown>, maxAge: number) {
  return new SignJWT(payload).setProtectedHeader({ alg: 'HS256' }).setIssuedAt().setExpirationTime(`${maxAge}s`).sign(await secret());
}
async function verify<T>(token: string | undefined): Promise<T | null> {
  if (!token) return null;
  try { return (await jwtVerify(token, await secret())).payload as T; } catch { return null; }
}
const cookieOpts = (maxAge: number) => ({ httpOnly: true, sameSite: 'lax' as const, secure: process.env.NODE_ENV === 'production', path: '/', maxAge });

/* ---------------- passwords ---------------- */
export const hashPassword = (p: string) => bcrypt.hash(p, 10);
export const checkPassword = (p: string, h: string) => bcrypt.compare(p, h);

/* ---------------- platform password gate ---------------- */
export async function gateConfigured() { return !!(await getSetting('gate_hash')); }
export async function setGatePassword(pw: string) {
  await setSetting('gate_hash', await hashPassword(pw));
  await setSetting('gate_version', String(Date.now()));
}
/** When the platform is public (Admin → Settings), nobody needs the platform password. */
export async function platformPublic() { return (await getSetting('gate_open')) === '1'; }
export async function hasGate(): Promise<boolean> {
  if (await platformPublic()) return true;
  const v = await getSetting('gate_version');
  if (!v) return false;
  const p = await verify<{ g: string }>((await cookies()).get(GATE)?.value);
  return p?.g === v;
}
export async function unlockGate(pw: string): Promise<boolean> {
  const h = await getSetting('gate_hash');
  if (!h || !(await checkPassword(pw, h))) return false;
  const v = (await getSetting('gate_version'))!;
  (await cookies()).set(GATE, await sign({ g: v }, YEAR), cookieOpts(YEAR));
  return true;
}

/* ---------------- sessions ---------------- */
export async function startSession(u: { id: string; role: Role }) {
  (await cookies()).set(SESSION, await sign({ uid: u.id, role: u.role }, 60 * 60 * 24 * 30), cookieOpts(60 * 60 * 24 * 30));
  const sql = await db();
  await sql`update users set last_login = now() where id = ${u.id}`;
}
export async function endSession() { (await cookies()).delete(SESSION); }

export async function currentUser(): Promise<User | null> {
  const p = await verify<{ uid: string }>((await cookies()).get(SESSION)?.value);
  if (!p?.uid) return null;
  const sql = await db();
  const [u] = await sql<User[]>`select id, email, name, role, status from users where id = ${p.uid}`;
  return u && u.status === 'active' ? u : null;
}

export const homeFor = (role: Role) => (role === 'admin' ? '/admin' : role === 'supplier' ? '/platform/supplier' : '/platform/couple');

/** Use at the top of every protected page and server action. */
export async function requireUser(role?: Role | Role[]): Promise<User> {
  const roles = role ? (Array.isArray(role) ? role : [role]) : null;
  const adminOnly = !!roles && roles.length === 1 && roles[0] === 'admin';
  if (!dbConfigured() || !(await hasGate())) redirect(adminOnly ? '/platform?next=/admin/login' : '/platform');
  const u = await currentUser();
  if (!u) redirect(adminOnly ? '/admin/login' : '/platform/login');
  if (roles && !roles.includes(u.role)) redirect(adminOnly ? '/admin/login' : homeFor(u.role));
  return u;
}

/** Only allow redirects to our own pages. */
export const safeNext = (v: unknown) => (typeof v === 'string' && /^\/(platform|admin)(\/[\w\-/?=&]*)?$/.test(v) ? v : '');

export async function adminExists() {
  const sql = await db();
  const [r] = await sql<{ n: number }[]>`select count(*)::int as n from users where role = 'admin'`;
  return r.n > 0;
}

/* ---------------- rate limits ---------------- */
/** True when `key` has had `max` or more attempts in the last `minutes`. */
export async function tooMany(key: string, max: number, minutes: number) {
  const sql = await db();
  const [r] = await sql<{ n: number }[]>`select count(*)::int as n from auth_attempts where key = ${key} and at > now() - make_interval(mins => ${minutes})`;
  return r.n >= max;
}
export async function noteAttempt(key: string) {
  const sql = await db();
  await sql`insert into auth_attempts (key) values (${key})`;
  if (Math.random() < 0.05) await sql`delete from auth_attempts where at < now() - interval '1 day'`;
}
export async function clearAttempts(key: string) {
  const sql = await db();
  await sql`delete from auth_attempts where key = ${key}`;
}

/* ---------------- email sign-in codes ---------------- */
const hashCode = async (userId: string, code: string) => createHmac('sha256', Buffer.from(await secret())).update(`${userId}:${code}`).digest('hex');

/** Makes a new 6-digit code for the user (older codes stop working). */
export async function newLoginCode(userId: string) {
  const code = String(randomInt(0, 1_000_000)).padStart(6, '0');
  const sql = await db();
  await sql`update login_codes set used_at = now() where user_id = ${userId} and used_at is null`;
  await sql`insert into login_codes (user_id, code_hash, expires_at) values (${userId}, ${await hashCode(userId, code)}, now() + interval '10 minutes')`;
  return code;
}

/** Checks a code. Each code works once, for 10 minutes, with up to 5 tries. */
export async function checkLoginCode(userId: string, code: string): Promise<'ok' | 'wrong' | 'expired'> {
  const sql = await db();
  const [c] = await sql<{ id: string; code_hash: string; attempts: number }[]>`
    select id, code_hash, attempts from login_codes where user_id = ${userId} and used_at is null and expires_at > now() order by created_at desc limit 1`;
  if (!c || c.attempts >= 5) return 'expired';
  const a = Buffer.from(await hashCode(userId, code)); const b = Buffer.from(c.code_hash);
  if (a.length === b.length && timingSafeEqual(a, b)) {
    await sql`update login_codes set used_at = now() where id = ${c.id}`;
    return 'ok';
  }
  await sql`update login_codes set attempts = attempts + 1 where id = ${c.id}`;
  return c.attempts + 1 >= 5 ? 'expired' : 'wrong';
}
