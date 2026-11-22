export const CATEGORIES = ['Venues', 'Photographers', 'Videographers', 'Catering', 'Florists', 'Music', 'Cakes', 'Hair & make-up', 'Bridalwear', 'Styling & decor', 'Stationery', 'Transport'] as const;
export const CAT_ICON: Record<string, string> = { Venues: 'home', Photographers: 'camera', Videographers: 'camera', Catering: 'layers', Florists: 'leaf', Music: 'music', Cakes: 'cake', 'Hair & make-up': 'brush', Bridalwear: 'heart', 'Styling & decor': 'sparkle', Stationery: 'mail', Transport: 'pin' };
export const REGIONS = ['London', 'South East', 'South West', 'East of England', 'East Midlands', 'West Midlands', 'Yorkshire', 'North West', 'North East', 'Wales', 'Scotland', 'Northern Ireland'];
export const STYLES = ['Rustic', 'Country house', 'Garden', 'Coastal', 'Classic', 'Modern', 'Boho', 'Luxury'];

export const gbp = (n: number) => '£' + Math.round(n || 0).toLocaleString('en-GB');
export const dateISO = (d: Date | string | null | undefined) => (!d ? '' : typeof d === 'string' ? d.slice(0, 10) : new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10));
export const fmtDate = (d: Date | string | null | undefined, opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' }) =>
  !d ? '—' : new Date(dateISO(d) + 'T12:00:00').toLocaleDateString('en-GB', opts);
export const fmtWhen = (d: Date | string) => {
  const t = new Date(d); const mins = Math.round((Date.now() - t.getTime()) / 60000);
  if (mins < 1) return 'Just now'; if (mins < 60) return `${mins} min ago`; if (mins < 60 * 24) return `${Math.round(mins / 60)}h ago`;
  if (mins < 60 * 24 * 7) return `${Math.round(mins / 1440)} days ago`;
  return t.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
};
export const daysUntil = (d: Date | string | null) => (!d ? 0 : Math.ceil((new Date(dateISO(d) + 'T12:00:00').getTime() - Date.now()) / 86400000));
export const addDaysISO = (iso: string, n: number) => { const t = new Date(iso + 'T12:00:00'); t.setDate(t.getDate() + n); return dateISO(t); };
export const todayISO = () => dateISO(new Date());

export type Pkg = { id: string; name: string; summary: string; price: number; per_guest: boolean; deposit: number; max_guests: number | null; hours: string; includes: string[] };
export type Extra = { id: string; name: string; price: number; per_guest: boolean };
export const pkgTotal = (p: { price: number; per_guest: boolean }, guests: number) => (p.per_guest ? p.price * guests : p.price);
export const extraTotal = (x: { price: number; per_guest: boolean }, guests: number) => (x.per_guest ? x.price * guests : x.price);

export const STATUS: Record<string, { label: string; couple: string; tone: 'new' | 'held' | 'ok' | 'done' | 'off' }> = {
  enquiry: { label: 'New enquiry', couple: 'Enquiry sent', tone: 'new' },
  contract: { label: 'Contract sent', couple: 'Contract to sign', tone: 'held' },
  deposit: { label: 'Deposit paid — date held', couple: 'Booked', tone: 'ok' },
  paid: { label: 'Fully paid', couple: 'Booked · fully paid', tone: 'done' },
  declined: { label: 'Declined', couple: 'Declined', tone: 'off' },
  cancelled: { label: 'Cancelled', couple: 'Cancelled', tone: 'off' },
};
export const isBooked = (s: string) => s === 'deposit' || s === 'paid';
export const depositOf = (b: { total: number; deposit_pct: number }) => Math.round((b.total * b.deposit_pct) / 100);
export const balanceDue = (b: { date: string | Date; balance_weeks: number }) => addDaysISO(dateISO(b.date), -7 * (b.balance_weeks ?? 8));

export const PLANS = [
  { id: 'founding', name: 'Founding Partner', rate: 0.03, monthly: 0 },
  { id: 'starter', name: 'Starter', rate: 0.05, monthly: 29 },
  { id: 'growth', name: 'Growth', rate: 0.04, monthly: 59 },
  { id: 'pro', name: 'Pro', rate: 0.03, monthly: 99 },
  { id: 'elite', name: 'Elite', rate: 0.02, monthly: 199 },
];
export const planOf = (id: string) => PLANS.find((p) => p.id === id) ?? PLANS[0];

export const clean = (v: FormDataEntryValue | null, max = 2000) => String(v ?? '').trim().slice(0, max);
export const num = (v: FormDataEntryValue | null) => { const n = parseInt(String(v ?? '').replace(/[^\d-]/g, ''), 10); return Number.isFinite(n) ? n : 0; };
export const qs = (o: Record<string, string>) => '?' + new URLSearchParams(o).toString();
