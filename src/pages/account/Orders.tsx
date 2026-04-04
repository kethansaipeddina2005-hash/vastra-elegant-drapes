import { useEffect, useState } from "react";
import Layout from "@/components/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { format, differenceInDays } from "date-fns";
import { RotateCcw } from "lucide-react";
import { toast } from "sonner";

interface OrderItem {
  id: string;
  product_id: number;
  quantity: number;
  price: number;
}

interface ProductReturnInfo {
  id: number;
  name: string;
  return_days: number | null;
}

interface Order {
  id: string;
  created_at: string;
  updated_at: string;
  total_amount: number;
  status: string;
  payment_method: string;
  payment_status: string;
  shipping_id: string | null;
  shipping_company: string | null;
  refund_status: string | null;
  refund_amount: number | null;
  order_items: OrderItem[];
}

const Orders = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Record<number, ProductReturnInfo>>({});
  const [loading, setLoading] = useState(true);
  const [returningOrderId, setReturningOrderId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user]);

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (*)
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);

      // Fetch product info for return_days
      const productIds = [...new Set((data || []).flatMap(o => o.order_items.map((i: OrderItem) => i.product_id)))];
      if (productIds.length > 0) {
        const { data: prodData } = await supabase
          .from('products')
          .select('id, name, return_days')
          .in('id', productIds);
        
        const prodMap: Record<number, ProductReturnInfo> = {};
        (prodData || []).forEach(p => { prodMap[p.id] = p; });
        setProducts(prodMap);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const getReturnEligibility = (order: Order) => {
    if (order.status !== 'delivered') return null;

    const deliveredDate = new Date(order.updated_at);
    const now = new Date();
    const daysSinceDelivery = differenceInDays(now, deliveredDate);

    // Check if any item in the order has return_days
    const eligibleItems = order.order_items.filter(item => {
      const product = products[item.product_id];
      return product && product.return_days && product.return_days > 0 && daysSinceDelivery <= product.return_days;
    });

    if (eligibleItems.length === 0) return null;

    // Find the max return window among eligible items
    const maxReturnDays = Math.max(
      ...eligibleItems.map(item => products[item.product_id]?.return_days || 0)
    );
    const daysLeft = maxReturnDays - daysSinceDelivery;

    return { eligibleItems, daysLeft };
  };

  const handleReturnRequest = async (orderId: string) => {
    setReturningOrderId(orderId);
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: 'return_requested' })
        .eq('id', orderId);

      if (error) throw error;
      toast.success('Return request submitted successfully! We will contact you shortly.');
      fetchOrders();
    } catch (error) {
      console.error('Error requesting return:', error);
      toast.error('Failed to submit return request');
    } finally {
      setReturningOrderId(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500';
      case 'processing': return 'bg-blue-500';
      case 'shipped': return 'bg-purple-500';
      case 'delivered': return 'bg-green-500';
      case 'cancelled': return 'bg-red-500';
      case 'return_requested': return 'bg-orange-500';
      case 'returned': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'return_requested': return 'Return Requested';
      case 'returned': return 'Returned';
      default: return status;
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-6 py-8">
        <h1 className="text-4xl font-playfair font-bold text-foreground mb-8">
          Order History
        </h1>
        
        {loading ? (
          <p className="text-muted-foreground">Loading orders...</p>
        ) : orders.length === 0 ? (
          <p className="text-muted-foreground text-lg">
            You haven't placed any orders yet.
          </p>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => {
              const returnInfo = getReturnEligibility(order);
              
              return (
                <Card key={order.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-xl">
                        Order #{order.id.slice(0, 8)}
                      </CardTitle>
                      <Badge className={getStatusColor(order.status)}>
                        {getStatusLabel(order.status)}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Placed on {format(new Date(order.created_at), 'PPP')}
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {order.order_items.length} {order.order_items.length === 1 ? 'item' : 'items'}
                      </p>
                      <div className="space-y-2">
                        {order.order_items.map((item) => {
                          const product = products[item.product_id];
                          return (
                            <div key={item.id} className="flex justify-between text-sm">
                              <span>{product?.name || `Product #${item.product_id}`} × {item.quantity}</span>
                              <span>₹{(item.price * item.quantity).toLocaleString()}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    
                    <Separator />
                    
                    {(order.shipping_company || order.shipping_id) && (
                      <>
                        <div className="bg-muted p-4 rounded-lg space-y-2">
                          <p className="text-sm font-medium text-foreground">Shipping Details</p>
                          {order.shipping_company && (
                            <div>
                              <p className="text-xs text-muted-foreground">Shipping Company</p>
                              <p className="font-medium">{order.shipping_company}</p>
                            </div>
                          )}
                          {order.shipping_id && (
                            <div>
                              <p className="text-xs text-muted-foreground">Tracking Number</p>
                              <p className="font-mono font-medium">{order.shipping_id}</p>
                            </div>
                          )}
                        </div>
                        <Separator />
                      </>
                    )}

                    {/* Return Option */}
                    {returnInfo && order.status === 'delivered' && (
                      <>
                        <div className="bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 p-4 rounded-lg">
                          <div className="flex items-center justify-between flex-wrap gap-3">
                            <div>
                              <p className="text-sm font-semibold text-orange-800 dark:text-orange-300">
                                Eligible for Return
                              </p>
                              <p className="text-xs text-orange-600 dark:text-orange-400 mt-0.5">
                                {returnInfo.daysLeft} {returnInfo.daysLeft === 1 ? 'day' : 'days'} left to request a return
                              </p>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-orange-500 text-orange-700 hover:bg-orange-100 dark:text-orange-300 dark:hover:bg-orange-900"
                              onClick={() => handleReturnRequest(order.id)}
                              disabled={returningOrderId === order.id}
                            >
                              <RotateCcw className="h-4 w-4 mr-1.5" />
                              {returningOrderId === order.id ? 'Submitting...' : 'Request Return'}
                            </Button>
                          </div>
                        </div>
                        <Separator />
                      </>
                    )}

                    {order.status === 'return_requested' && (
                      <>
                        <div className="bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 p-4 rounded-lg">
                          <p className="text-sm font-semibold text-orange-800 dark:text-orange-300">
                            ↩ Return Requested
                          </p>
                          <p className="text-xs text-orange-600 dark:text-orange-400 mt-0.5">
                            Your return request is being reviewed. We'll contact you shortly.
                          </p>
                        </div>
                        <Separator />
                      </>
                    )}

                    {order.status === 'returned' && order.refund_status === 'completed' && (
                      <>
                        <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 p-4 rounded-lg">
                          <p className="text-sm font-semibold text-green-800 dark:text-green-300">
                            ✓ Refund Completed
                          </p>
                          <p className="text-xs text-green-600 dark:text-green-400 mt-0.5">
                            ₹{order.refund_amount?.toLocaleString()} has been refunded to your account.
                          </p>
                        </div>
                        <Separator />
                      </>
                    )}

                    {order.refund_status === 'rejected' && (
                      <>
                        <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 p-4 rounded-lg">
                          <p className="text-sm font-semibold text-red-800 dark:text-red-300">
                            ✕ Return Rejected
                          </p>
                          <p className="text-xs text-red-600 dark:text-red-400 mt-0.5">
                            Your return request was not approved. Please contact support for details.
                          </p>
                        </div>
                        <Separator />
                      </>
                    )}
                    
                    <div className="flex justify-between items-center flex-wrap gap-3">
                      <div className="text-sm">
                        <p className="text-muted-foreground">Payment Method</p>
                        <p className="font-medium capitalize">{order.payment_method}</p>
                      </div>
                      <div className="text-sm">
                        <p className="text-muted-foreground">Payment Status</p>
                        <Badge variant={order.payment_status === 'completed' ? 'default' : 'outline'}>
                          {order.payment_status}
                        </Badge>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Total Amount</p>
                        <p className="text-2xl font-bold text-primary">
                          ₹{order.total_amount.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Orders;
