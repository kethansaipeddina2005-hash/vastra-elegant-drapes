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
    <section className="py-6">
      <h2 className="text-lg md:text-xl font-playfair font-bold text-foreground mb-4">
        Recently Viewed
      </h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {filteredProducts.map((product) => (
          <ProductCard key={product.id} {...product} />
        ))}
      </div>
    </section>
  );
};
