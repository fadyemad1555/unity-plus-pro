import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const orderInput = z.object({
  userId: z.string().uuid().nullable().optional(),
  customer_name: z.string().min(1).max(200),
  customer_phone: z.string().min(1).max(50),
  customer_address: z.string().min(1).max(500),
  total: z.number().min(0),
  paid: z.number().min(0),
  payment_method: z.enum(["visa", "mastercard", "instapay", "cash", "cod"]),
  status: z.enum(["pending", "confirmed", "shipped", "delivered", "cancelled"]).default("pending"),
  notes: z.string().max(2000).nullable().optional(),
  couponCode: z.string().max(100).nullable().optional(),
  items: z.array(z.object({
    product_id: z.string().uuid().nullable().optional(),
    product_name: z.string().min(1).max(300),
    unit_price: z.number().min(0),
    quantity: z.number().int().min(1),
  })).min(1),
});

export const createOrder = createServerFn({ method: "POST" })
  .inputValidator((input) => orderInput.parse(input))
  .handler(async ({ data }) => {
    const { data: order, error: orderError } = await supabaseAdmin
      .from("orders")
      .insert({
        user_id: data.userId ?? null,
        customer_name: data.customer_name,
        customer_phone: data.customer_phone,
        customer_address: data.customer_address,
        total: data.total,
        paid: data.paid,
        payment_method: data.payment_method,
        status: data.status,
        notes: data.notes ?? null,
      })
      .select("id")
      .single();

    if (orderError) throw new Error(orderError.message);

    const { error: itemsError } = await supabaseAdmin.from("order_items").insert(
      data.items.map((item) => ({
        order_id: order.id,
        product_id: item.product_id ?? null,
        product_name: item.product_name,
        unit_price: item.unit_price,
        quantity: item.quantity,
      })),
    );

    if (itemsError) {
      await supabaseAdmin.from("orders").delete().eq("id", order.id);
      throw new Error(itemsError.message);
    }

    if (data.couponCode) {
      const { data: coupon } = await supabaseAdmin
        .from("coupons")
        .select("id, uses")
        .eq("code", data.couponCode)
        .maybeSingle();

      if (coupon) {
        await supabaseAdmin
          .from("coupons")
          .update({ uses: (coupon.uses ?? 0) + 1 })
          .eq("id", coupon.id);
      }
    }

    return { id: order.id };
  });