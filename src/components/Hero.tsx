import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState, useRef, useCallback } from "react";
import { ChevronLeft, ChevronRight, Video } from "lucide-react";
import heroImage from "@/assets/hero-saree.jpg";
import { Helmet } from "react-helmet-async";
import { buildSrcSet, optimizedImage, HERO_WIDTHS } from "@/lib/image";

interface Banner {
  id: string;
  title: string;
  subtitle: string | null;
  image_url: string;
  link_url: string | null;
  display_order: number | null;
}

const Hero = () => {
  const defaultBanner: Banner = {
    id: 'default',
    title: 'Grace in Every Drape',
    subtitle: 'The Essence of Indian Elegance',
    image_url: heroImage,
    link_url: '/collections',
    display_order: 0
  };

  const [banners, setBanners] = useState<Banner[]>([defaultBanner]);
  const [currentBanner, setCurrentBanner] = useState(0);
  const [loading, setLoading] = useState(true);

  // Touch swipe state
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const autoplayRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    try {
      const { data, error } = await supabase
        .from("banners")
        .select("*")
        .eq("is_active", true)
        .order("display_order", { ascending: true });

      if (error) throw error;
      
      if (data && data.length > 0) {
        setBanners([defaultBanner, ...data]);
      }
    } catch (error) {
      console.error("Error fetching banners:", error);
    } finally {
      setLoading(false);
    }
  };

  const nextBanner = useCallback(() => {
    setCurrentBanner((prev) => (prev + 1) % banners.length);
  }, [banners.length]);

  const prevBanner = useCallback(() => {
    setCurrentBanner((prev) => (prev - 1 + banners.length) % banners.length);
  }, [banners.length]);

  // Auto-advance banners
  useEffect(() => {
    if (banners.length > 1) {
      autoplayRef.current = setInterval(nextBanner, 5000);
      return () => {
        if (autoplayRef.current) clearInterval(autoplayRef.current);
      };
    }
  }, [banners.length, nextBanner]);

  // Reset autoplay timer on manual interaction
  const resetAutoplay = useCallback(() => {
    if (autoplayRef.current) clearInterval(autoplayRef.current);
    if (banners.length > 1) {
      autoplayRef.current = setInterval(nextBanner, 5000);
    }
  }, [banners.length, nextBanner]);

  // Touch handlers for swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    const diff = touchStartX.current - touchEndX.current;
    const threshold = 50;
    if (Math.abs(diff) > threshold) {
      if (diff > 0) {
        nextBanner();
      } else {
        prevBanner();
      }
      resetAutoplay();
    }
  };

  const goToBanner = (index: number) => {
    setCurrentBanner(index);
    resetAutoplay();
  };

  const activeBanner = banners.length > 0 ? banners[currentBanner] : null;
  const heroSrc = activeBanner?.image_url || heroImage;
  const heroSrcSet = buildSrcSet(heroSrc, HERO_WIDTHS, { quality: 85, aspectRatio: 16 / 9 });
  const heroPreloadHref = optimizedImage(heroSrc, { width: 1280, height: 720, quality: 85 });

  return (
    <section
      id="home"
      className="relative min-h-[90vh] md:min-h-[700px] flex items-center overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Preload the LCP hero image */}
      <Helmet>
        <link
          rel="preload"
          as="image"
          href={heroPreloadHref}
          {...(heroSrcSet ? { imagesrcset: heroSrcSet, imagesizes: "100vw" } : {})}
        />
      </Helmet>
      <div className="absolute inset-0 transition-all duration-700 ease-in-out">
        <img
          src={optimizedImage(heroSrc, { width: 1600, height: 900, quality: 85 })}
          srcSet={heroSrcSet}
          sizes="100vw"
          alt={activeBanner?.title || "Handcrafted luxury saree from Vastra Luxe"}
          width={1600}
          height={900}
          loading="eager"
          {...{ fetchpriority: "high" }}
          decoding="sync"
          className="absolute inset-0 w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/70 to-transparent" />
      </div>
      
      <div className="container mx-auto px-6 relative z-10 py-12 md:py-16">
        <div className="max-w-xl md:max-w-2xl animate-fade-in text-left">
          <h1 className="text-[2rem] leading-[1.12] sm:text-5xl md:text-6xl font-playfair font-bold text-foreground text-balance break-words mb-3 sm:mb-4 md:mb-5">
            {activeBanner?.title || "Grace in Every Drape"}
          </h1>
          <p className="text-base sm:text-xl md:text-2xl text-muted-foreground font-light max-w-md md:max-w-xl text-pretty leading-relaxed mb-5 sm:mb-7">
            {activeBanner?.subtitle || "The Essence of Indian Elegance"}
          </p>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-2">
            <Link to={activeBanner?.link_url || "/collections"} className="inline-block">
              <Button
                size="lg"
                className="w-full sm:w-auto bg-secondary text-foreground hover:bg-primary hover:text-primary-foreground transition-all duration-300 shadow-lg hover:shadow-xl px-7 sm:px-8 py-5 sm:py-6 text-base sm:text-lg"
              >
                Shop Collection
              </Button>
            </Link>
            <a
              href={`https://wa.me/917997909061?text=${encodeURIComponent("Hi Vastra Luxe! I'd like to book a video call shopping session.")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block"
            >
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto border-primary/40 bg-background/60 backdrop-blur-sm text-foreground hover:bg-primary/10 transition-all duration-300 px-7 sm:px-8 py-5 sm:py-6 text-base sm:text-lg"
              >
                <Video className="w-4 h-4 mr-2" aria-hidden="true" />
                Book Video Call Shopping
              </Button>
            </a>
          </div>
        </div>
      </div>

      {/* Navigation arrows */}
      {banners.length > 1 && (
        <>
          <button
            onClick={() => { prevBanner(); resetAutoplay(); }}
            className="absolute left-3 top-1/2 -translate-y-1/2 z-20 bg-background/50 hover:bg-background/80 active:bg-background/90 text-foreground rounded-full p-2.5 transition-all"
            aria-label="Previous banner"
          >
            <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
          </button>
          <button
            onClick={() => { nextBanner(); resetAutoplay(); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 z-20 bg-background/50 hover:bg-background/80 active:bg-background/90 text-foreground rounded-full p-2.5 transition-all"
            aria-label="Next banner"
          >
            <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
          </button>

          {/* Dots indicator */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-2">
            {banners.map((_, index) => (
              <button
                key={index}
                onClick={() => goToBanner(index)}
                className={`h-2.5 rounded-full transition-all duration-300 ${
                  index === currentBanner ? "bg-primary w-8" : "bg-background/50 w-2.5"
                }`}
                aria-label={`Go to banner ${index + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
};

export default Hero;