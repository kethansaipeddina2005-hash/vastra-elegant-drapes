import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { useAdmin } from '@/hooks/useAdmin';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Loading } from '@/components/ui/loading';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface PopupAd {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  link_url: string | null;
  link_label: string | null;
  delay_seconds: number;
  auto_close_seconds: number | null;
  display_order: number;
  is_active: boolean;
}

const emptyForm = {
  title: '',
  description: '',
  image_url: '',
  link_url: '',
  link_label: '',
  delay_seconds: '3',
  auto_close_seconds: '',
  display_order: '0',
  is_active: true,
};

const AdminPopupAds = () => {
  const navigate = useNavigate();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const [ads, setAds] = useState<PopupAd[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editing, setEditing] = useState<PopupAd | null>(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState(emptyForm);

  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      toast.error('Unauthorized access');
      navigate('/');
    }
  }, [isAdmin, adminLoading, navigate]);

  useEffect(() => {
    if (isAdmin) fetchAds();
  }, [isAdmin]);

  const fetchAds = async () => {
    try {
      const { data, error } = await supabase
        .from('popup_ads')
        .select('*')
        .order('display_order', { ascending: true });
      if (error) throw error;
      setAds(data || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load popup ads');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        title: formData.title,
        description: formData.description || null,
        image_url: formData.image_url || null,
        link_url: formData.link_url || null,
        link_label: formData.link_label || null,
        delay_seconds: parseInt(formData.delay_seconds || '0', 10),
        auto_close_seconds: formData.auto_close_seconds
          ? parseInt(formData.auto_close_seconds, 10)
          : null,
        display_order: parseInt(formData.display_order || '0', 10),
        is_active: formData.is_active,
      };

      if (editing) {
        const { error } = await supabase
          .from('popup_ads')
          .update(payload)
          .eq('id', editing.id);
        if (error) throw error;
        toast.success('Popup ad updated');
      } else {
        const { error } = await supabase.from('popup_ads').insert([payload]);
        if (error) throw error;
        toast.success('Popup ad created');
      }
      setIsDialogOpen(false);
      resetForm();
      fetchAds();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to save popup ad');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this popup ad?')) return;
    try {
      const { error } = await supabase.from('popup_ads').delete().eq('id', id);
      if (error) throw error;
      toast.success('Popup ad deleted');
      fetchAds();
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete');
    }
  };

  const handleEdit = (ad: PopupAd) => {
    setEditing(ad);
    setFormData({
      title: ad.title,
      description: ad.description || '',
      image_url: ad.image_url || '',
      link_url: ad.link_url || '',
      link_label: ad.link_label || '',
      delay_seconds: String(ad.delay_seconds ?? 3),
      auto_close_seconds: ad.auto_close_seconds != null ? String(ad.auto_close_seconds) : '',
      display_order: String(ad.display_order ?? 0),
      is_active: ad.is_active,
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setEditing(null);
    setFormData(emptyForm);
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
            <h1 className="text-4xl font-bold mb-2">Popup Ads</h1>
            <p className="text-muted-foreground">
              Schedule offers and announcements that pop up for visitors.
            </p>
          </div>
          <Dialog
            open={isDialogOpen}
            onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) resetForm();
            }}
          >
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Popup Ad
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editing ? 'Edit Popup Ad' : 'Add Popup Ad'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="image_url">Image URL (optional)</Label>
                  <Input
                    id="image_url"
                    value={formData.image_url}
                    onChange={(e) =>
                      setFormData({ ...formData, image_url: e.target.value })
                    }
                    placeholder="https://..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="link_url">Link URL (optional)</Label>
                    <Input
                      id="link_url"
                      value={formData.link_url}
                      onChange={(e) =>
                        setFormData({ ...formData, link_url: e.target.value })
                      }
                      placeholder="/collections"
                    />
                  </div>
                  <div>
                    <Label htmlFor="link_label">Link Button Label</Label>
                    <Input
                      id="link_label"
                      value={formData.link_label}
                      onChange={(e) =>
                        setFormData({ ...formData, link_label: e.target.value })
                      }
                      placeholder="Shop Now"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="delay_seconds">Show after (seconds)</Label>
                    <Input
                      id="delay_seconds"
                      type="number"
                      min={0}
                      value={formData.delay_seconds}
                      onChange={(e) =>
                        setFormData({ ...formData, delay_seconds: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="auto_close_seconds">Auto close after (seconds)</Label>
                    <Input
                      id="auto_close_seconds"
                      type="number"
                      min={0}
                      placeholder="Leave empty to keep open"
                      value={formData.auto_close_seconds}
                      onChange={(e) =>
                        setFormData({ ...formData, auto_close_seconds: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="display_order">Display Order</Label>
                    <Input
                      id="display_order"
                      type="number"
                      value={formData.display_order}
                      onChange={(e) =>
                        setFormData({ ...formData, display_order: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, is_active: checked })
                    }
                  />
                  <Label htmlFor="is_active">Active</Label>
                </div>
                <Button type="submit" disabled={saving} className="w-full">
                  {saving ? <Loading size="sm" /> : editing ? 'Update Popup Ad' : 'Create Popup Ad'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Popup Ads ({ads.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Delay (s)</TableHead>
                  <TableHead>Auto close (s)</TableHead>
                  <TableHead>Order</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ads.map((ad) => (
                  <TableRow key={ad.id}>
                    <TableCell className="font-medium">{ad.title}</TableCell>
                    <TableCell>{ad.delay_seconds}</TableCell>
                    <TableCell>{ad.auto_close_seconds ?? '—'}</TableCell>
                    <TableCell>{ad.display_order}</TableCell>
                    <TableCell>
                      <span className={ad.is_active ? 'text-green-600' : 'text-gray-400'}>
                        {ad.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => handleEdit(ad)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(ad.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {ads.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      No popup ads yet. Create one to start showing offers to visitors.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default AdminPopupAds;