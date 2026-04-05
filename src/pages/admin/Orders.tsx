import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { useAdmin } from '@/hooks/useAdmin';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Loading } from '@/components/ui/loading';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Eye, RotateCcw, IndianRupee, PackageCheck, CheckCircle2, Search, CalendarIcon, Download, X } from 'lucide-react';
import { toast } from 'sonner';
import { format, isWithinInterval, startOfDay, endOfDay, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import * as XLSX from 'xlsx';

interface Order {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  total_amount: number;
  final_amount: number;
  status: string;
  payment_status: string;
  payment_method: string;
  shipping_id: string | null;
  shipping_company: string | null;
  return_product_received: boolean;
  return_product_ok: boolean;
  refund_status: string | null;
  refund_amount: number | null;
  refund_notes: string | null;
  created_at: string;
}

const AdminOrders = () => {
  const navigate = useNavigate();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [updating, setUpdating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();

  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      toast.error('Unauthorized access');
      navigate('/');
    }
  }, [isAdmin, adminLoading, navigate]);

  useEffect(() => {
    if (isAdmin) {
      fetchOrders();
    }
  }, [isAdmin, filterStatus]);

  const fetchOrders = async () => {
    try {
      let query = supabase.from('orders').select('*').order('created_at', { ascending: false });
      if (filterStatus !== 'all') {
        query = query.eq('status', filterStatus);
      }
      const { data, error } = await query;
      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  // Filter orders by search query and date range
  const filteredOrders = useMemo(() => {
    let result = orders;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(o =>
        o.id.toLowerCase().includes(q) ||
        (o.customer_name || '').toLowerCase().includes(q) ||
        (o.customer_email || '').toLowerCase().includes(q) ||
        (o.customer_phone || '').toLowerCase().includes(q)
      );
    }

    if (dateFrom) {
      result = result.filter(o => parseISO(o.created_at) >= startOfDay(dateFrom));
    }
    if (dateTo) {
      result = result.filter(o => parseISO(o.created_at) <= endOfDay(dateTo));
    }

    return result;
  }, [orders, searchQuery, dateFrom, dateTo]);

  // Group orders by date
  const groupedOrders = useMemo(() => {
    const groups: Record<string, Order[]> = {};
    filteredOrders.forEach(order => {
      const dateKey = format(parseISO(order.created_at), 'yyyy-MM-dd');
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(order);
    });
    return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
  }, [filteredOrders]);

  const handleExportExcel = () => {
    if (filteredOrders.length === 0) {
      toast.error('No orders to export');
      return;
    }

    const exportData = filteredOrders.map(o => ({
      'Order ID': o.id,
      'Customer Name': o.customer_name || '',
      'Email': o.customer_email || '',
      'Phone': o.customer_phone || '',
      'Total Amount': o.total_amount,
      'Final Amount': o.final_amount,
      'Status': o.status,
      'Payment Status': o.payment_status,
      'Payment Method': o.payment_method || '',
      'Shipping Company': o.shipping_company || '',
      'Tracking ID': o.shipping_id || '',
      'Refund Status': o.refund_status || '',
      'Refund Amount': o.refund_amount || '',
      'Date': format(parseISO(o.created_at), 'dd/MM/yyyy HH:mm'),
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Orders');

    // Auto-width columns
    const colWidths = Object.keys(exportData[0]).map(key => ({
      wch: Math.max(key.length, ...exportData.map(r => String((r as any)[key]).length)) + 2,
    }));
    ws['!cols'] = colWidths;

    const fileName = `Vastra_Orders_${format(new Date(), 'dd-MM-yyyy')}.xlsx`;
    XLSX.writeFile(wb, fileName);
    toast.success(`Exported ${filteredOrders.length} orders to ${fileName}`);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setDateFrom(undefined);
    setDateTo(undefined);
    setFilterStatus('all');
  };

  const hasActiveFilters = searchQuery || dateFrom || dateTo || filterStatus !== 'all';

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    setUpdating(true);
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);
      if (error) throw error;
      toast.success('Order status updated successfully');
      fetchOrders();
      if (selectedOrder?.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: newStatus });
      }
    } catch (error) {
      console.error('Error updating order:', error);
      toast.error('Failed to update order status');
    } finally {
      setUpdating(false);
    }
  };

  const handleShippingUpdate = async (orderId: string, field: 'shipping_id' | 'shipping_company', value: string) => {
    setUpdating(true);
    try {
      const { error } = await supabase
        .from('orders')
        .update({ [field]: value })
        .eq('id', orderId);
      if (error) throw error;
      toast.success(`${field === 'shipping_id' ? 'Tracking ID' : 'Shipping Company'} updated successfully`);
      fetchOrders();
      if (selectedOrder?.id === orderId) {
        setSelectedOrder({ ...selectedOrder, [field]: value });
      }
    } catch (error) {
      console.error('Error updating shipping info:', error);
      toast.error('Failed to update shipping info');
    } finally {
      setUpdating(false);
    }
  };

  const handleReturnChecklistUpdate = async (orderId: string, field: string, value: boolean | string | number | null) => {
    setUpdating(true);
    try {
      const { error } = await supabase
        .from('orders')
        .update({ [field]: value })
        .eq('id', orderId);
      if (error) throw error;
      toast.success('Return info updated');
      fetchOrders();
      if (selectedOrder?.id === orderId) {
        setSelectedOrder({ ...selectedOrder, [field]: value } as Order);
      }
    } catch (error) {
      console.error('Error updating return info:', error);
      toast.error('Failed to update return info');
    } finally {
      setUpdating(false);
    }
  };

  const handleProcessRefund = async (order: Order) => {
    if (!order.refund_amount || order.refund_amount <= 0) {
      toast.error('Please enter a valid refund amount');
      return;
    }
    if (!order.return_product_received) {
      toast.error('Please confirm the product has been received first');
      return;
    }
    if (!order.return_product_ok) {
      toast.error('Please confirm the product quality check first');
      return;
    }
    setUpdating(true);
    try {
      const { error } = await supabase
        .from('orders')
        .update({
          refund_status: 'completed',
          status: 'returned',
          payment_status: 'refunded',
        })
        .eq('id', order.id);
      if (error) throw error;
      toast.success(`Refund of ₹${order.refund_amount} marked as completed!`);
      fetchOrders();
      if (selectedOrder?.id === order.id) {
        setSelectedOrder({ ...order, refund_status: 'completed', status: 'returned', payment_status: 'refunded' });
      }
    } catch (error) {
      console.error('Error processing refund:', error);
      toast.error('Failed to process refund');
    } finally {
      setUpdating(false);
    }
  };

  const handleRejectReturn = async (order: Order) => {
    setUpdating(true);
    try {
      const { error } = await supabase
        .from('orders')
        .update({
          refund_status: 'rejected',
          status: 'delivered',
        })
        .eq('id', order.id);
      if (error) throw error;
      toast.success('Return rejected, order restored to delivered');
      fetchOrders();
      if (selectedOrder?.id === order.id) {
        setSelectedOrder({ ...order, refund_status: 'rejected', status: 'delivered' });
      }
    } catch (error) {
      console.error('Error rejecting return:', error);
      toast.error('Failed to reject return');
    } finally {
      setUpdating(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      pending: 'outline',
      processing: 'secondary',
      shipped: 'default',
      delivered: 'default',
      return_requested: 'destructive',
      returned: 'secondary',
      cancelled: 'destructive',
    };
    const labels: Record<string, string> = { return_requested: 'Return Requested', returned: 'Returned' };
    return <Badge variant={variants[status] || 'outline'}>{labels[status] || status}</Badge>;
  };

  const returnRequestCount = orders.filter(o => o.status === 'return_requested').length;

  if (adminLoading || loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loading size="lg" />
        </div>
      </Layout>
    );
  }

  if (!isAdmin) return null;

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
          <div>
            <h1 className="text-4xl font-bold mb-2">Order Management</h1>
            <p className="text-muted-foreground">View and manage all customer orders</p>
          </div>
          <Button onClick={handleExportExcel} variant="outline" className="gap-2 shrink-0">
            <Download className="h-4 w-4" />
            Export to Excel
          </Button>
        </div>

        {/* Return Requests Alert */}
        {returnRequestCount > 0 && filterStatus === 'all' && (
          <Card className="mb-6 border-orange-300 bg-orange-50 dark:bg-orange-950/20 dark:border-orange-800">
            <CardContent className="py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <RotateCcw className="h-5 w-5 text-orange-600" />
                <div>
                  <p className="font-semibold text-orange-800 dark:text-orange-300">
                    {returnRequestCount} Return {returnRequestCount === 1 ? 'Request' : 'Requests'} Pending
                  </p>
                  <p className="text-sm text-orange-600 dark:text-orange-400">Customers are waiting for return approval</p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="border-orange-500 text-orange-700 hover:bg-orange-100"
                onClick={() => setFilterStatus('return_requested')}
              >
                View Returns
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Search & Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
              {/* Search */}
              <div className="sm:col-span-2 lg:col-span-1">
                <Label htmlFor="search-orders">Search Orders</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search-orders"
                    placeholder="Order ID, name, email, phone..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              {/* Status filter */}
              <div>
                <Label htmlFor="status-filter">Status</Label>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger id="status-filter">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Orders</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="shipped">Shipped</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                    <SelectItem value="return_requested">Return Requested</SelectItem>
                    <SelectItem value="returned">Returned</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Date From */}
              <div>
                <Label>From Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !dateFrom && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateFrom ? format(dateFrom, 'dd MMM yyyy') : 'Pick date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={dateFrom} onSelect={setDateFrom} initialFocus className="p-3 pointer-events-auto" />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Date To */}
              <div>
                <Label>To Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !dateTo && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateTo ? format(dateTo, 'dd MMM yyyy') : 'Pick date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={dateTo} onSelect={setDateTo} initialFocus className="p-3 pointer-events-auto" />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {hasActiveFilters && (
              <div className="mt-4 flex items-center gap-2">
                <p className="text-sm text-muted-foreground">
                  Showing {filteredOrders.length} of {orders.length} orders
                </p>
                <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1 text-destructive hover:text-destructive">
                  <X className="h-3 w-3" /> Clear filters
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Orders grouped by date */}
        {groupedOrders.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground text-lg">No orders found matching your filters.</p>
            </CardContent>
          </Card>
        ) : (
          groupedOrders.map(([dateKey, dateOrders]) => (
            <Card key={dateKey} className="mb-4">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                    {format(parseISO(dateKey), 'EEEE, dd MMMM yyyy')}
                  </span>
                  <Badge variant="secondary">{dateOrders.length} order{dateOrders.length > 1 ? 's' : ''}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order ID</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Payment</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dateOrders.map((order) => (
                      <TableRow key={order.id} className={order.status === 'return_requested' ? 'bg-orange-50/50 dark:bg-orange-950/10' : ''}>
                        <TableCell className="font-mono text-sm">{order.id.slice(0, 8)}...</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{order.customer_name}</p>
                            <p className="text-sm text-muted-foreground">{order.customer_email}</p>
                          </div>
                        </TableCell>
                        <TableCell>₹{order.final_amount}</TableCell>
                        <TableCell>{getStatusBadge(order.status)}</TableCell>
                        <TableCell>
                          <Badge variant={order.payment_status === 'completed' ? 'default' : order.payment_status === 'refunded' ? 'secondary' : 'outline'}>
                            {order.payment_status}
                          </Badge>
                        </TableCell>
                        <TableCell>{format(parseISO(order.created_at), 'hh:mm a')}</TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedOrder(order);
                              setIsDialogOpen(true);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ))
        )}

        {/* Order Details Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Order Details</DialogTitle>
            </DialogHeader>
            {selectedOrder && (
              <div className="space-y-4">
                <div>
                  <Label>Order ID</Label>
                  <p className="font-mono text-sm break-all select-all">{selectedOrder.id}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Customer Name</Label>
                    <p>{selectedOrder.customer_name}</p>
                  </div>
                  <div>
                    <Label>Email</Label>
                    <p>{selectedOrder.customer_email}</p>
                  </div>
                  <div>
                    <Label>Phone</Label>
                    <p>{selectedOrder.customer_phone}</p>
                  </div>
                  <div>
                    <Label>Payment Method</Label>
                    <p>{selectedOrder.payment_method}</p>
                  </div>
                </div>
                <div>
                  <Label>Total Amount</Label>
                  <p className="text-2xl font-bold">₹{selectedOrder.final_amount}</p>
                </div>
                <div>
                  <Label>Order Date</Label>
                  <p>{format(parseISO(selectedOrder.created_at), 'dd MMMM yyyy, hh:mm a')}</p>
                </div>
                <div>
                  <Label htmlFor="order-status">Update Status</Label>
                  <Select
                    value={selectedOrder.status}
                    onValueChange={(value) => handleStatusUpdate(selectedOrder.id, value)}
                    disabled={updating}
                  >
                    <SelectTrigger id="order-status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="processing">Processing</SelectItem>
                      <SelectItem value="shipped">Shipped</SelectItem>
                      <SelectItem value="delivered">Delivered</SelectItem>
                      <SelectItem value="return_requested">Return Requested</SelectItem>
                      <SelectItem value="returned">Returned</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="shipping-company">Shipping Company</Label>
                  <Input
                    id="shipping-company"
                    defaultValue={selectedOrder.shipping_company || ''}
                    placeholder="e.g., BlueDart, DTDC, Delhivery"
                    onBlur={(e) => {
                      if (e.target.value !== selectedOrder.shipping_company) {
                        handleShippingUpdate(selectedOrder.id, 'shipping_company', e.target.value);
                      }
                    }}
                  />
                </div>
                <div>
                  <Label htmlFor="shipping-id">Tracking ID</Label>
                  <Input
                    id="shipping-id"
                    defaultValue={selectedOrder.shipping_id || ''}
                    placeholder="Enter tracking number"
                    onBlur={(e) => {
                      if (e.target.value !== selectedOrder.shipping_id) {
                        handleShippingUpdate(selectedOrder.id, 'shipping_id', e.target.value);
                      }
                    }}
                  />
                </div>

                {/* Return Management Section */}
                {(selectedOrder.status === 'return_requested' || selectedOrder.status === 'returned') && (
                  <>
                    <Separator />
                    <div className="rounded-lg border-2 border-orange-300 dark:border-orange-700 p-5 space-y-5 bg-orange-50/50 dark:bg-orange-950/20">
                      <div className="flex items-center gap-2">
                        <RotateCcw className="h-5 w-5 text-orange-600" />
                        <h3 className="font-bold text-lg text-orange-800 dark:text-orange-300">Return Management</h3>
                      </div>

                      <div className="space-y-4">
                        <p className="text-sm font-medium text-muted-foreground">Return Checklist</p>

                        <div className="flex items-start gap-3 p-3 rounded-md bg-background border">
                          <Checkbox
                            id="product-received"
                            checked={selectedOrder.return_product_received}
                            onCheckedChange={(checked) => {
                              handleReturnChecklistUpdate(selectedOrder.id, 'return_product_received', !!checked);
                              setSelectedOrder({ ...selectedOrder, return_product_received: !!checked });
                            }}
                            disabled={updating || selectedOrder.refund_status === 'completed'}
                          />
                          <div>
                            <label htmlFor="product-received" className="font-medium cursor-pointer flex items-center gap-2">
                              <PackageCheck className="h-4 w-4" />
                              Product Received
                            </label>
                            <p className="text-xs text-muted-foreground mt-0.5">Confirm returned product has been received back</p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3 p-3 rounded-md bg-background border">
                          <Checkbox
                            id="product-ok"
                            checked={selectedOrder.return_product_ok}
                            onCheckedChange={(checked) => {
                              handleReturnChecklistUpdate(selectedOrder.id, 'return_product_ok', !!checked);
                              setSelectedOrder({ ...selectedOrder, return_product_ok: !!checked });
                            }}
                            disabled={updating || !selectedOrder.return_product_received || selectedOrder.refund_status === 'completed'}
                          />
                          <div>
                            <label htmlFor="product-ok" className="font-medium cursor-pointer flex items-center gap-2">
                              <CheckCircle2 className="h-4 w-4" />
                              Product Quality OK
                            </label>
                            <p className="text-xs text-muted-foreground mt-0.5">Product passed inspection and is in acceptable condition</p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <p className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                          <IndianRupee className="h-4 w-4" />
                          Refund Details
                        </p>
                        <div>
                          <Label htmlFor="refund-amount">Refund Amount (₹)</Label>
                          <Input
                            id="refund-amount"
                            type="number"
                            defaultValue={selectedOrder.refund_amount || selectedOrder.final_amount || ''}
                            placeholder="Enter refund amount"
                            disabled={selectedOrder.refund_status === 'completed'}
                            onBlur={(e) => {
                              const val = parseFloat(e.target.value) || null;
                              if (val !== selectedOrder.refund_amount) {
                                handleReturnChecklistUpdate(selectedOrder.id, 'refund_amount', val);
                                setSelectedOrder({ ...selectedOrder, refund_amount: val });
                              }
                            }}
                          />
                        </div>
                        <div>
                          <Label htmlFor="refund-notes">Notes</Label>
                          <Textarea
                            id="refund-notes"
                            defaultValue={selectedOrder.refund_notes || ''}
                            placeholder="Add notes about the return or refund..."
                            disabled={selectedOrder.refund_status === 'completed'}
                            onBlur={(e) => {
                              if (e.target.value !== (selectedOrder.refund_notes || '')) {
                                handleReturnChecklistUpdate(selectedOrder.id, 'refund_notes', e.target.value || null);
                                setSelectedOrder({ ...selectedOrder, refund_notes: e.target.value || null });
                              }
                            }}
                          />
                        </div>

                        {selectedOrder.refund_status === 'completed' ? (
                          <div className="bg-green-100 dark:bg-green-950/30 border border-green-300 dark:border-green-800 p-3 rounded-md text-center">
                            <p className="font-semibold text-green-800 dark:text-green-300">
                              ✓ Refund of ₹{selectedOrder.refund_amount?.toLocaleString()} Completed
                            </p>
                          </div>
                        ) : selectedOrder.refund_status === 'rejected' ? (
                          <div className="bg-red-100 dark:bg-red-950/30 border border-red-300 dark:border-red-800 p-3 rounded-md text-center">
                            <p className="font-semibold text-red-800 dark:text-red-300">Return Rejected</p>
                          </div>
                        ) : (
                          <div className="flex gap-3 pt-2">
                            <Button
                              className="flex-1"
                              onClick={() => handleProcessRefund(selectedOrder)}
                              disabled={updating || !selectedOrder.return_product_received || !selectedOrder.return_product_ok}
                            >
                              <IndianRupee className="h-4 w-4 mr-1.5" />
                              {updating ? 'Processing...' : 'Mark Refund Completed'}
                            </Button>
                            <Button
                              variant="destructive"
                              onClick={() => handleRejectReturn(selectedOrder)}
                              disabled={updating}
                            >
                              Reject Return
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default AdminOrders;
