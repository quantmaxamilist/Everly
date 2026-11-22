'use server';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { db } from '../db';
import { requireUser } from '../auth';
import { extrasOf, notify, packagesOf, supplierById, supplierFree, weddingFor } from '../data';
import { sendMail, wrap, escapeHtml, mailConfigured } from '../mail';
import { REGIONS, clean, extraTotal, fmtDate, gbp, num, pkgTotal } from '../util';

async function me() {
  const u = await requireUser('couple');
  let w = await weddingFor(u.id);
  if (!w) {
    const sql = await db();
    await sql`insert into weddings (user_id, names) values (${u.id}, ${u.name}) on conflict do nothing`;
    w = (await weddingFor(u.id))!;
  }
  return { u, w };
}
const go = (path: string, k: 'm' | 'e', msg: string) => { const [p, h] = path.split('#'); return redirect(p + (p.includes('?') ? '&' : '?') + new URLSearchParams({ [k]: msg }).toString() + (h ? '#' + h : '')); };

export async function saveWedding(fd: FormData) {
  const { w } = await me();
  const date = clean(fd.get('date'), 10);
  const sql = await db();
  await sql`update weddings set names = ${clean(fd.get('names'), 120)}, date = ${/^\d{4}-\d{2}-\d{2}$/.test(date) ? date : null},
    region = ${REGIONS.includes(clean(fd.get('region'), 60)) ? clean(fd.get('region'), 60) : ''}, place = ${clean(fd.get('place'), 120)},
    guests = ${Math.max(0, Math.min(1000, num(fd.get('guests'))))}, budget = ${Math.max(0, num(fd.get('budget')))} where id = ${w.id}`;
  revalidatePath('/platform/couple');
  if (fd.get('welcome')) redirect('/platform/couple/explore?m=' + encodeURIComponent('Wedding saved — now find your suppliers'));
  go('/platform/couple/settings', 'm', 'Wedding details saved');
}

export async function toggleSaved(fd: FormData) {
  const { u } = await me();
  const sid = clean(fd.get('sid'), 40);
  const sql = await db();
  const [had] = await sql`delete from saved where user_id = ${u.id} and supplier_id = ${sid} returning 1`;
  if (!had) await sql`insert into saved (user_id, supplier_id) values (${u.id}, ${sid}) on conflict do nothing`;
  revalidatePath('/platform/couple');
  const back = clean(fd.get('back'), 300) || `/platform/couple/s/${sid}`;
  redirect(back.startsWith('/platform/couple') ? back : '/platform/couple');
}

export async function addToPlan(fd: FormData) {
  const { w } = await me();
  const sid = clean(fd.get('sid'), 40);
  const pid = clean(fd.get('package_id'), 40);
  const extras = fd.getAll('extras').map(String).filter((x) => /^[0-9a-f-]{36}$/i.test(x));
  const sql = await db();
  const [p] = await sql`select 1 from packages where id = ${pid} and supplier_id = ${sid}`;
  if (!p) go(`/platform/couple/s/${sid}`, 'e', 'Choose a package');
  await sql`insert into plan_items (wedding_id, supplier_id, package_id, extras) values (${w.id}, ${sid}, ${pid}, ${extras})
    on conflict (wedding_id, supplier_id) do update set package_id = excluded.package_id, extras = excluded.extras`;
  revalidatePath('/platform/couple/plan');
  go('/platform/couple/plan', 'm', 'Added to your plan');
}

export async function removeFromPlan(fd: FormData) {
  const { w } = await me();
  const sql = await db();
  await sql`delete from plan_items where id = ${clean(fd.get('id'), 40)} and wedding_id = ${w.id}`;
  revalidatePath('/platform/couple/plan');
  go('/platform/couple/plan', 'm', 'Removed from your plan');
}

export async function sendEnquiry(fd: FormData) {
  const { u, w } = await me();
  const sid = clean(fd.get('sid'), 40);
  const sup = await supplierById(sid);
  const back = `/platform/couple/s/${sid}`;
  if (!sup || sup.status !== 'approved') go('/platform/couple/explore', 'e', 'That supplier isn’t available');
  const pkgs = await packagesOf(sid);
  const pkg = pkgs.find((p) => p.id === clean(fd.get('package_id'), 40));
  if (!pkg) go(back + '#enquire', 'e', 'Choose a package');
  const date = clean(fd.get('date'), 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) go(back + '#enquire', 'e', 'Choose your wedding date');
  const guests = Math.max(1, num(fd.get('guests')) || w.guests);
  const message = clean(fd.get('message'), 3000);
  const exIds = fd.getAll('extras').map(String);
  const chosen = (await extrasOf(sid)).filter((x) => exIds.includes(x.id));
  const total = pkgTotal(pkg!, guests) + chosen.reduce((t, x) => t + extraTotal(x, guests), 0);
  const sql = await db();
  const [dupe] = await sql`select id from bookings where supplier_id = ${sid} and couple_user_id = ${u.id} and status in ('enquiry','contract','deposit','paid')`;
  if (dupe) redirect(`/platform/couple/bookings/${dupe.id}?m=` + encodeURIComponent('You already have an open request with this supplier'));
  const free = await supplierFree(sid, date);
  const [b] = await sql<{ id: string }[]>`insert into bookings (supplier_id, wedding_id, couple_user_id, couple_name, couple_email, couple_phone, date, guests, package_id, package_name, extras, total, deposit_pct, message)
    values (${sid}, ${w.id}, ${u.id}, ${w.names || u.name}, ${u.email}, ${clean(fd.get('phone'), 40)}, ${date}, ${guests}, ${pkg!.id}, ${pkg!.name},
    ${sql.json(chosen.map((x) => ({ name: x.name, price: extraTotal(x, guests) })))}, ${total}, ${pkg!.deposit}, ${message}) returning id`;
  await sql`delete from plan_items where wedding_id = ${w.id} and supplier_id = ${sid}`;
  if (!w.date) await sql`update weddings set date = ${date} where id = ${w.id}`;
  await notify(sup!.user_id, `New enquiry from ${w.names || u.name} for ${fmtDate(date)}${free ? '' : ' (that date is closed or booked on your calendar)'}`, `/platform/supplier/enquiries/${b.id}`);
  const [su] = await sql<{ email: string }[]>`select email from users where id = ${sup!.user_id}`;
  const host = (await headers()).get('host');
  await sendMail(su.email, `New enquiry: ${w.names || u.name} · ${fmtDate(date)}`, wrap('You have a new enquiry',
    `<p><b>${escapeHtml(w.names || u.name)}</b> would like to book <b>${escapeHtml(pkg!.name)}</b> for <b>${fmtDate(date)}</b> (${guests} guests, ${gbp(total)}).</p>${message ? `<p style="border-left:3px solid #ddd6c8;padding-left:12px">${escapeHtml(message)}</p>` : ''}`,
    { href: `https://${host}/platform/supplier/enquiries/${b.id}`, label: 'Reply on Asteria' }));
  revalidatePath('/platform/couple');
  redirect(`/platform/couple/bookings/${b.id}?m=` + encodeURIComponent(`Request sent to ${sup!.name}. They’ll reply here with their contract.`));
}

/* ---------------- guests ---------------- */
const G = '/platform/couple/guests';
export async function addGuest(fd: FormData) {
  const { w } = await me();
  const name = clean(fd.get('name'), 120);
  if (!name) go(G, 'e', 'Add the guest’s name');
  const sql = await db();
  await sql`insert into guests (wedding_id, name, side, plus_ones, dietary, email, phone) values (${w.id}, ${name}, ${clean(fd.get('side'), 40)},
    ${Math.min(5, Math.max(0, num(fd.get('plus_ones'))))}, ${clean(fd.get('dietary'), 200)}, ${clean(fd.get('email'), 200)}, ${clean(fd.get('phone'), 40)})`;
  revalidatePath(G);
  go(G, 'm', `${name} added`);
}
export async function updateGuest(fd: FormData) {
  const { w } = await me();
  const id = clean(fd.get('id'), 40);
  const rsvp = clean(fd.get('rsvp'), 10);
  const [state, plus] = rsvp.startsWith('yes') ? ['yes', num(rsvp.split('-')[1])] : [rsvp === 'no' ? 'no' : 'awaiting', 0];
  const sql = await db();
  await sql`update guests set rsvp = ${state}, plus_coming = least(plus_ones, ${plus}),
    dietary = coalesce(${fd.has('dietary') ? clean(fd.get('dietary'), 200) : null}, dietary) where id = ${id} and wedding_id = ${w.id}`;
  revalidatePath(G);
  redirect(G + (fd.get('f') ? `?f=${clean(fd.get('f'), 10)}` : ''));
}
export async function deleteGuest(fd: FormData) {
  const { w } = await me();
  const sql = await db();
  await sql`delete from guests where id = ${clean(fd.get('id'), 40)} and wedding_id = ${w.id}`;
  revalidatePath(G);
  go(G, 'm', 'Guest removed');
}
export async function sendInvites(fd: FormData) {
  const { w } = await me();
  if (!mailConfigured()) go(G, 'e', 'Email sending isn’t switched on yet — Asteria will enable it before launch');
  const sql = await db();
  const ids = fd.getAll('ids').map(String);
  const list = await sql<{ id: string; name: string; email: string }[]>`select id, name, email from guests where wedding_id = ${w.id} and email <> '' and id = any(${ids})`;
  const msg = clean(fd.get('message'), 2000);
  let sent = 0;
  for (const g of list) {
    const ok = await sendMail(g.email, `You’re invited — ${w.names}`, wrap(`${w.names} are getting married`,
      `<p>Dear ${escapeHtml(g.name)},</p><p>${escapeHtml(msg).replace(/\n/g, '<br>')}</p><p><b>${fmtDate(w.date, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</b>${w.place ? ` · ${escapeHtml(w.place)}` : ''}</p><p>Please reply to let them know if you can come.</p>`));
    if (ok) { sent++; await sql`update guests set invited = true where id = ${g.id}`; }
  }
  revalidatePath(G);
  go(G, sent ? 'm' : 'e', sent ? `Invites sent to ${sent} guest${sent === 1 ? '' : 's'}` : 'No invites were sent — check the guests have email addresses');
}

/* ---------------- checklist ---------------- */
export async function toggleTask(fd: FormData) {
  const { w } = await me();
  const key = clean(fd.get('key'), 60);
  const sql = await db();
  const [had] = await sql`delete from tasks_done where wedding_id = ${w.id} and key = ${key} returning 1`;
  if (!had) await sql`insert into tasks_done (wedding_id, key) values (${w.id}, ${key}) on conflict do nothing`;
  revalidatePath('/platform/couple/checklist');
  redirect('/platform/couple/checklist' + (fd.get('v') ? `?v=${clean(fd.get('v'), 10)}` : ''));
}

export async function markNotificationsRead() {
  const { u } = await me();
  const sql = await db();
  await sql`update notifications set read = true where user_id = ${u.id}`;
  revalidatePath('/platform/couple');
  redirect('/platform/couple');
}
