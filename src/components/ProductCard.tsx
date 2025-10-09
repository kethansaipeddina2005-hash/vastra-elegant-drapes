import { Link } from "react-router-dom";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { Heart } from "lucide-react";
import { Button } from "./ui/button";
import { useWishlist } from "@/contexts/WishlistContext";
import { Product } from "@/types/product";

const ProductCard = (product: Product) => {
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
    <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer">
      <Link to={`/product/${product.id}`}>
        <div className="relative overflow-hidden aspect-[3/4]">
          <img
            src={product.image}
            alt={product.name}
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
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-4 right-4 bg-background/80 hover:bg-background opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={toggleWishlist}
      >
        <Heart className={`h-5 w-5 ${inWishlist ? 'fill-primary text-primary' : ''}`} />
      </Button>
      
      <CardContent className="p-4">
        <Link to={`/product/${product.id}`}>
          <h3 className="font-playfair text-lg font-semibold text-foreground mb-2 line-clamp-1">
            {product.name}
          </h3>
          <div className="flex items-center justify-between">
            <p className="text-xl font-semibold text-primary">{formattedPrice}</p>
            {product.rating && (
              <div className="flex items-center gap-1">
                <span className="text-gold">★</span>
                <span className="text-sm text-muted-foreground">{product.rating}</span>
              </div>
            )}
          </div>
        </Link>
      </CardContent>
    </Card>
  );
};

export default ProductCard;
