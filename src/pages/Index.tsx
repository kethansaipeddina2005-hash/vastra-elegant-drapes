import { lazy, Suspense } from "react";
import { Link } from "react-router-dom";
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
        title="Vastra Luxe | Premium Dresses & Luxury Sarees"
        description="Explore customized premium dresses, exclusive luxury sarees and premium silk sarees at Vastra Luxe. Discover distinctive styles for special occasions."
        canonical="/"
        structuredData={structuredData}
      />
      <Hero />
      <ScarcityRibbon />
      <TrustStrip />
      <section className="container mx-auto px-4 pt-8 md:pt-12">
        <h1 className="max-w-3xl text-2xl md:text-3xl font-playfair font-bold text-foreground leading-tight">
          Discover Customized Premium Dresses &amp; Exclusive Luxury Sarees
        </h1>
        <p className="max-w-3xl mt-4 text-sm md:text-base text-muted-foreground leading-relaxed">
          Explore Vastra Luxe through two collections: <Link to="/dresses" className="text-primary underline underline-offset-4">premium dresses</Link> and <Link to="/sarees" className="text-primary underline underline-offset-4">luxury sarees</Link>.
          {' '}Compare fabrics, colors and occasion details on each product. For dresses with a size chart, choose from the listed measurements and available sizes; any customization should be confirmed for the individual design before ordering.
        </p>
      </section>
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
