'use server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { db } from '../db';
import { requireUser, type User } from '../auth';
import { bookingById, notify, supplierById, supplierFree, type Booking, type Supplier } from '../data';
import { clean, depositOf, fmtDate, gbp, num, qs } from '../util';

type Access = { u: User; b: Booking; sup: Supplier; side: 'supplier' | 'couple' | 'admin' };
async function access(id: string): Promise<Access> {
  const u = await requireUser();
  const b = await bookingById(id);
  if (!b) redirect('/platform');
  const sup = (await supplierById(b.supplier_id))!;
  const side = u.role === 'admin' ? 'admin' : sup.user_id === u.id ? 'supplier' : b.couple_user_id === u.id ? 'couple' : null;
  if (!side) redirect('/platform');
  return { u, b, sup, side };
}
const pathFor = (a: Access) => (a.side === 'couple' ? `/platform/couple/bookings/${a.b.id}` : a.side === 'admin' ? '/admin/bookings' : `/platform/supplier/enquiries/${a.b.id}`);
const done = (a: Access, k: 'm' | 'e', msg: string) => { revalidatePath(pathFor(a)); redirect(pathFor(a) + qs({ [k]: msg })); };
async function note(bookingId: string, body: string) {
  const sql = await db();
  await sql`insert into messages (booking_id, kind, body, read_couple, read_supplier) values (${bookingId}, 'note', ${body}, false, false)`;
}
const otherUser = (a: Access) => (a.side === 'couple' ? a.sup.user_id : a.b.couple_user_id);

export async function sendMessage(fd: FormData) {
  const a = await access(clean(fd.get('id'), 40));
  const body = clean(fd.get('body'), 4000);
  if (!body) done(a, 'e', 'Write a message first');
  const sql = await db();
  await sql`insert into messages (booking_id, sender_id, body, read_couple, read_supplier) values (${a.b.id}, ${a.u.id}, ${body}, ${a.side === 'couple'}, ${a.side === 'supplier'})`;
  await sql`update bookings set updated_at = now() where id = ${a.b.id}`;
  await notify(otherUser(a), `New message from ${a.side === 'couple' ? a.b.couple_name : a.sup.name}`, a.side === 'couple' ? `/platform/supplier/enquiries/${a.b.id}` : `/platform/couple/bookings/${a.b.id}`);
  revalidatePath(pathFor(a));
  redirect(pathFor(a) + '#composer');
}

export async function sendContract(fd: FormData) {
  const a = await access(clean(fd.get('id'), 40));
  if (a.side !== 'supplier') done(a, 'e', 'Only the supplier can send the contract');
  if (!['enquiry', 'contract'].includes(a.b.status)) done(a, 'e', 'This booking is past the contract stage');
  const total = num(fd.get('total')) || a.b.total;
  const dep = Math.min(100, Math.max(0, num(fd.get('deposit_pct')) || a.b.deposit_pct));
  const weeks = Math.min(52, Math.max(0, num(fd.get('balance_weeks')) || a.b.balance_weeks));
  const terms = clean(fd.get('terms'), 20000);
  if (!terms) done(a, 'e', 'Add your contract terms before sending');
  const sql = await db();
  await sql`update bookings set total = ${total}, deposit_pct = ${dep}, balance_weeks = ${weeks}, contract_terms = ${terms}, status = 'contract',
    contract_sent_at = now(), contract_signed_at = null, updated_at = now() where id = ${a.b.id}`;
  await sql`insert into settings (key, value) values (${'terms:' + a.sup.id}, ${terms}) on conflict (key) do update set value = excluded.value`;
  await note(a.b.id, `Contract sent · ${gbp(total)} total · ${dep}% deposit (${gbp(Math.round((total * dep) / 100))}) to secure the date`);
  await notify(a.b.couple_user_id, `${a.sup.name} sent you their contract — review and sign it to book`, `/platform/couple/bookings/${a.b.id}`);
  done(a, 'm', 'Contract sent. The date stays open until the deposit is paid.');
}

export async function declineEnquiry(fd: FormData) {
  const a = await access(clean(fd.get('id'), 40));
  if (a.side !== 'supplier' || a.b.status !== 'enquiry') done(a, 'e', 'This enquiry can’t be declined now');
  const sql = await db();
  await sql`update bookings set status = 'declined', updated_at = now() where id = ${a.b.id}`;
  const reason = clean(fd.get('reason'), 500);
  await note(a.b.id, `Enquiry declined${reason ? ` — ${reason}` : ''}`);
  await notify(a.b.couple_user_id, `${a.sup.name} can’t take your booking for ${fmtDate(a.b.date)}`, `/platform/couple/bookings/${a.b.id}`);
  done(a, 'm', 'Enquiry declined');
}

export async function signContract(fd: FormData) {
  const a = await access(clean(fd.get('id'), 40));
  if (a.side !== 'couple' || a.b.status !== 'contract') done(a, 'e', 'There’s no contract waiting to be signed');
  if (!fd.get('agree')) done(a, 'e', 'Tick the box to confirm you agree to the contract');
  const signed = clean(fd.get('signature'), 120);
  if (!signed) done(a, 'e', 'Type your full name to sign');
  const sql = await db();
  await sql`update bookings set contract_signed_at = now(), updated_at = now() where id = ${a.b.id}`;
  await note(a.b.id, `Contract signed by ${signed} · deposit of ${gbp(depositOf(a.b))} now due`);
  await notify(a.sup.user_id, `${a.b.couple_name} signed your contract — the deposit is now due`, `/platform/supplier/enquiries/${a.b.id}`);
  done(a, 'm', 'Contract signed. Pay the deposit to secure your date.');
}

export async function recordPayment(fd: FormData) {
  const a = await access(clean(fd.get('id'), 40));
  if (a.side !== 'supplier' && a.side !== 'admin') done(a, 'e', 'Only the supplier can record payments');
  if (['declined', 'cancelled', 'enquiry'].includes(a.b.status)) done(a, 'e', 'Send the contract before recording payments');
  const amount = num(fd.get('amount'));
  if (amount <= 0) done(a, 'e', 'Enter the amount received');
  const paid = a.b.paid + amount;
  let status = a.b.status;
  if (a.b.total > 0 && paid >= a.b.total) status = 'paid';
  else if (paid >= depositOf(a.b)) status = 'deposit';
  if ((status === 'deposit' || status === 'paid') && a.b.status === 'contract' && !(await supplierFree(a.b.supplier_id, a.b.date, a.b.id)))
    done(a, 'e', `${fmtDate(a.b.date)} is already held by another booking — cancel that one first`);
  const sql = await db();
  await sql`insert into payments (booking_id, kind, amount, method, reference) values (${a.b.id}, ${clean(fd.get('kind'), 30) || 'payment'}, ${amount}, ${clean(fd.get('method'), 30) || 'manual'}, ${clean(fd.get('reference'), 120)})`;
  await sql`update bookings set paid = ${paid}, status = ${status}, updated_at = now() where id = ${a.b.id}`;
  const held = status !== a.b.status && status === 'deposit';
  await note(a.b.id, `${gbp(amount)} payment received${held ? ' · date now held' : status === 'paid' && a.b.status !== 'paid' ? ' · fully paid' : ''}`);
  await notify(a.b.couple_user_id, `${a.sup.name} confirmed your ${gbp(amount)} payment${held ? ' — your date is booked!' : ''}`, `/platform/couple/bookings/${a.b.id}`);
  done(a, 'm', held ? 'Payment recorded — the date is now held' : 'Payment recorded');
}

export async function cancelBooking(fd: FormData) {
  const a = await access(clean(fd.get('id'), 40));
  if (['declined', 'cancelled'].includes(a.b.status)) done(a, 'e', 'Already closed');
  const sql = await db();
  await sql`update bookings set status = 'cancelled', updated_at = now() where id = ${a.b.id}`;
  const reason = clean(fd.get('reason'), 500);
  const who = a.side === 'couple' ? a.b.couple_name : a.side === 'supplier' ? a.sup.name : 'Asteria';
  await note(a.b.id, `Booking cancelled by ${who}${reason ? ` — ${reason}` : ''}`);
  await notify(otherUser(a), `${who} cancelled the booking for ${fmtDate(a.b.date)}`, a.side === 'couple' ? `/platform/supplier/enquiries/${a.b.id}` : `/platform/couple/bookings/${a.b.id}`);
  if (a.side === 'supplier' || a.side === 'admin') await notify(a.b.couple_user_id, `${a.sup.name} booking cancelled`, `/platform/couple/bookings/${a.b.id}`);
  done(a, 'm', 'Booking cancelled');
}

export async function saveNote(fd: FormData) {
  const a = await access(clean(fd.get('id'), 40));
  if (a.side !== 'supplier') done(a, 'e', 'Not allowed');
  const sql = await db();
  await sql`update bookings set note = ${clean(fd.get('note'), 2000)} where id = ${a.b.id}`;
  done(a, 'm', 'Private note saved');
}
