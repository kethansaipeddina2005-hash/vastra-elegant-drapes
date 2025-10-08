import Header from "@/components/Header";
import Hero from "@/components/Hero";
import FeaturedSarees from "@/components/FeaturedSarees";
import About from "@/components/About";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <Hero />
        <FeaturedSarees />
        <About />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
