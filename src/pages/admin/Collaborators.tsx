import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { useAdmin } from '@/hooks/useAdmin';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loading } from '@/components/ui/loading';
import { Users, Download, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface Commission {
  id: string;
  order_id: string;
  coupon_id: string | null;
  coupon_code: string;
  collaborator_email: string;
  order_amount: number;
  commission_percent: number;
  commission_amount: number;
  status: string;
  created_at: string;
  paid_at: string | null;
}

const AdminCollaborators = () => {
  const navigate = useNavigate();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const [rows, setRows] = useState<Commission[]>([]);
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      toast.error('Unauthorized access');
      navigate('/');
    }
  }, [isAdmin, adminLoading, navigate]);

  const load = async () => {
    const [{ data: comms }, { data: cps }] = await Promise.all([
      supabase.from('collaborator_commissions').select('*').order('created_at', { ascending: false }),
      supabase.from('coupons').select('id, code, collaborator_name, collaborator_email, commission_percent, is_active').not('collaborator_email', 'is', null),
    ]);
    setRows((comms as Commission[]) || []);
    setCoupons(cps || []);
    setLoading(false);
  };

  useEffect(() => { if (isAdmin) load(); }, [isAdmin]);

  const grouped = useMemo(() => {
    const map = new Map<string, { email: string; orders: number; sales: number; total: number; paid: number; pending: number; }>();
    rows.forEach((r) => {
      const rec = map.get(r.collaborator_email) || { email: r.collaborator_email, orders: 0, sales: 0, total: 0, paid: 0, pending: 0 };
      rec.orders += 1;
      rec.sales += Number(r.order_amount);
      rec.total += Number(r.commission_amount);
      if (r.status === 'paid') rec.paid += Number(r.commission_amount);
      else rec.pending += Number(r.commission_amount);
      map.set(r.collaborator_email, rec);
    });
    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [rows]);

  const togglePaid = async (r: Commission) => {
    const newStatus = r.status === 'paid' ? 'pending' : 'paid';
    const { error } = await supabase
      .from('collaborator_commissions')
      .update({ status: newStatus, paid_at: newStatus === 'paid' ? new Date().toISOString() : null })
      .eq('id', r.id);
    if (error) { toast.error(error.message); return; }
    toast.success(`Marked as ${newStatus}`);
    load();
  };

  const markAllPaid = async (email: string) => {
    const ids = rows.filter((r) => r.collaborator_email === email && r.status !== 'paid').map((r) => r.id);
    if (!ids.length) return;
    const { error } = await supabase
      .from('collaborator_commissions')
      .update({ status: 'paid', paid_at: new Date().toISOString() })
      .in('id', ids);
    if (error) { toast.error(error.message); return; }
    toast.success(`Marked ${ids.length} commissions as paid`);
    load();
  };

  const exportCsv = () => {
    const header = ['Collaborator Email', 'Coupon', 'Order ID', 'Date', 'Order Amount', 'Commission %', 'Commission', 'Status', 'Paid At'];
    const lines = rows.map((r) => [
      r.collaborator_email, r.coupon_code, r.order_id,
      format(new Date(r.created_at), 'yyyy-MM-dd'),
      r.order_amount, r.commission_percent, r.commission_amount,
      r.status, r.paid_at ? format(new Date(r.paid_at), 'yyyy-MM-dd') : '',
    ].join(','));
    const csv = [header.join(','), ...lines].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `collaborator-report-${format(new Date(), 'yyyyMMdd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (adminLoading || loading) {
    return <Layout><div className="flex items-center justify-center min-h-[60vh]"><Loading size="lg" /></div></Layout>;
  }
  if (!isAdmin) return null;

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-wrap justify-between items-center gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Collaborators</h1>
            <p className="text-muted-foreground">Manage collaborator commissions and payouts</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={exportCsv}><Download className="h-4 w-4 mr-2" />Export CSV</Button>
            <Button variant="outline" onClick={() => navigate('/admin/coupons')}>Manage Coupons</Button>
          </div>
        </div>

        <Card className="mb-8">
          <CardHeader><CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" />Collaborators ({coupons.length})</CardTitle></CardHeader>
          <CardContent>
            {coupons.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No collaborators yet. Add a collaborator email while creating a coupon.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Coupon</TableHead>
                      <TableHead>Commission %</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Orders</TableHead>
                      <TableHead>Sales</TableHead>
                      <TableHead>Total Comm.</TableHead>
                      <TableHead>Pending</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {coupons.map((c: any) => {
                      const g = grouped.find((x) => x.email === c.collaborator_email);
                      return (
                        <TableRow key={c.id}>
                          <TableCell>{c.collaborator_name || '—'}</TableCell>
                          <TableCell className="text-xs">{c.collaborator_email}</TableCell>
                          <TableCell><code className="bg-muted px-2 py-1 rounded font-mono">{c.code}</code></TableCell>
                          <TableCell>{Number(c.commission_percent)}%</TableCell>
                          <TableCell><Badge variant={c.is_active ? 'default' : 'secondary'}>{c.is_active ? 'Active' : 'Inactive'}</Badge></TableCell>
                          <TableCell>{g?.orders || 0}</TableCell>
                          <TableCell>₹{(g?.sales || 0).toLocaleString('en-IN')}</TableCell>
                          <TableCell className="font-semibold">₹{(g?.total || 0).toLocaleString('en-IN')}</TableCell>
                          <TableCell className="text-orange-600">₹{(g?.pending || 0).toLocaleString('en-IN')}</TableCell>
                          <TableCell>
                            {g && g.pending > 0 && (
                              <Button size="sm" variant="outline" onClick={() => markAllPaid(c.collaborator_email)}>
                                <CheckCircle2 className="h-4 w-4 mr-1" />Pay all
                              </Button>
                            )}
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

        <Card>
          <CardHeader><CardTitle>All Commissions ({rows.length})</CardTitle></CardHeader>
          <CardContent>
            {rows.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No commissions recorded yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Collaborator</TableHead>
                      <TableHead>Coupon</TableHead>
                      <TableHead>Order Amount</TableHead>
                      <TableHead>%</TableHead>
                      <TableHead>Commission</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell>{format(new Date(r.created_at), 'dd MMM yyyy')}</TableCell>
                        <TableCell className="text-xs">{r.collaborator_email}</TableCell>
                        <TableCell><code className="bg-muted px-2 py-1 rounded font-mono text-xs">{r.coupon_code}</code></TableCell>
                        <TableCell>₹{Number(r.order_amount).toLocaleString('en-IN')}</TableCell>
                        <TableCell>{Number(r.commission_percent)}%</TableCell>
                        <TableCell className="font-semibold">₹{Number(r.commission_amount).toLocaleString('en-IN')}</TableCell>
                        <TableCell><Badge variant={r.status === 'paid' ? 'default' : 'secondary'}>{r.status}</Badge></TableCell>
                        <TableCell>
                          <Button size="sm" variant="outline" onClick={() => togglePaid(r)}>
                            {r.status === 'paid' ? 'Mark Pending' : 'Mark Paid'}
                          </Button>
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
    </Layout>
  );
};

export default AdminCollaborators;