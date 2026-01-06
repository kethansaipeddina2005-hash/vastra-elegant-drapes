import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import * as LucideIcons from 'lucide-react';
import { Loading } from './ui/loading';

interface Category {
  id: string;
  name: string;
  icon_name: string;
  description: string | null;
  image_url: string | null;
}

export const CategorySection = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderIcon = (iconName: string) => {
    const IconComponent = (LucideIcons as any)[iconName];
    return IconComponent ? <IconComponent className="h-6 w-6 md:h-8 md:w-8" /> : null;
  };

  if (loading) {
    return (
      <section className="py-12 px-4">
        <div className="container mx-auto flex justify-center">
          <Loading />
        </div>
      </section>
    );
  }

  if (categories.length === 0) {
    return null;
  }

  return (
    <section className="py-8 md:py-12 px-4 md:px-6 bg-secondary/30">
      <div className="container mx-auto">
        <div className="text-center mb-6 md:mb-10 space-y-2 md:space-y-3">
          <h2 className="text-2xl md:text-4xl font-playfair font-bold text-foreground">
            Shop by Category
          </h2>
          <p className="text-sm md:text-base text-muted-foreground max-w-xl mx-auto">
            Explore our curated collections
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-6">
          {categories.map((category) => (
            <Link
              key={category.id}
              to={`/collections?category=${encodeURIComponent(category.name)}`}
              className="group flex flex-col items-center overflow-hidden bg-card rounded-xl shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1"
            >
              {category.image_url ? (
                <div className="w-full aspect-square overflow-hidden">
                  <img
                    src={category.image_url}
                    alt={category.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
              ) : (
                <div className="w-full aspect-square bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
                  {renderIcon(category.icon_name)}
                </div>
              )}
              <div className="p-2 md:p-3 text-center w-full">
                <h3 className="text-xs md:text-sm font-medium text-foreground line-clamp-1">
                  {category.name}
                </h3>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CategorySection;
