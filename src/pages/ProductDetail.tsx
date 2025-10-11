import { useParams, Link } from "react-router-dom";
import { useState } from "react";
import Layout from "@/components/Layout";
import ProductCard from "@/components/ProductCard";
import { products } from "@/data/products";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Heart, ShoppingCart, Minus, Plus, Share2, Facebook, Twitter, Link2 } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useWishlist } from "@/contexts/WishlistContext";
import { toast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const ProductDetail = () => {
  const { id } = useParams();
  const product = products.find(p => p.id === parseInt(id || '0'));
  const [quantity, setQuantity] = useState(1);
  const { addToCart } = useCart();
  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist();
  
  if (!product) {
    return (
      <Layout>
        <div className="container mx-auto px-6 py-8">
          <p>Product not found</p>
          <Link to="/collections">
            <Button>Back to Collections</Button>
          </Link>
        </div>
      </Layout>
    );
  }

  const relatedProducts = products.filter(p => 
    p.id !== product.id && 
    (p.fabricType === product.fabricType || p.occasion === product.occasion)
  ).slice(0, 3);

  const inWishlist = isInWishlist(product.id);

  const handleAddToCart = () => {
    addToCart(product, quantity);
  };

  const handleWishlist = () => {
    if (inWishlist) {
      removeFromWishlist(product.id);
    } else {
      addToWishlist(product);
    }
  };

  const handleShare = (platform: string) => {
    const url = window.location.href;
    const text = `Check out ${product.name} - ${product.description}`;
    
    let shareUrl = '';
    switch (platform) {
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
        break;
      case 'copy':
        navigator.clipboard.writeText(url);
        toast({ title: "Link Copied", description: "Product link copied to clipboard" });
        return;
    }
    
    if (shareUrl) {
      window.open(shareUrl, '_blank', 'width=600,height=400');
    }
  };
  
  return (
    <Layout>
      <div className="container mx-auto px-6 py-8">
        <Breadcrumb className="mb-6">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">Home</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/collections">Collections</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{product.name}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        
        <div className="grid md:grid-cols-2 gap-12 mb-20">
          <div className="space-y-4">
            <div className="aspect-[3/4] overflow-hidden rounded-lg">
              <img 
                src={product.image} 
                alt={product.name}
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
              />
            </div>
          </div>
          
          <div className="space-y-6">
            <div>
              <h1 className="text-4xl font-playfair font-bold text-foreground mb-4">
                {product.name}
              </h1>
              <p className="text-3xl font-semibold text-primary mb-4">
                ₹{product.price.toLocaleString('en-IN')}
              </p>
              {product.rating && (
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <span key={i} className={`text-xl ${i < Math.floor(product.rating!) ? 'text-gold' : 'text-muted'}`}>
                        ★
                      </span>
                    ))}
                  </div>
                  <span className="text-muted-foreground">({product.reviews} reviews)</span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <p className="text-muted-foreground"><span className="font-semibold text-foreground">Fabric:</span> {product.fabricType}</p>
              <p className="text-muted-foreground"><span className="font-semibold text-foreground">Color:</span> {product.color}</p>
              <p className="text-muted-foreground"><span className="font-semibold text-foreground">Region:</span> {product.region}</p>
              <p className="text-muted-foreground"><span className="font-semibold text-foreground">Occasion:</span> {product.occasion}</p>
              <p className="text-muted-foreground">
                <span className="font-semibold text-foreground">Availability:</span> 
                {product.stockQuantity > 0 ? ` In Stock (${product.stockQuantity} available)` : ' Out of Stock'}
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center border border-border rounded-md">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="px-4 font-medium">{quantity}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setQuantity(Math.min(product.stockQuantity, quantity + 1))}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex gap-4">
              <Button size="lg" className="flex-1" onClick={handleAddToCart}>
                <ShoppingCart className="mr-2 h-5 w-5" />
                Add to Cart
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                onClick={handleWishlist}
                className={inWishlist ? "text-primary" : ""}
              >
                <Heart className={`h-5 w-5 ${inWishlist ? 'fill-primary' : ''}`} />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="lg" variant="outline">
                    <Share2 className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleShare('facebook')}>
                    <Facebook className="mr-2 h-4 w-4" />
                    Share on Facebook
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleShare('twitter')}>
                    <Twitter className="mr-2 h-4 w-4" />
                    Share on Twitter
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleShare('copy')}>
                    <Link2 className="mr-2 h-4 w-4" />
                    Copy Link
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <Link to="/checkout">
              <Button size="lg" className="w-full" variant="secondary">
                Buy Now
              </Button>
            </Link>
          </div>
        </div>

        <Tabs defaultValue="description" className="mb-20">
          <TabsList className="grid w-full grid-cols-3 max-w-md">
            <TabsTrigger value="description">Description</TabsTrigger>
            <TabsTrigger value="care">Care Instructions</TabsTrigger>
            <TabsTrigger value="size">Size Guide</TabsTrigger>
          </TabsList>
          <TabsContent value="description" className="mt-6">
            <p className="text-muted-foreground leading-relaxed">{product.description}</p>
          </TabsContent>
          <TabsContent value="care" className="mt-6">
            <ul className="space-y-2 text-muted-foreground">
              <li>• Dry clean only for best results</li>
              <li>• Store in a cool, dry place</li>
              <li>• Avoid direct sunlight to prevent fading</li>
              <li>• Iron on low heat if needed</li>
              <li>• Keep away from perfumes and deodorants</li>
            </ul>
          </TabsContent>
          <TabsContent value="size" className="mt-6">
            <p className="text-muted-foreground mb-4">Standard saree dimensions:</p>
            <ul className="space-y-2 text-muted-foreground">
              <li>• Length: 5.5 meters (18 feet)</li>
              <li>• Width: 1.1 meters (44 inches)</li>
              <li>• Blouse piece: 80 cm included</li>
            </ul>
          </TabsContent>
        </Tabs>

        {relatedProducts.length > 0 && (
          <div>
            <h2 className="text-3xl font-playfair font-bold text-foreground mb-8">
              You Might Also Like
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {relatedProducts.map(product => (
                <ProductCard key={product.id} {...product} />
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ProductDetail;
