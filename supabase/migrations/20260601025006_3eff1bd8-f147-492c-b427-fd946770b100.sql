
-- Attach existing functions as triggers + add treasury auto-link for invoices/expenses

-- Treasury balance updater
DROP TRIGGER IF EXISTS trg_apply_treasury_movement ON public.treasury_transactions;
CREATE TRIGGER trg_apply_treasury_movement AFTER INSERT ON public.treasury_transactions
FOR EACH ROW EXECUTE FUNCTION public.apply_treasury_movement();

-- Stock triggers
DROP TRIGGER IF EXISTS trg_decrement_stock_order_item ON public.order_items;
CREATE TRIGGER trg_decrement_stock_order_item AFTER INSERT ON public.order_items
FOR EACH ROW EXECUTE FUNCTION public.decrement_stock_on_order_item();

DROP TRIGGER IF EXISTS trg_increment_stock_purchase ON public.purchase_invoice_items;
CREATE TRIGGER trg_increment_stock_purchase AFTER INSERT ON public.purchase_invoice_items
FOR EACH ROW EXECUTE FUNCTION public.increment_stock_on_purchase();

DROP TRIGGER IF EXISTS trg_decrement_stock_damaged ON public.damaged_items;
CREATE TRIGGER trg_decrement_stock_damaged AFTER INSERT ON public.damaged_items
FOR EACH ROW EXECUTE FUNCTION public.decrement_stock_on_damaged();

DROP TRIGGER IF EXISTS trg_decrement_stock_sales_item ON public.sales_invoice_items;
CREATE TRIGGER trg_decrement_stock_sales_item AFTER INSERT ON public.sales_invoice_items
FOR EACH ROW EXECUTE FUNCTION public.decrement_stock_on_sales_item();

-- Payment → treasury auto
DROP TRIGGER IF EXISTS trg_supplier_payment_treasury ON public.supplier_payments;
CREATE TRIGGER trg_supplier_payment_treasury AFTER INSERT ON public.supplier_payments
FOR EACH ROW EXECUTE FUNCTION public.apply_supplier_payment_to_treasury();

DROP TRIGGER IF EXISTS trg_customer_payment_treasury ON public.customer_payments;
CREATE TRIGGER trg_customer_payment_treasury AFTER INSERT ON public.customer_payments
FOR EACH ROW EXECUTE FUNCTION public.apply_customer_payment_to_treasury();

-- Expenses → treasury withdraw
CREATE OR REPLACE FUNCTION public.apply_expense_to_treasury()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.account_id IS NOT NULL AND NEW.amount > 0 THEN
    INSERT INTO public.treasury_transactions (kind, amount, from_account_id, payment_method, description, reference_id)
    VALUES ('withdraw'::treasury_kind, NEW.amount, NEW.account_id, NEW.payment_method, COALESCE('مصروف: ' || NEW.title, 'مصروف'), NEW.id);
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_expense_treasury ON public.expenses;
CREATE TRIGGER trg_expense_treasury AFTER INSERT ON public.expenses
FOR EACH ROW EXECUTE FUNCTION public.apply_expense_to_treasury();

-- Sales invoice → treasury deposit (paid portion)
CREATE OR REPLACE FUNCTION public.apply_sales_invoice_to_treasury()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.account_id IS NOT NULL AND NEW.paid > 0 THEN
    INSERT INTO public.treasury_transactions (kind, amount, to_account_id, payment_method, description, reference_id)
    VALUES ('deposit'::treasury_kind, NEW.paid, NEW.account_id, NEW.payment_method::text, 'فاتورة بيع - ' || COALESCE(NEW.customer_name,''), NEW.id);
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_sales_invoice_treasury ON public.sales_invoices;
CREATE TRIGGER trg_sales_invoice_treasury AFTER INSERT ON public.sales_invoices
FOR EACH ROW EXECUTE FUNCTION public.apply_sales_invoice_to_treasury();

-- Purchase invoice → treasury withdraw (paid portion)
CREATE OR REPLACE FUNCTION public.apply_purchase_invoice_to_treasury()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.account_id IS NOT NULL AND NEW.paid > 0 THEN
    INSERT INTO public.treasury_transactions (kind, amount, from_account_id, payment_method, description, reference_id)
    VALUES ('withdraw'::treasury_kind, NEW.paid, NEW.account_id, NEW.payment_method::text, 'فاتورة شراء', NEW.id);
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_purchase_invoice_treasury ON public.purchase_invoices;
CREATE TRIGGER trg_purchase_invoice_treasury AFTER INSERT ON public.purchase_invoices
FOR EACH ROW EXECUTE FUNCTION public.apply_purchase_invoice_to_treasury();

-- Damaged items → expense-style treasury withdraw (optional, only if cost > 0)
CREATE OR REPLACE FUNCTION public.apply_damaged_to_treasury()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  total numeric;
  default_acc uuid;
BEGIN
  total := COALESCE(NEW.unit_cost,0) * COALESCE(NEW.quantity,0);
  IF total > 0 THEN
    SELECT id INTO default_acc FROM public.treasury_accounts WHERE is_active = true ORDER BY created_at LIMIT 1;
    IF default_acc IS NOT NULL THEN
      INSERT INTO public.treasury_transactions (kind, amount, from_account_id, payment_method, description, reference_id)
      VALUES ('withdraw'::treasury_kind, total, default_acc, 'cash', 'تالف: ' || NEW.product_name, NEW.id);
    END IF;
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_damaged_treasury ON public.damaged_items;
CREATE TRIGGER trg_damaged_treasury AFTER INSERT ON public.damaged_items
FOR EACH ROW EXECUTE FUNCTION public.apply_damaged_to_treasury();
