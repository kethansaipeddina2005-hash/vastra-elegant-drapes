import Layout from "@/components/Layout";

const About = () => {
  return (
    <Layout>
      <div className="container mx-auto px-6 py-16">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl font-playfair font-bold text-foreground mb-6 text-center">
            About Vastra
          </h1>
          
          <div className="prose prose-lg max-w-none space-y-6">
            <p className="text-lg text-muted-foreground text-center mb-12">
              Celebrating Indian tradition through elegant sarees that blend timeless craftsmanship with modern style.
            </p>
            
            <section className="mb-12">
              <h2 className="text-3xl font-playfair font-semibold text-foreground mb-4">
                Our Story
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Vastra was born from a deep appreciation for the rich heritage of Indian textiles and the artistry of traditional saree weaving. Each saree in our collection tells a story of skilled artisans, generations of craftsmanship, and the timeless elegance that defines Indian fashion.
              </p>
            </section>
            
            <section className="mb-12">
              <h2 className="text-3xl font-playfair font-semibold text-foreground mb-4">
                Our Artisans
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                We work directly with master weavers across India, from the silk weavers of Varanasi to the cotton artisans of Chanderi. By supporting these traditional craftspeople, we help preserve ancient techniques while ensuring fair wages and sustainable practices.
              </p>
            </section>
            
            <section className="mb-12">
              <h2 className="text-3xl font-playfair font-semibold text-foreground mb-4">
                Quality Promise
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Every saree is handpicked for its quality, authenticity, and beauty. We use only the finest materials—pure silk, soft cotton, and delicate georgette—ensuring each piece is a masterpiece that can be treasured for generations.
              </p>
            </section>
            
            <section>
              <h2 className="text-3xl font-playfair font-semibold text-foreground mb-4">
                Cultural Heritage
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                The saree is more than just clothing—it's a symbol of grace, culture, and confidence. At Vastra, we honor this heritage by offering sarees that reflect the diversity and richness of Indian textile traditions, from Banarasi brocades to Kanjivaram silk.
              </p>
            </section>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default About;
