import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import heroImage from "@/assets/hero-saree.jpg";

interface Banner {
  id: string;
  title: string;
  subtitle: string | null;
  image_url: string;
  link_url: string | null;
  display_order: number | null;
}

const Hero = () => {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [currentBanner, setCurrentBanner] = useState(0);
  const [loading, setLoading] = useState(true);

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
        setBanners(data);
      }
    } catch (error) {
      console.error("Error fetching banners:", error);
    } finally {
      setLoading(false);
    }
  };

  const nextBanner = () => {
    setCurrentBanner((prev) => (prev + 1) % banners.length);
  };

  const prevBanner = () => {
    setCurrentBanner((prev) => (prev - 1 + banners.length) % banners.length);
  };

  // Auto-advance banners every 5 seconds
  useEffect(() => {
    if (banners.length > 1) {
      const interval = setInterval(nextBanner, 5000);
      return () => clearInterval(interval);
    }
  }, [banners.length]);

  const activeBanner = banners.length > 0 ? banners[currentBanner] : null;

  return (
    <section id="home" className="relative min-h-[600px] md:min-h-[700px] flex items-center">
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-all duration-500"
        style={{ backgroundImage: `url(${activeBanner?.image_url || heroImage})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/70 to-transparent" />
      </div>
      
      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-2xl space-y-6 animate-fade-in">
          <h2 className="text-5xl md:text-7xl font-playfair font-bold text-foreground leading-tight">
            {activeBanner?.title || "Grace in Every Drape"}
          </h2>
          <p className="text-xl md:text-2xl text-muted-foreground font-light">
            {activeBanner?.subtitle || "The Essence of Indian Elegance"}
          </p>
          <Link to={activeBanner?.link_url || "/collections"}>
            <Button 
              size="lg"
              className="bg-secondary text-foreground hover:bg-primary hover:text-primary-foreground transition-all duration-300 shadow-lg hover:shadow-xl px-8 py-6 text-lg"
            >
              Shop Now
            </Button>
          </Link>
        </div>
      </div>

      {/* Navigation arrows - only show if multiple banners */}
      {banners.length > 1 && (
        <>
          <button
            onClick={prevBanner}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-background/50 hover:bg-background/80 text-foreground rounded-full p-2 transition-all"
            aria-label="Previous banner"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={nextBanner}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-background/50 hover:bg-background/80 text-foreground rounded-full p-2 transition-all"
            aria-label="Next banner"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          {/* Dots indicator */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex gap-2">
            {banners.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentBanner(index)}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentBanner ? "bg-primary w-8" : "bg-background/50"
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
