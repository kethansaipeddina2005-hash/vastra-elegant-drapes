import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { useAdmin } from '@/hooks/useAdmin';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loading } from '@/components/ui/loading';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface Customer {
  id: string;
  full_name: string | null;
  phone: string | null;
  created_at: string;
  totalSpent: number;
  orderCount: number;
  lastOrderDate: string | null;
}

const AdminCustomers = () => {
  const navigate = useNavigate();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      toast.error('Unauthorized access');
      navigate('/');
    }
  }, [isAdmin, adminLoading, navigate]);

  useEffect(() => {
    if (isAdmin) {
      fetchCustomers();
    }
  }, [isAdmin]);

  const fetchCustomers = async () => {
    try {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('user_id, final_amount, created_at');

      if (ordersError) throw ordersError;

      const customerData = (profiles || []).map((profile) => {
        const userOrders = (orders || []).filter((o) => o.user_id === profile.id);
        const totalSpent = userOrders.reduce((sum, o) => sum + parseFloat(o.final_amount.toString()), 0);
        const lastOrder = userOrders.length > 0 
          ? userOrders.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]
          : null;

        return {
          id: profile.id,
          full_name: profile.full_name,
          phone: profile.phone,
          created_at: profile.created_at,
          totalSpent,
          orderCount: userOrders.length,
          lastOrderDate: lastOrder?.created_at || null,
        };
      });

      setCustomers(customerData);
    } catch (error) {
      console.error('Error fetching customers:', error);
      toast.error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

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
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Customer Management</h1>
          <p className="text-muted-foreground">View all registered customers and their activity</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Customers ({customers.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Total Orders</TableHead>
                  <TableHead>Total Spent</TableHead>
                  <TableHead>Last Order</TableHead>
                  <TableHead>Registered</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell className="font-medium">
                      {customer.full_name || 'No name provided'}
                    </TableCell>
                    <TableCell>{customer.phone || 'N/A'}</TableCell>
                    <TableCell>{customer.orderCount}</TableCell>
                    <TableCell className="font-semibold">₹{customer.totalSpent.toFixed(2)}</TableCell>
                    <TableCell>
                      {customer.lastOrderDate
                        ? format(new Date(customer.lastOrderDate), 'MMM dd, yyyy')
                        : 'No orders'}
                    </TableCell>
                    <TableCell>{format(new Date(customer.created_at), 'MMM dd, yyyy')}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default AdminCustomers;
