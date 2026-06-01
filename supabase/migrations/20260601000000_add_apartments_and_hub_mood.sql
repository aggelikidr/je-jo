-- Apartments
create table public.apartments (
  id text primary key,
  household_id uuid not null references public.households(id) on delete cascade,
  title text not null,
  area text not null default '',
  price numeric not null default 0,
  sqm numeric not null default 0,
  floor integer not null default 0,
  rooms integer not null default 0,
  year integer not null default 0,
  heat text not null default '',
  source text not null default '',
  url text not null default '',
  photo jsonb not null default '{}'::jsonb,
  status text not null default 'shortlist',
  visit_date date,
  reactions jsonb not null default '{}'::jsonb,
  notes jsonb not null default '[]'::jsonb,
  tags jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);
create index apartments_household_idx on public.apartments(household_id);
alter table public.apartments enable row level security;
create policy "apartments open" on public.apartments for all using (true) with check (true);
alter table public.apartments replica identity full;

-- Hub mood (one row per household)
create table public.hub_mood (
  household_id uuid primary key references public.households(id) on delete cascade,
  text text not null default '',
  who text not null default 'p1',
  at integer not null default 0,
  updated_at timestamptz not null default now()
);
alter table public.hub_mood enable row level security;
create policy "hub_mood open" on public.hub_mood for all using (true) with check (true);
alter table public.hub_mood replica identity full;
