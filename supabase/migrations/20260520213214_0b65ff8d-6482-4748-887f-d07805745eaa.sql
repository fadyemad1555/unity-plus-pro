CREATE TABLE public.customer_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name text NOT NULL,
  customer_phone text,
  account_id uuid REFERENCES public.treasury_accounts(id),
  amount numeric NOT NULL,
  payment_method text NOT NULL DEFAULT 'cash',
  paid_at date NOT NULL DEFAULT CURRENT_DATE,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.customer_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage customer payments" ON public.customer_payments
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE OR REPLACE FUNCTION public.apply_customer_payment_to_treasury()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.account_id IS NOT NULL THEN
    INSERT INTO public.treasury_transactions (kind, amount, to_account_id, payment_method, description, reference_id)
    VALUES ('deposit'::treasury_kind, NEW.amount, NEW.account_id, NEW.payment_method, 'Customer payment - ' || NEW.customer_name, NEW.id);
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_customer_payment_treasury ON public.customer_payments;
CREATE TRIGGER trg_customer_payment_treasury
AFTER INSERT ON public.customer_payments
FOR EACH ROW EXECUTE FUNCTION public.apply_customer_payment_to_treasury();