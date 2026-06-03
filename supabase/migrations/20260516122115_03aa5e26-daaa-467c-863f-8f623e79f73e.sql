
-- 1. Treasury accounts
create table public.treasury_accounts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  kind text not null default 'cash', -- cash, bank, wallet
  balance numeric not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.treasury_accounts enable row level security;
create policy "Admins manage treasury accounts" on public.treasury_accounts for all using (has_role(auth.uid(), 'admin'));
create policy "Treasury accounts public read" on public.treasury_accounts for select using (true);

-- seed default cash account
insert into public.treasury_accounts (name, kind) values ('Cash', 'cash');

-- 2. Update treasury_transactions for transfers + account linkage
alter table public.treasury_transactions add column if not exists from_account_id uuid references public.treasury_accounts(id);
alter table public.treasury_transactions add column if not exists to_account_id uuid references public.treasury_accounts(id);
alter table public.treasury_transactions add column if not exists payment_method text;

-- 3. Add account_id to orders, sales_invoices, purchase_invoices
alter table public.orders add column if not exists account_id uuid references public.treasury_accounts(id);
alter table public.sales_invoices add column if not exists account_id uuid references public.treasury_accounts(id);
alter table public.purchase_invoices add column if not exists account_id uuid references public.treasury_accounts(id);

-- 4. Nested categories
alter table public.categories add column if not exists parent_id uuid references public.categories(id) on delete set null;

-- 5. Expenses
create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text,
  amount numeric not null,
  account_id uuid references public.treasury_accounts(id),
  payment_method text not null default 'cash',
  notes text,
  spent_at date not null default current_date,
  created_at timestamptz not null default now()
);
alter table public.expenses enable row level security;
create policy "Admins manage expenses" on public.expenses for all using (has_role(auth.uid(), 'admin'));

-- 6. Damaged items (الهالك)
create table public.damaged_items (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.products(id) on delete set null,
  product_name text not null,
  quantity integer not null,
  unit_cost numeric not null default 0,
  reason text,
  recorded_at date not null default current_date,
  created_at timestamptz not null default now()
);
alter table public.damaged_items enable row level security;
create policy "Admins manage damaged items" on public.damaged_items for all using (has_role(auth.uid(), 'admin'));

-- Decrease product stock when damaged item is recorded
create or replace function public.decrement_stock_on_damaged()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.product_id is not null then
    update public.products set stock = greatest(stock - new.quantity, 0), updated_at = now() where id = new.product_id;
  end if;
  return new;
end; $$;
create trigger trg_damaged_decrement after insert on public.damaged_items for each row execute function public.decrement_stock_on_damaged();

-- 7. Coupons
create table public.coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  discount_type text not null default 'percent', -- percent or fixed
  discount_value numeric not null,
  min_subtotal numeric not null default 0,
  max_uses integer,
  uses integer not null default 0,
  expires_at timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.coupons enable row level security;
create policy "Admins manage coupons" on public.coupons for all using (has_role(auth.uid(), 'admin'));
create policy "Coupons public read" on public.coupons for select using (is_active = true);

-- 8. Promotions
create table public.promotions (
  id uuid primary key default gen_random_uuid(),
  title_en text not null,
  title_ar text not null,
  description_en text,
  description_ar text,
  image_url text,
  link_url text,
  starts_at timestamptz,
  ends_at timestamptz,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
alter table public.promotions enable row level security;
create policy "Admins manage promotions" on public.promotions for all using (has_role(auth.uid(), 'admin'));
create policy "Promotions public read" on public.promotions for select using (true);

-- 9. Ads
create table public.ads (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  image_url text not null,
  link_url text,
  placement text not null default 'home', -- home, sidebar, product
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
alter table public.ads enable row level security;
create policy "Admins manage ads" on public.ads for all using (has_role(auth.uid(), 'admin'));
create policy "Ads public read" on public.ads for select using (is_active = true);

-- 10. Treasury balance update function
create or replace function public.apply_treasury_movement()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.from_account_id is not null then
    update public.treasury_accounts set balance = balance - new.amount where id = new.from_account_id;
  end if;
  if new.to_account_id is not null then
    update public.treasury_accounts set balance = balance + new.amount where id = new.to_account_id;
  end if;
  return new;
end; $$;
create trigger trg_treasury_apply after insert on public.treasury_transactions for each row execute function public.apply_treasury_movement();
