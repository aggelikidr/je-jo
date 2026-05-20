
-- Households
create table public.households (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  setup jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Tasks
create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  name text not null,
  category text not null,
  due_date date,
  status text not null default 'todo',
  added_by text not null,
  completed_by text,
  created_at timestamptz not null default now()
);
create index tasks_household_idx on public.tasks(household_id);

-- Furniture items
create table public.furniture_items (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  name text not null,
  room text not null,
  status text not null default 'need',
  note text,
  added_by text not null,
  created_at timestamptz not null default now()
);
create index furniture_household_idx on public.furniture_items(household_id);

-- Wish links
create table public.wish_links (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.furniture_items(id) on delete cascade,
  url text not null,
  label text,
  price numeric,
  added_by text not null,
  reactions jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index wish_links_item_idx on public.wish_links(item_id);

-- Updated_at trigger for households
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger households_touch_updated_at
before update on public.households
for each row execute function public.touch_updated_at();

-- RLS: permissive (access controlled by knowing the household code in-app)
alter table public.households enable row level security;
alter table public.tasks enable row level security;
alter table public.furniture_items enable row level security;
alter table public.wish_links enable row level security;

create policy "households open" on public.households for all using (true) with check (true);
create policy "tasks open" on public.tasks for all using (true) with check (true);
create policy "furniture open" on public.furniture_items for all using (true) with check (true);
create policy "wish_links open" on public.wish_links for all using (true) with check (true);

-- Realtime
alter table public.households replica identity full;
alter table public.tasks replica identity full;
alter table public.furniture_items replica identity full;
alter table public.wish_links replica identity full;

alter publication supabase_realtime add table public.households;
alter publication supabase_realtime add table public.tasks;
alter publication supabase_realtime add table public.furniture_items;
alter publication supabase_realtime add table public.wish_links;
