/** Database schema. Every statement is idempotent, so it runs safely on each cold start. */
export const SCHEMA = /* sql */ `
create table if not exists settings (
  key text primary key,
  value text not null
);

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  password_hash text not null,
  name text not null default '',
  role text not null check (role in ('couple','supplier','admin')),
  status text not null default 'active' check (status in ('active','suspended')),
  created_at timestamptz not null default now(),
  last_login timestamptz
);
alter table users add column if not exists terms_version text;
alter table users add column if not exists terms_accepted_at timestamptz;
alter table users add column if not exists reset_allowed_until timestamptz;

create table if not exists login_codes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  code_hash text not null,
  expires_at timestamptz not null,
  attempts int not null default 0,
  used_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists login_codes_user on login_codes (user_id, created_at desc);

create table if not exists auth_attempts (
  key text not null,
  at timestamptz not null default now()
);
create index if not exists auth_attempts_key on auth_attempts (key, at);

create table if not exists suppliers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references users(id) on delete cascade,
  name text not null,
  category text not null,
  town text not null default '',
  region text not null default '',
  style text not null default '',
  about text not null default '',
  capacity int,
  travels boolean not null default false,
  phone text not null default '',
  website text not null default '',
  status text not null default 'pending' check (status in ('pending','approved','suspended')),
  plan text not null default 'founding',
  featured boolean not null default false,
  spotlight boolean not null default false,
  brochure_url text,
  brochure_name text,
  created_at timestamptz not null default now()
);

create table if not exists photos (
  id uuid primary key default gen_random_uuid(),
  supplier_id uuid not null references suppliers(id) on delete cascade,
  url text not null,
  position int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists photos_supplier on photos(supplier_id, position);

create table if not exists packages (
  id uuid primary key default gen_random_uuid(),
  supplier_id uuid not null references suppliers(id) on delete cascade,
  name text not null,
  summary text not null default '',
  price int not null,
  per_guest boolean not null default false,
  deposit int not null default 25,
  max_guests int,
  hours text not null default '',
  includes text[] not null default '{}',
  position int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists packages_supplier on packages(supplier_id);

create table if not exists extras (
  id uuid primary key default gen_random_uuid(),
  supplier_id uuid not null references suppliers(id) on delete cascade,
  name text not null,
  price int not null default 0,
  per_guest boolean not null default false,
  position int not null default 0
);

create table if not exists closed_dates (
  supplier_id uuid not null references suppliers(id) on delete cascade,
  date date not null,
  reason text not null default '',
  primary key (supplier_id, date)
);

create table if not exists weddings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references users(id) on delete cascade,
  names text not null default '',
  date date,
  region text not null default '',
  place text not null default '',
  guests int not null default 100,
  budget int not null default 20000,
  created_at timestamptz not null default now()
);

create table if not exists plan_items (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references weddings(id) on delete cascade,
  supplier_id uuid not null references suppliers(id) on delete cascade,
  package_id uuid references packages(id) on delete cascade,
  extras uuid[] not null default '{}',
  created_at timestamptz not null default now(),
  unique (wedding_id, supplier_id)
);

create table if not exists bookings (
  id uuid primary key default gen_random_uuid(),
  ref_no bigserial,
  supplier_id uuid not null references suppliers(id) on delete cascade,
  wedding_id uuid references weddings(id) on delete set null,
  couple_user_id uuid references users(id) on delete set null,
  couple_name text not null,
  couple_email text not null default '',
  couple_phone text not null default '',
  date date not null,
  end_date date,
  guests int not null default 0,
  package_id uuid references packages(id) on delete set null,
  package_name text not null default '',
  extras jsonb not null default '[]',
  total int not null default 0,
  deposit_pct int not null default 25,
  balance_weeks int not null default 8,
  status text not null default 'enquiry' check (status in ('enquiry','contract','deposit','paid','declined','cancelled')),
  source text not null default 'asteria' check (source in ('asteria','direct')),
  message text not null default '',
  note text not null default '',
  contract_terms text not null default '',
  contract_sent_at timestamptz,
  contract_signed_at timestamptz,
  paid int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists bookings_supplier on bookings(supplier_id, date);
create index if not exists bookings_couple on bookings(couple_user_id);

create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references bookings(id) on delete cascade,
  sender_id uuid references users(id) on delete set null,
  kind text not null default 'text' check (kind in ('text','note')),
  body text not null,
  read_couple boolean not null default false,
  read_supplier boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists messages_booking on messages(booking_id, created_at);

create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references bookings(id) on delete cascade,
  kind text not null default 'other',
  amount int not null,
  method text not null default 'manual',
  reference text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists guests (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references weddings(id) on delete cascade,
  name text not null,
  side text not null default '',
  plus_ones int not null default 0,
  rsvp text not null default 'awaiting' check (rsvp in ('awaiting','yes','no')),
  plus_coming int not null default 0,
  dietary text not null default '',
  email text not null default '',
  phone text not null default '',
  invited boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists saved (
  user_id uuid not null references users(id) on delete cascade,
  supplier_id uuid not null references suppliers(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, supplier_id)
);

create table if not exists tasks_done (
  wedding_id uuid not null references weddings(id) on delete cascade,
  key text not null,
  primary key (wedding_id, key)
);

create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  body text not null,
  link text not null default '',
  read boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists notifications_user on notifications(user_id, created_at desc);

/* ---------- stage 2: payments, subscriptions, Asteria Plus ---------- */
alter table suppliers add column if not exists approved_at timestamptz;
alter table suppliers add column if not exists stripe_account text;
alter table suppliers add column if not exists stripe_account_mode text;
alter table suppliers add column if not exists payouts_ready boolean not null default false;
alter table suppliers add column if not exists stripe_customer text;
alter table suppliers add column if not exists stripe_customer_mode text;
alter table suppliers add column if not exists plan_sub text;
alter table suppliers add column if not exists featured_sub text;
alter table suppliers add column if not exists spotlight_sub text;
update suppliers set approved_at = created_at where status = 'approved' and approved_at is null;

alter table users add column if not exists plus boolean not null default false;
alter table users add column if not exists plus_at timestamptz;

alter table payments add column if not exists stripe_session text;
alter table payments add column if not exists fee_pence int not null default 0;
create unique index if not exists payments_stripe_session on payments(stripe_session) where stripe_session is not null;

-- Asteria's own income: plans, Featured, Spotlight, Wedding Pass
create table if not exists platform_payments (
  id uuid primary key default gen_random_uuid(),
  kind text not null,
  supplier_id uuid references suppliers(id) on delete set null,
  user_id uuid references users(id) on delete set null,
  amount_pence int not null,
  stripe_id text unique,
  created_at timestamptz not null default now()
);

create table if not exists stripe_events (
  id text primary key,
  created_at timestamptz not null default now()
);

-- couples can keep several plans (Asteria Plus)
create table if not exists wedding_plans (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references weddings(id) on delete cascade,
  name text not null default 'My plan',
  created_at timestamptz not null default now()
);
alter table plan_items add column if not exists plan_id uuid references wedding_plans(id) on delete cascade;
insert into wedding_plans (wedding_id, name)
  select w.id, 'My plan' from weddings w
  where exists (select 1 from plan_items i where i.wedding_id = w.id and i.plan_id is null)
    and not exists (select 1 from wedding_plans p where p.wedding_id = w.id);
update plan_items i set plan_id = (select p.id from wedding_plans p where p.wedding_id = i.wedding_id order by p.created_at limit 1) where i.plan_id is null;
alter table plan_items drop constraint if exists plan_items_wedding_id_supplier_id_key;
create unique index if not exists plan_items_plan_supplier on plan_items(plan_id, supplier_id);
`;
