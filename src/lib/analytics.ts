// GA4 analytics helpers. The gtag script is loaded in index.html.
// All ecommerce events use INR currency and dedupe against sessionStorage.

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
  }
}

const MEASUREMENT_ID = "G-XCDLFVQXJ2";

const gtag = (...args: any[]) => {
  if (typeof window === "undefined") return;
  if (typeof window.gtag === "function") {
    window.gtag(...args);
  }
};

const onceKey = (name: string, id: string) => `ga4:${name}:${id}`;
const firedOnce = (name: string, id: string) => {
  try {
    const key = onceKey(name, id);
    if (sessionStorage.getItem(key)) return true;
    sessionStorage.setItem(key, "1");
    return false;
  } catch {
    return false;
  }
};

export const trackPageView = (path: string) => {
  gtag("event", "page_view", {
    page_path: path,
    page_location: window.location.href,
    page_title: document.title,
    send_to: MEASUREMENT_ID,
  });
};

type Item = {
  id: number | string;
  name: string;
  price: number;
  quantity?: number;
  categoryNames?: string[];
};

const toGaItem = (item: Item) => ({
  item_id: String(item.id),
  item_name: item.name,
  price: Number(item.price) || 0,
  quantity: item.quantity ?? 1,
  item_category: item.categoryNames?.[0],
});

export const trackViewItem = (item: Item) => {
  gtag("event", "view_item", {
    currency: "INR",
    value: Number(item.price) || 0,
    items: [toGaItem(item)],
  });
};

export const trackAddToCart = (item: Item, quantity = 1) => {
  gtag("event", "add_to_cart", {
    currency: "INR",
    value: (Number(item.price) || 0) * quantity,
    items: [toGaItem({ ...item, quantity })],
  });
};

export const trackBeginCheckout = (items: Item[], value: number) => {
  gtag("event", "begin_checkout", {
    currency: "INR",
    value,
    items: items.map(toGaItem),
  });
};

export const trackPurchase = (params: {
  transactionId: string;
  value: number;
  items: Item[];
  coupon?: string | null;
  shipping?: number;
  tax?: number;
}) => {
  if (!params.transactionId) return;
  if (firedOnce("purchase", params.transactionId)) return;
  gtag("event", "purchase", {
    transaction_id: params.transactionId,
    value: params.value,
    currency: "INR",
    coupon: params.coupon || undefined,
    shipping: params.shipping,
    tax: params.tax,
    items: params.items.map(toGaItem),
  });
};