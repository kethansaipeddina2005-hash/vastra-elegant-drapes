import { useRecentlyViewed } from '@/contexts/RecentlyViewedContext';
import ProductCard from './ProductCard';

interface RecentlyViewedProductsProps {
  excludeProductId?: number;
  maxItems?: number;
}

export const RecentlyViewedProducts = ({ excludeProductId, maxItems = 4 }: RecentlyViewedProductsProps) => {
  const { recentlyViewed } = useRecentlyViewed();

  const filteredProducts = recentlyViewed
    .filter((p) => p.id !== excludeProductId)
    .slice(0, maxItems);

  if (filteredProducts.length === 0) {
    return null;
  }

  return (
    <section className="py-12">
      <div className="text-center mb-8 space-y-2">
        <h2 className="text-2xl md:text-3xl font-playfair font-bold text-foreground">
          Recently Viewed
        </h2>
        <p className="text-muted-foreground">
          Continue where you left off
        </p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {filteredProducts.map((product) => (
          <ProductCard key={product.id} {...product} />
        ))}
      </div>
    </section>
  );
};
