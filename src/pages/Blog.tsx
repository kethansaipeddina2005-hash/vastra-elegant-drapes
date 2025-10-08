import { Link } from "react-router-dom";
import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const blogPosts = [
  {
    slug: "styling-silk-sarees",
    title: "5 Ways to Style Your Silk Saree",
    excerpt: "Discover modern and traditional ways to drape and accessorize your silk saree for any occasion.",
    category: "Styling",
  },
  {
    slug: "caring-for-handloom",
    title: "Caring for Your Handloom Saree",
    excerpt: "Essential tips to preserve the beauty and longevity of your precious handloom sarees.",
    category: "Care",
  },
  {
    slug: "history-of-banarasi",
    title: "The Rich History of Banarasi Sarees",
    excerpt: "Journey through centuries of tradition and craftsmanship that define Banarasi weaving.",
    category: "Cultural",
  },
];

const Blog = () => {
  return (
    <Layout>
      <div className="container mx-auto px-6 py-16">
        <h1 className="text-5xl font-playfair font-bold text-foreground mb-6 text-center">
          Blog & Stories
        </h1>
        <p className="text-lg text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
          Explore the art, culture, and craftsmanship behind traditional Indian sarees.
        </p>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {blogPosts.map((post) => (
            <Link key={post.slug} to={`/blog/${post.slug}`}>
              <Card className="h-full hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="text-sm text-primary mb-2">{post.category}</div>
                  <CardTitle className="text-2xl font-playfair">{post.title}</CardTitle>
                  <CardDescription className="text-base">{post.excerpt}</CardDescription>
                </CardHeader>
                <CardContent>
                  <span className="text-primary hover:underline">Read more →</span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default Blog;
