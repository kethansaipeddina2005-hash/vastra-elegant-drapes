import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Smartphone, QrCode, CheckCircle, Copy, ExternalLink, ChevronDown, ChevronUp, Clock, RefreshCw, AlertCircle } from "lucide-react";

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

const TIMER_DURATION = 5 * 60; // 5 minutes in seconds
const POLL_INTERVAL = 10000; // Check payment status every 10 seconds

const UPIPayment = ({ orderId, amount, onSuccess, onFailure }: UPIPaymentProps) => {
  const [loading, setLoading] = useState(true);
  const [upiData, setUpiData] = useState<UPIData | null>(null);
  const [transactionId, setTransactionId] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [timeLeft, setTimeLeft] = useState(TIMER_DURATION);
  const [isExpired, setIsExpired] = useState(false);

  // Initialize UPI payment
  const initializeUPIPayment = useCallback(async () => {
    try {
      setLoading(true);
      setIsExpired(false);
      setTimeLeft(TIMER_DURATION);
      
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
  }, [orderId, amount, onFailure]);

  useEffect(() => {
    initializeUPIPayment();
  }, [initializeUPIPayment]);

  // Countdown timer
  useEffect(() => {
    if (loading || isExpired) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setIsExpired(true);
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [loading, isExpired]);

  // Poll for payment status
  useEffect(() => {
    if (loading || isExpired) return;

    const checkPaymentStatus = async () => {
      try {
        const { data: order, error } = await supabase
          .from("orders")
          .select("payment_status, status")
          .eq("id", orderId)
          .single();

        if (error) {
          console.error("Error checking payment status:", error);
          return;
        }

        if (order?.payment_status === "completed") {
          toast({
            title: "Payment Confirmed!",
            description: "Your payment has been verified successfully.",
          });
          onSuccess();
        }
      } catch (error) {
        console.error("Error polling payment status:", error);
      }
    };

    const pollInterval = setInterval(checkPaymentStatus, POLL_INTERVAL);

    return () => clearInterval(pollInterval);
  }, [loading, isExpired, orderId, onSuccess]);

  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  const handleAppPayment = (appLink: string, appName: string) => {
    if (!isMobile) {
      toast({
        title: "Mobile Only Feature",
        description: `Please scan the QR code with your phone to pay via ${appName}, or use a mobile device.`,
      });
      return;
    }

    // Try to open the app
    window.location.href = appLink;

    toast({
      title: `Opening ${appName}...`,
      description: "Complete the payment in the app, then return here to confirm.",
    });
  };

  const handleGenericUPI = () => {
    if (!isMobile) {
      toast({
        title: "Mobile Only Feature",
        description: "UPI apps can only be opened on mobile devices. Please scan the QR code with your phone.",
      });
      return;
    }

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

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getTimerColor = () => {
    if (timeLeft <= 60) return "text-destructive";
    if (timeLeft <= 120) return "text-orange-500";
    return "text-primary";
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

  // Expired state
  if (isExpired) {
    return (
      <div className="space-y-6">
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="pt-6 text-center space-y-4">
            <AlertCircle className="h-16 w-16 mx-auto text-destructive" />
            <div>
              <h3 className="font-semibold text-lg">QR Code Expired</h3>
              <p className="text-sm text-muted-foreground mt-1">
                The payment session has timed out for security reasons.
              </p>
            </div>
            <Button onClick={initializeUPIPayment} className="w-full">
              <RefreshCw className="h-4 w-4 mr-2" />
              Generate New QR Code
            </Button>
          </CardContent>
        </Card>

        {/* Still allow manual confirmation if they already paid */}
        <Card>
          <CardContent className="pt-6 space-y-4">
            <p className="text-sm text-center text-muted-foreground">
              Already made the payment? You can still confirm it below.
            </p>
            <Button
              onClick={() => confirmPayment(false)}
              disabled={verifying}
              variant="outline"
              className="w-full"
            >
              {verifying ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Confirming...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  I've Already Paid
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Timer and Amount Display */}
      <div className="flex items-center justify-between bg-primary/5 rounded-lg p-4">
        <div>
          <p className="text-sm text-muted-foreground">Amount to Pay</p>
          <p className="text-2xl font-bold text-primary">₹{amount.toLocaleString()}</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-muted-foreground flex items-center justify-end gap-1">
            <Clock className="h-3 w-3" />
            Time Remaining
          </p>
          <p className={`text-2xl font-mono font-bold ${getTimerColor()}`}>
            {formatTime(timeLeft)}
          </p>
        </div>
      </div>

      {/* Status indicator */}
      <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
        </span>
        Checking payment status automatically...
      </div>

      {/* QR Code Section */}
      <Card>
        <CardHeader className="text-center pb-2">
          <CardTitle className="flex items-center justify-center gap-2 text-base">
            <QrCode className="h-5 w-5" />
            Scan QR Code
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Scan with any UPI app to pay
          </p>
        </CardHeader>
        <CardContent className="flex flex-col items-center">
          <div className="bg-white p-3 rounded-lg shadow-sm">
            <img
              src={upiData.qrCode}
              alt="UPI QR Code"
              className="w-52 h-52"
            />
          </div>
          <div className="mt-3 flex items-center gap-2">
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
        <div className="flex items-center justify-between">
          <h3 className="font-medium flex items-center gap-2 text-sm">
            <Smartphone className="h-4 w-4" />
            Pay with UPI App
          </h3>
          {!isMobile && (
            <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
              Mobile only
            </span>
          )}
        </div>
        {!isMobile && (
          <p className="text-xs text-muted-foreground">
            These buttons work on mobile devices. On desktop, please scan the QR code above with your phone.
          </p>
        )}
        
        <div className="grid grid-cols-3 gap-2">
          <Button
            variant="outline"
            className="h-12 flex flex-col items-center justify-center gap-1 text-xs hover:bg-purple-50 hover:border-purple-300"
            onClick={() => handleAppPayment(upiData.deepLinks.phonepe, "PhonePe")}
          >
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/thumb/7/71/PhonePe_Logo.svg/1024px-PhonePe_Logo.svg.png"
              alt="PhonePe"
              className="h-5 w-5"
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
            <span>PhonePe</span>
          </Button>
          
          <Button
            variant="outline"
            className="h-12 flex flex-col items-center justify-center gap-1 text-xs hover:bg-blue-50 hover:border-blue-300"
            onClick={() => handleAppPayment(upiData.deepLinks.gpay, "Google Pay")}
          >
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/thumb/f/f2/Google_Pay_Logo.svg/1024px-Google_Pay_Logo.svg.png"
              alt="Google Pay"
              className="h-5 w-5"
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
            <span>GPay</span>
          </Button>
          
          <Button
            variant="outline"
            className="h-12 flex flex-col items-center justify-center gap-1 text-xs hover:bg-sky-50 hover:border-sky-300"
            onClick={() => handleAppPayment(upiData.deepLinks.paytm, "Paytm")}
          >
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/24/Paytm_Logo_%28standalone%29.svg/1024px-Paytm_Logo_%28standalone%29.svg.png"
              alt="Paytm"
              className="h-5 w-5"
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
            <span>Paytm</span>
          </Button>
        </div>

        <Button
          variant="secondary"
          className="w-full h-10"
          onClick={handleGenericUPI}
        >
          <ExternalLink className="h-4 w-4 mr-2" />
          Open Any UPI App
        </Button>
      </div>

      <Separator />

      {/* Quick Confirmation */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-5 space-y-3">
          <div className="text-center">
            <h3 className="font-semibold">Completed Payment?</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Click below after you've made the payment via UPI
            </p>
          </div>
          
          <Button
            onClick={() => confirmPayment(false)}
            disabled={verifying}
            className="w-full h-11"
          >
            {verifying ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Confirming...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                I've Completed Payment
              </>
            )}
          </Button>

          {/* Advanced: Transaction ID Entry */}
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-xs text-muted-foreground"
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            {showAdvanced ? (
              <><ChevronUp className="h-3 w-3 mr-1" /> Hide transaction ID</>
            ) : (
              <><ChevronDown className="h-3 w-3 mr-1" /> Enter transaction ID (optional)</>
            )}
          </Button>

          {showAdvanced && (
            <div className="space-y-2 p-3 bg-background rounded-lg">
              <div>
                <Label htmlFor="transactionId" className="text-xs">UPI Transaction ID</Label>
                <Input
                  id="transactionId"
                  placeholder="Enter transaction ID"
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  className="mt-1 h-9"
                />
              </div>
              <Button
                onClick={() => confirmPayment(true)}
                disabled={verifying || !transactionId.trim()}
                variant="outline"
                size="sm"
                className="w-full"
              >
                Verify with Transaction ID
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Help Text */}
      <p className="text-center text-xs text-muted-foreground">
        Having trouble? Contact support@vastra.com
      </p>
    </div>
  );
};

export default UPIPayment;
