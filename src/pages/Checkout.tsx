import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { usePricing } from "@/contexts/PricingContext";
import { toast } from "@/hooks/use-toast";
import { Loader2, Lock, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import SEO from "@/components/SEO";
import { trackBeginCheckout, trackAddPaymentInfo } from "@/lib/analytics";

declare global {
  interface Window {
    Razorpay: any;
  }
}

const GUEST_TOKEN_KEY = "vastra_guest_token";
const GUEST_ORDER_KEY = "vastra_guest_order_id";
const DETAILS_KEY = "vastra_checkout_details";

interface SavedAddress {
  id: string;
  full_name: string;
  phone: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  postal_code: string;
  country?: string;
  is_default: boolean;
}

const emptyDetails = {
  fullName: "",
  email: "",
  phone: "",
  address: "",
  pincode: "",
};

const Checkout = () => {
  const navigate = useNavigate();
  const {
    cart,
    cartTotal,
    promoCode: savedPromoCode,
    discountPercent: savedDiscountPercent,
    updateQuantity,
    removeFromCart,
  } = useCart();

  const { user } = useAuth();
  const { pricingRegion, getDisplayPrice } = usePricing();

  // Guest checkout is the default. Details persist so an abandoned checkout resumes instantly.
  const [shippingData, setShippingData] = useState(() => {
    try {
      const saved = localStorage.getItem(DETAILS_KEY);
      return saved ? { ...emptyDetails, ...JSON.parse(saved) } : emptyDetails;
    } catch {
      return emptyDetails;
    }
  });

  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [isInternational, setIsInternational] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("razorpay");
  const [isProcessing, setIsProcessing] = useState(false);

  const [promoCode, setPromoCode] = useState(savedPromoCode);
  const [discountPercent, setDiscountPercent] = useState(savedDiscountPercent);
  const [couponMessage, setCouponMessage] = useState(
    savedPromoCode ? `${savedDiscountPercent}% discount applied ✅` : ""
  );
  const [couponLoading, setCouponLoading] = useState(false);

  // Reuse the same draft order across payment retries so we never create duplicates.
  const draftOrderRef = useRef<string | null>(null);
  const paymentInfoTracked = useRef(false);

  useEffect(() => {
    try {
      localStorage.setItem(DETAILS_KEY, JSON.stringify(shippingData));
    } catch {}
  }, [shippingData]);

  const pincodeLooksIntl =
    shippingData.pincode.trim().length > 0 && !/^\d{6}$/.test(shippingData.pincode.trim());
  const internationalOrder = isInternational || pincodeLooksIntl;
  const INTERNATIONAL_SHIPPING = 4000;

  const displayTotal = cart.reduce(
    (t, item) => t + getDisplayPrice(item.price, (item as any).foreignPrice) * item.quantity,
    0
  );
  const shipping = internationalOrder ? INTERNATIONAL_SHIPPING : displayTotal > 2000 ? 0 : 200;
  const discountAmount = Math.floor((discountPercent / 100) * displayTotal);
  const total = displayTotal + shipping - discountAmount;

  // Signed-in shoppers get their saved address pre-filled — no extra step.
  useEffect(() => {
    if (!user) {
      setSavedAddresses([]);
      return;
    }
    (async () => {
      const { data } = await supabase
        .from("addresses")
        .select("*")
        .eq("user_id", user.id)
        .order("is_default", { ascending: false });
      setSavedAddresses(data || []);
      const def = data?.find((a: any) => a.is_default) || data?.[0];
      if (def) applySavedAddress(def as SavedAddress);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const applySavedAddress = (addr: SavedAddress) => {
    setIsInternational(!!addr.country && addr.country.toLowerCase() !== "india");
    setShippingData((prev) => ({
      ...prev,
      fullName: addr.full_name || prev.fullName,
      email: prev.email || user?.email || "",
      phone: addr.phone || prev.phone,
      address: [addr.address_line1, addr.address_line2, addr.city, addr.state]
        .filter(Boolean)
        .join(", "),
      pincode: addr.postal_code || prev.pincode,
    }));
  };

  useEffect(() => {
    if (cart.length === 0) return;
    trackBeginCheckout(
      cart.map((item) => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        categoryNames: item.categoryNames,
      })),
      cartTotal
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const gaItems = () =>
    cart.map((item) => ({
      id: item.id,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      categoryNames: item.categoryNames,
    }));

  // ----------------- Coupon -----------------
  const handleApplyCoupon = async () => {
    if (!promoCode.trim()) {
      setCouponMessage("Please enter a coupon code");
      return;
    }
    setCouponLoading(true);
    const { data, error } = await supabase
      .from("coupons")
      .select("*")
      .eq("code", promoCode.trim().toUpperCase())
      .eq("is_active", true)
      .maybeSingle();
    setCouponLoading(false);

    if (error || !data) {
      setCouponMessage("Invalid coupon code ❌");
      setDiscountPercent(0);
      return;
    }
    if (new Date(data.expiry_date) < new Date()) {
      setCouponMessage("Coupon expired ❌");
      setDiscountPercent(0);
      return;
    }
    const minAmount = data.min_amount || 0;
    if (minAmount > 0 && displayTotal < minAmount) {
      setCouponMessage(`Minimum order ₹${minAmount.toLocaleString()} required ❌`);
      setDiscountPercent(0);
      return;
    }
    const limit = (data as any).usage_limit_per_user as number | null;
    if (limit && limit > 0) {
      if (!user) {
        setCouponMessage("Please sign in to use this coupon ❌");
        setDiscountPercent(0);
        return;
      }
      const { count } = await supabase
        .from("orders")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("coupon_code", data.code);
      if ((count ?? 0) >= limit) {
        setCouponMessage(
          limit === 1
            ? "This coupon is only valid on your first purchase ❌"
            : `You've already used this coupon ${limit} time(s) ❌`
        );
        setDiscountPercent(0);
        return;
      }
    }
    setDiscountPercent(data.discount_percent);
    setCouponMessage(`Success! ${data.discount_percent}% off applied ✅`);
  };

  const loadRazorpayScript = () =>
    new Promise((resolve) => {
      if (window.Razorpay) return resolve(true);
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });

  const shippingAddressString = [
    shippingData.address,
    shippingData.pincode,
    internationalOrder ? "International" : "India",
  ]
    .filter(Boolean)
    .join(", ");

  // ----------------- Validation -----------------
  const validateDetails = (): string | null => {
    const name = shippingData.fullName.trim();
    const email = shippingData.email.trim();
    const phone = shippingData.phone.trim();
    const address = shippingData.address.trim();
    const pincode = shippingData.pincode.trim();

    if (name.length < 2) return "Please enter your full name.";
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(email)) return "Please enter a valid email address.";

    const digits = phone.replace(/\D/g, "");
    if (internationalOrder) {
      if (digits.length < 8 || digits.length > 15) return "Please enter a valid phone number with country code.";
    } else if (!/^[6-9]\d{9}$/.test(digits.replace(/^91/, ""))) {
      return "Please enter a valid 10-digit Indian mobile number.";
    }

    if (address.length < 10) return "Please enter your complete address (house, street, area, city, state).";

    if (internationalOrder) {
      if (!/^[A-Za-z0-9][A-Za-z0-9\s-]{2,11}$/.test(pincode))
        return "Please enter a valid postal / ZIP code.";
    } else if (!/^[1-9]\d{5}$/.test(pincode)) {
      return "Please enter a valid 6-digit Indian pincode.";
    }
    return null;
  };

  // ----------------- Place Order -----------------
  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isProcessing) return;

    const validationError = validateDetails();
    if (validationError) {
      toast({ title: "Check your details", description: validationError, variant: "destructive" });
      return;
    }

    setIsProcessing(true);

    if (!paymentInfoTracked.current) {
      paymentInfoTracked.current = true;
      trackAddPaymentInfo(gaItems(), total, paymentMethod, promoCode || null);
    }

    try {
      // Live stock re-validation to prevent oversells
      const ids = cart.map((i) => i.id);
      if (ids.length > 0) {
        const { data: liveStock, error: stockErr } = await supabase
          .from("products")
          .select("id, name, stock_quantity")
          .in("id", ids);
        if (stockErr) throw stockErr;
        const stockMap = new Map((liveStock ?? []).map((p: any) => [p.id, p]));
        const issues: string[] = [];
        for (const item of cart) {
          const p: any = stockMap.get(item.id);
          const available = Math.max(0, p?.stock_quantity ?? 0);
          if (available < item.quantity) {
            issues.push(`${p?.name ?? item.name}: only ${available} left`);
            if (available <= 0) removeFromCart(item.id);
            else updateQuantity(item.id, available);
          }
        }
        if (issues.length > 0) {
          toast({
            title: "Stock changed",
            description: `We updated your cart: ${issues.join("; ")}. Please review and try again.`,
            variant: "destructive",
          });
          setIsProcessing(false);
          return;
        }
      }

      let guestToken = !user ? localStorage.getItem(GUEST_TOKEN_KEY) : null;
      let orderId = draftOrderRef.current;

      if (!orderId) {
        // Orders are created through a security-definer RPC so guests never need
        // read access to the orders table. Ownership is derived server-side.
        const { data: created, error: orderError } = await supabase.rpc("create_checkout_order", {
          _guest_token: user ? null : guestToken,
          _customer_name: shippingData.fullName.trim(),
          _customer_email: shippingData.email.trim(),
          _customer_phone: shippingData.phone.trim(),
          _shipping_address: shippingAddressString,
          _payment_method: paymentMethod,
          _items: cart.map((item) => ({ product_id: item.id, quantity: item.quantity })),
          _coupon_code: promoCode || null,
          _discount_percent: discountPercent,
          _total_amount: cartTotal,
          _final_amount: total,
          _pricing_region: pricingRegion,
        });

        if (orderError) throw orderError;
        const result: any = Array.isArray(created) ? created[0] : created;
        if (!result?.order_id) throw new Error("Order could not be created");

        orderId = result.order_id as string;
        draftOrderRef.current = orderId;
        if (!user) guestToken = (result.guest_token as string) ?? guestToken;

        if (!user && guestToken) {
          try {
            localStorage.setItem(GUEST_TOKEN_KEY, guestToken);
            localStorage.setItem(GUEST_ORDER_KEY, orderId);
          } catch {}
        }

        try {
          await supabase.functions.invoke("send-order-notification", {
            body: {
              orderId,
              customerName: shippingData.fullName,
              customerEmail: shippingData.email,
              customerPhone: shippingData.phone,
              shippingAddress: shippingAddressString,
              totalAmount: total,
              orderItems: cart.map((item) => ({
                name: item.name,
                quantity: item.quantity,
                price: item.price * item.quantity,
              })),
            },
          });
        } catch (emailError) {
          console.error("Error sending order notification:", emailError);
        }
      }


      if (paymentMethod === "razorpay") {
        await handleRazorpayPayment(orderId!, guestToken);
      } else {
        const { error: finalizeErr } = await supabase.functions.invoke("finalize-cod-order", {
          body: {
            order_id: orderId,
            items: cart.map((item) => ({ product_id: item.id, quantity: item.quantity })),
            shipping,
            coupon_code: promoCode || null,
            pricing_region: pricingRegion,
            guest_token: user ? null : guestToken,
          },
        });
        if (finalizeErr) throw finalizeErr;

        toast({ title: "Order Placed Successfully!", description: "Pay on delivery." });
        navigate("/thank-you", { state: { orderId, shippingAddress: shippingAddressString } });
        setIsProcessing(false);
      }
    } catch (error) {
      console.error("Error placing order:", error);
      toast({
        title: "Order Failed",
        description: "There was an error placing your order. Your cart is safe — please try again.",
        variant: "destructive",
      });
      setIsProcessing(false);
    }
  };

  // ----------------- Razorpay -----------------
  const handleRazorpayPayment = async (orderId: string, guestToken: string | null) => {
    try {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        toast({
          title: "Payment Gateway Error",
          description: "Unable to load payment gateway. Please try again.",
          variant: "destructive",
        });
        setIsProcessing(false);
        return;
      }

      const { data, error } = await supabase.functions.invoke("create-razorpay-order", {
        body: {
          amount: total,
          currency: "INR",
          receipt: orderId,
          notes: { order_id: orderId, user_id: user?.id ?? "guest" },
          items: cart.map((item) => ({ product_id: item.id, quantity: item.quantity })),
          shipping,
          coupon_code: promoCode || null,
          pricing_region: pricingRegion,
          order_id: orderId,
          guest_token: guestToken,
        },
      });

      if (error) throw error;

      const rzp = new window.Razorpay({
        key: data.keyId,
        amount: data.amount,
        currency: data.currency,
        name: "Vastra",
        description: "Purchase of Traditional Sarees",
        order_id: data.orderId,
        handler: async function (response: any) {
          try {
            const { error: verifyError } = await supabase.functions.invoke(
              "verify-razorpay-payment",
              {
                body: {
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  order_id: orderId,
                  guest_token: guestToken,
                },
              }
            );
            if (verifyError) throw verifyError;

            draftOrderRef.current = null;
            toast({ title: "Payment Successful!", description: "Order has been confirmed." });
            navigate("/thank-you", { state: { orderId, shippingAddress: shippingAddressString } });
          } catch (err) {
            console.error("Payment verification failed:", err);
            toast({
              title: "Payment Verification Failed",
              description: "Please contact support with your order ID.",
              variant: "destructive",
            });
          } finally {
            setIsProcessing(false);
          }
        },
        prefill: {
          name: shippingData.fullName,
          email: shippingData.email,
          contact: shippingData.phone,
        },
        theme: { color: "#c2a079" },
        modal: {
          ondismiss: function () {
            // Cart and details stay intact so the shopper can retry instantly.
            toast({
              title: "Payment Cancelled",
              description: "Your cart is saved. You can retry payment anytime.",
              variant: "destructive",
            });
            setIsProcessing(false);
          },
        },
      });
      rzp.open();
    } catch (error) {
      console.error("Razorpay payment error:", error);
      toast({
        title: "Payment Failed",
        description: "There was an error processing your payment. Your cart is saved — please try again.",
        variant: "destructive",
      });
      setIsProcessing(false);
    }
  };

  if (cart.length === 0) {
    navigate("/cart");
    return null;
  }

  return (
    <Layout>
      <SEO
        title="Secure Checkout | Vastra"
        description="Complete your purchase securely at Vastra."
        noIndex={true}
      />
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2 mb-6">
            <div>
              <h1 className="text-3xl sm:text-4xl font-playfair font-bold text-foreground">
                Secure Checkout
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                No account needed — checkout as a guest in under a minute.
              </p>
            </div>
            {!user && (
              <Link
                to="/account/login"
                className="text-sm text-primary underline underline-offset-4 whitespace-nowrap"
              >
                Have an account? Sign in (optional)
              </Link>
            )}
          </div>

          <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="font-playfair">Delivery Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {savedAddresses.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {savedAddresses.map((addr) => (
                        <Button
                          key={addr.id}
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => applySavedAddress(addr)}
                        >
                          Use {addr.city || addr.full_name} address
                        </Button>
                      ))}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="fullName">Full Name</Label>
                      <Input
                        id="fullName"
                        required
                        autoComplete="name"
                        value={shippingData.fullName}
                        onChange={(e) => setShippingData({ ...shippingData, fullName: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        type="tel"
                        inputMode="tel"
                        required
                        autoComplete="tel"
                        value={shippingData.phone}
                        onChange={(e) => setShippingData({ ...shippingData, phone: e.target.value })}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      inputMode="email"
                      required
                      autoComplete="email"
                      value={shippingData.email}
                      onChange={(e) => setShippingData({ ...shippingData, email: e.target.value })}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Order confirmation and tracking are sent here.
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="address">Full Address</Label>
                    <Textarea
                      id="address"
                      required
                      rows={3}
                      autoComplete="street-address"
                      placeholder="House / street, area, city, state"
                      value={shippingData.address}
                      onChange={(e) => setShippingData({ ...shippingData, address: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="pincode">
                        {internationalOrder ? "Postal / ZIP Code" : "Pincode"}
                      </Label>
                      <Input
                        id="pincode"
                        required
                        inputMode="text"
                        autoComplete="postal-code"
                        value={shippingData.pincode}
                        onChange={(e) => setShippingData({ ...shippingData, pincode: e.target.value })}
                      />
                      {!isInternational && pincodeLooksIntl && (
                        <p className="text-xs text-amber-700 mt-1">
                          Looks like an international code — ₹4,000 shipping will apply.
                        </p>
                      )}
                    </div>
                    <div className="flex items-start gap-3 p-3 border rounded-lg bg-accent/5 self-end">
                      <input
                        id="intl"
                        type="checkbox"
                        className="mt-1 h-4 w-4"
                        checked={isInternational}
                        onChange={(e) => setIsInternational(e.target.checked)}
                      />
                      <Label htmlFor="intl" className="cursor-pointer flex-1 text-sm">
                        Shipping outside India
                        <span className="block text-xs text-muted-foreground mt-0.5">
                          Flat ₹4,000 international shipping.
                        </span>
                      </Label>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="font-playfair">Payment</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                    <div className="flex items-center space-x-2 border rounded-lg p-4 bg-card hover:bg-accent/5 transition-colors">
                      <RadioGroupItem value="razorpay" id="razorpay" />
                      <Label htmlFor="razorpay" className="flex-1 cursor-pointer">
                        <div className="font-medium">Pay Online</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Credit/Debit Card, Netbanking, Wallets
                        </div>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 border rounded-lg p-4 bg-card hover:bg-accent/5 transition-colors">
                      <RadioGroupItem value="cod" id="cod" />
                      <Label htmlFor="cod" className="flex-1 cursor-pointer">
                        <div className="font-medium">Cash on Delivery</div>
                        <div className="text-xs text-muted-foreground mt-1">Pay when you receive</div>
                      </Label>
                    </div>
                  </RadioGroup>

                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <ShieldCheck className="h-4 w-4 text-primary" />
                    Secure, encrypted payments. Your cart is saved if payment fails.
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Order Summary */}
            <div>
              <Card className="lg:sticky lg:top-4">
                <CardHeader className="pb-4">
                  <CardTitle className="font-playfair">Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    {cart.map((item) => (
                      <div key={item.id} className="flex justify-between text-sm gap-3">
                        <span className="text-muted-foreground line-clamp-2">
                          {item.name} × {item.quantity}
                        </span>
                        <span className="whitespace-nowrap">
                          ₹{(item.price * item.quantity).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Input
                      placeholder="Promo code"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value)}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={handleApplyCoupon}
                      disabled={couponLoading}
                    >
                      {couponLoading ? "Applying..." : "Apply Code"}
                    </Button>
                    {couponMessage && <p className="text-sm">{couponMessage}</p>}
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span>₹{displayTotal.toLocaleString()}</span>
                    </div>
                    {discountPercent > 0 && (
                      <div className="flex justify-between text-green-700">
                        <span>Discount ({discountPercent}%)</span>
                        <span>- ₹{discountAmount.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        {internationalOrder ? "International Shipping" : "Shipping"}
                      </span>
                      <span>{shipping === 0 ? "FREE" : `₹${shipping.toLocaleString()}`}</span>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span>₹{total.toLocaleString()}</span>
                  </div>

                  <Button type="submit" size="lg" className="w-full" disabled={isProcessing}>
                    {isProcessing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Lock className="mr-2 h-4 w-4" />
                        {paymentMethod === "razorpay" ? "Pay Securely" : "Place Order"}
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default Checkout;
