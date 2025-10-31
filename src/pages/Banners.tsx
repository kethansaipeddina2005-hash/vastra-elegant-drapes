import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Image, ArrowLeft, Plus, Edit, Trash2, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';

interface Banner {
  id: string;
  title: string;
  subtitle: string;
  image_url: string;
  link_url: string;
  is_active: boolean;
  display_order: number;
  created_at: string;
}

const Banners = () => {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBanners();
  }, []);

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
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/admin/dashboard">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div className="flex items-center gap-2">
                <Image className="h-8 w-8 text-pink-600" />
                <h1 className="text-3xl font-bold text-gray-900">Banner Management</h1>
              </div>
            </div>
            <Button className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Add Banner
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {loading ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Loading banners...</p>
            </div>
          ) : banners.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Image className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500">No banners found. Add your first banner to get started.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {banners.map((banner) => (
                <Card key={banner.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-xl">{banner.title}</CardTitle>
                        <p className="text-sm text-gray-500 mt-1">{banner.subtitle}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={banner.is_active ? 'bg-green-500' : 'bg-gray-500'}>
                          {banner.is_active ? 'ACTIVE' : 'INACTIVE'}
                        </Badge>
                        <Badge variant="outline">Order: {banner.display_order}</Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        {banner.image_url && (
                          <img
                            src={banner.image_url}
                            alt={banner.title}
                            className="w-full h-32 object-cover rounded-lg"
                          />
                        )}
                      </div>
                      <div className="space-y-2">
                        <div>
                          <p className="text-sm text-gray-600">Link URL</p>
                          <p className="text-sm font-medium text-blue-600 truncate">
                            {banner.link_url || 'No link'}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Created</p>
                          <p className="text-sm font-medium">
                            {new Date(banner.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Button variant="outline" size="sm" className="flex items-center gap-2">
                        <Eye className="h-4 w-4" />
                        Preview
                      </Button>
                      <Button variant="outline" size="sm" className="flex items-center gap-2">
                        <Edit className="h-4 w-4" />
                        Edit
                      </Button>
                      <Button variant="destructive" size="sm" className="flex items-center gap-2">
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Banners;
