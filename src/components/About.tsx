const About = () => {
  return (
    <section id="about" className="py-20 px-6 bg-card">
      <div className="container mx-auto max-w-4xl text-center space-y-6">
        <h2 className="text-4xl md:text-5xl font-playfair font-bold text-foreground">
          About Vastra
        </h2>
        <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
          Vastra celebrates Indian tradition through elegant sarees that blend timeless 
          craftsmanship with modern style. Each saree is designed to reflect grace, culture, 
          and confidence.
        </p>
        <div className="w-24 h-1 bg-gold mx-auto mt-8" />
      </div>
    </section>
  );
};

export default About;
