
-- Reverse balance on delete
CREATE OR REPLACE FUNCTION public.reverse_treasury_movement()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.from_account_id IS NOT NULL THEN
    UPDATE public.treasury_accounts SET balance = balance + OLD.amount WHERE id = OLD.from_account_id;
  END IF;
  IF OLD.to_account_id IS NOT NULL THEN
    UPDATE public.treasury_accounts SET balance = balance - OLD.amount WHERE id = OLD.to_account_id;
  END IF;
  RETURN OLD;
END $$;

-- Reapply on update (reverse old, apply new)
CREATE OR REPLACE FUNCTION public.update_treasury_movement()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.from_account_id IS NOT NULL THEN
    UPDATE public.treasury_accounts SET balance = balance + OLD.amount WHERE id = OLD.from_account_id;
  END IF;
  IF OLD.to_account_id IS NOT NULL THEN
    UPDATE public.treasury_accounts SET balance = balance - OLD.amount WHERE id = OLD.to_account_id;
  END IF;
  IF NEW.from_account_id IS NOT NULL THEN
    UPDATE public.treasury_accounts SET balance = balance - NEW.amount WHERE id = NEW.from_account_id;
  END IF;
  IF NEW.to_account_id IS NOT NULL THEN
    UPDATE public.treasury_accounts SET balance = balance + NEW.amount WHERE id = NEW.to_account_id;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS treasury_insert_balance ON public.treasury_transactions;
DROP TRIGGER IF EXISTS treasury_update_balance ON public.treasury_transactions;
DROP TRIGGER IF EXISTS treasury_delete_balance ON public.treasury_transactions;

CREATE TRIGGER treasury_insert_balance
AFTER INSERT ON public.treasury_transactions
FOR EACH ROW EXECUTE FUNCTION public.apply_treasury_movement();

CREATE TRIGGER treasury_update_balance
AFTER UPDATE ON public.treasury_transactions
FOR EACH ROW EXECUTE FUNCTION public.update_treasury_movement();

CREATE TRIGGER treasury_delete_balance
AFTER DELETE ON public.treasury_transactions
FOR EACH ROW EXECUTE FUNCTION public.reverse_treasury_movement();
