import { useParams, Link, useNavigate } from "react-router-dom";
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
import { useRecentlyViewed } from "@/contexts/RecentlyViewedContext";
import { toast } from "@/hooks/use-toast";
import { Loading } from "@/components/ui/loading";
import { MediaCarousel } from "@/components/MediaCarousel";
import { RecentlyViewedProducts } from "@/components/RecentlyViewedProducts";
import { ProductReviews } from "@/components/reviews/ProductReviews";
import SEO, { getProductSchema, getBreadcrumbSchema } from "@/components/SEO";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const { addToCart } = useCart();
  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist();
  const { addToRecentlyViewed } = useRecentlyViewed();
  
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

      // Fetch categories for this product
      const { data: categoryMappings } = await supabase
        .from('product_categories')
        .select('category_id, categories(name)')
        .eq('product_id', data.id);

      const categoryIds = (categoryMappings || []).map((m: any) => m.category_id);
      const categoryNames = (categoryMappings || [])
        .map((m: any) => m.categories?.name)
        .filter(Boolean);

      const transformedProduct: Product = {
        id: data.id,
        name: data.name,
        price: Number(data.price),
        description: data.description || '',
        image: data.images?.[0] || '',
        images: data.images || [],
        videos: data.videos || [],
        fabricType: data.fabric_type || '',
        color: data.color || '',
        occasion: data.occasion || '',
        region: data.region || '',
        stockQuantity: data.stock_quantity || 0,
        isNew: data.is_new || false,
        rating: Number(data.rating) || 0,
        reviews: data.reviews || 0,
        categoryIds,
        categoryNames,
      };

      setProduct(transformedProduct);
      addToRecentlyViewed(transformedProduct);

      // Fetch related products based on multiple criteria
      const { data: relatedData } = await supabase
        .from('products')
        .select('*')
        .neq('id', transformedProduct.id)
        .limit(6);

      if (relatedData && relatedData.length > 0) {
        // Score and sort by relevance
        const scoredProducts = relatedData.map((p) => {
          let score = 0;
          if (p.fabric_type === transformedProduct.fabricType) score += 3;
          if (p.occasion?.includes(transformedProduct.occasion?.split(',')[0])) score += 2;
          if (p.region?.trim() === transformedProduct.region?.trim()) score += 2;
          if (p.color === transformedProduct.color) score += 1;
          // Price similarity (within 50% range)
          const priceDiff = Math.abs(Number(p.price) - transformedProduct.price) / transformedProduct.price;
          if (priceDiff <= 0.5) score += 1;
          return { product: p, score };
        });

        // Sort by score and take top 4
        const sortedProducts = scoredProducts
          .sort((a, b) => b.score - a.score)
          .slice(0, 4)
          .map(({ product: p }) => ({
            id: p.id,
            name: p.name,
            price: Number(p.price),
            description: p.description || '',
            image: p.images?.[0] || '',
            images: p.images || [],
            videos: p.videos || [],
            fabricType: p.fabric_type || '',
            color: p.color || '',
            occasion: p.occasion || '',
            region: p.region || '',
            stockQuantity: p.stock_quantity || 0,
            isNew: p.is_new || false,
            rating: Number(p.rating) || 0,
            reviews: p.reviews || 0,
          }));
        
        setRelatedProducts(sortedProducts);
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
  
  const productSchema = getProductSchema({
    name: product.name,
    description: product.description,
    price: product.price,
    images: product.images,
    rating: product.rating,
    reviewCount: product.reviews,
    inStock: product.stockQuantity > 0,
  });

  const breadcrumbSchema = getBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Collections', url: '/collections' },
    { name: product.name, url: `/product/${product.id}` },
  ]);

  return (
    <Layout>
      <SEO 
        title={`${product.name} | Vastra — Handcrafted Indian Sarees`}
        description={product.description.slice(0, 155) + '...'}
        canonical={`/product/${product.id}`}
        ogType="product"
        ogImage={product.images[0]}
        structuredData={[productSchema, breadcrumbSchema]}
      />
      <div className="container mx-auto px-4 py-4 max-w-6xl">
        <Breadcrumb className="mb-3">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/" className="text-xs">Home</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/collections" className="text-xs">Collections</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="text-xs">{product.name}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        
        <div className="grid md:grid-cols-2 gap-4 md:gap-6 mb-6">
          {/* Product Media Carousel */}
          <div className="w-full">
            <MediaCarousel 
              images={product.images}
              videos={product.videos}
              productName={product.name}
              productUrl={window.location.href}
            />
          </div>
          
          <div className="space-y-3 flex flex-col">
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                {product.categoryNames && product.categoryNames.length > 0 && (
                  <Link 
                    to={`/collections?category=${encodeURIComponent(product.categoryNames[0])}`}
                    className="text-xs text-muted-foreground uppercase tracking-wide hover:text-primary transition-colors"
                  >
                    {product.categoryNames.join(', ')}
                  </Link>
                )}
                {product.isNew && (
                  <span className="inline-block px-2 py-0.5 text-xs font-semibold bg-primary/10 text-primary rounded-full">
                    New
                  </span>
                )}
              </div>
              <h1 className="text-xl md:text-2xl font-playfair font-bold text-foreground leading-tight">
                {product.name}
              </h1>
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-bold text-primary">
                  ₹{product.price.toLocaleString('en-IN')}
                </p>
                {product.rating && (
                  <div className="flex items-center gap-1">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <span key={i} className={`text-sm ${i < Math.floor(product.rating!) ? 'text-gold' : 'text-muted'}`}>
                          ★
                        </span>
                      ))}
                    </div>
                    <span className="text-xs text-muted-foreground">({product.reviews})</span>
                  </div>
                )}
              </div>
            </div>

            {/* Product Description - Concise */}
            <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
              {product.description}
            </p>

            {/* Product Specs - Compact */}
            <div className="p-3 bg-muted/30 rounded-lg space-y-2 border border-border/50">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <p className="text-muted-foreground">Fabric</p>
                  <p className="font-semibold">{product.fabricType}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Color</p>
                  <p className="font-semibold">{product.color}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Region</p>
                  <p className="font-semibold">{product.region}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Occasion</p>
                  <p className="font-semibold">{product.occasion}</p>
                </div>
              </div>
              <div className="pt-2 border-t border-border/50">
                <p className={`text-xs font-semibold ${product.stockQuantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {product.stockQuantity > 0 ? `✓ In Stock (${product.stockQuantity})` : 'Out of Stock'}
                </p>
              </div>
            </div>

            {/* Quantity Selector - Compact */}
            <div className="flex items-center gap-3">
              <span className="text-xs font-medium text-muted-foreground">Qty:</span>
              <div className="flex items-center border border-border rounded-md overflow-hidden bg-background">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="h-8 w-8 p-0 rounded-none hover:bg-muted"
                >
                  <Minus className="h-3 w-3" />
                </Button>
                <span className="px-4 text-sm font-semibold">{quantity}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setQuantity(Math.min(product.stockQuantity, quantity + 1))}
                  className="h-8 w-8 p-0 rounded-none hover:bg-muted"
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            </div>

            {/* Action Buttons - Compact and Proportionate */}
            <div className="space-y-2 mt-auto">
              <Button 
                size="sm"
                className="w-full h-9 text-sm font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-300 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary"
                onClick={() => {
                  handleAddToCart();
                  navigate('/checkout');
                }}
              >
                <ShoppingCart className="mr-1.5 h-4 w-4" />
                Buy Now
              </Button>

              <div className="flex gap-2">
                <Button 
                  size="sm"
                  variant="outline" 
                  className="flex-1 h-9 text-sm rounded-lg" 
                  onClick={handleAddToCart}
                >
                  <ShoppingCart className="mr-1.5 h-3.5 w-3.5" />
                  Add to Cart
                </Button>
                <Button 
                  size="sm"
                  variant="outline" 
                  onClick={handleWishlist}
                  className={`h-9 w-9 p-0 rounded-lg ${inWishlist ? "text-primary border-primary" : ""}`}
                >
                  <Heart className={`h-4 w-4 transition-all ${inWishlist ? 'fill-primary' : ''}`} />
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="sm" variant="outline" className="h-9 w-9 p-0 rounded-lg">
                      <Share2 className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={() => handleShare('facebook')} className="cursor-pointer text-xs">
                      <Facebook className="mr-2 h-3.5 w-3.5" />
                      Facebook
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleShare('twitter')} className="cursor-pointer text-xs">
                      <Twitter className="mr-2 h-3.5 w-3.5" />
                      Twitter
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleShare('copy')} className="cursor-pointer text-xs">
                      <Link2 className="mr-2 h-3.5 w-3.5" />
                      Copy Link
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs - Compact */}
        <Tabs defaultValue="description" className="mb-6">
          <TabsList className="grid w-full grid-cols-4 max-w-lg h-9">
            <TabsTrigger value="description" className="text-xs">Description</TabsTrigger>
            <TabsTrigger value="reviews" className="text-xs">Reviews ({product.reviews || 0})</TabsTrigger>
            <TabsTrigger value="care" className="text-xs">Care</TabsTrigger>
            <TabsTrigger value="size" className="text-xs">Size</TabsTrigger>
          </TabsList>
          <TabsContent value="description" className="mt-3">
            <p className="text-sm text-muted-foreground leading-relaxed">{product.description}</p>
          </TabsContent>
          <TabsContent value="reviews" className="mt-3">
            <ProductReviews 
              productId={product.id} 
              productRating={product.rating}
              productReviewCount={product.reviews}
            />
          </TabsContent>
          <TabsContent value="care" className="mt-3">
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>• Dry clean only</li>
              <li>• Store in cool, dry place</li>
              <li>• Avoid direct sunlight</li>
              <li>• Iron on low heat</li>
            </ul>
          </TabsContent>
          <TabsContent value="size" className="mt-3">
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>• Length: 5.5m (18ft)</li>
              <li>• Width: 1.1m (44in)</li>
              <li>• Blouse: 80cm included</li>
            </ul>
          </TabsContent>
        </Tabs>

        {/* Similar Products - Smart Suggestions */}
        {relatedProducts.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg md:text-xl font-playfair font-bold text-foreground mb-4">
              You Might Also Like
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              Similar sarees based on fabric, occasion, and style
            </p>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {relatedProducts.map(product => (
                <ProductCard key={product.id} {...product} />
              ))}
            </div>
          </div>
        )}

        {/* Recently Viewed Products */}
        <RecentlyViewedProducts excludeProductId={product.id} maxItems={4} />
      </div>
    </Layout>
  );
};

export default ProductDetail;
