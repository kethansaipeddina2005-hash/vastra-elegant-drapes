import { Link } from "react-router-dom";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { Heart } from "lucide-react";
import { Button } from "./ui/button";
import { useWishlist } from "@/contexts/WishlistContext";
import { Product } from "@/types/product";

interface ProductCardProps extends Product {
  hideWishlistIcon?: boolean;
  actionButton?: React.ReactNode;
}

const ProductCard = ({ hideWishlistIcon = false, actionButton, ...product }: ProductCardProps) => {
  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist();
  const inWishlist = isInWishlist(product.id);

  const toggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    if (inWishlist) {
      removeFromWishlist(product.id);
    } else {
      addToWishlist(product);
    }
  };

  const formattedPrice = `₹${product.price.toLocaleString('en-IN')}`;

  return (
    <Card className="group relative overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer">
      <Link to={`/product/${product.id}`}>
        <div className="relative overflow-hidden aspect-[3/4]">
          <img
            src={product.image}
            alt={product.name}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          {(product.isNew || product.isOnSale) && (
            <div className="absolute top-4 left-4 flex flex-col gap-2">
              {product.isNew && <Badge className="bg-accent text-accent-foreground">New</Badge>}
              {product.isOnSale && <Badge className="bg-destructive text-destructive-foreground">Sale</Badge>}
            </div>
          )}
        </div>
      </Link>
      {actionButton && (
        <div className="absolute top-2 right-2 z-10">
          {actionButton}
        </div>
      )}
      {!hideWishlistIcon && !actionButton && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 z-10 h-8 w-8 bg-background/80 hover:bg-background shadow-sm"
          onClick={toggleWishlist}
        >
          <Heart className={`h-4 w-4 transition-all ${inWishlist ? 'fill-primary text-primary' : 'text-muted-foreground hover:text-primary'}`} />
        </Button>
      )}
      
      <CardContent className="p-3 md:p-4">
        <Link to={`/product/${product.id}`}>
          {product.categoryName && (
            <span className="text-xs text-muted-foreground uppercase tracking-wide">
              {product.categoryName}
            </span>
          )}
          <h3 className="font-playfair text-sm md:text-lg font-semibold text-foreground mb-1 md:mb-2 line-clamp-2">
            {product.name}
          </h3>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1">
            <p className="text-base md:text-xl font-semibold text-primary">{formattedPrice}</p>
            {product.rating && (
              <div className="flex items-center gap-1">
                <span className="text-gold text-sm">★</span>
                <span className="text-xs md:text-sm text-muted-foreground">{product.rating}</span>
              </div>
            )}
          </div>
        </Link>
      </CardContent>
    </Card>
  );
};

export default ProductCard;
