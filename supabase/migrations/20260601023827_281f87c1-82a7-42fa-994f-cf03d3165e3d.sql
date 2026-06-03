
-- Base grants for every public table: authenticated CRUD + service_role ALL
DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT c.relname FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
           WHERE n.nspname='public' AND c.relkind='r'
  LOOP
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', r.relname);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', r.relname);
  END LOOP;
END $$;

-- Publicly browsable tables: anon SELECT
GRANT SELECT ON public.products      TO anon;
GRANT SELECT ON public.categories    TO anon;
GRANT SELECT ON public.brands        TO anon;
GRANT SELECT ON public.banners       TO anon;
GRANT SELECT ON public.ads           TO anon;
GRANT SELECT ON public.promotions    TO anon;
GRANT SELECT ON public.coupons       TO anon;

-- Guest checkout: anon needs to create orders + order_items
GRANT INSERT ON public.orders        TO anon;
GRANT INSERT ON public.order_items   TO anon;
GRANT UPDATE ON public.coupons       TO anon; -- to bump uses counter

-- Sequences (if any)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated, anon, service_role;
