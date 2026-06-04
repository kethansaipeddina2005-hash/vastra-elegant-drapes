import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface RevenuePoint {
  date: string;
  revenue: number;
}

export interface StatusSlice {
  status: string;
  count: number;
}

export interface TopProduct {
  productId: number;
  name: string;
  units: number;
}

export interface LowStockItem {
  id: number;
  name: string;
  stock_quantity: number;
}

interface Analytics {
  revenue: RevenuePoint[];
  ordersByStatus: StatusSlice[];
  topProducts: TopProduct[];
  lowStock: LowStockItem[];
  loading: boolean;
}

const DAYS = 30;

export const useAdminAnalytics = (): Analytics => {
  const [state, setState] = useState<Analytics>({
    revenue: [],
    ordersByStatus: [],
    topProducts: [],
    lowStock: [],
    loading: true,
  });

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const since = new Date();
      since.setDate(since.getDate() - DAYS + 1);
      since.setHours(0, 0, 0, 0);

      const [ordersRes, itemsRes, productsRes] = await Promise.all([
        supabase
          .from('orders')
          .select('created_at, final_amount, total_amount, status, payment_status')
          .gte('created_at', since.toISOString()),
        supabase
          .from('order_items')
          .select('product_id, quantity, products(name)')
          .limit(2000),
        supabase
          .from('products')
          .select('id, name, stock_quantity')
          .lte('stock_quantity', 3)
          .order('stock_quantity', { ascending: true })
          .limit(10),
      ]);

      const orders = ordersRes.data || [];
      const items = itemsRes.data || [];
      const products = productsRes.data || [];

      // Build daily revenue (paid only)
      const byDay = new Map<string, number>();
      for (let i = 0; i < DAYS; i++) {
        const d = new Date(since);
        d.setDate(since.getDate() + i);
        byDay.set(d.toISOString().slice(0, 10), 0);
      }
      orders.forEach((o: any) => {
        if (o.payment_status !== 'paid' && o.payment_status !== 'completed') return;
        const day = new Date(o.created_at).toISOString().slice(0, 10);
        if (!byDay.has(day)) return;
        const amt = Number(o.final_amount ?? o.total_amount ?? 0);
        byDay.set(day, (byDay.get(day) || 0) + amt);
      });
      const revenue: RevenuePoint[] = Array.from(byDay.entries()).map(([date, val]) => ({
        date: date.slice(5),
        revenue: Math.round(val),
      }));

      // Orders by status
      const statusMap = new Map<string, number>();
      orders.forEach((o: any) => {
        const k = o.status || 'unknown';
        statusMap.set(k, (statusMap.get(k) || 0) + 1);
      });
      const ordersByStatus: StatusSlice[] = Array.from(statusMap.entries()).map(([status, count]) => ({
        status,
        count,
      }));

      // Top products by units
      const unitMap = new Map<number, { name: string; units: number }>();
      items.forEach((it: any) => {
        if (!it.product_id) return;
        const cur = unitMap.get(it.product_id) || { name: it.products?.name || `#${it.product_id}`, units: 0 };
        cur.units += Number(it.quantity || 0);
        unitMap.set(it.product_id, cur);
      });
      const topProducts: TopProduct[] = Array.from(unitMap.entries())
        .map(([productId, v]) => ({ productId, name: v.name, units: v.units }))
        .sort((a, b) => b.units - a.units)
        .slice(0, 5);

      if (!cancelled) {
        setState({
          revenue,
          ordersByStatus,
          topProducts,
          lowStock: products as LowStockItem[],
          loading: false,
        });
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  return state;
};