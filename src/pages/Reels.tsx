import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Heart, Share2, ShoppingBag, Volume2, VolumeX, ChevronUp, ChevronDown, Play, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useWishlist } from '@/contexts/WishlistContext';
import { useCart } from '@/contexts/CartContext';
import { Product } from '@/types/product';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import Layout from '@/components/Layout';
import { Loading } from '@/components/ui/loading';

interface Reel {
  id: number;
  videoUrl: string;
  product: Product;
}

const Reels = () => {
  const [reels, setReels] = useState<Reel[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState<{ [key: number]: boolean }>({});
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<{ [key: number]: HTMLVideoElement | null }>({});
  const navigate = useNavigate();
  
  // Touch/swipe handling
  const touchStartY = useRef<number | null>(null);
  const touchEndY = useRef<number | null>(null);
  const minSwipeDistance = 50;
  
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const { addToCart } = useCart();

  useEffect(() => {
    fetchReels();
  }, []);

  const fetchReels = async () => {
    try {
      setLoading(true);
      
      // Fetch products that have videos
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .not('videos', 'is', null)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform data to reels format - one reel per video
      const reelsData: Reel[] = [];
      
      (data || []).forEach((product: any) => {
        const videos = product.videos || [];
        videos.forEach((videoUrl: string) => {
          reelsData.push({
            id: product.id,
            videoUrl,
            product: {
              id: product.id,
              name: product.name,
              price: Number(product.price),
              description: product.description || '',
              image: product.images?.[0] || '',
              images: product.images || [],
              videos: product.videos || [],
              fabricType: product.fabric_type || '',
              color: product.color || '',
              occasion: product.occasion || '',
              region: product.region || '',
              stockQuantity: product.stock_quantity || 0,
              isNew: product.is_new || false,
              rating: Number(product.rating) || 0,
              reviews: product.reviews || 0,
            },
          });
        });
      });

      setReels(reelsData);
    } catch (error) {
      console.error('Error fetching reels:', error);
      toast.error('Failed to load reels');
    } finally {
      setLoading(false);
    }
  };

  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;
    
    const container = containerRef.current;
    const scrollTop = container.scrollTop;
    const itemHeight = container.clientHeight;
    const newIndex = Math.round(scrollTop / itemHeight);
    
    if (newIndex !== currentIndex && newIndex >= 0 && newIndex < reels.length) {
      setCurrentIndex(newIndex);
    }
  }, [currentIndex, reels.length]);

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll]);

  // Auto-play current video and pause others
  useEffect(() => {
    Object.entries(videoRefs.current).forEach(([index, video]) => {
      if (video) {
        if (parseInt(index) === currentIndex) {
          video.muted = isMuted;
          video.play().catch(() => {});
          setIsPlaying(prev => ({ ...prev, [parseInt(index)]: true }));
        } else {
          video.pause();
          video.currentTime = 0;
          setIsPlaying(prev => ({ ...prev, [parseInt(index)]: false }));
        }
      }
    });
  }, [currentIndex, isMuted]);

  const scrollToIndex = (index: number) => {
    if (containerRef.current && index >= 0 && index < reels.length) {
      containerRef.current.scrollTo({
        top: index * containerRef.current.clientHeight,
        behavior: 'smooth',
      });
    }
  };

  // Touch event handlers for swipe gestures
  const onTouchStart = (e: React.TouchEvent) => {
    touchEndY.current = null;
    touchStartY.current = e.targetTouches[0].clientY;
  };

  const onTouchMove = (e: React.TouchEvent) => {
    touchEndY.current = e.targetTouches[0].clientY;
  };

  const onTouchEnd = () => {
    if (!touchStartY.current || !touchEndY.current) return;
    
    const distance = touchStartY.current - touchEndY.current;
    const isSwipeUp = distance > minSwipeDistance;
    const isSwipeDown = distance < -minSwipeDistance;
    
    if (isSwipeUp && currentIndex < reels.length - 1) {
      scrollToIndex(currentIndex + 1);
    } else if (isSwipeDown && currentIndex > 0) {
      scrollToIndex(currentIndex - 1);
    }
    
    // Reset
    touchStartY.current = null;
    touchEndY.current = null;
  };

  const handleVideoClick = (index: number) => {
    const video = videoRefs.current[index];
    if (video) {
      if (video.paused) {
        video.play();
        setIsPlaying(prev => ({ ...prev, [index]: true }));
      } else {
        video.pause();
        setIsPlaying(prev => ({ ...prev, [index]: false }));
      }
    }
  };

  const handleLike = (product: Product) => {
    if (isInWishlist(product.id)) {
      removeFromWishlist(product.id);
      toast.success('Removed from wishlist');
    } else {
      addToWishlist(product);
      toast.success('Added to wishlist');
    }
  };

  const handleAddToCart = (product: Product) => {
    addToCart(product, 1);
    toast.success('Added to cart');
  };

  const handleBuyNow = (product: Product) => {
    addToCart(product, 1);
    navigate('/checkout');
  };

  const handleShare = async (product: Product) => {
    const url = `${window.location.origin}/product/${product.id}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied to clipboard');
    } catch {
      toast.error('Failed to copy link');
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loading size="lg" />
        </div>
      </Layout>
    );
  }

  if (reels.length === 0) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
          <Play className="h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-2xl font-playfair font-semibold mb-2">No Reels Yet</h2>
          <p className="text-muted-foreground text-center mb-4">
            Check back later for exciting product videos!
          </p>
          <Link to="/collections">
            <Button>Browse Collections</Button>
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <div className="fixed inset-0 bg-background z-50">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 p-4 bg-gradient-to-b from-background via-background/80 to-transparent">
        <div className="flex items-center justify-between">
          <Link to="/" className="text-foreground font-playfair text-xl font-semibold flex items-center gap-2">
            <Play className="h-5 w-5 fill-primary text-primary" />
            Vastra Reels
          </Link>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setIsMuted(!isMuted)}
              className="border-primary/30 hover:bg-primary/10"
            >
              {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
            </Button>
            <Link to="/">
              <Button variant="outline" size="sm" className="border-primary/30 hover:bg-primary/10">
                Close
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Navigation Arrows */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 z-10 flex flex-col gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={() => scrollToIndex(currentIndex - 1)}
          disabled={currentIndex === 0}
          className="border-primary/30 bg-card/80 backdrop-blur-sm hover:bg-primary/10 disabled:opacity-30"
        >
          <ChevronUp className="h-6 w-6" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => scrollToIndex(currentIndex + 1)}
          disabled={currentIndex === reels.length - 1}
          className="border-primary/30 bg-card/80 backdrop-blur-sm hover:bg-primary/10 disabled:opacity-30"
        >
          <ChevronDown className="h-6 w-6" />
        </Button>
      </div>

      {/* Reels Container */}
      <div
        ref={containerRef}
        className="h-full w-full overflow-y-scroll snap-y snap-mandatory scrollbar-hide touch-pan-y pt-16"
        style={{ scrollSnapType: 'y mandatory' }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {reels.map((reel, index) => (
          <div
            key={`${reel.id}-${index}`}
            className="h-full w-full snap-start snap-always relative flex items-center justify-center bg-muted/30"
          >
            {/* Video */}
            <video
              ref={(el) => { videoRefs.current[index] = el; }}
              src={reel.videoUrl}
              className="h-full w-full object-contain bg-muted/20 cursor-pointer rounded-lg shadow-lg"
              loop
              muted
              playsInline
              autoPlay={index === 0}
              onClick={() => handleVideoClick(index)}
              onLoadedData={(e) => {
                if (index === currentIndex) {
                  e.currentTarget.play().catch(() => {});
                  setIsPlaying(prev => ({ ...prev, [index]: true }));
                }
              }}
            />

            {/* Play/Pause Indicator */}
            {!isPlaying[index] && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="bg-card/80 backdrop-blur-sm rounded-full p-4 shadow-lg">
                  <Play className="h-12 w-12 text-primary fill-primary" />
                </div>
              </div>
            )}

            {/* Product Info & Actions */}
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background via-background/80 to-transparent">
              <div className="flex items-end justify-between gap-4">
                {/* Product Details */}
                <div className="flex-1 text-foreground">
                  <Link 
                    to={`/product/${reel.product.id}`}
                    className="block hover:underline"
                  >
                    <h3 className="font-playfair text-lg font-semibold line-clamp-2 mb-1">
                      {reel.product.name}
                    </h3>
                  </Link>
                  <p className="text-muted-foreground text-sm line-clamp-2 mb-2">
                    {reel.product.description}
                  </p>
                  <p className="text-xl font-semibold text-primary">
                    ₹{reel.product.price.toLocaleString()}
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col items-center gap-4">
                  <button
                    onClick={() => handleLike(reel.product)}
                    className="flex flex-col items-center gap-1"
                  >
                    <div className={cn(
                      "p-2 rounded-full bg-card/80 backdrop-blur-sm transition-colors border border-border shadow-sm",
                      isInWishlist(reel.product.id) && "bg-destructive border-destructive"
                    )}>
                      <Heart 
                        className={cn(
                          "h-6 w-6 text-foreground",
                          isInWishlist(reel.product.id) && "text-destructive-foreground fill-destructive-foreground"
                        )} 
                      />
                    </div>
                    <span className="text-foreground text-xs">Like</span>
                  </button>

                  <button
                    onClick={() => handleShare(reel.product)}
                    className="flex flex-col items-center gap-1"
                  >
                    <div className="p-2 rounded-full bg-card/80 backdrop-blur-sm border border-border shadow-sm">
                      <Share2 className="h-6 w-6 text-foreground" />
                    </div>
                    <span className="text-foreground text-xs">Share</span>
                  </button>

                  <button
                    onClick={() => handleAddToCart(reel.product)}
                    className="flex flex-col items-center gap-1"
                  >
                    <div className="p-2 rounded-full bg-card/80 backdrop-blur-sm border border-border shadow-sm">
                      <ShoppingBag className="h-6 w-6 text-foreground" />
                    </div>
                    <span className="text-foreground text-xs">Cart</span>
                  </button>

                  <button
                    onClick={() => handleBuyNow(reel.product)}
                    className="flex flex-col items-center gap-1"
                  >
                    <div className="p-2 rounded-full bg-primary backdrop-blur-sm shadow-sm">
                      <Zap className="h-6 w-6 text-primary-foreground" />
                    </div>
                    <span className="text-foreground text-xs">Buy Now</span>
                  </button>

                  <Link to={`/product/${reel.product.id}`}>
                    <Button 
                      size="sm" 
                      className="text-xs px-3"
                    >
                      View
                    </Button>
                  </Link>
                </div>
              </div>
            </div>

            {/* Progress Indicator */}
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col gap-1">
              {reels.map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "w-1 rounded-full transition-all duration-300",
                    i === currentIndex 
                      ? "h-6 bg-primary" 
                      : "h-2 bg-muted"
                  )}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Reel Counter */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-card/90 backdrop-blur-sm px-3 py-1 rounded-full border border-border shadow-sm">
        <span className="text-foreground text-sm">
          {currentIndex + 1} / {reels.length}
        </span>
      </div>
    </div>
  );
};

export default Reels;
