import { Link } from "react-router-dom";
import { usePartnerBrand } from "@/hooks/usePartnerBrand";

const PartnerBadge = ({ partnerId }: { partnerId?: string | null }) => {
  const brand = usePartnerBrand(partnerId);
  if (!brand) return null;
  return (
    <Link
      to={`/brand/${brand.id}`}
      className="inline-flex items-center gap-3 rounded-full border border-gold/40 bg-card/70 pl-1 pr-4 py-1 animate-fade-in hover:border-gold transition-colors"
    >
      {brand.logoSrc ? (
        <img src={brand.logoSrc} alt={`${brand.brand_name} logo`} className="h-8 w-8 rounded-full object-cover border border-border" />
      ) : (
        <span className="h-8 w-8 rounded-full bg-muted flex items-center justify-center font-playfair text-sm">{brand.brand_name[0]}</span>
      )}
      <span className="text-xs text-muted-foreground">
        Curated by Vastra Luxe · <span className="text-foreground font-medium">{brand.brand_name}</span>
      </span>
    </Link>
  );
};

export default PartnerBadge;
