/**
 * Couple-side model for the preview: plans, statuses, messages, guests, tasks and payments.
 * Everything is sample data held in memory — nothing is saved or sent.
 */
import { suppliers, categories, catOne, pkgTotal, extraTotal, extrasFor, addDays, daysBetween, gbp, fmtDate, unavailable, TODAY, type Category, type Supplier, type Wedding } from './data';

export type Ref = { sid: string; pid: string; extras?: string[] };
/** Shortlisted → Enquiry sent → Contract sent (awaiting your response) → Booked · or Cancelled */
export type ItemStatus = 'Shortlisted' | 'Enquiry sent' | 'Contract sent' | 'Booked' | 'Cancelled';
export type PlanItem = Ref & { status: ItemStatus; paid?: number };
export type Plan = { id: string; name: string; items: PlanItem[] };

export const MGMT_LABEL: Record<ItemStatus, string> = { Shortlisted: 'Shortlisted', 'Enquiry sent': 'Enquired', 'Contract sent': 'Awaiting your response', Booked: 'Booked', Cancelled: 'Cancelled' };

export const find = (r: Ref) => { const sup = suppliers.find((x) => x.id === r.sid)!; return { sup, pkg: sup.packages.find((p) => p.id === r.pid)! }; };
export const isFree = (x: Supplier, date: string) => !unavailable(x).has(date);
export const itemTotal = (r: Ref, guests: number) => { const { sup, pkg } = find(r); return pkgTotal(pkg, guests) + extraTotal(sup, r.extras, guests); };
export const planTotal = (p: Plan, guests: number) => p.items.filter((i) => i.status !== 'Cancelled').reduce((t, i) => t + itemTotal(i, guests), 0);
export const extraNames = (r: Ref) => { const { sup } = find(r); return extrasFor(sup).filter((x) => (r.extras ?? []).includes(x.id)).map((x) => x.name); };
export const depositOf = (r: Ref, guests: number) => Math.round((itemTotal(r, guests) * find(r).pkg.deposit) / 100);

/** every supplier the couple has gone beyond shortlisting with, across all plans (one per supplier) */
export function weddingItems(plans: Plan[]): PlanItem[] {
  const seen = new Map<string, PlanItem>();
  for (const p of plans) for (const i of p.items) if (i.status !== 'Shortlisted' && !seen.has(i.sid)) seen.set(i.sid, i);
  return [...seen.values()].sort((a, b) => categories.indexOf(find(a).sup.category) - categories.indexOf(find(b).sup.category));
}

/* ---------------- messages ---------------- */
export type Msg = { from: 'you' | 'them' | 'note'; text: string; at: string; action?: 'contract' };
export type Threads = Record<string, Msg[]>;

/* ---------------- payments ---------------- */
export type Pay = { sid: string; label: 'Deposit' | 'Final balance'; amount: number; due: string; paid: boolean };
export function paymentsFor(items: PlanItem[], w: Wedding): Pay[] {
  const out: Pay[] = [];
  for (const i of items) {
    if (i.status !== 'Booked' && i.status !== 'Contract sent') continue;
    const total = itemTotal(i, w.guests); const dep = depositOf(i, w.guests); const paid = i.paid ?? 0;
    out.push({ sid: i.sid, label: 'Deposit', amount: dep, due: i.status === 'Booked' ? TODAY : addDays(TODAY, 7), paid: paid >= dep });
    if (i.status === 'Booked' && total > dep) out.push({ sid: i.sid, label: 'Final balance', amount: total - dep, due: addDays(w.date, -56), paid: paid >= total });
  }
  return out.sort((a, b) => Number(a.paid) - Number(b.paid) || a.due.localeCompare(b.due));
}

/* ---------------- guests ---------------- */
export type Rsvp = 'awaiting' | 'yes' | 'no';
export type Guest = { id: string; name: string; side: string; plusOnes: number; rsvp: Rsvp; plusComing: number; dietary: string; email?: string; phone?: string; invited: boolean };
export const rsvpLabel = (g: Guest) => (g.rsvp === 'yes' ? (g.plusComing ? `Attending with +${g.plusComing}` : 'Attending') : g.rsvp === 'no' ? 'Not able to attend' : 'Awaiting reply');
export const guestTotals = (gs: Guest[]) => {
  const invited = gs.reduce((t, g) => t + 1 + g.plusOnes, 0);
  const attending = gs.filter((g) => g.rsvp === 'yes').reduce((t, g) => t + 1 + g.plusComing, 0);
  const awaiting = gs.filter((g) => g.rsvp === 'awaiting').reduce((t, g) => t + 1 + g.plusOnes, 0);
  const declined = gs.filter((g) => g.rsvp === 'no').length;
  const dietary = gs.filter((g) => g.rsvp !== 'no' && g.dietary).length;
  return { invited, attending, awaiting, declined, dietary, people: gs.length };
};
export function sampleGuests(names: string): Guest[] {
  const [a, b] = names.split(/\s*&\s*/).map((x) => x.trim() || 'Partner');
  const rows: [string, string, number, Rsvp, number, string, boolean][] = [
    ['Margaret & David Hughes', a, 0, 'yes', 0, '', true], ['Ellie Hughes', a, 1, 'yes', 1, 'Vegetarian', true], ['Tom Hughes', a, 1, 'awaiting', 0, '', true],
    ['Aunt Carol', a, 0, 'yes', 0, 'Gluten-free', true], ['Josh & Amy Patel', a, 0, 'yes', 0, '', true], ['Rachel Green', a, 1, 'no', 0, '', true],
    ['Sam Taylor', a, 1, 'awaiting', 0, '', true], ['Grandma Joan', a, 0, 'yes', 0, 'Soft foods', true], ['Laura Bennett', a, 1, 'yes', 1, 'Vegan', true],
    ['Peter & Sue Morgan', b, 0, 'yes', 0, '', true], ['Hannah Morgan', b, 1, 'yes', 0, '', true], ['Ollie Morgan', b, 2, 'awaiting', 0, '', true],
    ['Uncle Rob', b, 1, 'yes', 1, 'Nut allergy', true], ['Chris & Dan Lee', b, 0, 'no', 0, '', true], ['Mia Roberts', b, 1, 'awaiting', 0, 'Vegetarian', false],
    ['Ben Carter', b, 1, 'yes', 1, '', true], ['Zoe Williams', 'Both', 0, 'awaiting', 0, '', false], ['Harry & Priya Shah', 'Both', 0, 'yes', 0, 'Halal', true],
  ];
  return rows.map(([name, side, plusOnes, rsvp, plusComing, dietary, invited], i) => {
    const first = name.split(/[ &]/)[0].toLowerCase();
    return { id: `g${i}`, name, side, plusOnes, rsvp, plusComing, dietary, invited, email: i % 3 === 2 ? undefined : `${first}${i}@example.com`, phone: i % 3 === 2 || i % 4 === 0 ? `07700 900${String(300 + i * 7)}` : undefined };
  });
}

/* ---------------- checklist & timeline ---------------- */
export type Task = { id: string; title: string; due: string; cat?: Category; done: boolean; state?: string; auto?: boolean; sid?: string };
const plan: [number, string, Category?][] = [
  [13, 'Set your budget'], [12, 'Start your guest list'], [12, 'Book your venue', 'Venues'], [11, 'Book your photographer', 'Photographers'],
  [10, 'Book your caterer', 'Catering'], [10, 'Send save-the-dates'], [9, 'Book your band or DJ', 'Music'], [8, 'Book your florist', 'Florists'],
  [7, 'Choose your outfits'], [6, 'Book hair & make-up', 'Hair & make-up'], [6, 'Order your cake', 'Cakes'], [5, 'Book wedding transport'],
  [4, 'Give notice of marriage at the register office'], [3, 'Send your invitations'], [2, 'Buy your wedding rings'], [1, 'Chase outstanding RSVPs'],
  [1, 'Give final numbers to your venue & caterer'], [0.5, 'Finish the seating plan'], [0.25, 'Confirm timings with every supplier'],
];
export function buildTasks(w: Wedding, items: PlanItem[], ticked: Record<string, boolean>, ctx: { guests: number; invitesSent: boolean }): Task[] {
  const byCat = new Map(items.map((i) => [find(i).sup.category, i]));
  const tasks: Task[] = plan.map(([m, title, cat], idx) => {
    const id = `t${idx}`;
    const due = addDays(w.date, -Math.round(m * 30.4));
    if (cat) {
      const it = byCat.get(cat);
      const st = it?.status;
      return { id, title, due, cat, done: st === 'Booked', auto: true, state: st === 'Booked' ? `Booked — ${find(it!).sup.name}` : st === 'Contract sent' ? `Contract from ${find(it!).sup.name} to sign` : st === 'Enquiry sent' ? `Enquiry sent to ${find(it!).sup.name}` : st === 'Cancelled' ? 'Cancelled — find another' : undefined };
    }
    const autoDone = (title === 'Set your budget' && w.budget > 0) || (title === 'Start your guest list' && ctx.guests > 0) || (title === 'Send your invitations' && ctx.invitesSent);
    return { id, title, due, done: autoDone || !!ticked[id], auto: autoDone };
  });
  for (const i of items) {
    if (i.status !== 'Booked') continue;
    const total = itemTotal(i, w.guests);
    if ((i.paid ?? 0) < total) tasks.push({ id: `pay-${i.sid}`, title: `Pay ${find(i).sup.name} — ${gbp(total - (i.paid ?? 0))} balance`, due: addDays(w.date, -56), done: false, sid: i.sid });
  }
  return tasks.sort((a, b) => a.due.localeCompare(b.due));
}
export function timelineGroup(due: string, wedding: string) {
  const m = daysBetween(due, wedding) / 30.4;
  return m >= 12 ? '12+ months to go' : m >= 9 ? '9 – 12 months' : m >= 6 ? '6 – 9 months' : m >= 3 ? '3 – 6 months' : m >= 1 ? '1 – 3 months' : 'The final month';
}

/* ---------------- demo: jump ahead to a booked wedding ---------------- */
export function seedBookedWedding(w: Wedding): { items: PlanItem[]; threads: Threads } {
  const want: [Category, ItemStatus][] = [['Venues', 'Booked'], ['Photographers', 'Booked'], ['Catering', 'Contract sent'], ['Florists', 'Enquiry sent'], ['Music', 'Booked'], ['Cakes', 'Cancelled'], ['Hair & make-up', 'Shortlisted']];
  const items: PlanItem[] = [];
  const threads: Threads = {};
  const date = fmtDate(w.date, { day: 'numeric', month: 'long', year: 'numeric' });
  for (const [cat, status] of want) {
    const opts = suppliers.filter((x) => x.category === cat && (x.region === w.region || x.travels) && (!x.capacity || x.capacity >= w.guests) && isFree(x, w.date));
    const sup = opts.sort((a, b) => b.rating - a.rating)[0] ?? suppliers.find((x) => x.category === cat)!;
    const pkg = [...sup.packages].sort((a, b) => pkgTotal(a, w.guests) - pkgTotal(b, w.guests))[0];
    const r: Ref = { sid: sup.id, pid: pkg.id };
    const dep = depositOf(r, w.guests);
    items.push({ ...r, status, paid: status === 'Booked' ? (cat === 'Music' ? itemTotal(r, w.guests) : dep) : 0 });
    if (status === 'Shortlisted') continue;
    const t: Msg[] = [{ from: 'you', text: `Hi ${sup.name}! We're getting married on ${date} with around ${w.guests} guests and love the ${pkg.name}. Is the date free?`, at: '3 weeks ago' }];
    if (status !== 'Enquiry sent') t.push({ from: 'them', text: `Lovely to hear from you! ${date} is available. I've sent our contract — sign it and pay the ${pkg.deposit}% deposit to secure your date.`, at: '3 weeks ago', action: status === 'Contract sent' ? 'contract' : undefined });
    if (status === 'Booked') t.push({ from: 'note', text: `Contract signed · ${gbp(dep)} deposit paid`, at: '2 weeks ago' }, { from: 'them', text: `Thank you — your date is secured! We'll be in touch nearer the time to go through the details.`, at: '2 weeks ago' });
    if (status === 'Cancelled') t.push({ from: 'note', text: 'Booking cancelled', at: '1 week ago' });
    if (status === 'Enquiry sent') t[0].at = 'Yesterday';
    threads[sup.id] = t;
  }
  return { items, threads };
}

export const whenLabel = (due: string) => {
  const n = daysBetween(TODAY, due);
  return n < 0 ? `${-n} day${n === -1 ? '' : 's'} overdue` : n === 0 ? 'Due today' : n < 45 ? `In ${n} day${n === 1 ? '' : 's'}` : fmtDate(due, { day: 'numeric', month: 'short', year: 'numeric' });
};
export { catOne };
