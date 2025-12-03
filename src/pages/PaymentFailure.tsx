import { useNavigate, useSearchParams } from "react-router-dom";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { XCircle, RefreshCw, MessageCircle, ArrowRight } from "lucide-react";

const PaymentFailure = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("orderId");
  const reason = searchParams.get("reason") || "Payment could not be completed";

  return (
    <Layout>
      <div className="container mx-auto px-6 py-16">
        <div className="max-w-lg mx-auto text-center">
          <Card className="overflow-hidden">
            <div className="bg-gradient-to-r from-red-500 to-rose-500 py-8">
              <XCircle className="h-20 w-20 text-white mx-auto" />
            </div>
            <CardContent className="py-8 space-y-6">
              <div>
                <h1 className="text-3xl font-playfair font-bold text-foreground mb-2">
                  Payment Failed
                </h1>
                <p className="text-muted-foreground">
                  {reason}
                </p>
              </div>

              {orderId && (
                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="text-sm text-muted-foreground">Order ID</p>
                  <p className="font-mono text-lg font-semibold">{orderId.slice(0, 8).toUpperCase()}</p>
                </div>
              )}

              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 text-left">
                <h3 className="font-medium text-amber-800 dark:text-amber-200 mb-2">
                  What you can do:
                </h3>
                <ul className="text-sm text-amber-700 dark:text-amber-300 space-y-1">
                  <li>• Check if the amount was debited from your account</li>
                  <li>• If debited, the refund will be processed in 5-7 business days</li>
                  <li>• Try again with a different payment method</li>
                  <li>• Contact support if the issue persists</li>
                </ul>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Button
                  onClick={() => navigate("/cart")}
                  className="flex-1"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate("/contact")}
                  className="flex-1"
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Contact Support
                </Button>
              </div>

              <Button
                variant="ghost"
                onClick={() => navigate("/account/orders")}
                className="w-full"
              >
                View My Orders
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default PaymentFailure;
