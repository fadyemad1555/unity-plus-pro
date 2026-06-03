
-- =========== ROLES ===========
create type public.app_role as enum ('admin', 'user');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  avatar_url text,
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, phone)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'phone');
  insert into public.user_roles (user_id, role)
  values (new.id, 'user')
  on conflict do nothing;
  return new;
end; $$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- profiles policies
create policy "Profiles viewable by self or admin" on public.profiles
  for select using (auth.uid() = id or public.has_role(auth.uid(), 'admin'));
create policy "Users update own profile" on public.profiles
  for update using (auth.uid() = id);
create policy "Users insert own profile" on public.profiles
  for insert with check (auth.uid() = id);

-- roles policies
create policy "Users see own roles" on public.user_roles
  for select using (auth.uid() = user_id or public.has_role(auth.uid(), 'admin'));
create policy "Admins manage roles" on public.user_roles
  for all using (public.has_role(auth.uid(), 'admin'));

-- =========== CATALOG ===========
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name_en text not null,
  name_ar text not null,
  slug text unique not null,
  image_url text,
  created_at timestamptz not null default now()
);
alter table public.categories enable row level security;
create policy "Categories public read" on public.categories for select using (true);
create policy "Admins manage categories" on public.categories for all using (public.has_role(auth.uid(),'admin'));

create table public.brands (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  logo_url text,
  created_at timestamptz not null default now()
);
alter table public.brands enable row level security;
create policy "Brands public read" on public.brands for select using (true);
create policy "Admins manage brands" on public.brands for all using (public.has_role(auth.uid(),'admin'));

create table public.products (
  id uuid primary key default gen_random_uuid(),
  name_en text not null,
  name_ar text not null,
  description_en text,
  description_ar text,
  price numeric(12,2) not null default 0,
  discount_percent int not null default 0,
  cost numeric(12,2) not null default 0,
  stock int not null default 0,
  low_stock_threshold int not null default 5,
  category_id uuid references public.categories(id) on delete set null,
  brand_id uuid references public.brands(id) on delete set null,
  images text[] not null default '{}',
  video_url text,
  is_featured boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.products enable row level security;
create policy "Products public read" on public.products for select using (true);
create policy "Admins manage products" on public.products for all using (public.has_role(auth.uid(),'admin'));

-- =========== BANNERS ===========
create table public.banners (
  id uuid primary key default gen_random_uuid(),
  title_en text,
  title_ar text,
  subtitle_en text,
  subtitle_ar text,
  image_url text not null,
  link_url text,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.banners enable row level security;
create policy "Banners public read" on public.banners for select using (true);
create policy "Admins manage banners" on public.banners for all using (public.has_role(auth.uid(),'admin'));

-- =========== FAVORITES & CART ===========
create table public.favorites (
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, product_id)
);
alter table public.favorites enable row level security;
create policy "Users manage own favorites" on public.favorites for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table public.cart_items (
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  quantity int not null default 1,
  created_at timestamptz not null default now(),
  primary key (user_id, product_id)
);
alter table public.cart_items enable row level security;
create policy "Users manage own cart" on public.cart_items for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- =========== ORDERS ===========
create type public.order_status as enum ('pending','confirmed','shipped','delivered','cancelled');
create type public.payment_method as enum ('visa','mastercard','instapay','cash','cod');

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  customer_name text not null,
  customer_phone text not null,
  customer_address text not null,
  total numeric(12,2) not null default 0,
  paid numeric(12,2) not null default 0,
  payment_method payment_method not null default 'cod',
  status order_status not null default 'pending',
  notes text,
  created_at timestamptz not null default now()
);
alter table public.orders enable row level security;
create policy "Users see own orders" on public.orders for select using (auth.uid() = user_id or public.has_role(auth.uid(),'admin'));
create policy "Anyone can create orders" on public.orders for insert with check (true);
create policy "Admins update orders" on public.orders for update using (public.has_role(auth.uid(),'admin'));
create policy "Admins delete orders" on public.orders for delete using (public.has_role(auth.uid(),'admin'));

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_name text not null,
  unit_price numeric(12,2) not null,
  quantity int not null,
  created_at timestamptz not null default now()
);
alter table public.order_items enable row level security;
create policy "Order items follow order" on public.order_items for select using (
  exists (select 1 from public.orders o where o.id = order_id and (o.user_id = auth.uid() or public.has_role(auth.uid(),'admin')))
);
create policy "Anyone insert order items" on public.order_items for insert with check (true);
create policy "Admins manage order items" on public.order_items for all using (public.has_role(auth.uid(),'admin'));

-- Decrement stock when order_items inserted
create or replace function public.decrement_stock_on_order_item()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.product_id is not null then
    update public.products set stock = greatest(stock - new.quantity, 0), updated_at = now() where id = new.product_id;
  end if;
  return new;
end; $$;
create trigger trg_decrement_stock after insert on public.order_items
for each row execute function public.decrement_stock_on_order_item();

-- =========== SUPPLIERS ===========
create table public.suppliers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  email text,
  address text,
  notes text,
  created_at timestamptz not null default now()
);
alter table public.suppliers enable row level security;
create policy "Admins manage suppliers" on public.suppliers for all using (public.has_role(auth.uid(),'admin'));

-- =========== INVOICES ===========
create table public.purchase_invoices (
  id uuid primary key default gen_random_uuid(),
  supplier_id uuid references public.suppliers(id) on delete set null,
  total numeric(12,2) not null default 0,
  paid numeric(12,2) not null default 0,
  payment_method payment_method not null default 'cash',
  notes text,
  created_at timestamptz not null default now()
);
alter table public.purchase_invoices enable row level security;
create policy "Admins manage purchase invoices" on public.purchase_invoices for all using (public.has_role(auth.uid(),'admin'));

create table public.purchase_invoice_items (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.purchase_invoices(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_name text not null,
  unit_cost numeric(12,2) not null,
  quantity int not null,
  created_at timestamptz not null default now()
);
alter table public.purchase_invoice_items enable row level security;
create policy "Admins manage purchase invoice items" on public.purchase_invoice_items for all using (public.has_role(auth.uid(),'admin'));

create or replace function public.increment_stock_on_purchase()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.product_id is not null then
    update public.products set stock = stock + new.quantity, updated_at = now() where id = new.product_id;
  end if;
  return new;
end; $$;
create trigger trg_increment_stock after insert on public.purchase_invoice_items
for each row execute function public.increment_stock_on_purchase();

create table public.sales_invoices (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders(id) on delete set null,
  customer_name text not null,
  total numeric(12,2) not null default 0,
  paid numeric(12,2) not null default 0,
  payment_method payment_method not null default 'cash',
  notes text,
  created_at timestamptz not null default now()
);
alter table public.sales_invoices enable row level security;
create policy "Admins manage sales invoices" on public.sales_invoices for all using (public.has_role(auth.uid(),'admin'));

-- =========== TREASURY ===========
create type public.treasury_kind as enum ('deposit','withdraw','sale','purchase','expense','income');

create table public.treasury_transactions (
  id uuid primary key default gen_random_uuid(),
  kind treasury_kind not null,
  amount numeric(12,2) not null,
  description text,
  reference_id uuid,
  created_at timestamptz not null default now()
);
alter table public.treasury_transactions enable row level security;
create policy "Admins manage treasury" on public.treasury_transactions for all using (public.has_role(auth.uid(),'admin'));

-- =========== STORAGE BUCKET ===========
insert into storage.buckets (id, name, public) values ('media','media', true)
on conflict (id) do nothing;

create policy "Media public read" on storage.objects for select using (bucket_id = 'media');
create policy "Admins upload media" on storage.objects for insert with check (bucket_id = 'media' and public.has_role(auth.uid(),'admin'));
create policy "Admins update media" on storage.objects for update using (bucket_id = 'media' and public.has_role(auth.uid(),'admin'));
create policy "Admins delete media" on storage.objects for delete using (bucket_id = 'media' and public.has_role(auth.uid(),'admin'));
