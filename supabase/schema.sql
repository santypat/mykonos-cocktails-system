create extension if not exists pgcrypto;

create table if not exists public.app_users (
  id uuid primary key default gen_random_uuid(),
  username text not null unique,
  password_hash text not null,
  full_name text not null,
  role text not null default 'seller' check (role in ('admin', 'seller')),
  is_active boolean not null default true,
  is_principal boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.inventory (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  quantity numeric not null default 0 check (quantity >= 0),
  unit text not null default 'unidades',
  min_stock numeric not null default 5 check (min_stock >= 0),
  last_update timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  price numeric not null check (price >= 0),
  image text not null default '',
  is_active boolean not null default true,
  preparation jsonb not null default '[]'::jsonb,
  category text not null default 'Granizados',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.sales (
  id uuid primary key default gen_random_uuid(),
  items jsonb not null default '[]'::jsonb,
  total numeric not null check (total >= 0),
  payment_method text not null check (payment_method in ('cash', 'transfer')),
  seller_id uuid not null references public.app_users(id),
  seller_name text not null,
  invoice_number text not null unique,
  date timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.movements (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('income', 'expense')),
  amount numeric not null check (amount >= 0),
  payment_method text not null check (payment_method in ('cash', 'transfer')),
  description text not null,
  category text not null default 'Otros',
  user_id uuid not null references public.app_users(id),
  user_name text not null,
  date timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.shifts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.app_users(id),
  user_name text not null,
  start_time timestamptz not null default now(),
  end_time timestamptz,
  is_active boolean not null default true,
  total_sales numeric not null default 0,
  sales_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists app_users_set_updated_at on public.app_users;
create trigger app_users_set_updated_at
before update on public.app_users
for each row execute function public.set_updated_at();

drop trigger if exists inventory_set_updated_at on public.inventory;
create trigger inventory_set_updated_at
before update on public.inventory
for each row execute function public.set_updated_at();

drop trigger if exists products_set_updated_at on public.products;
create trigger products_set_updated_at
before update on public.products
for each row execute function public.set_updated_at();

drop trigger if exists sales_set_updated_at on public.sales;
create trigger sales_set_updated_at
before update on public.sales
for each row execute function public.set_updated_at();

drop trigger if exists movements_set_updated_at on public.movements;
create trigger movements_set_updated_at
before update on public.movements
for each row execute function public.set_updated_at();

drop trigger if exists shifts_set_updated_at on public.shifts;
create trigger shifts_set_updated_at
before update on public.shifts
for each row execute function public.set_updated_at();

alter table public.app_users enable row level security;
alter table public.inventory enable row level security;
alter table public.products enable row level security;
alter table public.sales enable row level security;
alter table public.movements enable row level security;
alter table public.shifts enable row level security;
