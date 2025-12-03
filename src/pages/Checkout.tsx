import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { Check, Loader2, Smartphone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import UPIPayment from "@/components/UPIPayment";

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface SavedAddress {
  id: string;
  full_name: string;
  phone: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  postal_code: string;
  is_default: boolean;
}

const Checkout = () => {
  const navigate = useNavigate();
  const { 
    cart, 
    cartTotal, 
    clearCart, 
    promoCode: savedPromoCode, 
    discountPercent: savedDiscountPercent,
    clearPromo
  } = useCart();
  const [step, setStep] = useState(1);
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [useNewAddress, setUseNewAddress] = useState(false);
  const [shippingData, setShippingData] = useState({
    fullName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
  });
  const [paymentMethod, setPaymentMethod] = useState("razorpay");
  const [isProcessing, setIsProcessing] = useState(false);
  const [showUPIPayment, setShowUPIPayment] = useState(false);
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(null);

  // Coupon states - Load from cart context
  const [promoCode, setPromoCode] = useState(savedPromoCode);
  const [discountPercent, setDiscountPercent] = useState(savedDiscountPercent);
  const [couponMessage, setCouponMessage] = useState(savedPromoCode ? `${savedDiscountPercent}% discount applied ✅` : "");
  const [couponLoading, setCouponLoading] = useState(false);

  const shipping = cartTotal > 2000 ? 0 : 200;
  const discountAmount = Math.floor((discountPercent / 100) * cartTotal);
  const total = cartTotal + shipping - discountAmount;

  const { user } = useAuth();

  // Fetch saved addresses
  useEffect(() => {
    if (user) {
      fetchSavedAddresses();
    }
  }, [user]);

  const fetchSavedAddresses = async () => {
    try {
      const { data, error } = await supabase
        .from("addresses")
        .select("*")
        .eq("user_id", user?.id)
        .order("is_default", { ascending: false });

      if (error) throw error;
      setSavedAddresses(data || []);
      
      // Auto-select default address
      const defaultAddr = data?.find(addr => addr.is_default);
      if (defaultAddr) {
        setSelectedAddressId(defaultAddr.id);
      }
    } catch (error) {
      console.error("Error fetching addresses:", error);
    }
  };

  const loadSelectedAddress = () => {
    const selected = savedAddresses.find(addr => addr.id === selectedAddressId);
    if (selected) {
      setShippingData({
        fullName: selected.full_name,
        email: user?.email || "",
        phone: selected.phone,
        address: selected.address_line1 + (selected.address_line2 ? `, ${selected.address_line2}` : ""),
        city: selected.city,
        state: selected.state,
        pincode: selected.postal_code,
      });
    }
  };

  // ----------------- Coupon Handling -----------------
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

    setDiscountPercent(data.discount_percent);
    setCouponMessage(`Success! ${data.discount_percent}% off applied ✅`);
  };

  // ----------------- Shipping Submit -----------------
  const handleShippingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // If using saved address, load it
    if (!useNewAddress && selectedAddressId) {
      loadSelectedAddress();
    }
    
    setStep(2);
  };

  // ----------------- Razorpay Script Loader -----------------
  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  // ----------------- Place Order -----------------
  const handlePlaceOrder = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to place an order.",
        variant: "destructive",
      });
      navigate("/account/login");
      return;
    }

    setIsProcessing(true);

    try {
      // Create order in database first
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          user_id: user.id,
          total_amount: cartTotal,
          discount_percent: discountPercent,
          coupon_code: promoCode || null,
          final_amount: total,
          shipping_address_id: null,
          status: "processing",
          payment_method: paymentMethod,
          payment_status: paymentMethod === "cod" ? "pending" : "completed",
          customer_name: shippingData.fullName,
          customer_email: shippingData.email,
          customer_phone: shippingData.phone,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = cart.map(item => ({
        order_id: order.id,
        product_id: item.id,
        quantity: item.quantity,
        price: item.price
      }));

      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // Send order notification emails
      try {
        await supabase.functions.invoke('send-order-notification', {
          body: {
            orderId: order.id,
            customerName: shippingData.fullName,
            customerEmail: shippingData.email,
            customerPhone: shippingData.phone,
            totalAmount: total,
            orderItems: cart.map(item => ({
              name: item.name,
              quantity: item.quantity,
              price: item.price * item.quantity
            }))
          }
        });
      } catch (emailError) {
        console.error('Error sending order notification:', emailError);
        // Don't fail the order if email fails
      }

      // Handle payment
      if (paymentMethod === "razorpay") {
        await handleRazorpayPayment(order.id, total);
      } else if (paymentMethod === "upi") {
        // Set order ID and show UPI payment component
        setCurrentOrderId(order.id);
        setShowUPIPayment(true);
        setIsProcessing(false);
      } else if (paymentMethod === "cod") {
        toast({
          title: "Order Placed Successfully!",
          description: `Order #${order.id.slice(0, 8)} confirmed. Pay on delivery.`,
        });
        clearCart();
        clearPromo();
        navigate("/account/orders");
        setIsProcessing(false);
      }

    } catch (error) {
      console.error('Error placing order:', error);
      toast({
        title: "Order Failed",
        description: "There was an error placing your order. Please try again.",
        variant: "destructive",
      });
      setIsProcessing(false);
    }
  };

  // ----------------- Razorpay Payment -----------------
  const handleRazorpayPayment = async (orderId: string, amount: number) => {
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

      const { data, error } = await supabase.functions.invoke('create-razorpay-order', {
        body: {
          amount: amount,
          currency: 'INR',
          receipt: orderId,
          notes: {
            order_id: orderId,
            user_id: user!.id
          }
        }
      });

      if (error) throw error;

      const options = {
        key: data.keyId,
        amount: data.amount,
        currency: data.currency,
        name: "Vastra",
        description: "Purchase of Traditional Sarees",
        order_id: data.orderId,
        handler: async function (response: any) {
          try {
            const { error: verifyError } = await supabase.functions.invoke('verify-razorpay-payment', {
              body: {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                order_id: orderId
              }
            });

            if (verifyError) throw verifyError;

            toast({
              title: "Payment Successful!",
              description: `Order #${orderId.slice(0, 8)} has been confirmed.`,
            });
            clearCart();
            navigate("/account/orders");
          } catch (error) {
            console.error('Payment verification failed:', error);
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
        theme: {
          color: "#c2a079",
        },
        modal: {
          ondismiss: function() {
            toast({
              title: "Payment Cancelled",
              description: "You can retry payment from your orders page.",
              variant: "destructive",
            });
            setIsProcessing(false);
          }
        }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();

    } catch (error) {
      console.error('Razorpay payment error:', error);
      toast({
        title: "Payment Failed",
        description: "There was an error processing your payment. Please try again.",
        variant: "destructive",
      });
      setIsProcessing(false);
    }
  };

  // ----------------- Redirect if Cart is Empty -----------------
  if (cart.length === 0) {
    navigate("/cart");
    return null;
  }

  return (
    <Layout>
      <div className="container mx-auto px-6 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-playfair font-bold text-foreground mb-8">Checkout</h1>

          {/* Progress Indicator */}
          <div className="flex items-center justify-center mb-12">
            <div className="flex items-center gap-4">
              <div className={`flex items-center gap-2 ${step >= 1 ? 'text-primary' : 'text-muted-foreground'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                  {step > 1 ? <Check className="h-5 w-5" /> : '1'}
                </div>
                <span className="font-medium">Shipping</span>
              </div>
              <div className="w-16 h-0.5 bg-border" />
              <div className={`flex items-center gap-2 ${step >= 2 ? 'text-primary' : 'text-muted-foreground'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                  2
                </div>
                <span className="font-medium">Payment</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              {step === 1 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Shipping Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleShippingSubmit} className="space-y-6">
                      {/* Saved Addresses Section */}
                      {savedAddresses.length > 0 && (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <Label>Select Saved Address</Label>
                            <Button
                              type="button"
                              variant="link"
                              size="sm"
                              onClick={() => setUseNewAddress(!useNewAddress)}
                            >
                              {useNewAddress ? "Use Saved Address" : "Enter New Address"}
                            </Button>
                          </div>
                          
                          {!useNewAddress && (
                            <RadioGroup value={selectedAddressId || ""} onValueChange={setSelectedAddressId}>
                              {savedAddresses.map((address) => (
                                <div key={address.id} className="flex items-start space-x-2 border rounded-lg p-4 hover:bg-accent/5 transition-colors">
                                  <RadioGroupItem value={address.id} id={address.id} className="mt-1" />
                                  <Label htmlFor={address.id} className="flex-1 cursor-pointer">
                                    <div className="font-medium">{address.full_name}</div>
                                    <div className="text-sm text-muted-foreground mt-1">
                                      {address.address_line1}
                                      {address.address_line2 && `, ${address.address_line2}`}
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                      {address.city}, {address.state} {address.postal_code}
                                    </div>
                                    <div className="text-sm text-muted-foreground">{address.phone}</div>
                                    {address.is_default && (
                                      <span className="inline-block mt-1 px-2 py-0.5 bg-primary/10 text-primary text-xs rounded">
                                        Default
                                      </span>
                                    )}
                                  </Label>
                                </div>
                              ))}
                            </RadioGroup>
                          )}
                        </div>
                      )}

                      {/* New Address Form */}
                      {(useNewAddress || savedAddresses.length === 0) && (
                        <>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="fullName">Full Name</Label>
                              <Input 
                                id="fullName" 
                                required 
                                value={shippingData.fullName}
                                onChange={(e) => setShippingData({...shippingData, fullName: e.target.value})}
                              />
                            </div>
                            <div>
                              <Label htmlFor="phone">Phone</Label>
                              <Input 
                                id="phone" 
                                type="tel" 
                                required
                                value={shippingData.phone}
                                onChange={(e) => setShippingData({...shippingData, phone: e.target.value})}
                              />
                            </div>
                          </div>
                          <div>
                            <Label htmlFor="email">Email</Label>
                            <Input 
                              id="email" 
                              type="email" 
                              required
                              value={shippingData.email}
                              onChange={(e) => setShippingData({...shippingData, email: e.target.value})}
                            />
                          </div>
                          <div>
                            <Label htmlFor="address">Address</Label>
                            <Input 
                              id="address" 
                              required
                              value={shippingData.address}
                              onChange={(e) => setShippingData({...shippingData, address: e.target.value})}
                            />
                          </div>
                          <div className="grid grid-cols-3 gap-4">
                            <div>
                              <Label htmlFor="city">City</Label>
                              <Input 
                                id="city" 
                                required
                                value={shippingData.city}
                                onChange={(e) => setShippingData({...shippingData, city: e.target.value})}
                              />
                            </div>
                            <div>
                              <Label htmlFor="state">State</Label>
                              <Input 
                                id="state" 
                                required
                                value={shippingData.state}
                                onChange={(e) => setShippingData({...shippingData, state: e.target.value})}
                              />
                            </div>
                            <div>
                              <Label htmlFor="pincode">Pincode</Label>
                              <Input 
                                id="pincode" 
                                required
                                value={shippingData.pincode}
                                onChange={(e) => setShippingData({...shippingData, pincode: e.target.value})}
                              />
                            </div>
                          </div>
                        </>
                      )}

                      <Button type="submit" size="lg" className="w-full">Continue to Payment</Button>
                    </form>
                  </CardContent>
                </Card>
              )}

              {step === 2 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Payment Method</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">

                    {/* Coupon Section */}
                    <div className="space-y-2">
                      <Input 
                        placeholder="Enter promo code" 
                        value={promoCode}
                        onChange={(e) => setPromoCode(e.target.value)}
                      />
                      <Button 
                        variant="outline" 
                        className="w-full" 
                        onClick={handleApplyCoupon}
                        disabled={couponLoading}
                      >
                        {couponLoading ? "Applying..." : "Apply Code"}
                      </Button>
                      {couponMessage && <p className="text-sm mt-1">{couponMessage}</p>}
                    </div>

                    <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                      <div className="flex items-center space-x-2 border rounded-lg p-4 bg-card hover:bg-accent/5 transition-colors">
                        <RadioGroupItem value="upi" id="upi" />
                        <Label htmlFor="upi" className="flex-1 cursor-pointer">
                          <div className="font-medium flex items-center gap-2">
                            <Smartphone className="h-4 w-4" />
                            UPI Payment
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">PhonePe, Google Pay, Paytm, or any UPI app</div>
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2 border rounded-lg p-4 bg-card hover:bg-accent/5 transition-colors">
                        <RadioGroupItem value="razorpay" id="razorpay" />
                        <Label htmlFor="razorpay" className="flex-1 cursor-pointer">
                          <div className="font-medium">Pay with Razorpay</div>
                          <div className="text-xs text-muted-foreground mt-1">Credit/Debit Card, UPI, Wallets</div>
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

                    <div className="flex gap-4">
                      <Button 
                        variant="outline" 
                        onClick={() => setStep(1)} 
                        className="flex-1"
                        disabled={isProcessing}
                      >
                        Back to Shipping
                      </Button>
                      <Button 
                        onClick={handlePlaceOrder} 
                        size="lg" 
                        className="flex-1"
                        disabled={isProcessing}
                      >
                        {isProcessing ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Processing...
                          </>
                        ) : paymentMethod === "razorpay" || paymentMethod === "upi" ? (
                          "Pay Now"
                        ) : (
                          "Place Order"
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* UPI Payment Step */}
              {step === 2 && showUPIPayment && currentOrderId && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Smartphone className="h-5 w-5" />
                      Complete UPI Payment
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <UPIPayment
                      orderId={currentOrderId}
                      amount={total}
                      onSuccess={() => {
                        clearCart();
                        clearPromo();
                        navigate(`/payment/success?orderId=${currentOrderId}`);
                      }}
                      onFailure={() => {
                        navigate(`/payment/failure?orderId=${currentOrderId}`);
                      }}
                    />
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Order Summary */}
            <div>
              <Card className="sticky top-4">
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    {cart.map(item => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          {item.name} × {item.quantity}
                        </span>
                        <span>₹{(item.price * item.quantity).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                  
                  <Separator />

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span>₹{cartTotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Discount</span>
                      <span>- ₹{discountAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Shipping</span>
                      <span>{shipping === 0 ? 'FREE' : `₹${shipping}`}</span>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span>₹{total.toLocaleString()}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Checkout;
