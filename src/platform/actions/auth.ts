'use server';
import { redirect } from 'next/navigation';
import { db } from '../db';
import { adminExists, safeNext, checkPassword, checkLoginCode, clearAttempts, currentUser, endSession, hasGate, hashPassword, homeFor, newLoginCode, noteAttempt, setGatePassword, startSession, tooMany, unlockGate, type Role } from '../auth';
import { mailConfigured, sendMail, wrap } from '../mail';
import { CATEGORIES, clean, qs } from '../util';

/** Versions of the legal documents people accept at sign-up (bump when Asteria publishes new versions). */
const TERMS = { couple: 'terms-2026-11-22', supplier: 'supplier-terms-1.0-2026-11-22' };
const emailOk = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

export async function unlockAction(fd: FormData) {
  const ok = await unlockGate(clean(fd.get('password'), 200));
  const next = safeNext(fd.get('next'));
  redirect(ok ? next || '/platform' : '/platform' + qs({ e: 'That password isn’t right', next }));
}

export async function loginAction(fd: FormData) {
  if (!(await hasGate())) redirect('/platform');
  const email = clean(fd.get('email'), 200).toLowerCase();
  const pw = clean(fd.get('password'), 200);
  const back = fd.get('back') === 'admin' ? '/admin/login' : '/platform/login';
  const key = 'pw:' + email;
  if (await tooMany(key, 5, 15)) redirect(back + qs({ e: 'Too many wrong passwords. Wait 15 minutes, or sign in with an email code instead.', email }));
  const sql = await db();
  const [u] = await sql<{ id: string; role: Role; password_hash: string; status: string }[]>`select id, role, password_hash, status from users where email = ${email}`;
  if (!u || !(await checkPassword(pw, u.password_hash))) { await noteAttempt(key); redirect(back + qs({ e: 'Email or password not recognised', email })); }
  if (u.status !== 'active') redirect(back + qs({ e: 'This account has been suspended — contact hello@asteria-events.com' }));
  await clearAttempts(key);
  await startSession(u);
  redirect(homeFor(u.role));
}

export async function signupAction(fd: FormData) {
  if (!(await hasGate())) redirect('/platform');
  const role = fd.get('role') === 'supplier' ? 'supplier' : 'couple';
  const name = clean(fd.get('name'), 120);
  const email = clean(fd.get('email'), 200).toLowerCase();
  const pw = clean(fd.get('password'), 200);
  const back = (e: string) => redirect('/platform/signup' + qs({ role, e, name, email }));
  if (!name) back('Please add your name');
  if (!emailOk(email)) back('Please enter a valid email address');
  if (pw.length < 8) back('Use a password of at least 8 characters');
  if (!fd.get('terms')) back(role === 'supplier' ? 'Please accept the Supplier Terms to continue' : 'Please confirm you’re 18 or over and accept the Terms of Use');
  let business = '', category = '';
  if (role === 'supplier') {
    business = clean(fd.get('business'), 120); category = clean(fd.get('category'), 60);
    if (!business) back('Please add your business name');
    if (!(CATEGORIES as readonly string[]).includes(category)) back('Please choose your category');
  }
  const sql = await db();
  const [exists] = await sql`select 1 from users where email = ${email}`;
  if (exists) back('An account with that email already exists — log in instead');
  const hash = await hashPassword(pw);
  const id = await sql.begin(async (tx) => {
    const [u] = await tx<{ id: string }[]>`insert into users (email, password_hash, name, role, terms_version, terms_accepted_at) values (${email}, ${hash}, ${name}, ${role}, ${role === 'supplier' ? TERMS.supplier : TERMS.couple}, now()) returning id`;
    if (role === 'supplier') {
      await tx`insert into suppliers (user_id, name, category, region, town) values (${u.id}, ${business}, ${category}, ${clean(fd.get('region'), 60)}, ${clean(fd.get('town'), 80)})`;
      const admins = await tx<{ id: string }[]>`select id from users where role = 'admin'`;
      for (const a of admins) await tx`insert into notifications (user_id, body, link) values (${a.id}, ${`New supplier sign-up: ${business} (${category}) — waiting for approval`}, '/admin/suppliers')`;
    } else {
      await tx`insert into weddings (user_id, names) values (${u.id}, ${name})`;
    }
    return u.id;
  });
  await startSession({ id, role });
  redirect(role === 'supplier' ? '/platform/supplier/listing?m=' + encodeURIComponent('Welcome! Set up your listing — Asteria will approve it before couples can see it.') : '/platform/couple/settings?welcome=1');
}

export async function logoutAction(fd?: FormData) {
  await endSession();
  redirect(fd?.get('to') === 'admin' ? '/admin/login' : '/platform/login');
}

/** One-time setup: first admin account + the platform password. Only works while no admin exists. */
export async function setupAction(fd: FormData) {
  if (await adminExists()) redirect('/admin/login');
  const name = clean(fd.get('name'), 120);
  const email = clean(fd.get('email'), 200).toLowerCase();
  const pw = clean(fd.get('password'), 200);
  const gate = clean(fd.get('gate'), 200);
  const back = (e: string) => redirect('/admin/setup' + qs({ e, name, email }));
  if (!emailOk(email)) back('Please enter a valid email address');
  if (pw.length < 10) back('Admin password must be at least 10 characters');
  if (gate.length < 6) back('Platform password must be at least 6 characters');
  const sql = await db();
  const [u] = await sql<{ id: string }[]>`insert into users (email, password_hash, name, role) values (${email}, ${await hashPassword(pw)}, ${name || 'Asteria admin'}, 'admin')
    on conflict (email) do update set role = 'admin', password_hash = excluded.password_hash returning id`;
  await setGatePassword(gate);
  await unlockGate(gate);
  await startSession({ id: u.id, role: 'admin' });
  redirect('/admin?m=' + encodeURIComponent('Setup complete — share the platform password only with people testing Asteria.'));
}

export async function changePasswordAction(fd: FormData) {
  const u = await currentUser();
  if (!u) redirect('/platform/login');
  const cur = clean(fd.get('current'), 200); const next = clean(fd.get('next'), 200);
  const back = fd.get('back') ? String(fd.get('back')) : '/platform';
  const sql = await db();
  const [r] = await sql<{ password_hash: string }[]>`select password_hash from users where id = ${u.id}`;
  if (!(await checkPassword(cur, r.password_hash))) redirect(back + qs({ e: 'Current password is wrong' }));
  if (next.length < 8) redirect(back + qs({ e: 'New password must be at least 8 characters' }));
  await sql`update users set password_hash = ${await hashPassword(next)} where id = ${u.id}`;
  redirect(back + qs({ m: 'Password changed' }));
}

/* ---------------- sign in with an email code ---------------- */
const codePage = (admin: boolean) => (admin ? '/admin/login/code' : '/platform/login/code');

export async function sendCodeAction(fd: FormData) {
  if (!(await hasGate())) redirect('/platform');
  const admin = fd.get('back') === 'admin';
  const email = clean(fd.get('email'), 200).toLowerCase();
  const page = codePage(admin);
  if (!mailConfigured()) redirect(page + qs({ e: 'Email sign-in isn’t switched on yet — contact hello@asteria-events.com' }));
  if (!emailOk(email)) redirect(page + qs({ e: 'Please enter a valid email address', email }));
  const key = 'code:' + email;
  if (await tooMany(key, 3, 15)) redirect(page + qs({ e: 'We’ve sent a few codes already. Wait 15 minutes and try again.', email }));
  await noteAttempt(key);
  const sql = await db();
  const [u] = await sql<{ id: string; name: string; status: string }[]>`select id, name, status from users where email = ${email}`;
  if (u && u.status === 'active') {
    const code = await newLoginCode(u.id);
    await sendMail(email, `${code} is your Asteria sign-in code`, wrap('Your sign-in code',
      `<p>Hi${u.name ? ' ' + u.name.replace(/[<>&"]/g, '') : ''},</p><p>Use this code to sign in to Asteria:</p>
       <p style="font-size:32px;letter-spacing:.3em;font-weight:bold;color:#2a2a1e;margin:18px 0">${code}</p>
       <p>It works once and expires in 10 minutes. If you didn’t ask for it, you can ignore this email — your account is safe.</p>`));
  }
  // same answer whether or not the email has an account
  redirect(page + qs({ email, sent: '1' }));
}

export async function verifyCodeAction(fd: FormData) {
  if (!(await hasGate())) redirect('/platform');
  const admin = fd.get('back') === 'admin';
  const email = clean(fd.get('email'), 200).toLowerCase();
  const code = clean(fd.get('code'), 20).replace(/\D/g, '');
  const page = codePage(admin);
  const fail = (e: string) => redirect(page + qs({ email, sent: '1', e }));
  if (code.length !== 6) fail('Enter the 6-digit code from the email');
  const sql = await db();
  const [u] = await sql<{ id: string; role: Role; status: string }[]>`select id, role, status from users where email = ${email}`;
  if (!u) fail('That code isn’t right, or it has expired — request a new one');
  if (u.status !== 'active') fail('This account has been suspended — contact hello@asteria-events.com');
  const r = await checkLoginCode(u.id, code);
  if (r === 'expired') redirect(page + qs({ email, e: 'That code has expired or had too many tries — request a new one' }));
  if (r === 'wrong') fail('That code isn’t right — check the email and try again');
  await clearAttempts('pw:' + email);
  await sql`update users set reset_allowed_until = now() + interval '15 minutes' where id = ${u.id}`;
  await startSession(u);
  redirect('/platform/new-password');
}

/** Straight after signing in with a code, people can set a new password without the old one. */
export async function setNewPasswordAction(fd: FormData) {
  const u = await currentUser();
  if (!u) redirect('/platform/login');
  const sql = await db();
  const [r] = await sql<{ ok: boolean }[]>`select coalesce(reset_allowed_until > now(), false) as ok from users where id = ${u.id}`;
  if (!r?.ok) redirect(homeFor(u.role));
  const next = clean(fd.get('next'), 200);
  if (next.length < (u.role === 'admin' ? 10 : 8)) redirect('/platform/new-password' + qs({ e: `Use at least ${u.role === 'admin' ? 10 : 8} characters` }));
  if (next !== clean(fd.get('confirm'), 200)) redirect('/platform/new-password' + qs({ e: 'The two passwords don’t match' }));
  await sql`update users set password_hash = ${await hashPassword(next)}, reset_allowed_until = null where id = ${u.id}`;
  redirect(homeFor(u.role) + qs({ m: 'New password saved' }));
}
