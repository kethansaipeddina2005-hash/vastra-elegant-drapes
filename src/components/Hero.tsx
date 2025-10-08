import { Button } from "@/components/ui/button";
import heroImage from "@/assets/hero-saree.jpg";

const Hero = () => {
  return (
    <section id="home" className="relative min-h-[600px] md:min-h-[700px] flex items-center">
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${heroImage})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/70 to-transparent" />
      </div>
      
      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-2xl space-y-6 animate-fade-in">
          <h2 className="text-5xl md:text-7xl font-playfair font-bold text-foreground leading-tight">
            Grace in Every Drape
          </h2>
          <p className="text-xl md:text-2xl text-muted-foreground font-light">
            The Essence of Indian Elegance
          </p>
          <Button 
            size="lg"
            className="bg-secondary text-foreground hover:bg-primary hover:text-primary-foreground transition-all duration-300 shadow-lg hover:shadow-xl px-8 py-6 text-lg"
          >
            Shop Now
          </Button>
        </div>
      </div>
    </section>
  );
};

export default Hero;
