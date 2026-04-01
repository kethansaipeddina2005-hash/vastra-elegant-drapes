import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import * as LucideIcons from 'lucide-react';
import { Loading } from './ui/loading';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Category {
  id: string;
  name: string;
  icon_name: string;
  description: string | null;
  image_url: string | null;
  is_featured: boolean | null;
  featured_label: string | null;
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
      <section className="py-16 px-4">
        <div className="container mx-auto flex justify-center">
          <Loading />
        </div>
      </section>
    );
  }

  if (categories.length === 0) return null;

  return (
    <section className="py-12 md:py-20 px-4 md:px-6 bg-gradient-to-b from-background to-secondary/20">
      <div className="container mx-auto">
        {/* Header */}
        <div className="text-center mb-10 md:mb-14 space-y-3">
          <span className="inline-block text-xs tracking-[0.3em] uppercase text-primary font-medium">
            Curated Collections
          </span>
          <h2 className="text-3xl md:text-5xl font-playfair font-bold text-foreground">
            Shop by Category
          </h2>
          <div className="w-16 h-[2px] bg-accent mx-auto mt-3" />
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {categories.map((category, index) => (
            <Link
              key={category.id}
              to={`/collections?category=${encodeURIComponent(category.name)}`}
              className={cn(
                "group relative overflow-hidden rounded-2xl",
                // First two items span larger on larger screens
                index === 0 && "md:col-span-2 md:row-span-2",
                index === 0 ? "aspect-[3/4] md:aspect-auto" : "aspect-[3/4]"
              )}
            >
              {/* Image or Fallback */}
              {category.image_url ? (
                <img
                  src={category.image_url}
                  alt={category.name}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/10 flex items-center justify-center text-primary/60">
                  {renderIcon(category.icon_name)}
                </div>
              )}

              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/20 to-transparent transition-opacity duration-500" />

              {/* Hover shimmer */}
              <div className="absolute inset-0 bg-gradient-to-t from-accent/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              {/* Content */}
              <div className="absolute inset-x-0 bottom-0 p-4 md:p-6 flex items-end justify-between">
                <div className="space-y-1">
                  <h3 className={cn(
                    "font-playfair font-semibold text-white drop-shadow-lg",
                    index === 0 ? "text-xl md:text-3xl" : "text-sm md:text-lg"
                  )}>
                    {category.name}
                  </h3>
                  {category.description && index === 0 && (
                    <p className="text-white/70 text-xs md:text-sm line-clamp-2 max-w-xs">
                      {category.description}
                    </p>
                  )}
                </div>
                <div className="flex-shrink-0 h-8 w-8 md:h-10 md:w-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:bg-white/40 transition-all duration-300 group-hover:translate-x-1">
                  <ArrowRight className="h-4 w-4 md:h-5 md:w-5 text-white" />
                </div>
              </div>

              {/* Top border accent on hover */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-accent to-primary scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CategorySection;
