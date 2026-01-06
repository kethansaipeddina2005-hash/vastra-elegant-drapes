import { Link } from "react-router-dom";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { useWishlist } from "@/contexts/WishlistContext";
import { useCart } from "@/contexts/CartContext";
import ProductCard from "@/components/ProductCard";
import { Trash2, ShoppingCart } from "lucide-react";

const Wishlist = () => {
  const { wishlist, removeFromWishlist } = useWishlist();
  const { addToCart } = useCart();

  const handleMoveToCart = (product: any) => {
    addToCart(product);
    removeFromWishlist(product.id);
  };

  if (wishlist.length === 0) {
    return (
      <Layout>
        <div className="container mx-auto px-6 py-16 text-center">
          <h1 className="text-4xl font-playfair font-bold text-foreground mb-4">
            My Wishlist
          </h1>
          <p className="text-muted-foreground text-lg mb-8">
            Your wishlist is empty. Start adding items you love!
          </p>
          <Link to="/collections">
            <Button size="lg">Browse Collections</Button>
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-6 py-8">
        <h1 className="text-4xl font-playfair font-bold text-foreground mb-8">
          My Wishlist ({wishlist.length})
        </h1>
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {wishlist.map(product => (
            <div key={product.id} className="flex flex-col">
              <ProductCard 
                {...product} 
                actionButton={
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 bg-background/80 hover:bg-background shadow-sm"
                      onClick={(e) => {
                        e.preventDefault();
                        handleMoveToCart(product);
                      }}
                    >
                      <ShoppingCart className="h-4 w-4 text-primary" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 bg-background/80 hover:bg-destructive shadow-sm"
                      onClick={(e) => {
                        e.preventDefault();
                        removeFromWishlist(product.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-destructive hover:text-destructive-foreground" />
                    </Button>
                  </div>
                }
              />
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default Wishlist;
