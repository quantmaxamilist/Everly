/**
 * Everly. — site content + config.
 * Copy is DRAFT (written by Quantweb from the client brief) — client to approve.
 * Example venues/prices in the builder demo are illustrative, not real listings.
 */
const PREVIEW = process.env.NEXT_PUBLIC_PREVIEW === '1';

export const site = {
  name: 'Everly.',
  plainName: 'Everly',
  tagline: "Don't just plan your wedding. Build it.",
  description:
    'Everly is the UK wedding planning platform where couples build their wedding — venue, suppliers and budget — compare options side by side, then book and pay in one place.',
  url: process.env.NEXT_PUBLIC_SITE_URL || 'https://www.everly.co.uk', // TODO: confirm domain
  email: 'hello@everly.co.uk', // TODO: confirm inbox
  instagram: '', // TODO
};

/** Internal link. In the static preview build, links point at flat .html files. */
export function href(path: string) {
  if (!PREVIEW) return path;
  if (path.startsWith('#') || path.startsWith('http') || path.startsWith('mailto')) return path;
  const m = path.match(/^([^?#]*)(\?[^#]*)?(#.*)?$/)!;
  const clean = m[1] === '/' || m[1] === '' ? 'index' : m[1].replace(/^\//, '');
  return `${clean}.html${m[2] ?? ''}${m[3] ?? ''}`;
}

/** Public asset path (relative in the preview build). */
export function asset(path: string) {
  return PREVIEW ? path.replace(/^\//, '') : path;
}

export const nav = [
  { label: 'How it works', path: '/how-it-works' },
  { label: 'Couples', path: '/couples' },
  { label: 'Suppliers', path: '/suppliers' },
  { label: 'About', path: '/about' },
  { label: 'FAQs', path: '/faq' },
];

export const categories = ['Venues', 'Photographers', 'Catering', 'Florists', 'Music & DJs', 'Cakes', 'Hair & makeup', 'Cars', 'Stationery', 'Decor'];

/* ---------- Wedding Builder demo data (illustrative) ---------- */
export type Venue = { id: string; name: string; place: string; img: string; price: number; perGuest: number; capacity: number; tag: string };
export const venues: Venue[] = [
  { id: 'villa', name: 'The Stone Villa', place: 'Countryside estate', img: '/images/villa.jpg', price: 6500, perGuest: 0, capacity: 150, tag: 'Exclusive use' },
  { id: 'manor', name: 'Avenue House', place: 'Country manor', img: '/images/avenue.jpg', price: 8200, perGuest: 0, capacity: 180, tag: 'Gardens & ceremony room' },
  { id: 'garden', name: 'The Formal Gardens', place: 'Garden venue', img: '/images/gardens.jpg', price: 4800, perGuest: 0, capacity: 120, tag: 'Outdoor ceremony' },
];

export type Option = { id: string; group: string; name: string; detail: string; price: number; perGuest?: boolean };
export const options: Option[] = [
  { id: 'cat-a', group: 'Catering', name: 'Three-course wedding breakfast', detail: 'Per guest, drinks reception included', price: 72, perGuest: true },
  { id: 'cat-b', group: 'Catering', name: 'Sharing feast', detail: 'Per guest, long-table style', price: 58, perGuest: true },
  { id: 'pho-a', group: 'Photography', name: 'Full-day photography', detail: 'Prep to first dance, online gallery', price: 1650 },
  { id: 'pho-b', group: 'Photography', name: 'Ceremony & portraits', detail: '5 hours coverage', price: 950 },
  { id: 'flo-a', group: 'Flowers', name: 'Ceremony arch & table flowers', detail: 'Seasonal whites and greenery', price: 1400 },
  { id: 'flo-b', group: 'Flowers', name: 'Bridal party bouquets', detail: 'Bouquets and buttonholes', price: 520 },
  { id: 'mus-a', group: 'Music', name: 'Live band & DJ', detail: 'Two sets plus DJ until late', price: 1850 },
  { id: 'mus-b', group: 'Music', name: 'Evening DJ', detail: '7pm until midnight', price: 650 },
];

export const faqs = [
  { q: 'What is Everly?', a: 'Everly is a wedding planning platform where you build your wedding rather than just list it. Pick a venue, add suppliers and packages, and watch your total update as you go. When you are happy, you book and pay through Everly.' },
  { q: 'Is it free for couples?', a: 'Yes — creating an account, building and comparing weddings is free for couples.' },
  { q: 'Can I build more than one version of my wedding?', a: 'Yes. Create as many builds as you like — a summer villa wedding and a winter manor wedding, for example — and compare them side by side before you commit.' },
  { q: 'Do I need a budget to start?', a: 'No. Adding a budget is optional. If you do add one, Everly shows what is allocated and what is left as you build.' },
  { q: 'How do payments work?', a: 'Deposits and balances are paid securely by card through Everly using Stripe. Each supplier sets their own deposit, and you can see what is paid and what is due in My Wedding.' },
  { q: 'How do contracts work?', a: 'Suppliers can share their contract with you through Everly, and you can sign it online. Signed copies are saved to both accounts.' },
  { q: 'I am a supplier — how do I join?', a: 'Register your interest as a supplier and we will be in touch about listing your business, packages and availability ahead of launch.' },
  { q: 'Is there an app?', a: 'Everly launches on the web first, with iPhone and Android apps to follow using the same account.' },
];
