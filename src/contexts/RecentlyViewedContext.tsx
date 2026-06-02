import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Product } from '@/types/product';
import { supabase } from '@/integrations/supabase/client';

interface RecentlyViewedContextType {
  recentlyViewed: Product[];
  addToRecentlyViewed: (product: Product) => void;
  clearRecentlyViewed: () => void;
}

const RecentlyViewedContext = createContext<RecentlyViewedContextType | undefined>(undefined);

const STORAGE_KEY = 'vastra-recently-viewed';
const MAX_ITEMS = 10;

export const RecentlyViewedProvider = ({ children }: { children: ReactNode }) => {
  const [recentlyViewed, setRecentlyViewed] = useState<Product[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return;
    let parsed: Product[] = [];
    try {
      parsed = JSON.parse(stored);
    } catch (error) {
      console.error('Error parsing recently viewed:', error);
      return;
    }
    setRecentlyViewed(parsed);

    // Prune any products that no longer exist (e.g. deleted by admin)
    const ids = parsed.map((p) => p.id).filter((id) => id != null);
    if (ids.length === 0) return;
    supabase
      .from('products')
      .select('id')
      .in('id', ids)
      .then(({ data, error }) => {
        if (error || !data) return;
        const existing = new Set(data.map((p: { id: number }) => p.id));
        const cleaned = parsed.filter((p) => existing.has(p.id));
        if (cleaned.length !== parsed.length) {
          setRecentlyViewed(cleaned);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(cleaned));
        }
      });
  }, []);

  const addToRecentlyViewed = (product: Product) => {
    setRecentlyViewed((prev) => {
      const filtered = prev.filter((p) => p.id !== product.id);
      const updated = [product, ...filtered].slice(0, MAX_ITEMS);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const clearRecentlyViewed = () => {
    setRecentlyViewed([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <RecentlyViewedContext.Provider value={{ recentlyViewed, addToRecentlyViewed, clearRecentlyViewed }}>
      {children}
    </RecentlyViewedContext.Provider>
  );
};

export const useRecentlyViewed = () => {
  const context = useContext(RecentlyViewedContext);
  if (!context) {
    throw new Error('useRecentlyViewed must be used within a RecentlyViewedProvider');
  }
  return context;
};
