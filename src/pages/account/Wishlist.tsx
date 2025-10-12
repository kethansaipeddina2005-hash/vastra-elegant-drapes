import { Link } from "react-router-dom";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { useWishlist } from "@/contexts/WishlistContext";
import { useCart } from "@/contexts/CartContext";
import ProductCard from "@/components/ProductCard";

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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {wishlist.map(product => (
            <div key={product.id}>
              <ProductCard {...product} />
              <Button 
                variant="outline" 
                className="w-full mt-2"
                onClick={() => handleMoveToCart(product)}
              >
                Move to Cart
              </Button>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default Wishlist;
