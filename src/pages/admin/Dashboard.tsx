import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { useAdmin } from '@/hooks/useAdmin';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loading } from '@/components/ui/loading';
import { Package, ShoppingCart, Users, DollarSign, Plus, List, UserCog, Tag, Shield, CreditCard, FolderOpen, Mail, MessageSquare, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';


interface Stats {
  totalProducts: number;
  totalOrders: number;
  deliveredOrders: number;
  pendingPayments: number;
  totalCustomers: number;
}

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const [stats, setStats] = useState<Stats>({
    totalProducts: 0,
    totalOrders: 0,
    deliveredOrders: 0,
    pendingPayments: 0,
    totalCustomers: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      toast.error('Unauthorized access');
      navigate('/');
    }
  }, [isAdmin, adminLoading, navigate]);

  useEffect(() => {
    if (isAdmin) {
      fetchStats();
    }
  }, [isAdmin]);

  const fetchStats = async () => {
    try {
      const [products, orders, profiles] = await Promise.all([
        supabase.from('products').select('id', { count: 'exact', head: true }),
        supabase.from('orders').select('*'),
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
      ]);

      const ordersData = orders.data || [];
      const deliveredCount = ordersData.filter((o) => o.status === 'delivered').length;
      const pendingPaymentsCount = ordersData.filter(
        (o) => o.payment_status === 'pending'
      ).length;

      setStats({
        totalProducts: products.count || 0,
        totalOrders: ordersData.length,
        deliveredOrders: deliveredCount,
        pendingPayments: pendingPaymentsCount,
        totalCustomers: profiles.count || 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
      toast.error('Failed to load dashboard stats');
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

  if (!isAdmin) {
    return null;
  }

  const sections = [
    {
      title: 'Catalog',
      actions: [
        { label: 'Products', icon: Plus, path: '/admin/products' },
        { label: 'Categories', icon: FolderOpen, path: '/admin/categories' },
        { label: 'Banners', icon: ImageIcon, path: '/admin/banners' },
        { label: 'Popup Ads', icon: Tag, path: '/admin/popup-ads' },
      ],
    },
    {
      title: 'Sales',
      actions: [
        { label: 'Orders', icon: List, path: '/admin/orders' },
        { label: 'Payments', icon: CreditCard, path: '/admin/payments' },
        { label: 'Coupons', icon: Tag, path: '/admin/coupons' },
      ],
    },
    {
      title: 'Customers',
      actions: [
        { label: 'Customers', icon: UserCog, path: '/admin/customers' },
        { label: 'Admins', icon: Shield, path: '/admin/users' },
        { label: 'Live Chat', icon: MessageSquare, path: '/admin/chat' },
        { label: 'Contact Messages', icon: Mail, path: '/admin/messages' },
      ],
    },
    {
      title: 'Marketing',
      actions: [
        { label: 'Subscriptions', icon: Mail, path: '/admin/subscriptions' },
      ],
    },
  ];

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage your Vastra e-commerce store</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Products</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalProducts}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalOrders}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Delivered Orders</CardTitle>
              <ShoppingCart className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.deliveredOrders}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
              <DollarSign className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingPayments}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalCustomers}</div>
            </CardContent>
          </Card>
        </div>


        {/* Quick Actions, grouped */}
        <div className="space-y-6">
          {sections.map((section) => (
            <div key={section.title}>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">
                {section.title}
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {section.actions.map((a) => (
                  <Button
                    key={a.path}
                    onClick={() => navigate(a.path)}
                    variant="outline"
                    className="h-16 justify-start text-sm"
                  >
                    <a.icon className="mr-2 h-4 w-4" />
                    {a.label}
                  </Button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default AdminDashboard;
