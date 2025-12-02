import Layout from "@/components/Layout";
import Hero from "@/components/Hero";
import FeaturedSarees from "@/components/FeaturedSarees";
import About from "@/components/About";
import Newsletter from "@/components/Newsletter";
import { RecentlyViewedProducts } from "@/components/RecentlyViewedProducts";

const Index = () => {
  return (
    <Layout>
      <Hero />
      <FeaturedSarees />
      <div className="container mx-auto px-4">
        <RecentlyViewedProducts maxItems={4} />
      </div>
      <About />
      <Newsletter />
    </Layout>
  );
};

export default Index;
