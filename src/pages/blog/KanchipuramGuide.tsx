import { Link } from "react-router-dom";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import SEO, { getArticleSchema, getBreadcrumbSchema, getFAQSchema } from "@/components/SEO";
import blogBanarasi from "@/assets/blog-banarasi.jpg";

const faqs = [
  {
    question: "How can I identify an authentic Kanchipuram silk saree?",
    answer:
      "Check for the Silk Mark label, the zari's reddish silk core under a burnt strand, the distinct joint (korvai) where the border is interlocked with the body, and the weight — a genuine Kanchipuram silk saree usually weighs between 500g and 900g.",
  },
  {
    question: "Why are Kanchipuram silk sarees expensive?",
    answer:
      "They are woven from pure mulberry silk with real zari containing silver and gold. A single saree takes two to three weeks on a handloom, and the body, border and pallu are woven separately and interlocked by hand.",
  },
  {
    question: "Where can I buy Kanchipuram silk sarees online?",
    answer:
      "Vastra Luxe curates limited-edition Kanchipuram silk sarees sourced directly from weaver families in Kanchipuram, with detail photography, WhatsApp video shopping and worldwide shipping.",
  },
  {
    question: "How should I care for a Kanchipuram silk saree?",
    answer:
      "Dry clean only, store rolled or folded in a cotton or muslin cloth away from sunlight, refold every three months to avoid permanent creases, and never spray perfume directly on the silk or zari.",
  },
];

const KanchipuramGuide = () => {
  const articleSchema = getArticleSchema({
    title: "Kanchipuram Silk Sarees: The Complete Buyer's Guide",
    description:
      "History, weaving techniques and authenticity markers of Kanchipuram silk sarees, plus how and where to buy them online.",
    datePublished: "2026-08-03",
  });

  const breadcrumbSchema = getBreadcrumbSchema([
    { name: "Home", url: "/" },
    { name: "Blog", url: "/blog" },
    { name: "Kanchipuram Silk Saree Guide", url: "/blog/kanchipuram-silk-saree-guide" },
  ]);

  return (
    <Layout>
      <SEO
        title="Kanchipuram Silk Sarees: Complete Buyer's Guide"
        description="How Kanchipuram silk sarees are woven, how to spot an authentic one, what they cost and where to buy Kanchipuram silk sarees online with worldwide shipping."
        canonical="/blog/kanchipuram-silk-saree-guide"
        ogType="article"
        structuredData={[articleSchema, breadcrumbSchema, getFAQSchema(faqs)]}
      />
      <article className="container mx-auto px-4 md:px-6 py-10 md:py-16">
        <div className="max-w-3xl mx-auto">
          <Link to="/blog">
            <Button variant="ghost" className="mb-6">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Blog
            </Button>
          </Link>

          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <Badge>Cultural</Badge>
              <span className="text-muted-foreground text-sm">10 min read</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-playfair font-bold text-foreground mb-4 text-balance">
              Kanchipuram Silk Sarees: The Complete Buyer's Guide
            </h1>
            <p className="text-lg text-muted-foreground">
              Everything you need before you buy Kanchipuram silk sarees online — the weaving
              tradition, the authenticity markers, fair pricing and how to care for them.
            </p>
          </div>

          <img
            src={blogBanarasi}
            alt="Close-up of handwoven Kanchipuram silk saree with gold zari border"
            loading="lazy"
            className="w-full aspect-video object-cover rounded-lg mb-10"
          />

          <div className="prose prose-lg max-w-none">
            <p className="text-foreground leading-relaxed mb-6">
              Woven in the temple town of Kanchipuram in Tamil Nadu, the Kanchipuram (or
              Kanjivaram) silk saree is India's most recognisable heritage textile. It is
              defined by three things: pure mulberry silk, real zari twisted around a silk
              core, and a border that is woven separately and then interlocked with the body
              by hand. That last detail — the korvai joint — is why a genuine Kanchipuram
              drapes with weight and holds its shape for decades.
            </p>

            <h2 className="text-2xl md:text-3xl font-playfair font-bold text-foreground mt-10 mb-4">
              A brief history of Kanchipuram weaving
            </h2>
            <p className="text-foreground leading-relaxed mb-6">
              Weaving communities — the Devangas and Saligars — are said to have settled in
              Kanchipuram over four centuries ago, drawn by temple patronage. Motifs were
              borrowed directly from temple architecture: the yali (mythical lion), the
              rudraksham bead, mangoes, peacocks and the checkered kattam. Under the Chola and
              later Vijayanagara rulers, the sarees became ceremonial garments, and to this day
              a Kanchipuram is the saree of choice for South Indian weddings and temple visits.
            </p>

            <h2 className="text-2xl md:text-3xl font-playfair font-bold text-foreground mt-10 mb-4">
              How a Kanchipuram silk saree is woven
            </h2>
            <p className="text-foreground leading-relaxed mb-4">
              A single saree can take two to three weeks on a pit loom, and often two weavers
              working together. The process runs roughly like this:
            </p>
            <ul className="list-disc pl-6 text-foreground space-y-2 mb-6">
              <li>
                <strong>Silk selection:</strong> pure mulberry silk yarn, mostly from
                Karnataka, is dyed in deep contrasting colours.
              </li>
              <li>
                <strong>Zari preparation:</strong> silver thread is wound over a silk core and
                gilded with gold, which is what gives real zari its warm, non-metallic glow.
              </li>
              <li>
                <strong>Korvai interlocking:</strong> body and border are woven as separate
                warps and joined by hand, producing the tiny zig-zag line you can feel at the
                seam.
              </li>
              <li>
                <strong>Petni pallu:</strong> the pallu is woven separately and joined to the
                body — a genuine joint is strong enough that the saree tears elsewhere first.
              </li>
            </ul>

            <h2 className="text-2xl md:text-3xl font-playfair font-bold text-foreground mt-10 mb-4">
              How to identify an authentic Kanchipuram silk saree
            </h2>
            <ul className="list-disc pl-6 text-foreground space-y-2 mb-6">
              <li>
                <strong>Silk Mark:</strong> look for the Silk Mark India label and the
                Kanchipuram GI (Geographical Indication) tag.
              </li>
              <li>
                <strong>The zari burn test:</strong> a burnt strand of real zari leaves a
                reddish silk residue and smells of burnt hair; fake zari melts into a plastic
                bead.
              </li>
              <li>
                <strong>The joint:</strong> turn the saree inside out. A korvai border shows a
                visible interlocked line, never a printed or stitched-on border.
              </li>
              <li>
                <strong>Weight:</strong> most authentic pieces weigh 500g-900g. Anything
                markedly lighter is usually a silk blend.
              </li>
              <li>
                <strong>Price honesty:</strong> pure silk with real zari rarely starts below
                ₹15,000. Deep discounts on "pure Kanchipuram" are the clearest red flag.
              </li>
            </ul>

            <h2 className="text-2xl md:text-3xl font-playfair font-bold text-foreground mt-10 mb-4">
              Where to buy Kanchipuram silk sarees online
            </h2>
            <p className="text-foreground leading-relaxed mb-6">
              Buy from sellers who show the weave up close, state the silk and zari
              composition, and let you inspect the piece on video before you pay. At{" "}
              <Link to="/collections" className="text-primary underline">
                Vastra Luxe
              </Link>{" "}
              every Kanchipuram silk saree is sourced directly from weaver families, shot in
              natural light with border and pallu detail, and can be reviewed over a WhatsApp
              video call before purchase. We ship worldwide with insured, premium packaging.
            </p>

            <h2 className="text-2xl md:text-3xl font-playfair font-bold text-foreground mt-10 mb-4">
              Caring for your Kanchipuram silk
            </h2>
            <ul className="list-disc pl-6 text-foreground space-y-2 mb-6">
              <li>Dry clean only — never machine wash pure silk or real zari.</li>
              <li>Store rolled or folded in cotton or muslin, never in plastic.</li>
              <li>Refold every three months so creases don't set into the zari.</li>
              <li>Keep perfume, deodorant and direct sunlight away from the fabric.</li>
            </ul>

            <h2 className="text-2xl md:text-3xl font-playfair font-bold text-foreground mt-10 mb-4">
              Frequently asked questions
            </h2>
            <div className="space-y-5 mb-6">
              {faqs.map((faq) => (
                <div key={faq.question}>
                  <h3 className="font-semibold mb-1 text-foreground">{faq.question}</h3>
                  <p className="text-muted-foreground leading-relaxed">{faq.answer}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-border">
            <Link to="/collections">
              <Button>Browse Kanchipuram silk sarees</Button>
            </Link>
          </div>

          <div className="mt-14">
            <h2 className="text-2xl md:text-3xl font-playfair font-bold text-foreground mb-6">
              Related Articles
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <Link to="/blog/caring-for-silk-sarees">
                <Card className="p-6 hover:shadow-lg transition-shadow h-full">
                  <Badge variant="secondary" className="mb-3">Care</Badge>
                  <h3 className="text-xl font-playfair font-bold mb-2">
                    The Ultimate Guide to Caring for Silk Sarees
                  </h3>
                  <p className="text-muted-foreground">
                    Washing, storing and preserving your silk investment.
                  </p>
                </Card>
              </Link>
              <Link to="/blog/banarasi-silk-history">
                <Card className="p-6 hover:shadow-lg transition-shadow h-full">
                  <Badge variant="secondary" className="mb-3">Cultural</Badge>
                  <h3 className="text-xl font-playfair font-bold mb-2">
                    The Rich History of Banarasi Silk Sarees
                  </h3>
                  <p className="text-muted-foreground">
                    From Mughal-era origins to modern masterpieces.
                  </p>
                </Card>
              </Link>
            </div>
          </div>
        </div>
      </article>
    </Layout>
  );
};

export default KanchipuramGuide;