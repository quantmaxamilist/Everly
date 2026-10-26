/**
 * Demo data for the market-research previews (couple + supplier).
 * Everything here is FICTIONAL sample data — venues, suppliers, prices, couples and figures.
 */

export type Category = 'Venues' | 'Photographers' | 'Catering' | 'Florists' | 'Music';
export const categories: Category[] = ['Venues', 'Photographers', 'Catering', 'Florists', 'Music'];

export const regions = ['Cotswolds', 'Devon', 'Cornwall', 'Lake District', 'Yorkshire', 'London', 'Surrey', 'Scotland'];
export const styles = ['Rustic', 'Country house', 'Garden', 'Coastal', 'Classic', 'Modern'];

export type Package = {
  id: string;
  name: string;
  price: number;          // flat price (or per guest if perGuest)
  perGuest?: boolean;
  summary: string;
  includes: string[];
  hours?: string;
  maxGuests?: number;
  deposit: number;        // % due on booking
};

export type Supplier = {
  id: string;
  name: string;
  category: Category;
  region: string;
  town: string;
  style: string;
  rating: number;
  reviews: number;
  capacity?: number;
  img: string;
  gallery: string[];
  about: string;
  fromPrice: number;
  unavailable?: string[]; // ISO dates already booked
  packages: Package[];
};

export const suppliers: Supplier[] = [
  {
    id: 'stone-villa', name: 'The Stone Villa', category: 'Venues', region: 'Cotswolds', town: 'Chipping Campden', style: 'Country house',
    rating: 4.9, reviews: 128, capacity: 150, img: '/images/villa.jpg', gallery: ['/images/villa.jpg', '/images/table.jpg', '/images/arch.jpg'],
    about: 'A honey-stone farmhouse with olive groves, a walled garden for ceremonies and a long-table barn for the wedding breakfast. Exclusive use for your whole day.',
    fromPrice: 6500,
    packages: [
      { id: 'sv-day', name: 'Full Day Exclusive', price: 6500, summary: 'Exclusive use 10am – midnight', includes: ['Ceremony in the walled garden', 'Drinks reception on the terrace', 'Barn for wedding breakfast & evening', 'Tables, chairs & linen', 'Dedicated venue coordinator'], hours: '14 hrs', maxGuests: 150, deposit: 25 },
      { id: 'sv-weekend', name: 'Weekend Celebration', price: 9800, summary: 'Fri – Sun with 12 bedrooms', includes: ['Everything in Full Day Exclusive', 'Friday welcome evening', 'Sunday recovery brunch space', '12 bedrooms for 2 nights', 'Late licence until 1am'], hours: '3 days', maxGuests: 150, deposit: 25 },
      { id: 'sv-twilight', name: 'Twilight Wedding', price: 4200, summary: 'Ceremony from 4pm', includes: ['Ceremony in the walled garden', 'Barn for dinner & evening', 'Tables, chairs & linen', 'Venue coordinator'], hours: '8 hrs', maxGuests: 100, deposit: 25 },
    ],
    unavailable: ['2027-06-05', '2027-06-19', '2027-06-26'],
  },
  {
    id: 'avenue-house', name: 'Avenue House', category: 'Venues', region: 'Cotswolds', town: 'Stow-on-the-Wold', style: 'Classic',
    rating: 4.8, reviews: 94, capacity: 180, img: '/images/avenue.jpg', gallery: ['/images/avenue.jpg', '/images/setting.jpg'],
    about: 'A Georgian manor at the end of a tree-lined avenue, with a ceremony room, formal lawns and a ballroom for up to 180.',
    fromPrice: 8200,
    packages: [
      { id: 'ah-day', name: 'Manor Day', price: 8200, summary: 'Exclusive use 11am – midnight', includes: ['Ceremony room or lawn', 'Ballroom for dinner & dancing', 'Tables, chairs & linen', 'Venue coordinator', 'Bridal suite on the night'], hours: '13 hrs', maxGuests: 180, deposit: 30 },
      { id: 'ah-midweek', name: 'Midweek Manor', price: 6100, summary: 'Mon – Thu dates', includes: ['Ceremony room or lawn', 'Ballroom for dinner & dancing', 'Tables, chairs & linen', 'Venue coordinator'], hours: '12 hrs', maxGuests: 180, deposit: 30 },
    ],
    unavailable: ['2027-06-12'],
  },
  {
    id: 'formal-gardens', name: 'The Formal Gardens', category: 'Venues', region: 'Devon', town: 'Totnes', style: 'Garden',
    rating: 4.7, reviews: 61, capacity: 120, img: '/images/gardens.jpg', gallery: ['/images/gardens.jpg', '/images/aisle.jpg'],
    about: 'Parterre gardens and an orangery overlooking the Dart valley — made for outdoor ceremonies.',
    fromPrice: 4800,
    packages: [
      { id: 'fg-day', name: 'Garden Day', price: 4800, summary: 'Exclusive use 11am – 11pm', includes: ['Outdoor ceremony in the parterre', 'Orangery for dinner', 'Tables & chairs', 'Venue coordinator'], hours: '12 hrs', maxGuests: 120, deposit: 25 },
    ],
  },
  {
    id: 'meadow-light', name: 'Meadow & Light Photography', category: 'Photographers', region: 'Cotswolds', town: 'Cirencester', style: 'Rustic',
    rating: 5.0, reviews: 212, img: '/images/field.jpg', gallery: ['/images/field.jpg', '/images/couple.jpg', '/images/bouquet2.jpg'],
    about: 'Natural, documentary-style photography. We blend in, capture the real moments, and deliver a full online gallery within 6 weeks.',
    fromPrice: 950,
    packages: [
      { id: 'ml-half', name: 'Ceremony & Portraits', price: 950, summary: '5 hours coverage', includes: ['Ceremony & drinks reception', 'Couple portraits', '300+ edited photos', 'Online gallery'], hours: '5 hrs', deposit: 25 },
      { id: 'ml-full', name: 'Full Day Story', price: 1650, summary: 'Prep to first dance', includes: ['Bridal prep to first dance', 'Second photographer', '600+ edited photos', 'Online gallery', 'Engagement shoot'], hours: '10 hrs', deposit: 25 },
    ],
  },
  {
    id: 'golden-hour', name: 'Golden Hour Studio', category: 'Photographers', region: 'Devon', town: 'Exeter', style: 'Classic',
    rating: 4.8, reviews: 87, img: '/images/couple.jpg', gallery: ['/images/couple.jpg', '/images/field.jpg'],
    about: 'Timeless, editorial wedding photography across the South West.',
    fromPrice: 1100,
    packages: [
      { id: 'gh-full', name: 'Signature Day', price: 1450, summary: '8 hours coverage', includes: ['Ceremony to first dance', '500+ edited photos', 'Online gallery'], hours: '8 hrs', deposit: 30 },
    ],
  },
  {
    id: 'long-table', name: 'The Long Table Kitchen', category: 'Catering', region: 'Cotswolds', town: 'Moreton-in-Marsh', style: 'Rustic',
    rating: 4.9, reviews: 143, img: '/images/table2.jpg', gallery: ['/images/table2.jpg', '/images/setting.jpg'],
    about: 'Seasonal, locally sourced menus served family-style down long tables.',
    fromPrice: 58,
    packages: [
      { id: 'lt-feast', name: 'Sharing Feast', price: 58, perGuest: true, summary: 'Per guest, long-table style', includes: ['Canapés on arrival', 'Sharing mains & sides', 'Dessert table', 'Service staff'], deposit: 20 },
      { id: 'lt-three', name: 'Three-Course Breakfast', price: 72, perGuest: true, summary: 'Per guest, plated', includes: ['Canapés on arrival', 'Three plated courses', 'Evening bacon rolls', 'Service staff'], deposit: 20 },
    ],
  },
  {
    id: 'wild-bloom', name: 'Wild Bloom Florals', category: 'Florists', region: 'Cotswolds', town: 'Burford', style: 'Garden',
    rating: 4.9, reviews: 76, img: '/images/bouquet.jpg', gallery: ['/images/bouquet.jpg', '/images/table.jpg', '/images/arch.jpg'],
    about: 'Seasonal whites and greenery, from bridal bouquets to full ceremony arches.',
    fromPrice: 520,
    packages: [
      { id: 'wb-party', name: 'Bridal Party', price: 520, summary: 'Bouquets & buttonholes', includes: ['Bridal bouquet', '4 bridesmaid posies', '8 buttonholes'], deposit: 30 },
      { id: 'wb-full', name: 'Ceremony & Tables', price: 1400, summary: 'Arch + table flowers', includes: ['Ceremony arch', '12 table centrepieces', 'Bridal party flowers'], deposit: 30 },
    ],
  },
  {
    id: 'the-standards', name: 'The Standards Band', category: 'Music', region: 'London', town: 'London', style: 'Modern',
    rating: 4.8, reviews: 58, img: '/images/aisle.jpg', gallery: ['/images/aisle.jpg'],
    about: 'Five-piece party band playing soul, Motown and modern pop — plus DJ until late.',
    fromPrice: 1850,
    packages: [
      { id: 'ts-band', name: 'Band & DJ', price: 1850, summary: '2 sets + DJ until midnight', includes: ['2 × 60 min live sets', 'DJ until midnight', 'PA & lighting'], hours: '5 hrs', deposit: 25 },
    ],
  },
];

export const gbp = (n: number) => '£' + Math.round(n).toLocaleString('en-GB');
export const fmtDate = (iso: string, opts: Intl.DateTimeFormatOptions = { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) =>
  new Date(iso + 'T12:00:00').toLocaleDateString('en-GB', opts);
export const pkgTotal = (p: Package, guests: number) => (p.perGuest ? p.price * guests : p.price);

/* ---------------- supplier side (venue persona: The Stone Villa) ---------------- */
export type Booking = {
  id: string; couple: string; date: string; endDate?: string; pkg: string; guests: number; total: number; paid: number;
  status: 'booked' | 'held' | 'enquiry'; source: 'Everly' | 'Direct';
};
export const supplierBookings: Booking[] = [
  { id: 'E-20418', couple: 'Priya & Sam', date: '2027-06-05', pkg: 'Full Day Exclusive', guests: 120, total: 6500, paid: 1625, status: 'booked', source: 'Everly' },
  { id: 'E-20431', couple: 'Hannah & Tom', date: '2027-06-18', endDate: '2027-06-20', pkg: 'Weekend Celebration', guests: 140, total: 9800, paid: 9800, status: 'booked', source: 'Everly' },
  { id: 'D-1182', couple: 'Lucy & Ben', date: '2027-06-26', pkg: 'Full Day Exclusive', guests: 95, total: 6500, paid: 1625, status: 'booked', source: 'Direct' },
  { id: 'E-20452', couple: 'Olivia & Jack', date: '2027-06-09', pkg: 'Twilight Wedding', guests: 70, total: 4200, paid: 0, status: 'held', source: 'Everly' },
];
export const otherEnquiries = [
  { id: 'E-20466', couple: 'Amelia & Noah', date: '2027-07-17', pkg: 'Full Day Exclusive', guests: 110, received: '2h ago' },
  { id: 'E-20470', couple: 'Grace & Oliver', date: '2027-08-21', pkg: 'Weekend Celebration', guests: 150, received: 'Yesterday' },
];
export const monthly = [
  { m: 'Jan', v: 9800 }, { m: 'Feb', v: 6500 }, { m: 'Mar', v: 12300 }, { m: 'Apr', v: 18700 }, { m: 'May', v: 24100 }, { m: 'Jun', v: 31400 },
];
/** day prices for the calendar (June 2027): weekends higher */
export function dayPrice(iso: string) {
  const d = new Date(iso + 'T12:00:00').getDay();
  return d === 6 ? 6500 : d === 5 ? 5600 : d === 0 ? 5200 : 4200;
}
