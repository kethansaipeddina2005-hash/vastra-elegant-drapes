import ProductCard from "./ProductCard";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Product } from "@/types/product";
import { ProductGridSkeleton } from "./skeletons/ProductCardSkeleton";

const FeaturedSarees = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data: productsData, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(6);

      if (error) throw error;

      // Fetch category mappings for these products
      const productIds = (productsData || []).map(p => p.id);
      const { data: mappings } = await supabase
        .from('product_categories')
        .select('product_id, categories(name)')
        .in('product_id', productIds);

      // Create a map of product_id to category names
      const categoryMap = new Map<number, string[]>();
      (mappings || []).forEach((m: any) => {
        const existing = categoryMap.get(m.product_id) || [];
        if (m.categories?.name) {
          existing.push(m.categories.name);
        }
        categoryMap.set(m.product_id, existing);
      });

      const transformedProducts: Product[] = (productsData || []).map((product: any) => ({
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
        categoryNames: categoryMap.get(product.id) || [],
      }));

      setProducts(transformedProducts);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <section id="collections" className="py-20">
        <div className="container mx-auto px-4">
          <ProductGridSkeleton count={6} />
        </div>
      </section>
    );
  }

  return (
    <section id="collections" className="py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12 space-y-4">
          <h2 className="text-4xl md:text-5xl font-playfair font-bold text-foreground">
            Featured Collection
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Handpicked sarees that celebrate tradition and timeless beauty
          </p>
        </div>
        
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {products.map((saree) => (
            <ProductCard key={saree.id} {...saree} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedSarees;
