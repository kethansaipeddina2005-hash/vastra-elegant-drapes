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
  // Storefront is INR-only. International customers still see rupee pricing;
  // an extra shipping fee is applied at checkout instead.
  const pricingRegion: PricingRegion = 'india';
  const setPricingRegion = (_region: PricingRegion) => {};
  const currencySymbol = '₹';
  const currencyCode = 'INR';
  const loading = false;

  const getDisplayPrice = (indianPrice: number, _foreignPrice?: number | null): number => {
    return indianPrice;
  };

  const formatPrice = (indianPrice: number, _foreignPrice?: number | null): string => {
    return `₹${indianPrice.toLocaleString('en-IN')}`;
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
