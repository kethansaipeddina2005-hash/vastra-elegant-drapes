import Layout from "@/components/Layout";
import Hero from "@/components/Hero";
import FeaturedSarees from "@/components/FeaturedSarees";
import About from "@/components/About";
import Newsletter from "@/components/Newsletter";

const Index = () => {
  return (
    <Layout>
      <Hero />
      <FeaturedSarees />
      <About />
      <Newsletter />
    </Layout>
  );
};

export default Index;
