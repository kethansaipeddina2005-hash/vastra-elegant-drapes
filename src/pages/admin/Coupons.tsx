import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { useAdmin } from '@/hooks/useAdmin';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Loading } from '@/components/ui/loading';
import { Plus, Edit, Trash2, Tag, Calendar, Percent, Users } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface Coupon {
  id: string;
  code: string;
  discount_percent: number;
  min_amount: number;
  expiry_date: string;
  is_active: boolean;
  created_at: string;
  usage_limit_per_user: number | null;
  collaborator_name?: string | null;
  collaborator_email?: string | null;
  commission_percent?: number | null;
}

const AdminCoupons = () => {
  const navigate = useNavigate();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [redemptionsOpen, setRedemptionsOpen] = useState(false);
  const [redemptionsCoupon, setRedemptionsCoupon] = useState<Coupon | null>(null);
  const [redemptions, setRedemptions] = useState<
    Array<{
      user_id: string | null;
      customer_name: string | null;
      customer_email: string | null;
      count: number;
      total_discount: number;
      last_used: string;
    }>
  >([]);
  const [redemptionsLoading, setRedemptionsLoading] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    discount_percent: '',
    min_amount: '',
    expiry_date: '',
    is_active: true,
    usage_limit_per_user: '' as string, // '' = unlimited
    collaborator_name: '',
    collaborator_email: '',
    commission_percent: '10',
  });

  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      toast.error('Unauthorized access');
      navigate('/');
    }
  }, [isAdmin, adminLoading, navigate]);

  useEffect(() => {
    if (isAdmin) {
      fetchCoupons();
    }
  }, [isAdmin]);

  const fetchCoupons = async () => {
    try {
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setCoupons(data || []);
    } catch (error) {
      console.error('Error fetching coupons:', error);
      toast.error('Failed to load coupons');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const couponData = {
        code: formData.code.toUpperCase().trim(),
        discount_percent: parseInt(formData.discount_percent),
        min_amount: parseFloat(formData.min_amount) || 0,
        expiry_date: new Date(formData.expiry_date).toISOString(),
        is_active: formData.is_active,
        usage_limit_per_user:
          formData.usage_limit_per_user === '' || formData.usage_limit_per_user === '0'
            ? null
            : parseInt(formData.usage_limit_per_user),
        collaborator_name: formData.collaborator_name.trim() || null,
        collaborator_email: formData.collaborator_email.trim().toLowerCase() || null,
        commission_percent: formData.collaborator_email.trim()
          ? parseFloat(formData.commission_percent || '10')
          : 0,
      };

      if (couponData.collaborator_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(couponData.collaborator_email)) {
        toast.error('Please enter a valid collaborator email');
        return;
      }

      if (editingCoupon) {
        const { error } = await supabase
          .from('coupons')
          .update(couponData)
          .eq('id', editingCoupon.id);

        if (error) throw error;
        toast.success('Coupon updated successfully');
      } else {
        const { error } = await supabase.from('coupons').insert([couponData]);

        if (error) {
          if (error.code === '23505') {
            toast.error('Coupon code already exists');
            return;
          }
          throw error;
        }
        toast.success('Coupon created successfully');
      }

      setIsDialogOpen(false);
      resetForm();
      fetchCoupons();
    } catch (error: any) {
      console.error('Error saving coupon:', error);
      toast.error(error.message || 'Failed to save coupon');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this coupon?')) return;

    try {
      const { error } = await supabase.from('coupons').delete().eq('id', id);

      if (error) throw error;
      toast.success('Coupon deleted successfully');
      fetchCoupons();
    } catch (error) {
      console.error('Error deleting coupon:', error);
      toast.error('Failed to delete coupon');
    }
  };

  const handleToggleActive = async (coupon: Coupon) => {
    try {
      const { error } = await supabase
        .from('coupons')
        .update({ is_active: !coupon.is_active })
        .eq('id', coupon.id);

      if (error) throw error;
      toast.success(`Coupon ${!coupon.is_active ? 'activated' : 'deactivated'}`);
      fetchCoupons();
    } catch (error) {
      console.error('Error toggling coupon:', error);
      toast.error('Failed to update coupon');
    }
  };

  const handleEdit = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code,
      discount_percent: coupon.discount_percent.toString(),
      min_amount: coupon.min_amount?.toString() || '0',
      expiry_date: format(new Date(coupon.expiry_date), 'yyyy-MM-dd'),
      is_active: coupon.is_active,
      usage_limit_per_user: coupon.usage_limit_per_user ? String(coupon.usage_limit_per_user) : '',
      collaborator_name: coupon.collaborator_name || '',
      collaborator_email: coupon.collaborator_email || '',
      commission_percent: coupon.commission_percent != null ? String(coupon.commission_percent) : '10',
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setEditingCoupon(null);
    setFormData({
      code: '',
      discount_percent: '',
      min_amount: '',
      expiry_date: '',
      is_active: true,
      usage_limit_per_user: '',
      collaborator_name: '',
      collaborator_email: '',
      commission_percent: '10',
    });
  };

  const isExpired = (date: string) => new Date(date) < new Date();

  const handleViewRedemptions = async (coupon: Coupon) => {
    setRedemptionsCoupon(coupon);
    setRedemptionsOpen(true);
    setRedemptionsLoading(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('user_id, customer_name, customer_email, final_amount, total_amount, discount_percent, created_at, coupon_code')
        .ilike('coupon_code', coupon.code)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const grouped = new Map<string, typeof redemptions[number]>();
      (data || []).forEach((o: any) => {
        const key = o.user_id || `guest:${o.customer_email || 'unknown'}`;
        const discount =
          (Number(o.total_amount) || 0) - (Number(o.final_amount) || 0);
        const existing = grouped.get(key);
        if (existing) {
          existing.count += 1;
          existing.total_discount += discount;
          if (new Date(o.created_at) > new Date(existing.last_used)) {
            existing.last_used = o.created_at;
          }
        } else {
          grouped.set(key, {
            user_id: o.user_id,
            customer_name: o.customer_name,
            customer_email: o.customer_email,
            count: 1,
            total_discount: discount,
            last_used: o.created_at,
          });
        }
      });

      setRedemptions(
        Array.from(grouped.values()).sort((a, b) => b.count - a.count)
      );
    } catch (e) {
      console.error('Error loading redemptions:', e);
      toast.error('Failed to load redemptions');
    } finally {
      setRedemptionsLoading(false);
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
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Coupon Management</h1>
            <p className="text-muted-foreground">Create and manage discount coupons</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/admin/collaborators')}>
              <Users className="mr-2 h-4 w-4" />
              Collaborators
            </Button>
          <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Coupon
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingCoupon ? 'Edit Coupon' : 'Create New Coupon'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="code">Coupon Code</Label>
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder="e.g., SAVE20"
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1">Code will be converted to uppercase</p>
                </div>
                <div>
                  <Label htmlFor="discount">Discount Percentage</Label>
                  <div className="relative">
                    <Input
                      id="discount"
                      type="number"
                      min="1"
                      max="100"
                      value={formData.discount_percent}
                      onChange={(e) => setFormData({ ...formData, discount_percent: e.target.value })}
                      placeholder="e.g., 20"
                      required
                    />
                    <Percent className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
                <div>
                  <Label htmlFor="minAmount">Minimum Order Amount (₹)</Label>
                  <Input
                    id="minAmount"
                    type="number"
                    min="0"
                    value={formData.min_amount}
                    onChange={(e) => setFormData({ ...formData, min_amount: e.target.value })}
                    placeholder="e.g., 1000 (0 for no minimum)"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Leave 0 for no minimum order requirement</p>
                </div>
                <div>
                  <Label htmlFor="expiry">Expiry Date</Label>
                  <Input
                    id="expiry"
                    type="date"
                    value={formData.expiry_date}
                    onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                    min={format(new Date(), 'yyyy-MM-dd')}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="usageLimit">Usage Limit Per User</Label>
                  <div className="flex gap-2">
                    <Input
                      id="usageLimit"
                      type="number"
                      min="1"
                      value={formData.usage_limit_per_user}
                      onChange={(e) =>
                        setFormData({ ...formData, usage_limit_per_user: e.target.value })
                      }
                      placeholder="Unlimited"
                      disabled={formData.usage_limit_per_user === ''}
                    />
                    <Button
                      type="button"
                      variant={formData.usage_limit_per_user === '' ? 'default' : 'outline'}
                      onClick={() =>
                        setFormData({
                          ...formData,
                          usage_limit_per_user: formData.usage_limit_per_user === '' ? '1' : '',
                        })
                      }
                    >
                      {formData.usage_limit_per_user === '' ? 'Unlimited' : 'Set Unlimited'}
                    </Button>
                  </div>
                  <div className="flex gap-2 mt-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setFormData({ ...formData, usage_limit_per_user: '1' })}
                    >
                      First purchase only (1)
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setFormData({ ...formData, usage_limit_per_user: '3' })}
                    >
                      Up to 3 uses
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Leave Unlimited to allow this customer to redeem the coupon any number of times.
                  </p>
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="active">Active</Label>
                  <Switch
                    id="active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                </div>
                <div className="border-t pt-4 space-y-3">
                  <div>
                    <Label className="text-sm font-semibold">Collaborator (optional)</Label>
                    <p className="text-xs text-muted-foreground">
                      Adding a collaborator email turns this coupon into a referral coupon and unlocks the Collaborator Dashboard for that user.
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="collabName">Collaborator Name</Label>
                    <Input
                      id="collabName"
                      value={formData.collaborator_name}
                      onChange={(e) => setFormData({ ...formData, collaborator_name: e.target.value })}
                      placeholder="e.g., Priya Sharma"
                    />
                  </div>
                  <div>
                    <Label htmlFor="collabEmail">Collaborator Email</Label>
                    <Input
                      id="collabEmail"
                      type="email"
                      value={formData.collaborator_email}
                      onChange={(e) => setFormData({ ...formData, collaborator_email: e.target.value })}
                      placeholder="collaborator@example.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="commission">Commission Percentage</Label>
                    <div className="relative">
                      <Input
                        id="commission"
                        type="number"
                        min="0"
                        max="100"
                        step="0.5"
                        value={formData.commission_percent}
                        onChange={(e) => setFormData({ ...formData, commission_percent: e.target.value })}
                        placeholder="10"
                        disabled={!formData.collaborator_email.trim()}
                      />
                      <Percent className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                </div>
                <Button type="submit" className="w-full">
                  {editingCoupon ? 'Update Coupon' : 'Create Coupon'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Tag className="h-5 w-5" />
              Coupons ({coupons.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {coupons.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No coupons created yet. Click "Add Coupon" to create one.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Discount</TableHead>
                    <TableHead>Collaborator</TableHead>
                    <TableHead>Min. Order</TableHead>
                    <TableHead>Per-User Limit</TableHead>
                    <TableHead>Expiry Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {coupons.map((coupon) => (
                    <TableRow key={coupon.id}>
                      <TableCell>
                        <code className="bg-muted px-2 py-1 rounded font-mono font-bold">
                          {coupon.code}
                        </code>
                      </TableCell>
                      <TableCell>
                        <span className="font-semibold text-primary">{coupon.discount_percent}%</span>
                      </TableCell>
                      <TableCell>
                        {coupon.collaborator_email ? (
                          <div className="text-xs">
                            <div className="font-medium">{coupon.collaborator_name || coupon.collaborator_email}</div>
                            <div className="text-muted-foreground">{Number(coupon.commission_percent || 0)}% commission</div>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {coupon.min_amount > 0 ? `₹${coupon.min_amount.toLocaleString()}` : 'No minimum'}
                      </TableCell>
                      <TableCell>
                        {coupon.usage_limit_per_user
                          ? coupon.usage_limit_per_user === 1
                            ? 'First purchase only'
                            : `${coupon.usage_limit_per_user} times`
                          : 'Unlimited'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {format(new Date(coupon.expiry_date), 'dd MMM yyyy')}
                          {isExpired(coupon.expiry_date) && (
                            <Badge variant="destructive" className="text-xs">Expired</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={coupon.is_active}
                          onCheckedChange={() => handleToggleActive(coupon)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => handleViewRedemptions(coupon)}>
                            <Users className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleEdit(coupon)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(coupon.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Dialog open={redemptionsOpen} onOpenChange={setRedemptionsOpen}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>
                Redemptions — {redemptionsCoupon?.code}
              </DialogTitle>
            </DialogHeader>
            {redemptionsLoading ? (
              <div className="py-8 flex justify-center">
                <Loading size="md" />
              </div>
            ) : redemptions.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                No customers have used this coupon yet.
              </div>
            ) : (
              <div className="max-h-[60vh] overflow-auto">
                <div className="mb-4 flex gap-4 text-sm">
                  <Badge variant="secondary">
                    {redemptions.length} unique customer{redemptions.length !== 1 ? 's' : ''}
                  </Badge>
                  <Badge variant="secondary">
                    {redemptions.reduce((s, r) => s + r.count, 0)} total redemptions
                  </Badge>
                  <Badge variant="secondary">
                    ₹{redemptions.reduce((s, r) => s + r.total_discount, 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })} total discount
                  </Badge>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead className="text-center">Times Used</TableHead>
                      <TableHead>Total Discount</TableHead>
                      <TableHead>Last Used</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {redemptions.map((r, i) => (
                      <TableRow key={`${r.user_id || r.customer_email}-${i}`}>
                        <TableCell>
                          {r.customer_name || 'Guest'}
                          {!r.user_id && (
                            <Badge variant="outline" className="ml-2 text-xs">Guest</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {r.customer_email || '—'}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge>{r.count}</Badge>
                        </TableCell>
                        <TableCell>
                          ₹{r.total_discount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                        </TableCell>
                        <TableCell className="text-sm">
                          {format(new Date(r.last_used), 'dd MMM yyyy')}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default AdminCoupons;
