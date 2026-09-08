import { supabase } from "@/integrations/supabase/client";

const CART_TOKEN_KEY = "vastra_cart_token";

export const getCartToken = (): string => {
  try {
    let token = localStorage.getItem(CART_TOKEN_KEY);
    if (!token) {
      token = crypto.randomUUID();
      localStorage.setItem(CART_TOKEN_KEY, token);
    }
    return token;
  } catch {
    return crypto.randomUUID();
  }
};

export const resetCartToken = () => {
  try {
    localStorage.removeItem(CART_TOKEN_KEY);
  } catch {}
};

export interface TrackedCartItem {
  product_id: number;
  name: string;
  price: number;
  quantity: number;
  image?: string | null;
}

export const syncCartToServer = async (items: TrackedCartItem[]) => {
  try {
    const cartValue = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);
    await supabase.rpc("sync_cart", {
      _cart_token: getCartToken(),
      _items: items as any,
      _cart_value: cartValue,
      _item_count: itemCount,
    });
  } catch (e) {
    console.error("Cart sync failed", e);
  }
};

export const attachCartCustomer = async (
  details: { name?: string; email?: string; phone?: string },
  checkoutStarted = false
) => {
  try {
    await supabase.rpc("attach_cart_customer", {
      _cart_token: getCartToken(),
      _customer_name: details.name || null,
      _customer_email: details.email || null,
      _customer_phone: details.phone || null,
      _checkout_started: checkoutStarted,
    });
  } catch (e) {
    console.error("Cart customer attach failed", e);
  }
};

export const markCartPurchased = async (orderId: string) => {
  try {
    await supabase.rpc("mark_cart_purchased", {
      _cart_token: getCartToken(),
      _order_id: orderId,
    });
    resetCartToken();
  } catch (e) {
    console.error("Cart purchase marking failed", e);
  }
};
