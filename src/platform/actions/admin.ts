'use server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { randomBytes } from 'node:crypto';
import { db } from '../db';
import { hashPassword, requireUser, setGatePassword, unlockGate } from '../auth';
import { notify } from '../data';
import { PLANS, clean, qs } from '../util';

const go = (path: string, k: 'm' | 'e', msg: string) => redirect(path + qs({ [k]: msg }));
const back = (fd: FormData, fallback: string) => { const b = clean(fd.get('back'), 200); return b.startsWith('/admin') ? b.split('?')[0] : fallback; };

export async function setSupplierStatus(fd: FormData) {
  await requireUser('admin');
  const id = clean(fd.get('id'), 40); const status = clean(fd.get('status'), 20);
  if (!['approved', 'pending', 'suspended'].includes(status)) go('/admin/suppliers', 'e', 'Unknown status');
  const sql = await db();
  const [s] = await sql<{ name: string; user_id: string }[]>`update suppliers set status = ${status} where id = ${id} returning name, user_id`;
  if (s && status === 'approved') await notify(s.user_id, 'Your listing is approved and now live on Asteria', '/platform/supplier/listing');
  if (s && status === 'suspended') await notify(s.user_id, 'Your listing has been hidden from couples — contact hello@asteria-events.com', '/platform/supplier');
  revalidatePath('/admin');
  go(back(fd, '/admin/suppliers'), 'm', `${s?.name ?? 'Supplier'} ${status === 'approved' ? 'approved — now live' : status === 'suspended' ? 'hidden' : 'set to pending'}`);
}

export async function setSupplierFlags(fd: FormData) {
  await requireUser('admin');
  const id = clean(fd.get('id'), 40);
  const plan = clean(fd.get('plan'), 20);
  const sql = await db();
  await sql`update suppliers set featured = ${fd.get('featured') === 'on'}, spotlight = ${fd.get('spotlight') === 'on'},
    plan = ${PLANS.some((p) => p.id === plan) ? plan : 'founding'} where id = ${id}`;
  revalidatePath('/admin/suppliers');
  go(back(fd, '/admin/suppliers'), 'm', 'Supplier updated');
}

export async function setUserStatus(fd: FormData) {
  const me = await requireUser('admin');
  const id = clean(fd.get('id'), 40); const status = fd.get('status') === 'suspended' ? 'suspended' : 'active';
  if (id === me.id) go('/admin/users', 'e', 'You can’t suspend your own account');
  const sql = await db();
  await sql`update users set status = ${status} where id = ${id}`;
  revalidatePath('/admin/users');
  go('/admin/users', 'm', status === 'suspended' ? 'Account suspended' : 'Account re-activated');
}

export async function resetUserPassword(fd: FormData) {
  await requireUser('admin');
  const id = clean(fd.get('id'), 40);
  const temp = randomBytes(6).toString('base64url');
  const sql = await db();
  const [u] = await sql<{ email: string }[]>`update users set password_hash = ${await hashPassword(temp)} where id = ${id} returning email`;
  revalidatePath('/admin/users');
  go('/admin/users', 'm', `Temporary password for ${u?.email}: ${temp} — send it to them; they can change it in their account.`);
}

export async function addAdmin(fd: FormData) {
  await requireUser('admin');
  const email = clean(fd.get('email'), 200).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) go('/admin/settings', 'e', 'Enter a valid email');
  const temp = randomBytes(6).toString('base64url');
  const sql = await db();
  const [ex] = await sql`select 1 from users where email = ${email}`;
  if (ex) go('/admin/settings', 'e', 'That email already has an account');
  await sql`insert into users (email, password_hash, name, role) values (${email}, ${await hashPassword(temp)}, ${clean(fd.get('name'), 120)}, 'admin')`;
  go('/admin/settings', 'm', `Admin added. Temporary password for ${email}: ${temp}`);
}

export async function changeGate(fd: FormData) {
  await requireUser('admin');
  const pw = clean(fd.get('gate'), 200);
  if (pw.length < 6) go('/admin/settings', 'e', 'Use at least 6 characters');
  await setGatePassword(pw);
  await unlockGate(pw);
  go('/admin/settings', 'm', 'Platform password changed — everyone else will need the new one');
}
