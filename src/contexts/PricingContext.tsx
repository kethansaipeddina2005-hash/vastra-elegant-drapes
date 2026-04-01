import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '@/integrations/supabase/client';

type PricingRegion = 'india' | 'foreign';

interface PricingContextType {
  pricingRegion: PricingRegion;
  setPricingRegion: (region: PricingRegion) => void;
  currencySymbol: string;
  currencyCode: string;
  getDisplayPrice: (indianPrice: number, foreignPrice?: number | null) => number;
  formatPrice: (indianPrice: number, foreignPrice?: number | null) => string;
  loading: boolean;
}

const PricingContext = createContext<PricingContextType | undefined>(undefined);

export const PricingProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [pricingRegion, setPricingRegionState] = useState<PricingRegion>(() => {
    const saved = localStorage.getItem('vastra-pricing-region');
    return (saved as PricingRegion) || 'india';
  });
  const [loading, setLoading] = useState(false);

  // Load user's country_type from profile on login
  useEffect(() => {
    if (user) {
      loadUserCountryType();
    }
  }, [user]);

  const loadUserCountryType = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data } = await supabase
        .from('profiles')
        .select('country_type')
        .eq('id', user.id)
        .single();

      if (data?.country_type) {
        const region = data.country_type === 'foreign' ? 'foreign' : 'india';
        setPricingRegionState(region);
        localStorage.setItem('vastra-pricing-region', region);
      }
    } catch (error) {
      console.error('Error loading country type:', error);
    } finally {
      setLoading(false);
    }
  };

  const setPricingRegion = (region: PricingRegion) => {
    setPricingRegionState(region);
    localStorage.setItem('vastra-pricing-region', region);
  };

  const currencySymbol = pricingRegion === 'foreign' ? '$' : '₹';
  const currencyCode = pricingRegion === 'foreign' ? 'USD' : 'INR';

  const getDisplayPrice = (indianPrice: number, foreignPrice?: number | null): number => {
    if (pricingRegion === 'foreign' && foreignPrice != null && foreignPrice > 0) {
      return foreignPrice;
    }
    return indianPrice;
  };

  const formatPrice = (indianPrice: number, foreignPrice?: number | null): string => {
    const price = getDisplayPrice(indianPrice, foreignPrice);
    if (pricingRegion === 'foreign' && foreignPrice != null && foreignPrice > 0) {
      return `$${price.toLocaleString('en-US')}`;
    }
    return `₹${price.toLocaleString('en-IN')}`;
  };

  return (
    <PricingContext.Provider value={{
      pricingRegion,
      setPricingRegion,
      currencySymbol,
      currencyCode,
      getDisplayPrice,
      formatPrice,
      loading,
    }}>
      {children}
    </PricingContext.Provider>
  );
};

export const usePricing = () => {
  const context = useContext(PricingContext);
  if (!context) throw new Error('usePricing must be used within PricingProvider');
  return context;
};
