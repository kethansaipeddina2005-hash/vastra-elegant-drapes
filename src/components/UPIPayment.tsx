import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Smartphone, QrCode, CheckCircle, Copy, ExternalLink, ChevronDown, ChevronUp } from "lucide-react";

interface UPIPaymentProps {
  orderId: string;
  amount: number;
  onSuccess: () => void;
  onFailure: () => void;
}

interface UPIData {
  upiLink: string;
  qrCode: string;
  deepLinks: {
    phonepe: string;
    gpay: string;
    paytm: string;
    generic: string;
  };
  upiId: string;
}

const UPIPayment = ({ orderId, amount, onSuccess, onFailure }: UPIPaymentProps) => {
  const [loading, setLoading] = useState(true);
  const [upiData, setUpiData] = useState<UPIData | null>(null);
  const [transactionId, setTransactionId] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    initializeUPIPayment();
  }, [orderId, amount]);

  const initializeUPIPayment = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke("create-upi-order", {
        body: { orderId, amount },
      });

      if (error) throw error;

      setUpiData(data);
    } catch (error) {
      console.error("Error initializing UPI payment:", error);
      toast({
        title: "Payment Error",
        description: "Failed to initialize UPI payment. Please try again.",
        variant: "destructive",
      });
      onFailure();
    } finally {
      setLoading(false);
    }
  };

  const handleAppPayment = (appLink: string, appName: string) => {
    const link = document.createElement("a");
    link.href = appLink;
    link.click();

    toast({
      title: `Opening ${appName}...`,
      description: "Complete the payment in the app, then return here to confirm.",
    });
  };

  const handleGenericUPI = () => {
    if (upiData?.upiLink) {
      window.location.href = upiData.upiLink;
    }
  };

  const copyUPIId = async () => {
    if (upiData?.upiId) {
      await navigator.clipboard.writeText(upiData.upiId);
      setCopied(true);
      toast({ title: "UPI ID copied!", description: upiData.upiId });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const confirmPayment = async (withTransactionId: boolean = false) => {
    if (withTransactionId && !transactionId.trim()) {
      toast({
        title: "Transaction ID Required",
        description: "Please enter your UPI transaction ID to verify payment.",
        variant: "destructive",
      });
      return;
    }

    setVerifying(true);
    try {
      const { data, error } = await supabase.functions.invoke("verify-upi-payment", {
        body: { 
          orderId, 
          transactionId: withTransactionId ? transactionId.trim() : "USER_CONFIRMED" 
        },
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "Payment Confirmed!",
          description: "Your order has been placed successfully.",
        });
        onSuccess();
      }
    } catch (error) {
      console.error("Error confirming payment:", error);
      toast({
        title: "Confirmation Failed",
        description: "Could not confirm payment. Please contact support if payment was made.",
        variant: "destructive",
      });
    } finally {
      setVerifying(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-muted-foreground">Generating UPI payment...</p>
      </div>
    );
  }

  if (!upiData) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive">Failed to load payment options</p>
        <Button onClick={initializeUPIPayment} className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Amount Display */}
      <div className="text-center bg-primary/5 rounded-lg p-4">
        <p className="text-sm text-muted-foreground">Amount to Pay</p>
        <p className="text-3xl font-bold text-primary">₹{amount.toLocaleString()}</p>
      </div>

      {/* QR Code Section */}
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <QrCode className="h-5 w-5" />
            Scan QR Code
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Scan with any UPI app to pay
          </p>
        </CardHeader>
        <CardContent className="flex flex-col items-center">
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <img
              src={upiData.qrCode}
              alt="UPI QR Code"
              className="w-64 h-64"
            />
          </div>
          <div className="mt-4 flex items-center gap-2">
            <span className="text-sm text-muted-foreground">UPI ID:</span>
            <code className="bg-muted px-2 py-1 rounded text-sm">{upiData.upiId}</code>
            <Button variant="ghost" size="sm" onClick={copyUPIId}>
              {copied ? <CheckCircle className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* App Payment Buttons */}
      <div className="space-y-3">
        <h3 className="font-medium flex items-center gap-2">
          <Smartphone className="h-5 w-5" />
          Pay with UPI App
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Button
            variant="outline"
            className="h-14 flex items-center justify-center gap-2 hover:bg-purple-50 hover:border-purple-300"
            onClick={() => handleAppPayment(upiData.deepLinks.phonepe, "PhonePe")}
          >
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/thumb/7/71/PhonePe_Logo.svg/1024px-PhonePe_Logo.svg.png"
              alt="PhonePe"
              className="h-6 w-6"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
            <span>PhonePe</span>
          </Button>
          
          <Button
            variant="outline"
            className="h-14 flex items-center justify-center gap-2 hover:bg-blue-50 hover:border-blue-300"
            onClick={() => handleAppPayment(upiData.deepLinks.gpay, "Google Pay")}
          >
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/thumb/f/f2/Google_Pay_Logo.svg/1024px-Google_Pay_Logo.svg.png"
              alt="Google Pay"
              className="h-6 w-6"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
            <span>Google Pay</span>
          </Button>
          
          <Button
            variant="outline"
            className="h-14 flex items-center justify-center gap-2 hover:bg-sky-50 hover:border-sky-300"
            onClick={() => handleAppPayment(upiData.deepLinks.paytm, "Paytm")}
          >
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/24/Paytm_Logo_%28standalone%29.svg/1024px-Paytm_Logo_%28standalone%29.svg.png"
              alt="Paytm"
              className="h-6 w-6"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
            <span>Paytm</span>
          </Button>
        </div>

        <Button
          variant="secondary"
          className="w-full h-12"
          onClick={handleGenericUPI}
        >
          <ExternalLink className="h-4 w-4 mr-2" />
          Open Any UPI App
        </Button>
      </div>

      <Separator />

      {/* Quick Confirmation */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-6 space-y-4">
          <div className="text-center">
            <h3 className="font-semibold text-lg">Completed Payment?</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Click below after you've made the payment via UPI
            </p>
          </div>
          
          <Button
            onClick={() => confirmPayment(false)}
            disabled={verifying}
            className="w-full h-12 text-base"
            size="lg"
          >
            {verifying ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Confirming...
              </>
            ) : (
              <>
                <CheckCircle className="h-5 w-5 mr-2" />
                I've Completed Payment
              </>
            )}
          </Button>

          {/* Advanced: Transaction ID Entry */}
          <div className="pt-2">
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-muted-foreground"
              onClick={() => setShowAdvanced(!showAdvanced)}
            >
              {showAdvanced ? (
                <>
                  <ChevronUp className="h-4 w-4 mr-1" />
                  Hide transaction ID entry
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4 mr-1" />
                  Enter transaction ID (optional)
                </>
              )}
            </Button>

            {showAdvanced && (
              <div className="mt-3 space-y-3 p-3 bg-background rounded-lg">
                <div>
                  <Label htmlFor="transactionId">UPI Transaction ID</Label>
                  <Input
                    id="transactionId"
                    placeholder="Enter transaction ID from UPI app"
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                    className="mt-1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Find this in your UPI app's payment history
                  </p>
                </div>
                
                <Button
                  onClick={() => confirmPayment(true)}
                  disabled={verifying || !transactionId.trim()}
                  variant="outline"
                  className="w-full"
                >
                  Verify with Transaction ID
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Help Text */}
      <div className="text-center text-sm text-muted-foreground">
        <p>Having trouble? Contact us at support@vastra.com</p>
      </div>
    </div>
  );
};

export default UPIPayment;
