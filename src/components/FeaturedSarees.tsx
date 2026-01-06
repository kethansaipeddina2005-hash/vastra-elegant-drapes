import ProductCard from "./ProductCard";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Product } from "@/types/product";
import { Loading } from "./ui/loading";

const FeaturedSarees = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(6);

      if (error) throw error;

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

      setProducts(transformedProducts);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <section id="collections" className="py-20 px-6">
        <div className="container mx-auto flex justify-center">
          <Loading />
        </div>
      </section>
    );
  }

  return (
    <section id="collections" className="py-20 px-4 md:px-6">
      <div className="container mx-auto">
        <div className="text-center mb-12 space-y-4">
          <h2 className="text-4xl md:text-5xl font-playfair font-bold text-foreground">
            Featured Collection
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Handpicked sarees that celebrate tradition and timeless beauty
          </p>
        </div>
        
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8 justify-items-center">
          {products.map((saree) => (
            <ProductCard key={saree.id} {...saree} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedSarees;
