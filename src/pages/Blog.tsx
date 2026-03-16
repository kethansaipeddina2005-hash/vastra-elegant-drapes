import { useState } from "react";
import { Link } from "react-router-dom";
import Layout from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import SEO from "@/components/SEO";
import { Clock, ArrowRight, TrendingUp } from "lucide-react";

import blogDraping from "@/assets/blog-draping.jpg";
import blogCare from "@/assets/blog-care.jpg";
import blogBanarasi from "@/assets/blog-banarasi.jpg";
import blogWedding from "@/assets/blog-wedding.jpg";
import blogSustainable from "@/assets/blog-sustainable.jpg";
import blogRegional from "@/assets/blog-regional.jpg";

const blogPosts = [
  {
    slug: "how-to-drape-saree",
    title: "5 Different Ways to Drape a Saree",
    excerpt:
      "Master the art of saree draping with these simple techniques — from the classic Nivi to the modern Lehenga style. Perfect for every occasion and body type.",
    category: "Styling",
    date: "March 15, 2024",
    readTime: "6 min read",
    image: blogDraping,
    featured: true,
  },
  {
    slug: "caring-for-silk-sarees",
    title: "The Ultimate Guide to Caring for Silk Sarees",
    excerpt:
      "Learn professional tips on washing, storing, and maintaining your precious silk sarees so they retain their lustre and beauty for generations.",
    category: "Care",
    date: "March 10, 2024",
    readTime: "5 min read",
    image: blogCare,
  },
  {
    slug: "banarasi-silk-history",
    title: "The Rich History of Banarasi Silk Sarees",
    excerpt:
      "Explore the centuries-old tradition of Banarasi weaving — from Mughal-era origins to modern-day masterpieces that represent India's finest textile heritage.",
    category: "Cultural",
    date: "March 5, 2024",
    readTime: "8 min read",
    image: blogBanarasi,
  },
  {
    slug: "wedding-saree-guide",
    title: "Choosing the Perfect Wedding Saree",
    excerpt:
      "Your complete guide to selecting the ideal bridal saree — covering fabrics, colors, regional traditions, and styling tips for your most special day.",
    category: "Styling",
    date: "February 28, 2024",
    readTime: "7 min read",
    image: blogWedding,
  },
  {
    slug: "sustainable-sarees",
    title: "Sustainable Fashion: The Timeless Saree",
    excerpt:
      "Discover why the saree is the ultimate sustainable garment. Learn about eco-friendly fabrics, natural dyes, and how to build a conscious wardrobe.",
    category: "News",
    date: "February 20, 2024",
    readTime: "5 min read",
    image: blogSustainable,
  },
  {
    slug: "regional-saree-styles",
    title: "A Journey Through Regional Saree Styles",
    excerpt:
      "From Kanjivaram silk to Chanderi cotton, explore the unique characteristics, weaving techniques, and cultural stories behind sarees from every Indian region.",
    category: "Cultural",
    date: "February 15, 2024",
    readTime: "9 min read",
    image: blogRegional,
  },
];

const categories = ["All", "Styling", "Care", "Cultural", "News"];

const Blog = () => {
  const [activeCategory, setActiveCategory] = useState("All");

  const filteredPosts =
    activeCategory === "All"
      ? blogPosts
      : blogPosts.filter((p) => p.category === activeCategory);

  const featuredPost = blogPosts.find((p) => p.featured);
  const regularPosts = filteredPosts.filter((p) => !p.featured || activeCategory !== "All");

  return (
    <Layout>
      <SEO
        title="Blog | Vastra — Saree Styling Tips, Care Guides & Stories"
        description="Discover saree styling tips, care guides, and cultural stories on the Vastra blog. Learn how to drape, care for silk sarees, and explore regional styles."
        canonical="/blog"
      />

      {/* Hero Banner */}
      <section className="bg-card border-b border-border">
        <div className="container mx-auto px-4 py-12 md:py-16 text-center">
          <Badge variant="secondary" className="mb-4 text-xs tracking-widest uppercase px-4 py-1">
            <TrendingUp className="w-3 h-3 mr-1.5" />
            Fashion & Culture
          </Badge>
          <h1 className="text-4xl md:text-5xl font-playfair font-bold text-foreground mb-3">
            The Vastra Journal
          </h1>
          <p className="text-muted-foreground text-base md:text-lg max-w-xl mx-auto">
            Styling inspiration, care guides, and stories celebrating the timeless art of Indian sarees.
          </p>
        </div>
      </section>

      <div className="container mx-auto px-4 py-10 md:py-14">
        {/* Category Filter */}
        <div className="flex flex-wrap gap-2 justify-center mb-10">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                activeCategory === category
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted text-muted-foreground hover:bg-muted/70"
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Featured Post */}
        {activeCategory === "All" && featuredPost && (
          <Link to={`/blog/${featuredPost.slug}`} className="block mb-12">
            <Card className="overflow-hidden group hover:shadow-lg transition-shadow">
              <div className="grid md:grid-cols-2">
                <div className="aspect-[4/3] md:aspect-auto overflow-hidden">
                  <img
                    src={featuredPost.image}
                    alt={featuredPost.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                </div>
                <div className="p-6 md:p-10 flex flex-col justify-center">
                  <div className="flex items-center gap-3 mb-4">
                    <Badge className="bg-accent text-accent-foreground">Featured</Badge>
                    <Badge variant="outline">{featuredPost.category}</Badge>
                  </div>
                  <h2 className="text-2xl md:text-3xl font-playfair font-bold text-foreground mb-3 group-hover:text-primary transition-colors">
                    {featuredPost.title}
                  </h2>
                  <p className="text-muted-foreground mb-5 leading-relaxed">
                    {featuredPost.excerpt}
                  </p>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>{featuredPost.date}</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {featuredPost.readTime}
                    </span>
                  </div>
                  <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-primary group-hover:gap-3 transition-all">
                    Read Article <ArrowRight className="w-4 h-4" />
                  </span>
                </div>
              </div>
            </Card>
          </Link>
        )}

        {/* Blog Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {(activeCategory === "All" ? filteredPosts.filter((p) => !p.featured) : filteredPosts).map(
            (post) => (
              <Link key={post.slug} to={`/blog/${post.slug}`} className="group">
                <Card className="overflow-hidden h-full hover:shadow-lg transition-shadow flex flex-col">
                  <div className="aspect-[16/10] overflow-hidden">
                    <img
                      src={post.image}
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                  </div>
                  <div className="p-5 md:p-6 flex flex-col flex-1">
                    <div className="flex items-center gap-2 mb-3">
                      <Badge variant="secondary" className="text-xs">
                        {post.category}
                      </Badge>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {post.readTime}
                      </span>
                    </div>
                    <h2 className="text-lg font-playfair font-bold text-foreground mb-2 group-hover:text-primary transition-colors leading-snug">
                      {post.title}
                    </h2>
                    <p className="text-sm text-muted-foreground leading-relaxed flex-1">
                      {post.excerpt}
                    </p>
                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">{post.date}</span>
                      <span className="text-sm font-medium text-primary flex items-center gap-1 group-hover:gap-2 transition-all">
                        Read <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                </Card>
              </Link>
            )
          )}
        </div>

        {filteredPosts.length === 0 && (
          <div className="text-center py-16">
            <p className="text-muted-foreground text-lg">No articles found in this category.</p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Blog;
