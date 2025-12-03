import { useState, useMemo, useEffect } from 'react';
import { Product, Filter, SortOption } from '@/types/product';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useProducts = () => {
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [maxPrice, setMaxPrice] = useState(50000);
  const [filters, setFilters] = useState<Filter>({
    priceRange: [0, 50000],
    fabricTypes: [],
    colors: [],
    occasions: [],
    regions: [],
  });
  const [sortBy, setSortBy] = useState<SortOption>('none');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform database products to match Product type
      const transformedProducts: Product[] = (data || []).map((product) => ({
        id: product.id,
        name: product.name,
        price: Number(product.price),
        description: product.description || '',
        image: product.images?.[0] || '',
        images: product.images || [],
        fabricType: product.fabric_type || '',
        color: product.color || '',
        occasion: product.occasion || '',
        region: product.region || '',
        stockQuantity: product.stock_quantity || 0,
        isNew: product.is_new || false,
        rating: Number(product.rating) || 0,
        reviews: product.reviews || 0,
      }));
      const max = transformedProducts.length > 0 
        ? Math.max(50000, ...transformedProducts.map(p => p.price))
        : 50000;

      setAllProducts(transformedProducts);
      setMaxPrice(max);
      // Initialize price range to include all products on first load
      setFilters(prev => {
        const [, prevMax] = prev.priceRange;
        return prevMax < max ? { ...prev, priceRange: [0, max] } : prev;
      });
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };
  const filteredProducts = useMemo(() => {
    let filtered = [...allProducts];

    // Apply search
    if (searchQuery) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply price filter
    filtered = filtered.filter(
      product => product.price >= filters.priceRange[0] && product.price <= filters.priceRange[1]
    );

    // Apply fabric type filter
    if (filters.fabricTypes.length > 0) {
      filtered = filtered.filter(product =>
        filters.fabricTypes.includes(product.fabricType)
      );
    }

    // Apply color filter
    if (filters.colors.length > 0) {
      filtered = filtered.filter(product =>
        filters.colors.includes(product.color)
      );
    }

    // Apply occasion filter
    if (filters.occasions.length > 0) {
      filtered = filtered.filter(product =>
        filters.occasions.includes(product.occasion)
      );
    }

    // Apply region filter
    if (filters.regions.length > 0) {
      filtered = filtered.filter(product =>
        filters.regions.includes(product.region)
      );
    }

    // Apply sorting
    switch (sortBy) {
      case 'price-asc':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'popularity':
        filtered.sort((a, b) => (b.reviews || 0) - (a.reviews || 0));
        break;
      case 'newest':
        filtered.sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0));
        break;
      case 'none':
      default:
        // No sorting, keep original order from database
        break;
    }

    return filtered;
  }, [allProducts, filters, sortBy, searchQuery]);

  return {
    products: filteredProducts,
    filters,
    setFilters,
    sortBy,
    setSortBy,
    searchQuery,
    setSearchQuery,
    loading,
    refetch: fetchProducts,
    maxPrice,
  };
};
