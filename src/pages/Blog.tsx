import { Link } from "react-router-dom";
import Layout from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import SEO from "@/components/SEO";

const blogPosts = [
  {
    slug: "how-to-drape-saree",
    title: "5 Different Ways to Drape a Saree",
    excerpt: "Master the art of saree draping with these simple techniques for different occasions.",
    category: "Styling",
    date: "March 15, 2024",
  },
  {
    slug: "caring-for-silk-sarees",
    title: "The Ultimate Guide to Caring for Silk Sarees",
    excerpt: "Learn how to properly care for and store your precious silk sarees to maintain their beauty for years.",
    category: "Care",
    date: "March 10, 2024",
  },
  {
    slug: "banarasi-silk-history",
    title: "The Rich History of Banarasi Silk Sarees",
    excerpt: "Explore the cultural significance and heritage of one of India's most treasured textile traditions.",
    category: "Cultural",
    date: "March 5, 2024",
  },
  {
    slug: "wedding-saree-guide",
    title: "Choosing the Perfect Wedding Saree",
    excerpt: "A comprehensive guide to selecting the ideal saree for your special day.",
    category: "Styling",
    date: "February 28, 2024",
  },
  {
    slug: "sustainable-sarees",
    title: "Sustainable Fashion: The Timeless Saree",
    excerpt: "Discover why sarees are the ultimate sustainable fashion choice and how to build an eco-friendly wardrobe.",
    category: "News",
    date: "February 20, 2024",
  },
  {
    slug: "regional-saree-styles",
    title: "A Journey Through Regional Saree Styles",
    excerpt: "From Kanjivaram to Chanderi, explore the unique characteristics of sarees from different Indian regions.",
    category: "Cultural",
    date: "February 15, 2024",
  },
];

const categories = ["All", "Styling", "Care", "Cultural", "News"];

const Blog = () => {
  return (
    <Layout>
      <SEO 
        title="Blog | Vastra — Saree Styling Tips, Care Guides & Stories"
        description="Discover saree styling tips, care guides, and cultural stories on the Vastra blog. Learn how to drape, care for silk sarees, and explore regional styles."
        canonical="/blog"
      />
      <div className="container mx-auto px-6 py-16">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-5xl font-playfair font-bold text-foreground mb-4 text-center">
            Vastra Blog
          </h1>
          <p className="text-lg text-muted-foreground text-center mb-12">
            Discover styling tips, care guides, and cultural stories about sarees
          </p>

          {/* Category Filter */}
          <div className="flex flex-wrap gap-2 justify-center mb-12">
            {categories.map((category) => (
              <Badge
                key={category}
                variant={category === "All" ? "default" : "outline"}
                className="cursor-pointer px-4 py-2"
              >
                {category}
              </Badge>
            ))}
          </div>

          {/* Blog Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {blogPosts.map((post) => (
              <Link key={post.slug} to={`/blog/${post.slug}`}>
                <Card className="overflow-hidden hover:shadow-lg transition-shadow h-full">
                  <div className="aspect-video bg-muted" />
                  <div className="p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <Badge variant="secondary">{post.category}</Badge>
                      <span className="text-sm text-muted-foreground">{post.date}</span>
                    </div>
                    <h2 className="text-xl font-playfair font-bold mb-2 hover:text-primary transition-colors">
                      {post.title}
                    </h2>
                    <p className="text-muted-foreground">{post.excerpt}</p>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Blog;
