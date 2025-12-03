import { useParams, Link } from "react-router-dom";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Share2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import SEO, { getArticleSchema, getBreadcrumbSchema } from "@/components/SEO";

const BlogPost = () => {
  const { slug } = useParams();
  
  // TODO: Fetch actual blog post data based on slug
  const articleSchema = getArticleSchema({
    title: '5 Different Ways to Drape a Saree',
    description: 'Master the art of saree draping with these simple techniques for different occasions.',
    datePublished: '2024-03-15',
  });
  
  const breadcrumbSchema = getBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Blog', url: '/blog' },
    { name: '5 Different Ways to Drape a Saree', url: `/blog/${slug}` },
  ]);

  const handleShare = () => {
    toast({
      title: "Link copied!",
      description: "Article link copied to clipboard.",
    });
  };

  return (
    <Layout>
      <SEO 
        title="5 Different Ways to Drape a Saree | Vastra Blog"
        description="Master the art of saree draping with these simple techniques for different occasions. Learn Nivi, Bengali, Gujarati, Maharashtrian, and Lehenga styles."
        canonical={`/blog/${slug}`}
        ogType="article"
        structuredData={[articleSchema, breadcrumbSchema]}
      />
      <article className="container mx-auto px-6 py-16">
        <div className="max-w-4xl mx-auto">
          {/* Back Button */}
          <Link to="/blog">
            <Button variant="ghost" className="mb-6">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Blog
            </Button>
          </Link>

          {/* Article Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <Badge>Styling</Badge>
              <span className="text-muted-foreground">March 15, 2024</span>
            </div>
            <h1 className="text-5xl font-playfair font-bold text-foreground mb-4">
              5 Different Ways to Drape a Saree
            </h1>
            <p className="text-xl text-muted-foreground">
              Master the art of saree draping with these simple techniques for different occasions.
            </p>
          </div>

          {/* Featured Image */}
          <div className="aspect-video bg-muted rounded-lg mb-8" />

          {/* Article Content */}
          <div className="prose prose-lg max-w-none">
            <p className="text-foreground leading-relaxed mb-6">
              The saree is one of the most versatile garments in the world, and its beauty lies not just in the fabric 
              but in how it's draped. Each draping style tells a different story and suits different occasions. Let's 
              explore five popular draping techniques that every saree lover should know.
            </p>

            <h2 className="text-3xl font-playfair font-bold text-foreground mt-8 mb-4">
              1. The Classic Nivi Style
            </h2>
            <p className="text-foreground leading-relaxed mb-6">
              The most popular draping style, originating from Andhra Pradesh. This elegant style is perfect for 
              any occasion and is the easiest to manage throughout the day. The pleats fall gracefully in the front, 
              and the pallu is draped over the left shoulder.
            </p>

            <h2 className="text-3xl font-playfair font-bold text-foreground mt-8 mb-4">
              2. The Bengali Style
            </h2>
            <p className="text-foreground leading-relaxed mb-6">
              Characterized by no pleats in the front and a distinctive pallu draping from the right shoulder, 
              this style is traditional to West Bengal. The pallu is brought around from the back and pleated 
              before being pinned on the left shoulder, creating a unique and elegant look.
            </p>

            <h2 className="text-3xl font-playfair font-bold text-foreground mt-8 mb-4">
              3. The Gujarati Style
            </h2>
            <p className="text-foreground leading-relaxed mb-6">
              In this vibrant style, the pallu is draped from back to front over the right shoulder, creating 
              a distinctive look. The pleats are in the back instead of the front, making it comfortable and 
              perfect for festive occasions.
            </p>

            <h2 className="text-3xl font-playfair font-bold text-foreground mt-8 mb-4">
              4. The Maharashtrian Style
            </h2>
            <p className="text-foreground leading-relaxed mb-6">
              This traditional drape resembles a dhoti and is worn without a petticoat. The saree is wrapped 
              around the legs in a pant-like fashion, making it extremely practical while maintaining elegance. 
              Perfect for those who want the grace of a saree with the comfort of trousers.
            </p>

            <h2 className="text-3xl font-playfair font-bold text-foreground mt-8 mb-4">
              5. The Lehenga Style
            </h2>
            <p className="text-foreground leading-relaxed mb-6">
              A modern, trendy style where the saree is draped to resemble a lehenga. The pleats are tucked 
              in a circular manner around the waist, creating a flared skirt effect. The pallu is draped 
              elegantly over the shoulder, making it perfect for weddings and special occasions.
            </p>

            <h2 className="text-3xl font-playfair font-bold text-foreground mt-8 mb-4">
              Tips for Perfect Draping
            </h2>
            <ul className="list-disc pl-6 text-foreground space-y-2 mb-6">
              <li>Always start with a well-fitted blouse and petticoat</li>
              <li>Use safety pins strategically to keep pleats in place</li>
              <li>Practice makes perfect - don't be discouraged if it takes a few tries</li>
              <li>Consider the fabric when choosing a draping style - heavier silks work better with simpler drapes</li>
              <li>Watch video tutorials for visual guidance</li>
            </ul>

            <p className="text-foreground leading-relaxed">
              Each draping style has its own charm and cultural significance. Experiment with different styles 
              to find what works best for you and the occasion. Remember, the most beautiful drape is one worn 
              with confidence!
            </p>
          </div>

          {/* Share Button */}
          <div className="mt-12 pt-8 border-t border-border">
            <Button onClick={handleShare} variant="outline">
              <Share2 className="w-4 h-4 mr-2" />
              Share Article
            </Button>
          </div>

          {/* Related Articles */}
          <div className="mt-16">
            <h2 className="text-3xl font-playfair font-bold text-foreground mb-8">
              Related Articles
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <Link to="/blog/caring-for-silk-sarees">
                <Card className="p-6 hover:shadow-lg transition-shadow">
                  <Badge variant="secondary" className="mb-3">Care</Badge>
                  <h3 className="text-xl font-playfair font-bold mb-2">
                    The Ultimate Guide to Caring for Silk Sarees
                  </h3>
                  <p className="text-muted-foreground">
                    Learn how to properly care for and store your precious silk sarees.
                  </p>
                </Card>
              </Link>
              <Link to="/blog/wedding-saree-guide">
                <Card className="p-6 hover:shadow-lg transition-shadow">
                  <Badge variant="secondary" className="mb-3">Styling</Badge>
                  <h3 className="text-xl font-playfair font-bold mb-2">
                    Choosing the Perfect Wedding Saree
                  </h3>
                  <p className="text-muted-foreground">
                    A comprehensive guide to selecting the ideal saree for your special day.
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

export default BlogPost;
