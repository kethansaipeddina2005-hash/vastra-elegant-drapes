import Layout from "@/components/Layout";
import Hero from "@/components/Hero";
import FeaturedSarees from "@/components/FeaturedSarees";
import About from "@/components/About";
import Newsletter from "@/components/Newsletter";
import { RecentlyViewedProducts } from "@/components/RecentlyViewedProducts";
import CategorySection from "@/components/CategorySection";
import SEO, { getOrganizationSchema, getWebsiteSchema } from "@/components/SEO";

const Index = () => {
  const structuredData = [
    getOrganizationSchema(),
    getWebsiteSchema(),
  ];

  return (
    <Layout>
      <SEO 
        title="Vastra — Grace in Every Drape | Handcrafted Indian Sarees"
        description="Discover elegant handcrafted Indian sarees at Vastra. Shop authentic Banarasi, Kanjivaram, Chanderi sarees. Traditional craftsmanship meets modern style."
        canonical="/"
        structuredData={structuredData}
      />
      <Hero />
      <CategorySection />
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
