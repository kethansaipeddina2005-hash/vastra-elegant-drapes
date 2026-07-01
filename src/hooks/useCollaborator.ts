import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface CollaboratorCoupon {
  id: string;
  code: string;
  discount_percent: number;
  commission_percent: number;
  is_active: boolean;
  collaborator_name: string | null;
  collaborator_email: string | null;
}

export const useCollaborator = () => {
  const { user, loading: authLoading } = useAuth();
  const [coupons, setCoupons] = useState<CollaboratorCoupon[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const run = async () => {
      if (!user?.email) {
        setCoupons([]);
        setLoading(false);
        return;
      }
      const { data, error } = await supabase
        .from('coupons')
        .select('id, code, discount_percent, commission_percent, is_active, collaborator_name, collaborator_email')
        .eq('collaborator_email', user.email.toLowerCase());
      if (error) {
        console.error('collab lookup', error);
        setCoupons([]);
      } else {
        setCoupons((data as any) || []);
      }
      setLoading(false);
    };
    if (!authLoading) run();
  }, [user, authLoading]);

  const activeCoupons = coupons.filter((c) => c.is_active);
  return {
    coupons,
    activeCoupons,
    isCollaborator: activeCoupons.length > 0,
    loading: authLoading || loading,
  };
};