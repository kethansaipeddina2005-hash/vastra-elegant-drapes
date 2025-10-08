import { Link } from "react-router-dom";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { Heart } from "lucide-react";
import { Button } from "./ui/button";
import { useState } from "react";

interface ProductCardProps {
  id: number;
  image: string;
  name: string;
  price: string | number;
  isNew?: boolean;
  isOnSale?: boolean;
  rating?: number;
}

const ProductCard = ({ id, image, name, price, isNew, isOnSale, rating }: ProductCardProps) => {
  const [isWishlisted, setIsWishlisted] = useState(false);

  const formattedPrice = typeof price === 'number' 
    ? `₹${price.toLocaleString('en-IN')}` 
    : `₹${price}`;

  return (
    <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer">
      <Link to={`/product/${id}`}>
        <div className="relative overflow-hidden aspect-[3/4]">
          <img
            src={image}
            alt={name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          {(isNew || isOnSale) && (
            <div className="absolute top-4 left-4 flex flex-col gap-2">
              {isNew && <Badge className="bg-accent text-accent-foreground">New</Badge>}
              {isOnSale && <Badge className="bg-destructive text-destructive-foreground">Sale</Badge>}
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 bg-background/80 hover:bg-background opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => {
              e.preventDefault();
              setIsWishlisted(!isWishlisted);
            }}
          >
            <Heart className={`h-5 w-5 ${isWishlisted ? 'fill-primary text-primary' : ''}`} />
          </Button>
        </div>
      </Link>
      
      <CardContent className="p-4">
        <Link to={`/product/${id}`}>
          <h3 className="font-playfair text-lg font-semibold text-foreground mb-2 line-clamp-1">
            {name}
          </h3>
          <div className="flex items-center justify-between">
            <p className="text-xl font-semibold text-primary">{formattedPrice}</p>
            {rating && (
              <div className="flex items-center gap-1">
                <span className="text-gold">★</span>
                <span className="text-sm text-muted-foreground">{rating}</span>
              </div>
            )}
          </div>
        </Link>
      </CardContent>
    </Card>
  );
};

export default ProductCard;
