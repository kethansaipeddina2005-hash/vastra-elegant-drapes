import { lazy, Suspense } from "react";
import Layout from "@/components/Layout";
import Hero from "@/components/Hero";
import ScarcityRibbon from "@/components/ScarcityRibbon";
import FeaturedSarees from "@/components/FeaturedSarees";
import CategorySection from "@/components/CategorySection";
import TrustStrip from "@/components/TrustStrip";
import LazySection from "@/components/LazySection";
import DeferUntilIdle from "@/components/DeferUntilIdle";
import SEO, { getOrganizationSchema, getWebsiteSchema, getFAQSchema, getLocalBusinessSchema } from "@/components/SEO";

// Below-the-fold sections: split into their own chunks and mounted on approach
const About = lazy(() => import("@/components/About"));
const Newsletter = lazy(() => import("@/components/Newsletter"));
const RecentlyViewedProducts = lazy(() =>
  import("@/components/RecentlyViewedProducts").then((m) => ({ default: m.RecentlyViewedProducts })),
);
const PopupAd = lazy(() => import("@/components/PopupAd"));

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
      <TrustStrip />
      <CategorySection />
      <FeaturedSarees />
      <Suspense fallback={null}>
        <LazySection minHeight={0} className="container mx-auto px-4">
          <RecentlyViewedProducts maxItems={4} />
        </LazySection>
        <LazySection minHeight={420}>
          <About />
        </LazySection>
        <LazySection minHeight={280}>
          <Newsletter />
        </LazySection>
        <DeferUntilIdle>
          <PopupAd />
        </DeferUntilIdle>
      </Suspense>
    </Layout>
  );
};

export default Index;
