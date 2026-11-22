import { addDaysISO, todayISO } from './util';

export type Task = { key: string; title: string; due: string; done: boolean; auto?: boolean; cat?: string; note?: string };

/** months-before-the-wedding timeline; category tasks tick themselves off when that supplier is booked */
const TIMELINE: [number, string, string, string?][] = [
  [14, 'budget', 'Set your budget'],
  [13, 'guestlist', 'Draft your guest list'],
  [12, 'venue', 'Book your venue', 'Venues'],
  [11, 'photo', 'Book your photographer', 'Photographers'],
  [10, 'catering', 'Book your caterer', 'Catering'],
  [10, 'music', 'Book your band or DJ', 'Music'],
  [9, 'savedate', 'Send save-the-dates'],
  [9, 'attire', 'Choose your wedding outfits', 'Bridalwear'],
  [8, 'florist', 'Book your florist', 'Florists'],
  [7, 'hair', 'Book hair & make-up', 'Hair & make-up'],
  [6, 'cake', 'Order your cake', 'Cakes'],
  [6, 'transport', 'Arrange transport', 'Transport'],
  [5, 'invites', 'Send your invitations'],
  [4, 'rings', 'Buy your wedding rings'],
  [3, 'menu', 'Confirm menu & dietary needs'],
  [2, 'rsvp', 'Chase outstanding RSVPs'],
  [2, 'numbers', 'Give final numbers to suppliers'],
  [1, 'seating', 'Finalise the seating plan'],
  [0.25, 'timings', 'Send day-of timings to suppliers'],
];

export function buildTasks(date: string | null, bookedCats: Set<string>, ticked: Set<string>, opts: { guests: number; invitesSent: boolean; hasBudget: boolean }): Task[] {
  const wed = date || addDaysISO(todayISO(), 365);
  return TIMELINE.map(([months, key, title, cat]) => {
    const due = addDaysISO(wed, -Math.round(months * 30.4));
    let auto = false, done = ticked.has(key), note = '';
    if (cat && bookedCats.has(cat)) { auto = true; done = true; note = 'Booked'; }
    if (key === 'guestlist' && opts.guests >= 10) { auto = true; done = true; note = `${opts.guests} guests added`; }
    if (key === 'budget' && opts.hasBudget && !ticked.has(key)) { done = true; auto = true; note = 'Budget set'; }
    if (key === 'invites' && opts.invitesSent) { auto = true; done = true; note = 'E-invites sent'; }
    return { key, title, due, done, auto, cat, note };
  });
}

export function groupOf(due: string, wed: string | null) {
  if (!wed) return 'To do';
  const m = Math.round((new Date(wed).getTime() - new Date(due).getTime()) / (30.4 * 86400000));
  if (m >= 12) return '12+ months to go';
  if (m >= 9) return '9 – 12 months';
  if (m >= 6) return '6 – 9 months';
  if (m >= 3) return '3 – 6 months';
  if (m >= 1) return '1 – 3 months';
  return 'Final weeks';
}
