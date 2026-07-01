import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { useCollaborator } from '@/hooks/useCollaborator';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loading } from '@/components/ui/loading';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DollarSign, ShoppingCart, TrendingUp, Wallet, Clock, CheckCircle2 } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, CartesianGrid,
} from 'recharts';
import { format } from 'date-fns';

interface Commission {
  id: string;
  order_id: string;
  coupon_code: string;
  order_amount: number;
  commission_percent: number;
  commission_amount: number;
  status: string;
  created_at: string;
  paid_at: string | null;
}

interface OrderInfo {
  id: string;
  order_number: string | null;
  status: string;
  customer_name: string | null;
  customer_email: string | null;
  created_at: string;
}

const maskName = (name?: string | null) => {
  if (!name) return 'Guest';
  const parts = name.trim().split(/\s+/);
  return parts.map((p) => (p.length <= 2 ? p[0] + '*' : p[0] + '*'.repeat(Math.max(1, p.length - 2)) + p.slice(-1))).join(' ');
};

const CollaboratorDashboard = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { activeCoupons, coupons, isCollaborator, loading: cLoading } = useCollaborator();
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [orders, setOrders] = useState<Record<string, OrderInfo>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) navigate('/account/login');
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (!user?.email) return;
    const fetchData = async () => {
      const { data: commData, error } = await supabase
        .from('collaborator_commissions')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) console.error(error);
      const c = (commData as Commission[]) || [];
      setCommissions(c);

      if (c.length) {
        const ids = c.map((r) => r.order_id);
        const { data: oData } = await supabase
          .from('orders')
          .select('id, order_number, status, customer_name, customer_email, created_at')
          .in('id', ids);
        const map: Record<string, OrderInfo> = {};
        (oData || []).forEach((o: any) => (map[o.id] = o));
        setOrders(map);
      }
      setLoading(false);
    };
    fetchData();
  }, [user]);

  const totals = useMemo(() => {
    const totalSales = commissions.reduce((s, r) => s + Number(r.order_amount || 0), 0);
    const totalCommission = commissions.reduce((s, r) => s + Number(r.commission_amount || 0), 0);
    const paid = commissions.filter((r) => r.status === 'paid').reduce((s, r) => s + Number(r.commission_amount || 0), 0);
    const pending = totalCommission - paid;
    return {
      totalSales, totalCommission, paid, pending,
      totalOrders: commissions.length,
    };
  }, [commissions]);

  const monthly = useMemo(() => {
    const map = new Map<string, { month: string; sales: number; commission: number }>();
    commissions.forEach((r) => {
      const key = format(new Date(r.created_at), 'yyyy-MM');
      const label = format(new Date(r.created_at), 'MMM yy');
      const rec = map.get(key) || { month: label, sales: 0, commission: 0 };
      rec.sales += Number(r.order_amount || 0);
      rec.commission += Number(r.commission_amount || 0);
      map.set(key, rec);
    });
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b)).map(([, v]) => v);
  }, [commissions]);

  const topMonths = useMemo(
    () => [...monthly].sort((a, b) => b.sales - a.sales).slice(0, 3),
    [monthly]
  );

  if (authLoading || cLoading || loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]"><Loading size="lg" /></div>
      </Layout>
    );
  }

  if (!isCollaborator) {
    return (
      <Layout>
        <div className="container mx-auto px-6 py-16 max-w-2xl text-center">
          <h1 className="text-3xl font-playfair font-bold mb-4">Collaborator Portal</h1>
          <p className="text-muted-foreground">
            This area is available to registered Vastra Luxe collaborators. If you believe you
            should have access, please contact our team so we can link a coupon to
            <span className="font-medium"> {user?.email}</span>.
          </p>
          {coupons.length > 0 && (
            <p className="mt-4 text-sm text-orange-600">
              You have a coupon assigned, but it is currently inactive.
            </p>
          )}
        </div>
      </Layout>
    );
  }

  const primary = activeCoupons[0];

  const cards = [
    { title: 'Total Sales', value: `₹${totals.totalSales.toLocaleString('en-IN')}`, icon: TrendingUp, color: 'text-blue-600' },
    { title: 'Total Orders', value: totals.totalOrders.toString(), icon: ShoppingCart, color: 'text-purple-600' },
    { title: 'Total Commission', value: `₹${totals.totalCommission.toLocaleString('en-IN')}`, icon: DollarSign, color: 'text-primary' },
    { title: 'Pending', value: `₹${totals.pending.toLocaleString('en-IN')}`, icon: Clock, color: 'text-orange-600' },
    { title: 'Paid', value: `₹${totals.paid.toLocaleString('en-IN')}`, icon: CheckCircle2, color: 'text-green-600' },
  ];

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-playfair font-bold mb-2">Collaborator Dashboard</h1>
          <p className="text-muted-foreground">Welcome{primary.collaborator_name ? `, ${primary.collaborator_name}` : ''}!</p>
        </div>

        {/* Overview cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
          {cards.map((c) => (
            <Card key={c.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-medium">{c.title}</CardTitle>
                <c.icon className={`h-4 w-4 ${c.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold">{c.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Coupons */}
        <Card className="mb-8">
          <CardHeader><CardTitle className="flex items-center gap-2"><Wallet className="h-5 w-5" />Your Coupons</CardTitle></CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              {coupons.map((c) => (
                <div key={c.id} className="border rounded-lg p-4 flex justify-between items-center">
                  <div>
                    <code className="bg-muted px-2 py-1 rounded font-mono font-bold text-base">{c.code}</code>
                    <div className="mt-2 text-sm text-muted-foreground">
                      Discount: <span className="font-medium text-foreground">{c.discount_percent}%</span> · Your commission: <span className="font-medium text-foreground">{Number(c.commission_percent)}%</span>
                    </div>
                  </div>
                  <Badge variant={c.is_active ? 'default' : 'secondary'}>{c.is_active ? 'Active' : 'Inactive'}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Charts */}
        <div className="grid gap-6 lg:grid-cols-2 mb-8">
          <Card>
            <CardHeader><CardTitle>Monthly Sales</CardTitle></CardHeader>
            <CardContent style={{ height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthly}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip formatter={(v: number) => `₹${v.toLocaleString('en-IN')}`} />
                  <Line type="monotone" dataKey="sales" stroke="hsl(var(--primary))" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Monthly Commission</CardTitle></CardHeader>
            <CardContent style={{ height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthly}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip formatter={(v: number) => `₹${v.toLocaleString('en-IN')}`} />
                  <Bar dataKey="commission" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Top months */}
        {topMonths.length > 0 && (
          <Card className="mb-8">
            <CardHeader><CardTitle>Top Performing Months</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {topMonths.map((m, i) => (
                  <div key={m.month} className="border rounded-lg p-4">
                    <div className="text-sm text-muted-foreground">#{i + 1} · {m.month}</div>
                    <div className="text-lg font-bold">₹{m.sales.toLocaleString('en-IN')}</div>
                    <div className="text-xs text-muted-foreground">Commission ₹{m.commission.toLocaleString('en-IN')}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Order history */}
        <Card>
          <CardHeader><CardTitle>Order History</CardTitle></CardHeader>
          <CardContent>
            {commissions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No orders yet. Share your coupon to start earning!</div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Value</TableHead>
                      <TableHead>Order Status</TableHead>
                      <TableHead>Commission</TableHead>
                      <TableHead>Payout</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {commissions.map((r) => {
                      const o = orders[r.order_id];
                      return (
                        <TableRow key={r.id}>
                          <TableCell className="font-mono text-xs">{o?.order_number || r.order_id.slice(0, 8)}</TableCell>
                          <TableCell>{format(new Date(r.created_at), 'dd MMM yyyy')}</TableCell>
                          <TableCell>{maskName(o?.customer_name)}</TableCell>
                          <TableCell>₹{Number(r.order_amount).toLocaleString('en-IN')}</TableCell>
                          <TableCell><Badge variant="outline">{o?.status || '—'}</Badge></TableCell>
                          <TableCell className="font-semibold">₹{Number(r.commission_amount).toLocaleString('en-IN')}</TableCell>
                          <TableCell>
                            <Badge variant={r.status === 'paid' ? 'default' : 'secondary'}>{r.status}</Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default CollaboratorDashboard;