import { useParams, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import ProductCard from "@/components/ProductCard";
import { supabase } from "@/integrations/supabase/client";
import { Product } from "@/types/product";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Heart, ShoppingCart, Minus, Plus, Share2, Facebook, Twitter, Link2 } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useWishlist } from "@/contexts/WishlistContext";
import { toast } from "@/hooks/use-toast";
import { Loading } from "@/components/ui/loading";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const ProductDetail = () => {
  const { id } = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const { addToCart } = useCart();
  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist();
  
  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', parseInt(id || '0'))
        .single();

      if (error) throw error;

      const transformedProduct: Product = {
        id: data.id,
        name: data.name,
        price: Number(data.price),
        description: data.description || '',
        image: data.images?.[0] || '',
        images: data.images || [],
        fabricType: data.fabric_type || '',
        color: data.color || '',
        occasion: data.occasion || '',
        region: data.region || '',
        stockQuantity: data.stock_quantity || 0,
        isNew: data.is_new || false,
        rating: Number(data.rating) || 0,
        reviews: data.reviews || 0,
      };

      setProduct(transformedProduct);

      // Fetch related products
      const { data: relatedData } = await supabase
        .from('products')
        .select('*')
        .neq('id', transformedProduct.id)
        .or(`fabric_type.eq.${transformedProduct.fabricType},occasion.eq.${transformedProduct.occasion}`)
        .limit(3);

      if (relatedData) {
        const transformedRelated: Product[] = relatedData.map((p) => ({
          id: p.id,
          name: p.name,
          price: Number(p.price),
          description: p.description || '',
          image: p.images?.[0] || '',
          images: p.images || [],
          fabricType: p.fabric_type || '',
          color: p.color || '',
          occasion: p.occasion || '',
          region: p.region || '',
          stockQuantity: p.stock_quantity || 0,
          isNew: p.is_new || false,
          rating: Number(p.rating) || 0,
          reviews: p.reviews || 0,
        }));
        setRelatedProducts(transformedRelated);
      }
    } catch (error) {
      console.error('Error fetching product:', error);
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-6 py-8 flex justify-center items-center min-h-[60vh]">
          <Loading />
        </div>
      </Layout>
    );
  }
  
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
        
        <div className="grid md:grid-cols-2 gap-8 lg:gap-12 mb-16 md:mb-20">
          <div className="space-y-4">
            <div className="aspect-[3/4] overflow-hidden rounded-2xl shadow-xl border border-border/50 bg-muted/20">
              <img 
                src={product.image} 
                alt={product.name}
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
              />
            </div>
          </div>
          
          <div className="space-y-6 md:space-y-8">
            <div className="space-y-3">
              {product.isNew && (
                <span className="inline-block px-3 py-1 text-xs font-semibold bg-primary/10 text-primary rounded-full mb-2">
                  New Arrival
                </span>
              )}
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-playfair font-bold text-foreground leading-tight">
                {product.name}
              </h1>
              <div className="flex items-baseline gap-3">
                <p className="text-4xl font-bold text-primary">
                  ₹{product.price.toLocaleString('en-IN')}
                </p>
                {product.rating && (
                  <div className="flex items-center gap-2">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <span key={i} className={`text-lg ${i < Math.floor(product.rating!) ? 'text-gold' : 'text-muted'}`}>
                          ★
                        </span>
                      ))}
                    </div>
                    <span className="text-sm text-muted-foreground">({product.reviews})</span>
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 bg-muted/30 rounded-xl space-y-3 border border-border/50">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Fabric</p>
                  <p className="font-semibold text-foreground">{product.fabricType}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Color</p>
                  <p className="font-semibold text-foreground">{product.color}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Region</p>
                  <p className="font-semibold text-foreground">{product.region}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Occasion</p>
                  <p className="font-semibold text-foreground">{product.occasion}</p>
                </div>
              </div>
              <div className="pt-3 border-t border-border/50">
                <p className={`text-sm font-semibold ${product.stockQuantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {product.stockQuantity > 0 ? `✓ In Stock (${product.stockQuantity} available)` : '✗ Out of Stock'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 mb-2">
              <span className="text-sm font-medium text-muted-foreground">Quantity:</span>
              <div className="flex items-center border border-border rounded-lg overflow-hidden bg-background">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="rounded-none hover:bg-muted"
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="px-6 py-2 font-semibold min-w-[60px] text-center">{quantity}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setQuantity(Math.min(product.stockQuantity, quantity + 1))}
                  className="rounded-none hover:bg-muted"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Primary CTA - Buy Now */}
            <Link to="/checkout" className="block">
              <Button 
                size="lg" 
                className="w-full h-14 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary group"
              >
                <ShoppingCart className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" />
                Buy Now
              </Button>
            </Link>

            {/* Secondary actions */}
            <div className="flex gap-3">
              <Button 
                size="lg" 
                variant="outline" 
                className="flex-1 h-12 border-2 hover:bg-muted" 
                onClick={handleAddToCart}
              >
                <ShoppingCart className="mr-2 h-4 w-4" />
                Add to Cart
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                onClick={handleWishlist}
                className={`h-12 border-2 hover:bg-muted ${inWishlist ? "text-primary border-primary" : ""}`}
              >
                <Heart className={`h-5 w-5 transition-all ${inWishlist ? 'fill-primary scale-110' : ''}`} />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="lg" variant="outline" className="h-12 border-2 hover:bg-muted">
                    <Share2 className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem onClick={() => handleShare('facebook')} className="cursor-pointer">
                    <Facebook className="mr-2 h-4 w-4" />
                    Share on Facebook
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleShare('twitter')} className="cursor-pointer">
                    <Twitter className="mr-2 h-4 w-4" />
                    Share on Twitter
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleShare('copy')} className="cursor-pointer">
                    <Link2 className="mr-2 h-4 w-4" />
                    Copy Link
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
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
