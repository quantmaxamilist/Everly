'use server';
import { redirect } from 'next/navigation';
import { db } from '../db';
import { adminExists, safeNext, checkPassword, currentUser, endSession, hasGate, hashPassword, homeFor, setGatePassword, startSession, unlockGate, type Role } from '../auth';
import { CATEGORIES, clean, qs } from '../util';

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
  const sql = await db();
  const [u] = await sql<{ id: string; role: Role; password_hash: string; status: string }[]>`select id, role, password_hash, status from users where email = ${email}`;
  if (!u || !(await checkPassword(pw, u.password_hash))) redirect(back + qs({ e: 'Email or password not recognised', email }));
  if (u.status !== 'active') redirect(back + qs({ e: 'This account has been suspended — contact hello@asteria-events.com' }));
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
  if (!fd.get('terms')) back('Please agree to the terms and privacy policy');
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
    const [u] = await tx<{ id: string }[]>`insert into users (email, password_hash, name, role) values (${email}, ${hash}, ${name}, ${role}) returning id`;
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
