import { Link } from "react-router-dom";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/contexts/CartContext";
import { Minus, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";

const Cart = () => {
  const { cart, removeFromCart, updateQuantity, cartTotal, cartCount } = useCart();

  const [promoCode, setPromoCode] = useState("");
  const [discountPercent, setDiscountPercent] = useState(0);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleApplyCode = async () => {
    if (!promoCode.trim()) {
      setMessage("Please enter a coupon code");
      return;
    }

    setLoading(true);

    const { data, error } = await supabase
      .from("coupons")
      .select("*")
      .eq("code", promoCode.trim().toUpperCase())
      .eq("is_active", true)
      .maybeSingle();

    setLoading(false);

    if (error || !data) {
      setMessage("Invalid coupon code ❌");
      setDiscountPercent(0);
      return;
    }

    if (new Date(data.expiry_date) < new Date()) {
      setMessage("Coupon expired ❌");
      setDiscountPercent(0);
      return;
    }

    setDiscountPercent(data.discount_percent);
    setMessage(`Success! ${data.discount_percent}% off applied ✅`);
  };

  if (cartCount === 0) {
    return (
      <Layout>
        <div className="container mx-auto px-6 py-16 text-center">
          <h1 className="text-4xl font-playfair font-bold text-foreground mb-4">Shopping Cart</h1>
          <p className="text-muted-foreground text-lg mb-8">Your cart is empty. Start shopping to add items here.</p>
          <Button asChild size="lg">
            <Link to="/collections">Browse Collections</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  const shipping = cartTotal > 2000 ? 0 : 200;
  const discountAmount = Math.floor((discountPercent / 100) * cartTotal);
  const total = cartTotal + shipping - discountAmount;

  return (
    <Layout>
      <div className="container mx-auto px-6 py-8">
        <h1 className="text-4xl font-playfair font-bold text-foreground mb-8">Shopping Cart</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {cart.map(item => (
              <Card key={item.id}>
                <CardContent className="p-6">
                  <div className="flex gap-6">
                    <img src={item.image} alt={item.name} className="w-24 h-24 object-cover rounded" />
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-2">{item.name}</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        {item.fabricType} • {item.color}
                      </p>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center border rounded">
                          <Button variant="ghost" size="icon" onClick={() => updateQuantity(item.id, item.quantity - 1)}>
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="px-4 text-sm font-medium">{item.quantity}</span>
                          <Button variant="ghost" size="icon" onClick={() => updateQuantity(item.id, item.quantity + 1)}>
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => removeFromCart(item.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-lg">₹{(item.price * item.quantity).toLocaleString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div>
            <Card className="sticky top-4">
              <CardContent className="p-6 space-y-6">
                <h2 className="text-2xl font-playfair font-bold">Order Summary</h2>
                
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal ({cartCount} items)</span>
                    <span className="font-medium">₹{cartTotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Shipping</span>
                    <span className="font-medium">{shipping === 0 ? "FREE" : `₹${shipping}`}</span>
                  </div>
                  {discountPercent > 0 && (
                    <div className="flex justify-between text-green-600 font-medium">
                      <span>Discount ({discountPercent}%)</span>
                      <span>-₹{discountAmount.toLocaleString()}</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span>₹{total.toLocaleString()}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Input
                    placeholder="Enter promo code"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                  />
                  <Button variant="outline" className="w-full" onClick={handleApplyCode} disabled={loading}>
                    {loading ? "Checking..." : "Apply Code"}
                  </Button>
                  {message && <p className="text-sm text-center text-green-600">{message}</p>}
                </div>

                <Button asChild size="lg" className="w-full">
                  <Link to="/checkout">Proceed to Checkout</Link>
                </Button>
                
                <Button variant="outline" asChild className="w-full">
                  <Link to="/collections">Continue Shopping</Link>
                </Button>

                {cartTotal < 2000 && (
                  <p className="text-sm text-center text-muted-foreground">
                    Add ₹{(2000 - cartTotal).toLocaleString()} more for free shipping!
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Cart;
