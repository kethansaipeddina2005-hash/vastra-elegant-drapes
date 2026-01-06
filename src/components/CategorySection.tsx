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
    return IconComponent ? <IconComponent className="h-8 w-8" /> : null;
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
    <section className="py-12 px-4 md:px-6 bg-secondary/30">
      <div className="container mx-auto">
        <div className="text-center mb-10 space-y-3">
          <h2 className="text-3xl md:text-4xl font-playfair font-bold text-foreground">
            Shop by Category
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Explore our curated collections
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 md:gap-6">
          {categories.map((category) => (
            <Link
              key={category.id}
              to={`/collections?category=${encodeURIComponent(category.name)}`}
              className="group flex flex-col items-center p-4 md:p-6 bg-card rounded-xl shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1"
            >
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300 mb-3">
                {renderIcon(category.icon_name)}
              </div>
              <h3 className="text-sm md:text-base font-medium text-foreground text-center">
                {category.name}
              </h3>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CategorySection;
