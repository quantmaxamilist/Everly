/**
 * Demo data for the market-research previews (couple + supplier).
 * Everything here is FICTIONAL sample data — venues, suppliers, prices, couples, reviews and figures.
 * Nothing is saved or sent; the supplier-side figures are generated from a fixed seed so they never change.
 */

export type Category = 'Venues' | 'Photographers' | 'Catering' | 'Florists' | 'Music' | 'Cakes' | 'Hair & make-up';
export const categories: Category[] = ['Venues', 'Photographers', 'Catering', 'Florists', 'Music', 'Cakes', 'Hair & make-up'];
export const catIcon: Record<Category, string> = { Venues: 'home', Photographers: 'camera', Catering: 'layers', Florists: 'leaf', Music: 'music', Cakes: 'cake', 'Hair & make-up': 'brush' };
/** singular label, e.g. "venue", "photographer" */
export const catOne: Record<Category, string> = { Venues: 'venue', Photographers: 'photographer', Catering: 'caterer', Florists: 'florist', Music: 'band / DJ', Cakes: 'cake maker', 'Hair & make-up': 'hair & make-up artist' };

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
  travels?: boolean;      // covers the whole UK, so shows in every region
  img: string;
  gallery: string[];
  about: string;
  fromPrice: number;
  booked?: string[];      // fixed booked dates (ISO) — more are generated on the supplier side
  packages: Package[];
};

/* ---------------- sample weddings (couple side quick-start) ---------------- */
export type Wedding = { names: string; date: string; region: string; guests: number; budget: number };
export const sampleWeddings: (Wedding & { blurb: string; img: string })[] = [
  { names: 'Sophie & James', date: '2027-06-12', region: 'Cotswolds', guests: 110, budget: 25000, blurb: 'Country-house summer wedding', img: '/images/villa.jpg' },
  { names: 'Aisha & Ravi', date: '2027-09-18', region: 'London', guests: 180, budget: 42000, blurb: 'Big city celebration', img: '/images/setting.jpg' },
  { names: 'Emma & Lewis', date: '2027-05-22', region: 'Cornwall', guests: 70, budget: 16000, blurb: 'Small coastal wedding', img: '/images/aisle.jpg' },
  { names: 'Megan & Callum', date: '2027-08-14', region: 'Lake District', guests: 120, budget: 22000, blurb: 'Rustic barn in the fells', img: '/images/hills.jpg' },
];
export const SAMPLE_DATES = sampleWeddings.map((w) => w.date);

/* ---------------- suppliers ---------------- */
export const suppliers: Supplier[] = [
  /* ---- Venues ---- */
  {
    id: 'stone-villa', name: 'The Stone Villa', category: 'Venues', region: 'Cotswolds', town: 'Chipping Campden', style: 'Country house',
    rating: 4.9, reviews: 128, capacity: 150, img: '/images/villa.jpg', gallery: ['/images/villa.jpg', '/images/table.jpg', '/images/arch.jpg', '/images/gardens.jpg'],
    about: 'A honey-stone farmhouse with olive groves, a walled garden for ceremonies and a long-table barn for the wedding breakfast. Exclusive use for your whole day.',
    fromPrice: 6500,
    packages: [
      { id: 'sv-day', name: 'Full Day Exclusive', price: 6500, summary: 'Exclusive use 10am – midnight', includes: ['Ceremony in the walled garden', 'Drinks reception on the terrace', 'Barn for wedding breakfast & evening', 'Tables, chairs & linen', 'Dedicated venue coordinator'], hours: '14 hrs', maxGuests: 150, deposit: 25 },
      { id: 'sv-weekend', name: 'Weekend Celebration', price: 9800, summary: 'Fri – Sun with 12 bedrooms', includes: ['Everything in Full Day Exclusive', 'Friday welcome evening', 'Sunday recovery brunch space', '12 bedrooms for 2 nights', 'Late licence until 1am'], hours: '3 days', maxGuests: 150, deposit: 25 },
      { id: 'sv-twilight', name: 'Twilight Wedding', price: 4200, summary: 'Ceremony from 4pm', includes: ['Ceremony in the walled garden', 'Barn for dinner & evening', 'Tables, chairs & linen', 'Venue coordinator'], hours: '8 hrs', maxGuests: 100, deposit: 25 },
    ],
  },
  {
    id: 'avenue-house', name: 'Avenue House', category: 'Venues', region: 'Cotswolds', town: 'Stow-on-the-Wold', style: 'Classic',
    rating: 4.8, reviews: 94, capacity: 180, img: '/images/avenue.jpg', gallery: ['/images/avenue.jpg', '/images/setting.jpg', '/images/aisle.jpg'],
    about: 'A Georgian manor at the end of a tree-lined avenue, with a ceremony room, formal lawns and a ballroom for up to 180.',
    fromPrice: 8200, booked: ['2027-06-12'],
    packages: [
      { id: 'ah-day', name: 'Manor Day', price: 8200, summary: 'Exclusive use 11am – midnight', includes: ['Ceremony room or lawn', 'Ballroom for dinner & dancing', 'Tables, chairs & linen', 'Venue coordinator', 'Bridal suite on the night'], hours: '13 hrs', maxGuests: 180, deposit: 30 },
      { id: 'ah-midweek', name: 'Midweek Manor', price: 6100, summary: 'Mon – Thu dates', includes: ['Ceremony room or lawn', 'Ballroom for dinner & dancing', 'Tables, chairs & linen', 'Venue coordinator'], hours: '12 hrs', maxGuests: 180, deposit: 30 },
    ],
  },
  {
    id: 'bramley-orchard', name: 'Bramley Orchard', category: 'Venues', region: 'Cotswolds', town: 'Painswick', style: 'Garden',
    rating: 4.9, reviews: 47, capacity: 90, img: '/images/gardens.jpg', gallery: ['/images/gardens.jpg', '/images/bouquet2.jpg', '/images/table2.jpg'],
    about: 'An apple orchard and Victorian glasshouse for smaller, relaxed weddings. Ceremony under the trees, dinner by candlelight in the glasshouse.',
    fromPrice: 3900,
    packages: [
      { id: 'bo-day', name: 'Orchard Day', price: 3900, summary: 'Exclusive use 12pm – 11pm', includes: ['Ceremony in the orchard', 'Glasshouse for dinner', 'Festoon lighting', 'Tables & chairs'], hours: '11 hrs', maxGuests: 90, deposit: 25 },
      { id: 'bo-intimate', name: 'Intimate Wedding', price: 2400, summary: 'Up to 40 guests, weekdays', includes: ['Ceremony in the orchard', 'Glasshouse for dinner', 'Tables & chairs'], hours: '7 hrs', maxGuests: 40, deposit: 25 },
    ],
  },
  {
    id: 'formal-gardens', name: 'The Formal Gardens', category: 'Venues', region: 'Devon', town: 'Totnes', style: 'Garden',
    rating: 4.7, reviews: 61, capacity: 120, img: '/images/arch.jpg', gallery: ['/images/arch.jpg', '/images/gardens.jpg', '/images/aisle.jpg'],
    about: 'Parterre gardens and an orangery overlooking the Dart valley — made for outdoor ceremonies.',
    fromPrice: 4800,
    packages: [
      { id: 'fg-day', name: 'Garden Day', price: 4800, summary: 'Exclusive use 11am – 11pm', includes: ['Outdoor ceremony in the parterre', 'Orangery for dinner', 'Tables & chairs', 'Venue coordinator'], hours: '12 hrs', maxGuests: 120, deposit: 25 },
    ],
  },
  {
    id: 'harbour-light', name: 'Harbour Light Hotel', category: 'Venues', region: 'Cornwall', town: 'St Ives', style: 'Coastal',
    rating: 4.8, reviews: 112, capacity: 90, img: '/images/aisle.jpg', gallery: ['/images/aisle.jpg', '/images/setting.jpg', '/images/table.jpg'],
    about: 'A whitewashed harbour-side hotel with a sea-view terrace for ceremonies and 24 bedrooms for guests.',
    fromPrice: 5400, booked: ['2027-05-22'],
    packages: [
      { id: 'hl-day', name: 'Harbour Day', price: 5400, summary: 'Terrace ceremony + dinner', includes: ['Sea-view terrace ceremony', 'Prosecco reception', 'Dining room exclusive use', 'Bridal suite'], hours: '12 hrs', maxGuests: 90, deposit: 30 },
      { id: 'hl-all', name: 'All-inclusive 70', price: 11900, summary: '70 guests, food & drink included', includes: ['Terrace ceremony', 'Three-course dinner', 'Half a bottle of wine per guest', 'Evening buffet', 'Bridal suite'], hours: '12 hrs', maxGuests: 70, deposit: 30 },
    ],
  },
  {
    id: 'trevose-barn', name: 'Trevose Cove Barn', category: 'Venues', region: 'Cornwall', town: 'Padstow', style: 'Rustic',
    rating: 4.9, reviews: 38, capacity: 130, img: '/images/hills.jpg', gallery: ['/images/hills.jpg', '/images/table2.jpg', '/images/field.jpg'],
    about: 'A restored threshing barn a short walk from the beach, with clifftop ceremony spot and fire-pit evening garden.',
    fromPrice: 4600,
    packages: [
      { id: 'tc-day', name: 'Cove Day', price: 4600, summary: 'Exclusive use 11am – midnight', includes: ['Clifftop ceremony spot', 'Barn for dinner & dancing', 'Fire-pit garden', 'Tables & chairs'], hours: '13 hrs', maxGuests: 130, deposit: 25 },
      { id: 'tc-weekend', name: 'Cove Weekend', price: 7200, summary: 'Fri – Sun with glamping field', includes: ['Everything in Cove Day', 'Glamping field for 60', 'Friday BBQ evening', 'Sunday beach brunch space'], hours: '3 days', maxGuests: 130, deposit: 25 },
    ],
  },
  {
    id: 'fellside-barn', name: 'Fellside Barn', category: 'Venues', region: 'Lake District', town: 'Ambleside', style: 'Rustic',
    rating: 4.8, reviews: 76, capacity: 140, img: '/images/field.jpg', gallery: ['/images/field.jpg', '/images/hills.jpg', '/images/table2.jpg'],
    about: 'A slate-and-oak barn under the fells, with lake views from the ceremony meadow.',
    fromPrice: 5200, booked: ['2027-08-14'],
    packages: [
      { id: 'fb-day', name: 'Fellside Day', price: 5200, summary: 'Exclusive use 11am – midnight', includes: ['Meadow or barn ceremony', 'Barn for dinner & dancing', 'Tables, chairs & linen', 'Venue coordinator'], hours: '13 hrs', maxGuests: 140, deposit: 25 },
    ],
  },
  {
    id: 'langdale-hall', name: 'Langdale Hall', category: 'Venues', region: 'Lake District', town: 'Grasmere', style: 'Country house',
    rating: 4.7, reviews: 52, capacity: 160, img: '/images/hero.jpg', gallery: ['/images/hero.jpg', '/images/avenue.jpg', '/images/setting.jpg'],
    about: 'A Victorian country house with lakeside lawns, a panelled ceremony room and 18 bedrooms.',
    fromPrice: 6900,
    packages: [
      { id: 'lh-day', name: 'Hall Day', price: 6900, summary: 'Exclusive use 11am – midnight', includes: ['Ceremony room or lawn', 'Lakeside drinks reception', 'Great Hall for dinner', 'Bridal suite'], hours: '13 hrs', maxGuests: 160, deposit: 30 },
      { id: 'lh-weekend', name: 'House Party Weekend', price: 12500, summary: 'Fri – Sun, all 18 bedrooms', includes: ['Everything in Hall Day', 'All 18 bedrooms, 2 nights', 'Friday supper room', 'Sunday brunch room'], hours: '3 days', maxGuests: 160, deposit: 30 },
    ],
  },
  {
    id: 'thornbury-hall', name: 'Thornbury Hall', category: 'Venues', region: 'Yorkshire', town: 'Harrogate', style: 'Country house',
    rating: 4.8, reviews: 89, capacity: 200, img: '/images/avenue.jpg', gallery: ['/images/avenue.jpg', '/images/gardens.jpg', '/images/setting.jpg'],
    about: 'A Palladian hall in 40 acres of parkland, with an orangery and a ballroom for up to 200.',
    fromPrice: 7400,
    packages: [
      { id: 'th-day', name: 'Hall Day', price: 7400, summary: 'Exclusive use 11am – midnight', includes: ['Orangery ceremony', 'Ballroom dinner', 'Parkland portraits', 'Venue coordinator'], hours: '13 hrs', maxGuests: 200, deposit: 25 },
    ],
  },
  {
    id: 'glasshouse', name: 'The Glasshouse', category: 'Venues', region: 'London', town: 'Shoreditch', style: 'Modern',
    rating: 4.7, reviews: 143, capacity: 200, img: '/images/setting.jpg', gallery: ['/images/setting.jpg', '/images/table.jpg', '/images/aisle.jpg'],
    about: 'A glass-roofed former print hall with a roof terrace — industrial-modern, made for big city parties.',
    fromPrice: 9500, booked: ['2027-09-18'],
    packages: [
      { id: 'gh-day', name: 'Hall & Terrace', price: 9500, summary: 'Exclusive use 12pm – 1am', includes: ['Ceremony on the roof terrace', 'Main hall for dinner & dancing', 'In-house lighting rig', 'Venue manager'], hours: '13 hrs', maxGuests: 200, deposit: 30 },
      { id: 'gh-eve', name: 'Evening Party', price: 5800, summary: '6pm – 1am', includes: ['Main hall', 'In-house lighting rig', 'Late licence'], hours: '7 hrs', maxGuests: 200, deposit: 30 },
    ],
  },
  {
    id: 'printworks-loft', name: 'Riverside Loft', category: 'Venues', region: 'London', town: 'Bermondsey', style: 'Modern',
    rating: 4.6, reviews: 71, capacity: 190, img: '/images/table.jpg', gallery: ['/images/table.jpg', '/images/setting.jpg'],
    about: 'A Thames-side warehouse loft with exposed brick, river views and an in-house bar team.',
    fromPrice: 7800,
    packages: [
      { id: 'rl-day', name: 'Loft Day', price: 7800, summary: 'Exclusive use 12pm – midnight', includes: ['Ceremony with river views', 'Dinner & dancing in the loft', 'Bar team', 'Venue manager'], hours: '12 hrs', maxGuests: 190, deposit: 25 },
    ],
  },
  {
    id: 'willow-mill', name: 'Willow Mill', category: 'Venues', region: 'Surrey', town: 'Dorking', style: 'Rustic',
    rating: 4.8, reviews: 66, capacity: 130, img: '/images/table2.jpg', gallery: ['/images/table2.jpg', '/images/field.jpg', '/images/gardens.jpg'],
    about: 'A working watermill on the River Mole, with a willow-lined ceremony lawn and timber-framed barn.',
    fromPrice: 5900,
    packages: [
      { id: 'wm-day', name: 'Mill Day', price: 5900, summary: 'Exclusive use 11am – midnight', includes: ['Riverside ceremony lawn', 'Barn for dinner & dancing', 'Tables & chairs', 'Venue coordinator'], hours: '13 hrs', maxGuests: 130, deposit: 25 },
    ],
  },
  {
    id: 'loch-ard', name: 'Loch Ard Lodge', category: 'Venues', region: 'Scotland', town: 'Aberfoyle', style: 'Rustic',
    rating: 4.9, reviews: 41, capacity: 100, img: '/images/hills.jpg', gallery: ['/images/hills.jpg', '/images/field.jpg'],
    about: 'A lochside hunting lodge in the Trossachs with a boathouse ceremony spot and whisky bar.',
    fromPrice: 5600,
    packages: [
      { id: 'la-day', name: 'Lodge Day', price: 5600, summary: 'Exclusive use 11am – midnight', includes: ['Boathouse ceremony', 'Lodge dining room', 'Whisky bar', 'Piper on arrival'], hours: '13 hrs', maxGuests: 100, deposit: 25 },
    ],
  },

  /* ---- Photographers ---- */
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
      { id: 'gh-half', name: 'Essentials', price: 1100, summary: '5 hours coverage', includes: ['Ceremony & portraits', '300+ edited photos', 'Online gallery'], hours: '5 hrs', deposit: 30 },
    ],
  },
  {
    id: 'saltwater', name: 'Saltwater Stories', category: 'Photographers', region: 'Cornwall', town: 'Falmouth', style: 'Coastal',
    rating: 4.9, reviews: 64, img: '/images/aisle.jpg', gallery: ['/images/aisle.jpg', '/images/couple.jpg', '/images/hills.jpg'],
    about: 'Photo + film duo shooting relaxed coastal weddings — beach portraits at sunset are our thing.',
    fromPrice: 1200,
    packages: [
      { id: 'sw-photo', name: 'Photo Day', price: 1200, summary: '8 hours photography', includes: ['Ceremony to first dance', 'Sunset beach portraits', '500+ edited photos'], hours: '8 hrs', deposit: 25 },
      { id: 'sw-film', name: 'Photo + Film', price: 2350, summary: 'Photos plus 5-minute film', includes: ['Everything in Photo Day', 'Highlights film (5 min)', 'Full ceremony film', 'Drone shots'], hours: '10 hrs', deposit: 25 },
    ],
  },
  {
    id: 'north-pine', name: 'North & Pine', category: 'Photographers', region: 'Lake District', town: 'Keswick', style: 'Rustic', travels: true,
    rating: 4.9, reviews: 101, img: '/images/hills.jpg', gallery: ['/images/hills.jpg', '/images/field.jpg', '/images/couple.jpg'],
    about: 'Adventurous, moody landscapes and honest moments. Based in the Lakes, travelling UK-wide.',
    fromPrice: 1300,
    packages: [
      { id: 'np-day', name: 'Whole Day', price: 1800, summary: '10 hours + mountain portraits', includes: ['Prep to first dance', 'Mountain portrait session', '700+ edited photos', 'Printed album'], hours: '10 hrs', deposit: 25 },
      { id: 'np-elope', name: 'Elopement', price: 1300, summary: '4 hours, any location', includes: ['Ceremony & adventure portraits', '250+ edited photos', 'Location scouting'], hours: '4 hrs', deposit: 25 },
    ],
  },
  {
    id: 'studio-halden', name: 'Studio Halden', category: 'Photographers', region: 'London', town: 'Hackney', style: 'Modern', travels: true,
    rating: 4.7, reviews: 58, img: '/images/bouquet2.jpg', gallery: ['/images/bouquet2.jpg', '/images/setting.jpg', '/images/couple.jpg'],
    about: 'Fashion-led, flash-lit city wedding photography with a fast 2-week turnaround.',
    fromPrice: 1400,
    packages: [
      { id: 'sh-day', name: 'City Day', price: 1900, summary: '9 hours, 2 photographers', includes: ['Two photographers', 'Flash party coverage', '700+ edited photos', '2-week delivery'], hours: '9 hrs', deposit: 30 },
      { id: 'sh-short', name: 'Registry & Party', price: 1400, summary: '6 hours', includes: ['Registry ceremony', 'Street portraits', '400+ edited photos'], hours: '6 hrs', deposit: 30 },
    ],
  },

  /* ---- Catering ---- */
  {
    id: 'long-table', name: 'The Long Table Kitchen', category: 'Catering', region: 'Cotswolds', town: 'Moreton-in-Marsh', style: 'Rustic',
    rating: 4.9, reviews: 143, img: '/images/table2.jpg', gallery: ['/images/table2.jpg', '/images/setting.jpg', '/images/table.jpg'],
    about: 'Seasonal, locally sourced menus served family-style down long tables.',
    fromPrice: 58,
    packages: [
      { id: 'lt-feast', name: 'Sharing Feast', price: 58, perGuest: true, summary: 'Per guest, long-table style', includes: ['Canapés on arrival', 'Sharing mains & sides', 'Dessert table', 'Service staff'], deposit: 20 },
      { id: 'lt-three', name: 'Three-Course Breakfast', price: 72, perGuest: true, summary: 'Per guest, plated', includes: ['Canapés on arrival', 'Three plated courses', 'Evening bacon rolls', 'Service staff'], deposit: 20 },
    ],
  },
  {
    id: 'smoke-ember', name: 'Smoke & Ember', category: 'Catering', region: 'Surrey', town: 'Guildford', style: 'Rustic', travels: true,
    rating: 4.8, reviews: 96, img: '/images/table.jpg', gallery: ['/images/table.jpg', '/images/table2.jpg'],
    about: 'Live-fire cooking — whole roasted lamb, flatbreads from the wood oven and big seasonal salads.',
    fromPrice: 49,
    packages: [
      { id: 'se-fire', name: 'Fire Feast', price: 49, perGuest: true, summary: 'Per guest, live-fire sharing', includes: ['Wood-fired flatbreads', 'Two fire-roasted meats', 'Seasonal salads', 'Chef team'], deposit: 25 },
      { id: 'se-full', name: 'Fire Feast + Evening', price: 64, perGuest: true, summary: 'Per guest, day + evening', includes: ['Everything in Fire Feast', 'Evening street-food station', 'Service staff'], deposit: 25 },
    ],
  },
  {
    id: 'copper-pot', name: 'Copper Pot Catering', category: 'Catering', region: 'London', town: 'Islington', style: 'Modern',
    rating: 4.7, reviews: 122, img: '/images/setting.jpg', gallery: ['/images/setting.jpg', '/images/table.jpg'],
    about: 'Modern British menus with a global twist; halal, vegan and kosher-style menus on request.',
    fromPrice: 68,
    packages: [
      { id: 'cp-plated', name: 'Plated Dinner', price: 78, perGuest: true, summary: 'Per guest, three courses', includes: ['Canapés', 'Three plated courses', 'Front-of-house team', 'Crockery & glassware'], deposit: 25 },
      { id: 'cp-bowl', name: 'Bowl Food Party', price: 68, perGuest: true, summary: 'Per guest, roaming', includes: ['6 bowl-food dishes', '2 dessert bowls', 'Front-of-house team'], deposit: 25 },
    ],
  },
  {
    id: 'harvest-hearth', name: 'Harvest & Hearth', category: 'Catering', region: 'Devon', town: 'Ashburton', style: 'Garden',
    rating: 4.9, reviews: 57, img: '/images/table2.jpg', gallery: ['/images/table2.jpg', '/images/bouquet.jpg'],
    about: 'Farm-to-table Devon produce, cooked over our own field kitchen.',
    fromPrice: 54,
    packages: [
      { id: 'hh-feast', name: 'Field Kitchen Feast', price: 54, perGuest: true, summary: 'Per guest, sharing boards', includes: ['Grazing boards', 'Sharing mains', 'Pudding table'], deposit: 20 },
    ],
  },

  /* ---- Florists ---- */
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
    id: 'petal-stem', name: 'Petal & Stem', category: 'Florists', region: 'London', town: 'Columbia Road', style: 'Modern', travels: true,
    rating: 4.8, reviews: 133, img: '/images/bouquet2.jpg', gallery: ['/images/bouquet2.jpg', '/images/setting.jpg'],
    about: 'Sculptural, colour-led installations — hanging clouds, statement arches and bold bouquets.',
    fromPrice: 650,
    packages: [
      { id: 'ps-party', name: 'Bridal Party', price: 650, summary: 'Bouquets, posies & buttonholes', includes: ['Bridal bouquet', '5 bridesmaid posies', '10 buttonholes'], deposit: 30 },
      { id: 'ps-install', name: 'Statement Install', price: 2800, summary: 'Hanging cloud + tables', includes: ['Hanging floral cloud', '15 table designs', 'Bridal party flowers', 'Set-up & clear-down'], deposit: 30 },
    ],
  },
  {
    id: 'moorland-blooms', name: 'Moorland Blooms', category: 'Florists', region: 'Yorkshire', town: 'Helmsley', style: 'Rustic',
    rating: 4.9, reviews: 44, img: '/images/arch.jpg', gallery: ['/images/arch.jpg', '/images/bouquet.jpg'],
    about: 'Home-grown British flowers and foraged heather, wild and loose.',
    fromPrice: 420,
    packages: [
      { id: 'mb-party', name: 'Wild Bridal Party', price: 420, summary: 'Bouquets & buttonholes', includes: ['Bridal bouquet', '3 bridesmaid posies', '6 buttonholes'], deposit: 25 },
      { id: 'mb-full', name: 'Full Wild Wedding', price: 1250, summary: 'Ceremony + tables', includes: ['Ceremony urns', '10 table jars', 'Bridal party flowers'], deposit: 25 },
    ],
  },
  {
    id: 'sea-pink', name: 'Sea Pink Flowers', category: 'Florists', region: 'Cornwall', town: 'Truro', style: 'Coastal',
    rating: 4.7, reviews: 39, img: '/images/bouquet.jpg', gallery: ['/images/bouquet.jpg', '/images/aisle.jpg'],
    about: 'Soft coastal palettes — sea pinks, grasses and blues for beach and harbour weddings.',
    fromPrice: 480,
    packages: [
      { id: 'sp-party', name: 'Bridal Party', price: 480, summary: 'Bouquets & buttonholes', includes: ['Bridal bouquet', '4 bridesmaid posies', '8 buttonholes'], deposit: 30 },
    ],
  },

  /* ---- Music ---- */
  {
    id: 'the-standards', name: 'The Standards Band', category: 'Music', region: 'London', town: 'London', style: 'Modern', travels: true,
    rating: 4.8, reviews: 58, img: '/images/setting.jpg', gallery: ['/images/setting.jpg', '/images/aisle.jpg'],
    about: 'Five-piece party band playing soul, Motown and modern pop — plus DJ until late.',
    fromPrice: 1850,
    packages: [
      { id: 'ts-band', name: 'Band & DJ', price: 1850, summary: '2 sets + DJ until midnight', includes: ['2 × 60 min live sets', 'DJ until midnight', 'PA & lighting'], hours: '5 hrs', deposit: 25 },
      { id: 'ts-full', name: 'Ceremony to Last Dance', price: 2650, summary: 'Acoustic duo + band + DJ', includes: ['Acoustic duo for ceremony & drinks', '2 × 60 min live sets', 'DJ until midnight', 'PA & lighting'], hours: '9 hrs', deposit: 25 },
    ],
  },
  {
    id: 'strings-attached', name: 'Strings Attached Quartet', category: 'Music', region: 'Cotswolds', town: 'Cheltenham', style: 'Classic', travels: true,
    rating: 5.0, reviews: 71, img: '/images/aisle.jpg', gallery: ['/images/aisle.jpg', '/images/gardens.jpg'],
    about: 'String quartet for ceremonies and drinks receptions — classical to pop covers, arranged for your walk down the aisle.',
    fromPrice: 690,
    packages: [
      { id: 'sa-cer', name: 'Ceremony', price: 690, summary: 'Ceremony music', includes: ['Arrival music', 'Aisle & signing music', 'One custom arrangement'], hours: '1.5 hrs', deposit: 25 },
      { id: 'sa-full', name: 'Ceremony & Drinks', price: 1090, summary: 'Ceremony + 2hr reception', includes: ['Ceremony music', '2 hrs drinks reception', 'Two custom arrangements'], hours: '3.5 hrs', deposit: 25 },
    ],
  },
  {
    id: 'night-shift', name: 'Night Shift DJs', category: 'Music', region: 'Yorkshire', town: 'Leeds', style: 'Modern', travels: true,
    rating: 4.7, reviews: 164, img: '/images/table.jpg', gallery: ['/images/table.jpg', '/images/setting.jpg'],
    about: 'Party DJs with a full light show and a no-cheese promise (unless you ask for it).',
    fromPrice: 650,
    packages: [
      { id: 'ns-eve', name: 'Evening DJ', price: 650, summary: '7pm – midnight', includes: ['Pro DJ', 'Dance-floor lighting', 'Your must-play list'], hours: '5 hrs', deposit: 20 },
      { id: 'ns-day', name: 'All-day DJ', price: 1050, summary: 'Ceremony to midnight', includes: ['Ceremony PA & mics', 'Background music for dinner', 'Evening DJ set', 'Light show'], hours: '10 hrs', deposit: 20 },
    ],
  },
  {
    id: 'acoustic-fox', name: 'Acoustic Fox', category: 'Music', region: 'Devon', town: 'Plymouth', style: 'Garden', travels: true,
    rating: 4.9, reviews: 49, img: '/images/field.jpg', gallery: ['/images/field.jpg', '/images/bouquet2.jpg'],
    about: 'Solo singer-guitarist for ceremonies, drinks and laid-back evenings.',
    fromPrice: 420,
    packages: [
      { id: 'af-cer', name: 'Ceremony & Drinks', price: 420, summary: '2 hours live', includes: ['Ceremony songs', 'Drinks reception set', 'PA included'], hours: '2 hrs', deposit: 25 },
      { id: 'af-eve', name: 'Evening Sets', price: 680, summary: '2 × 45 min sets', includes: ['2 × 45 min live sets', 'Playlist between sets', 'PA & lighting'], hours: '4 hrs', deposit: 25 },
    ],
  },

  /* ---- Cakes ---- */
  {
    id: 'crumb-crown', name: 'Crumb & Crown', category: 'Cakes', region: 'Cotswolds', town: 'Tetbury', style: 'Classic',
    rating: 4.9, reviews: 88, img: '/images/table.jpg', gallery: ['/images/table.jpg', '/images/bouquet.jpg'],
    about: 'Elegant buttercream and sugar-flower cakes, delivered and set up on the day.',
    fromPrice: 380,
    packages: [
      { id: 'cc-3', name: 'Three-Tier Classic', price: 520, summary: 'Serves 110', includes: ['Three tiers, two flavours', 'Fresh flowers', 'Delivery & set-up', 'Tasting box'], deposit: 30 },
      { id: 'cc-2', name: 'Two-Tier', price: 380, summary: 'Serves 70', includes: ['Two tiers', 'Fresh flowers', 'Delivery & set-up'], deposit: 30 },
    ],
  },
  {
    id: 'little-bake', name: 'The Little Bake House', category: 'Cakes', region: 'Devon', town: 'Dartmouth', style: 'Rustic', travels: true,
    rating: 4.8, reviews: 52, img: '/images/table2.jpg', gallery: ['/images/table2.jpg', '/images/setting.jpg'],
    about: 'Semi-naked cakes, dessert tables and doughnut walls — posted tasting boxes UK-wide.',
    fromPrice: 290,
    packages: [
      { id: 'lb-naked', name: 'Semi-Naked Three-Tier', price: 450, summary: 'Serves 100', includes: ['Three tiers', 'Seasonal fruit & flowers', 'Delivery & set-up'], deposit: 25 },
      { id: 'lb-dessert', name: 'Dessert Table', price: 690, summary: 'Cake + 120 sweet treats', includes: ['Two-tier cake', '120 mini desserts', 'Styled table'], deposit: 25 },
    ],
  },
  {
    id: 'sugar-loaf', name: 'Sugar Loaf Cakes', category: 'Cakes', region: 'London', town: 'Greenwich', style: 'Modern', travels: true,
    rating: 4.7, reviews: 67, img: '/images/setting.jpg', gallery: ['/images/setting.jpg', '/images/table.jpg'],
    about: 'Architectural, palette-knife and painted cakes for modern weddings.',
    fromPrice: 480,
    packages: [
      { id: 'sl-4', name: 'Four-Tier Statement', price: 890, summary: 'Serves 180', includes: ['Four tiers, three flavours', 'Hand-painted design', 'Delivery & set-up'], deposit: 30 },
    ],
  },

  /* ---- Hair & make-up ---- */
  {
    id: 'bloom-beauty', name: 'Bloom Bridal Beauty', category: 'Hair & make-up', region: 'Cotswolds', town: 'Cheltenham', style: 'Classic', travels: true,
    rating: 5.0, reviews: 118, img: '/images/couple.jpg', gallery: ['/images/couple.jpg', '/images/bouquet2.jpg'],
    about: 'Soft, glowing bridal make-up and timeless hair. Two artists so the morning runs on time.',
    fromPrice: 280,
    packages: [
      { id: 'bb-bride', name: 'Bride + Trial', price: 280, summary: 'Hair & make-up', includes: ['Trial session', 'Wedding-day hair & make-up', 'Touch-up kit'], deposit: 30 },
      { id: 'bb-party', name: 'Bridal Party of 5', price: 720, summary: 'Bride + 4', includes: ['Bride trial', 'Hair & make-up for 5', 'Two artists on the day', 'Touch-up kit'], deposit: 30 },
    ],
  },
  {
    id: 'glow-studio', name: 'Glow Studio', category: 'Hair & make-up', region: 'London', town: 'Marylebone', style: 'Modern', travels: true,
    rating: 4.8, reviews: 91, img: '/images/bouquet2.jpg', gallery: ['/images/bouquet2.jpg', '/images/couple.jpg'],
    about: 'Editorial make-up and sleek styling — airbrush and lashes included.',
    fromPrice: 340,
    packages: [
      { id: 'gs-bride', name: 'Bride Luxe', price: 340, summary: 'Airbrush + hair', includes: ['Trial session', 'Airbrush make-up & lashes', 'Wedding-day hair'], deposit: 30 },
      { id: 'gs-party', name: 'Party of 6', price: 990, summary: 'Bride + 5', includes: ['Bride trial', 'Hair & make-up for 6', 'Three artists'], deposit: 30 },
    ],
  },
  {
    id: 'coastline-bridal', name: 'Coastline Bridal', category: 'Hair & make-up', region: 'Cornwall', town: 'Newquay', style: 'Coastal',
    rating: 4.9, reviews: 36, img: '/images/couple.jpg', gallery: ['/images/couple.jpg', '/images/aisle.jpg'],
    about: 'Windproof, beach-ready hair and natural make-up for Cornish weddings.',
    fromPrice: 240,
    packages: [
      { id: 'cb-bride', name: 'Bride + Trial', price: 240, summary: 'Hair & make-up', includes: ['Trial session', 'Wedding-day hair & make-up'], deposit: 25 },
    ],
  },
];

export const gbp = (n: number) => '£' + Math.round(n).toLocaleString('en-GB');
export const fmtDate = (iso: string, opts: Intl.DateTimeFormatOptions = { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) =>
  new Date(iso + 'T12:00:00').toLocaleDateString('en-GB', opts);
export const pkgTotal = (p: Package, guests: number) => (p.perGuest ? p.price * guests : p.price);
export const supById = (id: string) => suppliers.find((x) => x.id === id);

/* ---------------- reviews (sample) ---------------- */
export type Review = { by: string; when: string; stars: number; text: string };
const reviewPool: Record<Category, string[]> = {
  Venues: ['The team thought of everything — we didn’t have to lift a finger on the day.', 'Guests still talk about the ceremony spot. Worth every penny.', 'Flexible on suppliers and so calm when it rained. Plan B was just as beautiful.', 'Comparing it side by side with two other venues made the decision easy.'],
  Photographers: ['We cried looking through the gallery. Every real moment is there.', 'Totally invisible on the day, then delivered in under five weeks.', 'Made two very awkward people look relaxed in portraits!', 'The sunset portraits are the best photos we own.'],
  Catering: ['Guests are still asking for the lamb recipe.', 'Handled 12 dietary requirements without a single mix-up.', 'Generous portions and the service team were brilliant.', 'The sharing-style dinner got everyone talking across the tables.'],
  Florists: ['The arch was even better than the mood board.', 'Our bouquet lasted the whole week after the wedding.', 'Listened to our budget and still made it look lavish.', 'Re-used the ceremony flowers on the tables — clever and beautiful.'],
  Music: ['Packed dance floor from the first song to the last.', 'The aisle arrangement of our song was perfect.', 'Read the room brilliantly — everyone from Gran to the kids danced.', 'Easy to deal with and arrived early to set up.'],
  Cakes: ['Looked stunning and tasted even better.', 'The tasting box made choosing flavours so fun.', 'Delivered and set up perfectly in 30°C heat!', 'Every slice went — nobody took any home.'],
  'Hair & make-up': ['Felt like myself, just the best version.', 'Make-up lasted through tears, dancing and a heatwave.', 'Kept the whole bridal party on schedule and calm.', 'The trial took all the stress away.'],
};
const reviewers = ['Priya & Sam', 'Hannah & Tom', 'Lucy & Ben', 'Chloe & Harry', 'Ella & George', 'Zara & Adam', 'Mia & Daniel', 'Isla & Ryan', 'Freya & Joe', 'Ruby & Will'];
const reviewWhen = ['2 weeks ago', '1 month ago', '2 months ago', '3 months ago'];

/* ---------------- deterministic generator (same numbers every load) ---------------- */
function seedFrom(str: string) { let h = 2166136261; for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619); return h >>> 0; }
function rng(seed: number) { return () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const pick = <T,>(r: () => number, a: T[]) => a[Math.floor(r() * a.length)];

export function reviewsFor(sup: Supplier, n = 3): Review[] {
  const r = rng(seedFrom(sup.id + ':rev'));
  const pool = [...reviewPool[sup.category]];
  const who = [...reviewers];
  return Array.from({ length: Math.min(n, pool.length) }, (_, i) => {
    const text = pool.splice(Math.floor(r() * pool.length), 1)[0];
    const by = who.splice(Math.floor(r() * who.length), 1)[0];
    return { by, when: reviewWhen[i], stars: r() > 0.25 ? 5 : 4, text };
  });
}

/* ---------------- supplier side ---------------- */
/** Platform fee — the most Everly will take. */
export const FEE = 0.03;
export const FEE_LABEL = '3%';
/** "Today" for the preview, so countdowns and due dates read the same for everyone. */
export const TODAY = '2026-10-29';
/** Final balance is due this many days before the wedding (default policy). */
export const BALANCE_DAYS = 56;
/** Couples have this many days to sign and pay the deposit once a contract is sent. */
export const CONTRACT_DAYS = 7;

/**
 * Booking journey:
 * new (enquiry) → held (date held, contract sent) → deposit (contract signed + deposit paid) → paid (fully paid)
 * plus declined / cancelled.
 */
export type JobStatus = 'new' | 'held' | 'deposit' | 'paid' | 'declined' | 'cancelled';
export const STATUS_LABEL: Record<JobStatus, string> = { new: 'New enquiry', held: 'Date held', deposit: 'Deposit paid', paid: 'Fully paid', declined: 'Declined', cancelled: 'Cancelled' };
export type Job = {
  id: string; couple: string; date: string; endDate?: string; pkg: string; pid?: string; guests: number;
  total: number; deposit: number; paid: number; status: JobStatus; source: 'Everly' | 'Direct';
  message?: string; phone?: string; email?: string; received?: string; contractDaysAgo?: number;
  fromCouplePreview?: boolean; noQuote?: boolean; note?: string; balanceDays?: number; cancelPolicy?: string; securityDeposit?: number;
};
export const isBooked = (j: Job) => j.status === 'deposit' || j.status === 'paid';
export const blocksDate = (j: Job) => j.status === 'held' || isBooked(j);
export const depositAmt = (j: Job) => Math.round((j.total * j.deposit) / 100);

export type Persona = { sup: Supplier; initials: string; jobs: Job[]; conversion: number; reviews: Review[] };

/** Months the preview covers: Jan 2026 – Dec 2027, as 'YYYY-MM'. */
export const PREVIEW_MONTHS: string[] = Array.from({ length: 24 }, (_, i) => `${2026 + Math.floor(i / 12)}-${String((i % 12) + 1).padStart(2, '0')}`);
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export const monthLabel = (ym: string, long = false) => {
  const [y, m] = ym.split('-').map(Number);
  return long ? `${new Date(y, m - 1, 1).toLocaleDateString('en-GB', { month: 'long' })} ${y}` : `${MONTH_NAMES[m - 1]}${long ? '' : ` ${String(y).slice(2)}`}`;
};

const couples = ['Priya & Sam', 'Hannah & Tom', 'Lucy & Ben', 'Olivia & Jack', 'Amelia & Noah', 'Grace & Oliver', 'Chloe & Harry', 'Ella & George', 'Zara & Adam', 'Mia & Daniel', 'Isla & Ryan', 'Freya & Joe', 'Ruby & Will', 'Evie & Matt', 'Leah & Chris', 'Nadia & Kieran', 'Jess & Aaron', 'Holly & Luke', 'Kate & Rhys', 'Anna & Marco', 'Beth & Owen', 'Sara & Imran', 'Laura & Dan', 'Fiona & Euan', 'Rosie & Alfie', 'Maya & Ethan', 'Alice & Theo', 'Niamh & Conor', 'Tara & Josh', 'Lily & Sam', 'Erin & Max', 'Poppy & Jake', 'Katie & Liam', 'Ava & Harvey', 'Emily & Joel', 'Sophia & Rory', 'Megan & Tom', 'Charlotte & Ed', 'Jasmine & Kai', 'Bella & Finn'];
const messages: Record<Category, string[]> = {
  Venues: ['Hi! We’re getting married on {date} with around {guests} guests and love the {pkg} package. Is the date available, and could we arrange a visit?', 'Hello — we’re hoping to book {date} for {guests} guests. Could you share your wet-weather plan and whether we can bring our own caterer?', 'Hi! Is {date} still free? We’d love the {pkg} and would like to come and see the venue on a weekend.'],
  Photographers: ['Hi! We love your natural style. Are you free on {date}? We’re interested in {pkg} — could you send a full sample gallery?', 'Hello! Our wedding is on {date}, around {guests} guests. Do you travel to our venue and is {pkg} still available?', 'Hi! Can we add an engagement shoot to {pkg}? Our date is {date}.'],
  Catering: ['Hello! We’re planning for {guests} guests on {date} and are keen on the {pkg}. Can you cater for two vegans and a gluten-free guest?', 'Hi! Could we book a tasting? We’re thinking {pkg} for {guests} guests on {date}.', 'Hello — do you provide crockery and bar staff with the {pkg}? Our date is {date}.'],
  Florists: ['Hi! We’re thinking {pkg} in whites and soft greens. Are you available on {date}?', 'Hello! Could you do a quote for {pkg} for {date}? We’d love lots of trailing greenery.', 'Hi! Can the ceremony flowers be moved to the tables after? Date is {date}.'],
  Music: ['Hi! Are you free on {date}? We’d love {pkg} — can you learn one song for our first dance?', 'Hello! What time would you need to arrive to set up for {pkg} on {date}?', 'Hi! Is {date} free for {pkg}? We have around {guests} guests.'],
  Cakes: ['Hi! We’d love a cake for {guests} guests on {date}. Do you offer tastings?', 'Hello! Could {pkg} be lemon & elderflower plus chocolate? Our date is {date}.', 'Hi! Is {date} free for the {pkg}? We need one tier gluten-free.'],
  'Hair & make-up': ['Hi! Looking for bridal hair & make-up on {date} for me plus 3 bridesmaids. Do you offer a trial?', 'Hello! Is {date} available for {pkg}? Getting ready starts at 8am.', 'Hi! Could you do the mums too? We’re looking at {pkg} for {date}.'],
};
const received = ['12 min ago', '2h ago', '5h ago', 'Yesterday', '2 days ago', '3 days ago'];

const iso = (y: number, m: number, d: number) => `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
export const addDays = (s: string, n: number) => { const d = new Date(s + 'T12:00:00'); d.setDate(d.getDate() + n); return iso(d.getFullYear(), d.getMonth(), d.getDate()); };
export const daysBetween = (a: string, b: string) => Math.round((new Date(b + 'T12:00:00').getTime() - new Date(a + 'T12:00:00').getTime()) / 864e5);
const roundPrice = (n: number) => (n >= 1000 ? Math.round(n / 100) * 100 : n >= 100 ? Math.round(n / 10) * 10 : Math.round(n));
const fill = (t: string, v: Record<string, string>) => t.replace(/\{(\w+)\}/g, (_, k) => v[k] ?? '');
const multiDay = (p: Package) => p.hours === '3 days';

/** weekend prices are higher; per-guest suppliers show per-head prices */
export function dayPrice(sup: Supplier, isoDate: string) {
  const d = new Date(isoDate + 'T12:00:00').getDay();
  if (sup.packages[0].perGuest) return roundPrice(sup.fromPrice * (d === 6 ? 1.1 : 1));
  const k = sup.category === 'Venues' ? (d === 6 ? 1 : d === 5 ? 0.86 : d === 0 ? 0.8 : 0.65) : (d === 6 ? 1 : d === 5 || d === 0 ? 0.95 : 0.85);
  return roundPrice(sup.fromPrice * k);
}
export const shortGbp = (n: number) => (n >= 1000 ? `£${(n / 1000).toFixed(1).replace(/\.0$/, '')}k` : `£${Math.round(n)}`);
export function shortPrice(sup: Supplier, n: number) {
  return sup.packages[0].perGuest ? `£${n}pp` : shortGbp(n);
}

/** payments a supplier is waiting on: deposits for held dates, balances for deposit-paid bookings */
export type Due = { job: Job; kind: 'Deposit' | 'Final payment'; amount: number; due: string; inDays: number };
export function paymentsDue(jobs: Job[], today = TODAY): Due[] {
  const out: Due[] = [];
  for (const j of jobs) {
    if (j.noQuote) continue;
    if (j.status === 'held') {
      const due = addDays(today, CONTRACT_DAYS - (j.contractDaysAgo ?? 0));
      out.push({ job: j, kind: 'Deposit', amount: depositAmt(j), due, inDays: daysBetween(today, due) });
    } else if (j.status === 'deposit' && j.total > j.paid) {
      const due = addDays(j.date, -(j.balanceDays ?? BALANCE_DAYS));
      out.push({ job: j, kind: 'Final payment', amount: j.total - j.paid, due, inDays: daysBetween(today, due) });
    }
  }
  return out.sort((a, b) => a.due.localeCompare(b.due));
}

const cache = new Map<string, Persona>();
export function personaFor(id: string): Persona {
  const hit = cache.get(id);
  if (hit) return hit;
  const sup = supById(id) ?? suppliers[0];
  const r = rng(seedFrom(sup.id));
  const guestsFor = (p: Package) => Math.min(p.maxGuests ?? 200, Math.round((60 + r() * 100) / 5) * 5);
  const used = new Set<string>();
  const names = [...couples].sort(() => r() - 0.5);
  let n = 0;
  const jobs: Job[] = [];
  const statusFor = (date: string): JobStatus => {
    if (date < TODAY) return 'paid';
    const ahead = daysBetween(TODAY, date);
    if (ahead < BALANCE_DAYS) return r() < 0.88 ? 'paid' : 'deposit';
    if (ahead < 150) return r() < 0.25 ? 'paid' : 'deposit';
    const x = r();
    return x < 0.12 ? 'held' : x < 0.25 ? 'paid' : 'deposit';
  };
  const mk = (date: string, status: JobStatus): void => {
    const p = pick(r, sup.packages);
    const guests = guestsFor(p);
    const total = pkgTotal(p, guests);
    const end = multiDay(p) ? addDays(date, 2) : undefined;
    for (let i = 0; i <= (end ? 2 : 0); i++) used.add(addDays(date, i));
    const direct = r() > 0.72;
    jobs.push({
      id: (direct ? 'D-' : 'E-') + (19000 + Math.floor(r() * 2000)), couple: names[n++ % names.length], date, endDate: end, pkg: p.name, pid: p.id, guests, total, deposit: p.deposit,
      paid: status === 'paid' ? total : status === 'deposit' ? Math.round((total * p.deposit) / 100) : 0, status, source: direct ? 'Direct' : 'Everly',
      contractDaysAgo: status === 'held' ? 1 + Math.floor(r() * 5) : undefined,
    });
  };
  (sup.booked ?? []).forEach((d) => mk(d, 'deposit'));
  for (const ym of PREVIEW_MONTHS) {
    const [y, m1] = ym.split('-').map(Number); const m = m1 - 1;
    const days = new Date(y, m + 1, 0).getDate();
    const cand: string[] = [];
    for (let d = 1; d <= days; d++) { const s = iso(y, m, d); const wd = new Date(s + 'T12:00:00').getDay(); if (wd === 6 || wd === 5 || (wd === 0 && r() < 0.4)) cand.push(s); }
    const season = m >= 4 && m <= 8 ? 3 : m === 3 || m === 9 ? 2 : 1; // busier May–Sep
    const want = Math.max(1, season + Math.floor(r() * 2) + (m === 5 || m === 6 ? 1 : 0) - (y === 2026 ? 1 : 0));
    for (let i = 0; i < want && cand.length; i++) {
      const s = cand.splice(Math.floor(r() * cand.length), 1)[0];
      const span = [s, addDays(s, 1), addDays(s, 2)];
      if (span.some((x) => SAMPLE_DATES.includes(x) || used.has(x))) continue;
      mk(s, statusFor(s));
    }
  }

  // incoming enquiries (3 new, 2 already held with a contract out)
  const tmpl = messages[sup.category];
  for (let i = 0; i < 5; i++) {
    let date = '';
    for (let t = 0; t < 60 && !date; t++) {
      const ym = PREVIEW_MONTHS[15 + Math.floor(r() * 7)]; // Apr – Oct 2027
      const [y, m1] = ym.split('-').map(Number); const s = iso(y, m1 - 1, 1 + Math.floor(r() * 28));
      const wd = new Date(s + 'T12:00:00').getDay();
      if ((wd === 6 || wd === 5) && !used.has(s) && !SAMPLE_DATES.includes(s)) date = s;
    }
    const p = pick(r, sup.packages); const guests = guestsFor(p); const couple = names[n++ % names.length];
    const first = couple.split(' & ')[0].toLowerCase();
    jobs.push({
      id: 'E-' + (20460 + i * 7), couple, date, guests, pkg: p.name, pid: p.id, total: pkgTotal(p, guests), deposit: p.deposit, paid: 0, source: 'Everly',
      message: fill(tmpl[i % tmpl.length], { date: fmtDate(date, { day: 'numeric', month: 'long', year: 'numeric' }), guests: String(guests), pkg: p.name }),
      phone: `07700 900${String(100 + Math.floor(r() * 800))}`, email: `${first}@example.com`, received: received[i], status: i < 3 ? 'new' : 'held', contractDaysAgo: i < 3 ? undefined : 2 + i,
    });
    used.add(date);
  }
  jobs.sort((a, b) => a.date.localeCompare(b.date));

  const words = sup.name.replace(/^The /, '').split(/\s+/).filter((w) => /^[A-Z]/.test(w));
  const persona: Persona = {
    sup, initials: (words[0][0] + (words[1]?.[0] ?? words[0][1] ?? '')).toUpperCase(), jobs,
    conversion: 28 + Math.floor(r() * 18), reviews: reviewsFor(sup, 3),
  };
  cache.set(id, persona);
  return persona;
}

/** dates a couple sees as unavailable for a supplier (held or booked) */
export function unavailable(sup: Supplier): Set<string> {
  const out = new Set<string>();
  personaFor(sup.id).jobs.filter(blocksDate).forEach((b) => { let d = b.date; const end = b.endDate || b.date; while (d <= end) { out.add(d); d = addDays(d, 1); } });
  return out;
}

/** one supplier of each type, offered in the supplier preview's "Preview as" switcher */
export const featuredPersonas = ['stone-villa', 'meadow-light', 'long-table', 'wild-bloom', 'the-standards', 'crumb-crown', 'bloom-beauty'];

/* ---------------- inspiration mood boards ---------------- */
export type Board = {
  id: string; name: string; blurb: string; imgs: string[]; palette: [string, string][]; words: string[]; ideas: string[];
  match: { region: string; style: string; regions: string[]; styles: string[] };
};
export const boards: Board[] = [
  {
    id: 'country', name: 'Country house', blurb: 'Honey stone, walled gardens and long candlelit tables.',
    imgs: ['/images/villa.jpg', '/images/table.jpg', '/images/avenue.jpg', '/images/bouquet.jpg', '/images/gardens.jpg'],
    palette: [['Olive', '#7A8F58'], ['Honey stone', '#D8C29D'], ['Ivory', '#FAF6F2'], ['Soft sage', '#C9D3B0'], ['Blush', '#E7C8BE']],
    words: ['Walled garden', 'Garden roses', 'Long tables', 'Candlelight', 'Linen'],
    ideas: ['Ceremony in the walled garden, drinks on the lawn', 'Long banquet tables with trailing greenery', 'String quartet for the aisle, party band after dinner'],
    match: { region: 'Cotswolds', style: 'Country house', regions: ['Cotswolds', 'Yorkshire', 'Lake District'], styles: ['Country house', 'Classic', 'Garden'] },
  },
  {
    id: 'city', name: 'City', blurb: 'Warehouse lofts, rooftop vows and a late-night party.',
    imgs: ['/images/setting.jpg', '/images/table.jpg', '/images/aisle.jpg', '/images/bouquet2.jpg', '/images/table2.jpg'],
    palette: [['Ink', '#2A2A24'], ['Champagne', '#D4B895'], ['Chalk', '#F4F1EC'], ['Smoke', '#9A978C'], ['Brass', '#B08D57']],
    words: ['Rooftop', 'Industrial', 'Flash photography', 'Cocktails', 'Statement florals'],
    ideas: ['Registry ceremony, then street portraits across the city', 'Bowl-food dinner and a cocktail bar', 'Hanging floral cloud over the dance floor'],
    match: { region: 'London', style: 'Modern', regions: ['London'], styles: ['Modern'] },
  },
  {
    id: 'mountain', name: 'Mountain', blurb: 'Fells, lakes and a cosy barn with a fire pit.',
    imgs: ['/images/hills.jpg', '/images/field.jpg', '/images/hero.jpg', '/images/table2.jpg', '/images/couple.jpg'],
    palette: [['Pine', '#3F4E34'], ['Slate', '#6B7177'], ['Moss', '#8C9A6B'], ['Heather', '#A88BA0'], ['Oat', '#E8DCC6']],
    words: ['Lakeside vows', 'Fire pits', 'Wool blankets', 'Adventure portraits', 'Whisky bar'],
    ideas: ['Meadow ceremony with the fells behind you', 'Mountain portrait session at golden hour', 'Hot drinks and blankets around the fire pit'],
    match: { region: 'Lake District', style: 'Rustic', regions: ['Lake District', 'Scotland', 'Yorkshire'], styles: ['Rustic', 'Country house'] },
  },
  {
    id: 'seaside', name: 'Seaside', blurb: 'Clifftop ceremonies, sea pinks and sunset on the beach.',
    imgs: ['/images/aisle.jpg', '/images/hills.jpg', '/images/bouquet2.jpg', '/images/couple.jpg', '/images/setting.jpg'],
    palette: [['Sea', '#5E8C99'], ['Sand', '#E9DCC4'], ['Sea pink', '#E4A9B0'], ['Driftwood', '#A89580'], ['Foam', '#F6F4EE']],
    words: ['Clifftop', 'Sea pinks', 'Barefoot', 'Sunset portraits', 'Seafood feast'],
    ideas: ['Terrace ceremony overlooking the harbour', 'Sunset beach portraits after dinner', 'Grasses and sea pinks instead of formal florals'],
    match: { region: 'Cornwall', style: 'Coastal', regions: ['Cornwall', 'Devon'], styles: ['Coastal', 'Garden'] },
  },
  {
    id: 'garden', name: 'Garden party', blurb: 'Orchards, parterres and a relaxed outdoor feast.',
    imgs: ['/images/gardens.jpg', '/images/arch.jpg', '/images/bouquet.jpg', '/images/table2.jpg', '/images/field.jpg'],
    palette: [['Leaf', '#6E8B4E'], ['Petal', '#F1D7D2'], ['Butter', '#F3E3A6'], ['Cream', '#FBF7EF'], ['Lavender', '#B9AFD1']],
    words: ['Floral arch', 'Orchard', 'Festoon lights', 'Sharing boards', 'Lawn games'],
    ideas: ['Floral arch at the end of a grass aisle', 'Sharing boards and a pudding table', 'Festoon lights strung through the trees'],
    match: { region: 'Devon', style: 'Garden', regions: ['Devon', 'Cotswolds', 'Surrey'], styles: ['Garden'] },
  },
  {
    id: 'barn', name: 'Rustic barn', blurb: 'Timber beams, wildflowers and dancing till late.',
    imgs: ['/images/table2.jpg', '/images/field.jpg', '/images/hills.jpg', '/images/bouquet.jpg', '/images/table.jpg'],
    palette: [['Oak', '#8A6A4A'], ['Wheat', '#E6D3A8'], ['Fern', '#6F8455'], ['Rust', '#B5643C'], ['Cream', '#FAF3E6']],
    words: ['Timber beams', 'Wildflowers', 'Hay bales', 'Live-fire food', 'Barn dance'],
    ideas: ['Wildflowers in jam jars down the tables', 'Live-fire sharing feast', 'Ceilidh or party band in the barn'],
    match: { region: 'Surrey', style: 'Rustic', regions: ['Surrey', 'Cornwall', 'Lake District', 'Scotland'], styles: ['Rustic'] },
  },
];
