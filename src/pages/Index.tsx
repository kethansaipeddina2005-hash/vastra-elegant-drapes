import Layout from "@/components/Layout";
import Hero from "@/components/Hero";
import FeaturedSarees from "@/components/FeaturedSarees";
import About from "@/components/About";
import Newsletter from "@/components/Newsletter";
import { RecentlyViewedProducts } from "@/components/RecentlyViewedProducts";
import CategorySection from "@/components/CategorySection";
import SEO, { getOrganizationSchema, getWebsiteSchema, getFAQSchema, getLocalBusinessSchema } from "@/components/SEO";
import PopupAd from "@/components/PopupAd";

const Index = () => {
  const faqSchema = getFAQSchema([
    { question: "Does Vastra Luxe ship worldwide?", answer: "Yes. We ship luxury designer sarees worldwide, including the USA, Canada, UK, Australia, UAE, Singapore and Germany, with tracked international delivery." },
    { question: "Are Vastra Luxe sarees authentic handcrafted silk?", answer: "Every saree is handpicked from master weavers — authentic Kanchipuram silk, pure Banarasi silk, soft silk and handloom sarees, limited to 50 exclusive pieces per collection." },
    { question: "Can I shop luxury sarees over WhatsApp video?", answer: "Yes. Book a live WhatsApp video shopping session with a stylist to view drape, fabric sheen and zari work in real time before you buy." },
    { question: "What makes a saree a bridal or wedding saree?", answer: "Bridal silk sarees typically feature heavy zari work, rich pallus and traditional motifs in Kanchipuram or Banarasi silk — ideal for weddings, receptions and festive occasions." },
  ]);

  const structuredData = [
    getOrganizationSchema(),
    getWebsiteSchema(),
    getLocalBusinessSchema(),
    faqSchema,
  ];

  return (
    <Layout>
      <SEO 
        title="Luxury Designer Sarees Online | Vastra Luxe — Silk & Bridal"
        description="Vastra Luxe curates exclusive luxury designer sarees — Kanchipuram, Banarasi & bridal silk. 50 handpicked pieces per collection with worldwide shipping."
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
      <PopupAd />
    </Layout>
  );
};

export default Index;
