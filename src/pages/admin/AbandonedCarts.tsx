import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Eye,
  IndianRupee,
  RefreshCw,
  Search,
  ShoppingBag,
  ShoppingCart,
  User,
} from 'lucide-react';
import Layout from '@/components/Layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Loading } from '@/components/ui/loading';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAdmin } from '@/hooks/useAdmin';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import type { Database, Json } from '@/integrations/supabase/types';

type AbandonedCart = Database['public']['Tables']['abandoned_carts']['Row'];

type CartItem = {
  product_id?: number | string;
  id?: number | string;
  name?: string;
  product_name?: string;
  productCode?: string;
  product_code?: string;
  image?: string;
  image_url?: string;
  price?: number | string;
  quantity?: number | string;
};

const statusStyles: Record<string, string> = {
  active: 'bg-secondary text-secondary-foreground',
  abandoned: 'bg-muted text-muted-foreground',
  checkout_started: 'bg-accent text-accent-foreground',
  recovered: 'bg-secondary text-secondary-foreground',
  purchased: 'bg-primary text-primary-foreground',
};

const formatStatus = (status: string) =>
  status
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

const getCartItems = (items: Json): CartItem[] => (Array.isArray(items) ? (items as CartItem[]) : []);

const getItemName = (item: CartItem) => item.name || item.product_name || 'Saree';
const getItemCode = (item: CartItem) => item.product_code || item.productCode || '—';
const getItemImage = (item: CartItem) => item.image || item.image_url || '/placeholder.svg';
const getItemQuantity = (item: CartItem) => Number(item.quantity || 1);
const getItemPrice = (item: CartItem) => Number(item.price || 0);

const AdminAbandonedCarts = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const [carts, setCarts] = useState<AbandonedCart[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedCart, setSelectedCart] = useState<AbandonedCart | null>(null);
  const [markingCartId, setMarkingCartId] = useState<string | null>(null);

  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      navigate('/');
    }
  }, [isAdmin, adminLoading, navigate]);

  useEffect(() => {
    if (isAdmin) {
      fetchCarts();
    }
  }, [isAdmin]);

  const fetchCarts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('abandoned_carts')
        .select('*')
        .order('last_activity_at', { ascending: false });

      if (error) throw error;
      setCarts(data || []);
    } catch (error) {
      console.error('Error fetching abandoned carts:', error);
      toast({
        title: 'Error',
        description: 'Failed to load abandoned carts',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const markAsPurchased = async (cart: AbandonedCart) => {
    if (cart.status === 'purchased') return;
    if (!confirm('Mark this cart as Purchased?')) return;

    try {
      setMarkingCartId(cart.id);
      const purchasedAt = new Date().toISOString();
      const { error } = await supabase
        .from('abandoned_carts')
        .update({
          status: 'purchased',
          purchased_at: purchasedAt,
          updated_at: purchasedAt,
        })
        .eq('id', cart.id);

      if (error) throw error;

      setCarts((current) =>
        current.map((item) =>
          item.id === cart.id
            ? { ...item, status: 'purchased', purchased_at: purchasedAt, updated_at: purchasedAt }
            : item
        )
      );
      setSelectedCart((current) =>
        current?.id === cart.id
          ? { ...current, status: 'purchased', purchased_at: purchasedAt, updated_at: purchasedAt }
          : current
      );
      toast({
        title: 'Cart updated',
        description: 'The cart has been marked as Purchased.',
      });
    } catch (error) {
      console.error('Error marking cart as purchased:', error);
      toast({
        title: 'Update failed',
        description: 'Could not mark this cart as Purchased.',
        variant: 'destructive',
      });
    } finally {
      setMarkingCartId(null);
    }
  };

  const filteredCarts = useMemo(() => {
    const query = search.trim().toLowerCase();
    return carts.filter((cart) => {
      const matchesStatus = statusFilter === 'all' || cart.status === statusFilter;
      const customer = [cart.customer_name, cart.customer_email, cart.customer_phone]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      const matchesSearch = !query || customer.includes(query) || cart.cart_token.toLowerCase().includes(query);
      return matchesStatus && matchesSearch;
    });
  }, [carts, search, statusFilter]);

  const stats = useMemo(() => {
    return {
      total: carts.length,
      active: carts.filter((cart) => cart.status === 'active').length,
      abandoned: carts.filter((cart) => cart.status === 'abandoned').length,
      checkoutStarted: carts.filter((cart) => cart.status === 'checkout_started').length,
      purchased: carts.filter((cart) => cart.status === 'purchased').length,
      value: carts
        .filter((cart) => cart.status !== 'purchased')
        .reduce((sum, cart) => sum + Number(cart.cart_value || 0), 0),
    };
  }, [carts]);

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
        <Button variant="ghost" onClick={() => navigate('/admin/dashboard')} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-playfair font-bold text-foreground">Abandoned Carts</h1>
            <p className="text-muted-foreground mt-1">
              Track anonymous carts, checkout activity, and completed purchases.
            </p>
          </div>
          <Button variant="outline" onClick={fetchCarts}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Carts</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent><div className="text-2xl font-bold">{stats.total}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Active</CardTitle>
              <ShoppingBag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent><div className="text-2xl font-bold">{stats.active}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Abandoned</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent><div className="text-2xl font-bold">{stats.abandoned}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Checkout Started</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent><div className="text-2xl font-bold">{stats.checkoutStarted}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Purchased</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent><div className="text-2xl font-bold">{stats.purchased}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Open Cart Value</CardTitle>
              <IndianRupee className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent><div className="text-2xl font-bold">₹{stats.value.toLocaleString('en-IN')}</div></CardContent>
          </Card>
        </div>

        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-[1fr_220px] gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search by customer, email, phone, or cart ID..."
                  className="pl-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="abandoned">Abandoned</SelectItem>
                  <SelectItem value="checkout_started">Checkout Started</SelectItem>
                  <SelectItem value="recovered">Recovered</SelectItem>
                  <SelectItem value="purchased">Purchased</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-0">
            {filteredCarts.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground">
                <ShoppingBag className="mx-auto h-12 w-12 mb-4 opacity-50" />
                <p>No carts found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer</TableHead>
                      <TableHead>Products</TableHead>
                      <TableHead>Cart Value</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Added / Updated</TableHead>
                      <TableHead>Checkout</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCarts.map((cart) => (
                      <TableRow key={cart.id}>
                        <TableCell>
                          <div className="font-medium">{cart.customer_name || 'Anonymous Visitor'}</div>
                          <div className="text-sm text-muted-foreground">{cart.customer_email || 'No email provided'}</div>
                          <div className="text-sm text-muted-foreground">{cart.customer_phone || 'No phone provided'}</div>
                        </TableCell>
                        <TableCell>{cart.item_count} item{cart.item_count === 1 ? '' : 's'}</TableCell>
                        <TableCell className="font-semibold">₹{Number(cart.cart_value).toLocaleString('en-IN')}</TableCell>
                        <TableCell>
                          <Badge className={statusStyles[cart.status] || 'bg-muted text-muted-foreground'}>
                            {formatStatus(cart.status)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div>{format(new Date(cart.created_at), 'dd MMM yyyy, hh:mm a')}</div>
                          <div className="text-sm text-muted-foreground">
                            Updated {format(new Date(cart.last_activity_at), 'dd MMM, hh:mm a')}
                          </div>
                        </TableCell>
                        <TableCell>
                          {cart.checkout_started_at
                            ? format(new Date(cart.checkout_started_at), 'dd MMM yyyy, hh:mm a')
                            : 'Not started'}
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" size="sm" onClick={() => setSelectedCart(cart)}>
                              <Eye className="mr-1 h-4 w-4" />
                              View
                            </Button>
                            {cart.status !== 'purchased' && (
                              <Button
                                size="sm"
                                onClick={() => markAsPurchased(cart)}
                                disabled={markingCartId === cart.id}
                              >
                                <CheckCircle2 className="mr-1 h-4 w-4" />
                                Mark Purchased
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!selectedCart} onOpenChange={(open) => !open && setSelectedCart(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Cart Details</DialogTitle>
          </DialogHeader>
          {selectedCart && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader><CardTitle className="text-base">Customer</CardTitle></CardHeader>
                  <CardContent className="space-y-1 text-sm">
                    <p className="font-medium">{selectedCart.customer_name || 'Anonymous Visitor'}</p>
                    <p>{selectedCart.customer_email || 'No email provided'}</p>
                    <p>{selectedCart.customer_phone || 'No phone provided'}</p>
                    <p className="text-muted-foreground break-all">Cart ID: {selectedCart.cart_token}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle className="text-base">Cart Status</CardTitle></CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <Badge className={statusStyles[selectedCart.status] || 'bg-muted text-muted-foreground'}>
                      {formatStatus(selectedCart.status)}
                    </Badge>
                    <p>Created: {format(new Date(selectedCart.created_at), 'dd MMM yyyy, hh:mm a')}</p>
                    <p>Last activity: {format(new Date(selectedCart.last_activity_at), 'dd MMM yyyy, hh:mm a')}</p>
                    <p>Checkout: {selectedCart.checkout_started_at ? format(new Date(selectedCart.checkout_started_at), 'dd MMM yyyy, hh:mm a') : 'Not started'}</p>
                    <p>Purchase: {selectedCart.purchased_at ? format(new Date(selectedCart.purchased_at), 'dd MMM yyyy, hh:mm a') : 'Not purchased'}</p>
                  </CardContent>
                </Card>
              </div>

              <div>
                <h3 className="font-semibold mb-3">Products</h3>
                <div className="space-y-3">
                  {getCartItems(selectedCart.items).map((item, index) => (
                    <div key={`${selectedCart.id}-${index}`} className="flex items-center gap-4 rounded-lg border p-3">
                      <img
                        src={getItemImage(item)}
                        alt={getItemName(item)}
                        className="h-16 w-16 rounded-md object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{getItemName(item)}</p>
                        <p className="text-sm text-muted-foreground">Code: {getItemCode(item)}</p>
                        <p className="text-sm text-muted-foreground">Quantity: {getItemQuantity(item)}</p>
                      </div>
                      <div className="text-right font-semibold">
                        ₹{(getItemPrice(item) * getItemQuantity(item)).toLocaleString('en-IN')}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t pt-4">
                <div>
                  <p className="text-sm text-muted-foreground">Total cart value</p>
                  <p className="text-2xl font-bold">₹{Number(selectedCart.cart_value).toLocaleString('en-IN')}</p>
                </div>
                {selectedCart.status !== 'purchased' && (
                  <Button
                    onClick={() => markAsPurchased(selectedCart)}
                    disabled={markingCartId === selectedCart.id}
                  >
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Mark as Purchased
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default AdminAbandonedCarts;
