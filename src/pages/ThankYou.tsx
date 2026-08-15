import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { 
  CheckCircle, 
  Package, 
  ShoppingBag, 
  Truck, 
  MapPin, 
  Calendar,
  ArrowRight,
  Home
} from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { trackPurchase } from "@/lib/analytics";
import SEO from "@/components/SEO";
import { toast } from "@/hooks/use-toast";

interface OrderItem {
  id: string;
  product_id: number;
  name: string;
  quantity: number;
  price: number;
  image?: string;
}

interface OrderDetails {
  id: string;
  order_number: string;
  status: string;
  payment_status: string;
  payment_method: string;
  total_amount: number;
  final_amount: number;
  discount_percent: number;
  coupon_code: string | null;
  created_at: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  shipping_address: string;
  shipping_address_id: string | null;
  items: OrderItem[];
}

const GUEST_TOKEN_KEY = "vastra_guest_token";


const ThankYou = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { clearCart, clearPromo } = useCart();
  const { user } = useAuth();
  
  const orderId = location.state?.orderId || null;
  
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [password, setPassword] = useState("");
  const [creatingAccount, setCreatingAccount] = useState(false);
  const [accountCreated, setAccountCreated] = useState(false);

  const handleCreateAccount = async () => {
    if (!order?.customer_email || password.length < 6) {
      toast({
        title: "Password too short",
        description: "Please use at least 6 characters.",
        variant: "destructive",
      });
      return;
    }
    setCreatingAccount(true);
    const { error } = await supabase.auth.signUp({
      email: order.customer_email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: { full_name: order.customer_name },
      },
    });
    setCreatingAccount(false);
    if (error) {
      toast({ title: "Could not create account", description: error.message, variant: "destructive" });
      return;
    }
    setAccountCreated(true);
    toast({ title: "Account created", description: "You can now track all your orders." });
  };

  // Clear cart and promo once on arrival
  useEffect(() => {
    clearCart();
    clearPromo();
  }, []);

  useEffect(() => {
    if (!orderId) {
      setLoading(false);
      return;
    }

    const fetchOrder = async () => {
      try {
        const guestToken = localStorage.getItem(GUEST_TOKEN_KEY);

        // Use edge function or direct query based on auth
        let query = supabase
          .from("orders")
          .select(`
            id,
            order_number,
            status,
            payment_status,
            payment_method,
            total_amount,
            final_amount,
            discount_percent,
            coupon_code,
            created_at,
            customer_name,
            customer_email,
            customer_phone,
            shipping_address_id,
            order_items(
              id,
              product_id,
              quantity,
              price,
              products(name, image)
            )
          `)
          .eq("id", orderId);


        if (!user) {
          query = query.eq("guest_token", guestToken);
        } else {
          query = query.eq("user_id", user.id);
        }

        const { data, error } = await query.maybeSingle();

        if (error) throw error;
        if (!data) {
          setLoading(false);
          return;
        }

        const rawItems = (data as any).order_items || [];
        const items: OrderItem[] = rawItems.map((oi: any) => ({
          id: oi.id,
          product_id: oi.product_id,
          name: oi.products?.name || `Product ${oi.product_id}`,
          quantity: oi.quantity,
          price: Number(oi.price) || 0,
          image: oi.products?.image || "/placeholder.svg",
        }));

        // Fetch shipping address from saved addresses if available
        let shippingAddress = location.state?.shippingAddress || "";
        const shippingAddressId = (data as any).shipping_address_id;
        if (!shippingAddress && shippingAddressId) {
          try {
            const { data: addr } = await supabase
              .from("addresses")
              .select("full_name, address_line1, address_line2, city, state, postal_code, country")
              .eq("id", shippingAddressId)
              .maybeSingle();
            if (addr) {
              shippingAddress = [
                addr.full_name,
                addr.address_line1,
                addr.address_line2,
                `${addr.city}, ${addr.state} - ${addr.postal_code}`,
                addr.country,
              ].filter(Boolean).join("\n");
            }
          } catch {
            // ignore address fetch errors
          }
        }

        const orderDetails: OrderDetails = {
          id: data.id,
          order_number: data.order_number || data.id.slice(0, 8).toUpperCase(),
          status: data.status,
          payment_status: data.payment_status,
          payment_method: data.payment_method,
          total_amount: Number(data.total_amount) || 0,
          final_amount: Number(data.final_amount) || Number(data.total_amount) || 0,
          discount_percent: Number(data.discount_percent) || 0,
          coupon_code: data.coupon_code,
          created_at: data.created_at,
          customer_name: data.customer_name || "",
          customer_email: data.customer_email || "",
          customer_phone: data.customer_phone || "",
          shipping_address: shippingAddress,
          shipping_address_id: shippingAddressId || null,
          items,
        };

        setOrder(orderDetails);


        // Track purchase once
        if (!sessionStorage.getItem(`thankyou-tracked-${orderId}`)) {
          sessionStorage.setItem(`thankyou-tracked-${orderId}`, "true");
          trackPurchase({
            transactionId: orderDetails.order_number,
            value: orderDetails.final_amount,
            items: items.map((i) => ({
              id: i.product_id,
              name: i.name,
              price: i.price,
              quantity: i.quantity,
            })),
            coupon: orderDetails.coupon_code || undefined,
          });
        }
      } catch (error) {
        console.error("Error fetching order:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId, user]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const discountAmount = order
    ? Math.floor((order.discount_percent / 100) * order.total_amount)
    : 0;

  // final_amount = total_amount - discount + shipping
  const shippingAmount = order
    ? Math.max(0, order.final_amount - order.total_amount + discountAmount)
    : 0;


  return (
    <Layout>
      <SEO
        title="Thank You for Your Order | Vastra"
        description="Your order has been placed successfully. Thank you for shopping with Vastra."
        noIndex={true}
      />
      <div className="min-h-screen bg-gradient-to-b from-[#faf9f3] via-[#f5f5dc] to-[#faf9f3]">
        <div className="container mx-auto px-4 py-12 md:py-20">
          <div className="max-w-3xl mx-auto">
            {/* Hero Thank You Card */}
            <div className="text-center mb-8 md:mb-12">
              <div className="inline-flex items-center justify-center w-20 h-20 md:w-24 md:h-24 rounded-full bg-[#d4af37]/15 mb-6">
                <CheckCircle className="h-10 w-10 md:h-12 md:w-12 text-[#b8860b]" />
              </div>
              <h1 className="text-3xl md:text-5xl font-playfair font-bold text-[#2c1810] mb-3 text-balance">
                Thank You for Your Purchase
              </h1>
              <p className="text-[#5a4a3a] text-base md:text-lg max-w-xl mx-auto text-balance">
                Your order has been received and is being prepared with care. We appreciate you choosing Vastra for your timeless ensemble.
              </p>
            </div>

            {loading ? (
              <Card className="border-[#d4af37]/20 shadow-lg">
                <CardContent className="py-16 text-center">
                  <div className="w-10 h-10 border-2 border-[#d4af37] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-[#5a4a3a]">Loading your order details...</p>
                </CardContent>
              </Card>
            ) : order ? (
              <div className="space-y-6">
                {/* Order Info Card */}
                <Card className="border-[#d4af37]/20 shadow-lg overflow-hidden">
                  <div className="bg-gradient-to-r from-[#f4e4bc] to-[#f5f5dc] px-6 py-4 border-b border-[#d4af37]/20">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div>
                        <p className="text-sm text-[#5a4a3a]">Order Number</p>
                        <p className="font-mono text-lg font-semibold text-[#2c1810]">
                          {order.order_number}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 text-[#5a4a3a] text-sm">
                        <Calendar className="h-4 w-4" />
                        <span>{formatDate(order.created_at)}</span>
                      </div>
                    </div>
                  </div>
                  <CardContent className="p-6">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#d4af37]/10 flex items-center justify-center shrink-0">
                          <Package className="h-5 w-5 text-[#b8860b]" />
                        </div>
                        <div>
                          <p className="text-sm text-[#5a4a3a]">Order Status</p>
                          <p className="font-medium text-[#2c1810] capitalize">{order.status}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#d4af37]/10 flex items-center justify-center shrink-0">
                          <Truck className="h-5 w-5 text-[#b8860b]" />
                        </div>
                        <div>
                          <p className="text-sm text-[#5a4a3a]">Payment</p>
                          <p className="font-medium text-[#2c1810] capitalize">
                            {order.payment_method === "razorpay" ? "Online Payment" : "Cash on Delivery"}
                          </p>
                          <p className="text-xs text-[#5a4a3a] capitalize">{order.payment_status}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#d4af37]/10 flex items-center justify-center shrink-0">
                          <MapPin className="h-5 w-5 text-[#b8860b]" />
                        </div>
                        <div>
                          <p className="text-sm text-[#5a4a3a]">Shipping To</p>
                          <p className="font-medium text-[#2c1810] line-clamp-2">{order.customer_name}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Order Items */}
                <Card className="border-[#d4af37]/20 shadow-lg">
                  <CardContent className="p-6">
                    <h2 className="font-playfair text-xl font-semibold text-[#2c1810] mb-4 flex items-center gap-2">
                      <ShoppingBag className="h-5 w-5 text-[#b8860b]" />
                      Items Ordered
                    </h2>
                    <div className="space-y-4">
                      {order.items.map((item) => (
                        <div key={item.id} className="flex gap-4">
                          <div className="w-20 h-20 rounded-md overflow-hidden bg-[#f4e4bc]/30 shrink-0 border border-[#d4af37]/20">
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-[#2c1810] line-clamp-2">{item.name}</p>
                            <p className="text-sm text-[#5a4a3a]">Qty: {item.quantity}</p>
                            <p className="font-semibold text-[#2c1810]">{formatPrice(item.price * item.quantity)}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <Separator className="my-6 bg-[#d4af37]/20" />

                    {/* Order Summary */}
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between text-[#5a4a3a]">
                        <span>Subtotal</span>
                        <span>{formatPrice(order.total_amount)}</span>
                      </div>
                      {shippingAmount > 0 && (
                        <div className="flex justify-between text-[#5a4a3a]">
                          <span>Shipping</span>
                          <span>{formatPrice(shippingAmount)}</span>
                        </div>
                      )}

                      {order.discount_percent > 0 && (
                        <div className="flex justify-between text-green-700">
                          <span>Discount ({order.discount_percent}%)</span>
                          <span>-{formatPrice(discountAmount)}</span>
                        </div>
                      )}
                      {order.coupon_code && (
                        <div className="flex justify-between text-[#5a4a3a]">
                          <span>Coupon</span>
                          <span className="font-mono">{order.coupon_code}</span>
                        </div>
                      )}
                      <Separator className="my-2 bg-[#d4af37]/20" />
                      <div className="flex justify-between text-lg font-semibold text-[#2c1810]">
                        <span>Total</span>
                        <span>{formatPrice(order.final_amount)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Shipping Address Card */}
                {order.shipping_address && (
                  <Card className="border-[#d4af37]/20 shadow-lg">
                    <CardContent className="p-6">
                      <h2 className="font-playfair text-xl font-semibold text-[#2c1810] mb-3 flex items-center gap-2">
                        <MapPin className="h-5 w-5 text-[#b8860b]" />
                        Delivery Address
                      </h2>
                      <div className="text-[#5a4a3a] space-y-1">
                        <p className="font-medium text-[#2c1810]">{order.customer_name}</p>
                        <p>{order.customer_phone}</p>
                        <p>{order.customer_email}</p>
                        <p className="whitespace-pre-line">{order.shipping_address}</p>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* What happens next */}
                <Card className="border-[#d4af37]/20 shadow-lg bg-gradient-to-br from-white to-[#f5f5dc]/50">
                  <CardContent className="p-6">
                    <h2 className="font-playfair text-xl font-semibold text-[#2c1810] mb-4">
                      What Happens Next
                    </h2>
                    <div className="space-y-4">
                      <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#d4af37]/20 flex items-center justify-center shrink-0 text-[#b8860b] font-semibold text-sm">1</div>
                        <div>
                          <p className="font-medium text-[#2c1810]">Order Confirmation</p>
                          <p className="text-sm text-[#5a4a3a]">A confirmation email with your order details has been sent.</p>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#d4af37]/20 flex items-center justify-center shrink-0 text-[#b8860b] font-semibold text-sm">2</div>
                        <div>
                          <p className="font-medium text-[#2c1810]">Processing</p>
                          <p className="text-sm text-[#5a4a3a]">Our team carefully inspects and packs your saree for dispatch.</p>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#d4af37]/20 flex items-center justify-center shrink-0 text-[#b8860b] font-semibold text-sm">3</div>
                        <div>
                          <p className="font-medium text-[#2c1810]">Shipping</p>
                          <p className="text-sm text-[#5a4a3a]">Once shipped, you will receive tracking information via email or SMS.</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card className="border-[#d4af37]/20 shadow-lg">
                <CardContent className="py-12 text-center">
                  <Package className="h-12 w-12 text-[#c2a079] mx-auto mb-4" />
                  <h2 className="font-playfair text-xl font-semibold text-[#2c1810] mb-2">
                    Order details not found
                  </h2>
                  <p className="text-[#5a4a3a] mb-6">
                    We couldn't locate your order. If you just placed one, please check your email or account orders.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button onClick={() => navigate(user ? "/account/orders" : "/")}>
                      {user ? "View Orders" : "Continue Shopping"}
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 mt-8 md:mt-10">
              <Button
                onClick={() => navigate(user ? "/account/orders" : "/")}
                className="flex-1 bg-[#c2a079] hover:bg-[#b08d5f] text-white"
                size="lg"
              >
                {user ? "View My Orders" : "Continue Shopping"}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate("/collections")}
                className="flex-1 border-[#c2a079] text-[#5a4a3a] hover:bg-[#f5f5dc]"
                size="lg"
              >
                <Home className="h-4 w-4 mr-2" />
                Shop More Sarees
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ThankYou;
