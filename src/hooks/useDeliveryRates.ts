import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useDeliveryRates = () => useQuery({
  queryKey: ['delivery-rates'],
  queryFn: async () => {
    const { data, error } = await supabase.from('delivery_rates').select('*').order('country_name');
    if (error) throw error;
    return data;
  },
  staleTime: 0,
  refetchOnWindowFocus: true,
  refetchInterval: 15000,
});