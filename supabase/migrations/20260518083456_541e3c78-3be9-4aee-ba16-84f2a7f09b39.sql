CREATE TABLE public.sales_invoice_items (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id uuid NOT NULL,
  product_id uuid,
  product_name text NOT NULL,
  quantity integer NOT NULL,
  unit_price numeric NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE public.sales_invoice_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage sales invoice items" ON public.sales_invoice_items FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE OR REPLACE FUNCTION public.decrement_stock_on_sales_item()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.product_id IS NOT NULL THEN
    UPDATE public.products SET stock = GREATEST(stock - NEW.quantity, 0), updated_at = now() WHERE id = NEW.product_id;
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER trg_sales_item_stock
AFTER INSERT ON public.sales_invoice_items
FOR EACH ROW EXECUTE FUNCTION public.decrement_stock_on_sales_item();