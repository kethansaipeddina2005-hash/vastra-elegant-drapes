import Layout from "@/components/Layout";
import { Card } from "@/components/ui/card";

const About = () => {
  return (
    <Layout>
      <div className="container mx-auto px-6 py-16">
        {/* Brand Story */}
        <div className="max-w-4xl mx-auto mb-16">
          <h1 className="text-5xl font-playfair font-bold text-foreground mb-6 text-center">
            About Vastra
          </h1>
          <p className="text-lg text-muted-foreground text-center mb-8">
            Preserving the Art of Traditional Indian Textiles
          </p>
          <p className="text-foreground leading-relaxed mb-6">
            Vastra was born from a deep appreciation for the timeless beauty and craftsmanship of traditional Indian sarees. 
            Our journey began with a simple mission: to connect women who value cultural heritage with authentic, handcrafted 
            sarees that tell stories of India's rich textile traditions.
          </p>
          <p className="text-foreground leading-relaxed">
            Each saree in our collection is carefully selected to represent the finest craftsmanship from different regions 
            of India. We work directly with skilled artisans and weavers, ensuring fair compensation and preserving traditional 
            weaving techniques that have been passed down through generations.
          </p>
        </div>

        {/* Quality Promise */}
        <div className="bg-card rounded-lg p-8 mb-16 border border-border">
          <h2 className="text-3xl font-playfair font-bold text-foreground mb-6 text-center">
            Our Quality Promise
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-4xl mb-4">🎨</div>
              <h3 className="text-xl font-semibold mb-2">Authentic Materials</h3>
              <p className="text-muted-foreground">
                Only genuine silk, cotton, and traditional fabrics sourced directly from weavers
              </p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-4">✨</div>
              <h3 className="text-xl font-semibold mb-2">Handcrafted Excellence</h3>
              <p className="text-muted-foreground">
                Each saree is a masterpiece, woven by skilled artisans with years of experience
              </p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-4">🛡️</div>
              <h3 className="text-xl font-semibold mb-2">Quality Assurance</h3>
              <p className="text-muted-foreground">
                Every piece is carefully inspected to ensure it meets our high standards
              </p>
            </div>
          </div>
        </div>

        {/* Cultural Heritage */}
        <div className="max-w-4xl mx-auto mb-16">
          <h2 className="text-3xl font-playfair font-bold text-foreground mb-6 text-center">
            Celebrating Cultural Heritage
          </h2>
          <p className="text-foreground leading-relaxed mb-6">
            The saree is more than just a garment—it's a symbol of Indian culture, tradition, and feminine grace. 
            With a history spanning over 5,000 years, the saree has evolved while maintaining its essential elegance 
            and cultural significance.
          </p>
          <p className="text-foreground leading-relaxed">
            At Vastra, we honor this heritage by offering sarees that showcase the diversity of India's textile 
            traditions—from the intricate Banarasi silk to the elegant Kanjivaram, from the delicate Chanderi to 
            the vibrant Bandhani. Each region brings its unique weaving techniques, patterns, and stories.
          </p>
        </div>

        {/* Artisan Stories */}
        <div className="bg-muted/30 rounded-lg p-8">
          <h2 className="text-3xl font-playfair font-bold text-foreground mb-8 text-center">
            Supporting Our Artisans
          </h2>
          <p className="text-foreground leading-relaxed text-center max-w-3xl mx-auto">
            Behind every saree is a dedicated artisan whose skill and passion bring these beautiful textiles to life. 
            By choosing Vastra, you're not just purchasing a saree—you're supporting traditional craftsmanship, 
            preserving cultural heritage, and empowering artisan communities across India. We ensure fair wages, 
            ethical working conditions, and sustainable practices in all our partnerships.
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default About;
