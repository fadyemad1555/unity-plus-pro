CREATE TABLE public.expense_categories (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL UNIQUE,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE public.expense_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage expense categories" ON public.expense_categories FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Expense categories public read" ON public.expense_categories FOR SELECT USING (true);

INSERT INTO public.expense_categories (name) VALUES ('إيجار'),('كهرباء'),('مياه'),('إنترنت'),('رواتب'),('مواصلات'),('تسويق'),('صيانة'),('أخرى') ON CONFLICT DO NOTHING;

-- Supplier payments table for installments
CREATE TABLE public.supplier_payments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  supplier_id uuid NOT NULL,
  amount numeric NOT NULL,
  account_id uuid,
  payment_method text NOT NULL DEFAULT 'cash',
  notes text,
  paid_at date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE public.supplier_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage supplier payments" ON public.supplier_payments FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE OR REPLACE FUNCTION public.apply_supplier_payment_to_treasury()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.account_id IS NOT NULL THEN
    INSERT INTO public.treasury_transactions (kind, amount, from_account_id, payment_method, description, reference_id)
    VALUES ('withdraw'::treasury_kind, NEW.amount, NEW.account_id, NEW.payment_method, 'Supplier payment', NEW.id);
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER trg_supplier_payment_treasury
AFTER INSERT ON public.supplier_payments
FOR EACH ROW EXECUTE FUNCTION public.apply_supplier_payment_to_treasury();