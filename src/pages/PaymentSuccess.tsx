import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, Package, ArrowRight } from "lucide-react";
import { useCart } from "@/contexts/CartContext";

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("orderId");
  const { clearCart, clearPromo } = useCart();

  useEffect(() => {
    // Clear cart on successful payment
    clearCart();
    clearPromo();
  }, []);

  return (
    <Layout>
      <div className="container mx-auto px-6 py-16">
        <div className="max-w-lg mx-auto text-center">
          <Card className="overflow-hidden">
            <div className="bg-gradient-to-r from-green-500 to-emerald-500 py-8">
              <CheckCircle className="h-20 w-20 text-white mx-auto animate-bounce" />
            </div>
            <CardContent className="py-8 space-y-6">
              <div>
                <h1 className="text-3xl font-playfair font-bold text-foreground mb-2">
                  Payment Successful!
                </h1>
                <p className="text-muted-foreground">
                  Thank you for your order. Your payment has been processed successfully.
                </p>
              </div>

              {orderId && (
                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="text-sm text-muted-foreground">Order ID</p>
                  <p className="font-mono text-lg font-semibold">{orderId.slice(0, 8).toUpperCase()}</p>
                </div>
              )}

              <div className="flex items-center justify-center gap-2 text-muted-foreground">
                <Package className="h-5 w-5" />
                <span>Your order is being processed</span>
              </div>

              <p className="text-sm text-muted-foreground">
                A confirmation email has been sent to your registered email address.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Button
                  onClick={() => navigate("/account/orders")}
                  className="flex-1"
                >
                  View Orders
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate("/collections")}
                  className="flex-1"
                >
                  Continue Shopping
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default PaymentSuccess;
