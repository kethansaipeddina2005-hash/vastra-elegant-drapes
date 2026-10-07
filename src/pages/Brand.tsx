import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Layout from "@/components/Layout";
import SEO from "@/components/SEO";
import ProductCard from "@/components/ProductCard";
import { ProductGridSkeleton } from "@/components/skeletons/ProductCardSkeleton";
import { supabase } from "@/integrations/supabase/client";
import { usePartnerBrand } from "@/hooks/usePartnerBrand";
import type { Product } from "@/types/product";

const Brand = () => {
  const { id } = useParams();
  const brand = usePartnerBrand(id);
  const [products, setProducts] = useState<Product[] | null>(null);

  useEffect(() => {
    if (!id) return;
    supabase.from("products").select("*").eq("partner_id", id).eq("approval_status", "approved")
      .order("created_at", { ascending: false })
      .then(({ data }) => setProducts((data || []).map((p: any) => ({
        id: p.id, name: p.name, price: Number(p.price), description: p.description || "",
        image: p.images?.[0] || "", images: p.images || [], fabricType: p.fabric_type || "",
        color: p.color || "", occasion: p.occasion || "", region: p.region || "",
        stockQuantity: p.stock_quantity || 0, showLowStockBadge: p.show_low_stock_badge !== false,
        isNew: p.is_new || false, rating: Number(p.rating) || 0, reviews: p.reviews || 0, partnerId: p.partner_id,
      }))));
  }, [id]);

  return (
    <Layout>
      <SEO title={`${brand?.brand_name ?? "Designer"} — Vastra Luxe`} description={brand?.business_description?.slice(0, 150) || "Designer collection on Vastra Luxe"} />
      <div className="container mx-auto px-4 py-10">
        <div className="flex items-center gap-5 mb-10 animate-fade-in">
          {brand?.logoSrc ? (
            <img src={brand.logoSrc} alt={`${brand.brand_name} logo`} className="h-20 w-20 rounded-full object-cover border border-gold/50 shadow-md" />
          ) : (
            <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center font-playfair text-3xl border border-gold/50">{brand?.brand_name?.[0] ?? ""}</div>
          )}
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-accent mb-1">Designer on Vastra Luxe</p>
            <h1 className="font-playfair text-3xl md:text-4xl">{brand?.brand_name ?? ""}</h1>
            {brand?.location && <p className="text-sm text-muted-foreground">{brand.location}</p>}
          </div>
        </div>
        {brand?.business_description && <p className="max-w-2xl text-muted-foreground mb-10">{brand.business_description}</p>}
        {products === null ? (
          <ProductGridSkeleton count={4} />
        ) : products.length === 0 ? (
          <p className="text-muted-foreground">No pieces available right now.</p>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {products.map((p) => <ProductCard key={p.id} {...p} />)}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Brand;
