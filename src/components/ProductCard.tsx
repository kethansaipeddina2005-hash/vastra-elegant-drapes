import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";

interface ProductCardProps {
  image: string;
  name: string;
  price: string;
}

const ProductCard = ({ image, name, price }: ProductCardProps) => {
  return (
    <Card className="group overflow-hidden border-border bg-card hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
      <div className="aspect-[3/4] overflow-hidden bg-muted">
        <img 
          src={image} 
          alt={name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
      </div>
      <CardContent className="p-4 space-y-2">
        <h3 className="text-lg font-playfair font-semibold text-foreground">
          {name}
        </h3>
        <p className="text-2xl font-medium text-primary">
          ₹{price}
        </p>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Button 
          variant="outline" 
          className="w-full border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-all duration-300"
        >
          View Details
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ProductCard;
