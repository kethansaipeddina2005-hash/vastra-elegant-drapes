import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { useAdmin } from '@/hooks/useAdmin';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Loading } from '@/components/ui/loading';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface Banner {
  id: string;
  title: string;
  subtitle: string | null;
  image_url: string;
  link_url: string | null;
  display_order: number;
  is_active: boolean;
}

const AdminBanners = () => {
  const navigate = useNavigate();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    link_url: '',
    display_order: '0',
    is_active: true,
  });

  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      toast.error('Unauthorized access');
      navigate('/');
    }
  }, [isAdmin, adminLoading, navigate]);

  useEffect(() => {
    if (isAdmin) {
      fetchBanners();
    }
  }, [isAdmin]);

  const fetchBanners = async () => {
    try {
      const { data, error } = await supabase
        .from('banners')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;
      setBanners(data || []);
    } catch (error) {
      console.error('Error fetching banners:', error);
      toast.error('Failed to load banners');
    } finally {
      setLoading(false);
    }
  };

  const uploadImage = async (): Promise<string> => {
    if (!imageFile) throw new Error('No image file selected');

    try {
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `banner-${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = fileName;

      console.log('Uploading banner:', fileName);

      const { error: uploadError, data } = await supabase.storage
        .from('banners')
        .upload(filePath, imageFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw new Error(`Failed to upload banner: ${uploadError.message}`);
      }

      const { data: { publicUrl } } = supabase.storage
        .from('banners')
        .getPublicUrl(filePath);

      console.log('Banner uploaded successfully:', publicUrl);
      return publicUrl;
    } catch (error) {
      console.error('Error uploading banner:', error);
      throw error;
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setImageFile(file);
    
    if (file) {
      const preview = URL.createObjectURL(file);
      setImagePreview(preview);
    } else {
      setImagePreview('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);

    try {
      let imageUrl = editingBanner?.image_url || '';

      if (imageFile) {
        imageUrl = await uploadImage();
      } else if (!editingBanner) {
        toast.error('Please select an image');
        return;
      }

      const bannerData = {
        ...formData,
        display_order: parseInt(formData.display_order),
        image_url: imageUrl,
      };

      if (editingBanner) {
        const { error } = await supabase
          .from('banners')
          .update(bannerData)
          .eq('id', editingBanner.id);

        if (error) throw error;
        toast.success('Banner updated successfully');
      } else {
        const { error } = await supabase.from('banners').insert([bannerData]);

        if (error) throw error;
        toast.success('Banner created successfully');
      }

      setIsDialogOpen(false);
      resetForm();
      fetchBanners();
    } catch (error: any) {
      console.error('Error saving banner:', error);
      toast.error(error.message || 'Failed to save banner');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this banner?')) return;

    try {
      const { error } = await supabase.from('banners').delete().eq('id', id);

      if (error) throw error;
      toast.success('Banner deleted successfully');
      fetchBanners();
    } catch (error) {
      console.error('Error deleting banner:', error);
      toast.error('Failed to delete banner');
    }
  };

  const handleEdit = (banner: Banner) => {
    setEditingBanner(banner);
    setFormData({
      title: banner.title,
      subtitle: banner.subtitle || '',
      link_url: banner.link_url || '',
      display_order: banner.display_order.toString(),
      is_active: banner.is_active,
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setEditingBanner(null);
    setFormData({
      title: '',
      subtitle: '',
      link_url: '',
      display_order: '0',
      is_active: true,
    });
    setImageFile(null);
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
      setImagePreview('');
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
            <h1 className="text-4xl font-bold mb-2">Banner Management</h1>
            <p className="text-muted-foreground">Manage homepage banners and promotions</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Banner
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingBanner ? 'Edit Banner' : 'Add New Banner'}</DialogTitle>
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
                  <Label htmlFor="subtitle">Subtitle</Label>
                  <Input
                    id="subtitle"
                    value={formData.subtitle}
                    onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="link_url">Link URL</Label>
                  <Input
                    id="link_url"
                    type="url"
                    value={formData.link_url}
                    onChange={(e) => setFormData({ ...formData, link_url: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
                <div>
                  <Label htmlFor="display_order">Display Order</Label>
                  <Input
                    id="display_order"
                    type="number"
                    value={formData.display_order}
                    onChange={(e) => setFormData({ ...formData, display_order: e.target.value })}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                  <Label htmlFor="is_active">Active</Label>
                </div>
                <div>
                  <Label htmlFor="image">Banner Image {!editingBanner && '(Required)'}</Label>
                  <Input
                    id="image"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    required={!editingBanner}
                    className="mb-2"
                  />
                  <p className="text-sm text-muted-foreground mb-2">
                    Upload banner image (JPG, PNG, WEBP) - recommended size: 1920x600px
                  </p>
                  
                  {/* Image Preview */}
                  {imagePreview && (
                    <div className="mb-2">
                      <p className="text-sm font-medium mb-2">New image preview:</p>
                      <img 
                        src={imagePreview} 
                        alt="Banner preview"
                        className="w-full h-32 object-cover rounded border"
                      />
                    </div>
                  )}
                  
                  {/* Current Image */}
                  {editingBanner && !imagePreview && (
                    <div className="mb-2">
                      <p className="text-sm font-medium mb-2">Current image:</p>
                      <img 
                        src={editingBanner.image_url} 
                        alt={editingBanner.title}
                        className="w-full h-32 object-cover rounded border"
                      />
                      <p className="text-sm text-muted-foreground mt-1">
                        Upload a new image to replace this one
                      </p>
                    </div>
                  )}
                </div>
                <Button type="submit" disabled={uploading} className="w-full">
                  {uploading ? <Loading size="sm" /> : editingBanner ? 'Update Banner' : 'Create Banner'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Banners ({banners.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Preview</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Subtitle</TableHead>
                  <TableHead>Order</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {banners.map((banner) => (
                  <TableRow key={banner.id}>
                    <TableCell>
                      <img
                        src={banner.image_url}
                        alt={banner.title}
                        className="w-32 h-20 object-cover rounded"
                      />
                    </TableCell>
                    <TableCell className="font-medium">{banner.title}</TableCell>
                    <TableCell>{banner.subtitle || '-'}</TableCell>
                    <TableCell>{banner.display_order}</TableCell>
                    <TableCell>
                      <span className={banner.is_active ? 'text-green-600' : 'text-gray-400'}>
                        {banner.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => handleEdit(banner)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(banner.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
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

export default AdminBanners;
