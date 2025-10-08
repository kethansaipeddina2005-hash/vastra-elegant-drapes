import { useParams, Link } from "react-router-dom";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";

const BlogPost = () => {
  const { slug } = useParams();
  
  return (
    <Layout>
      <div className="container mx-auto px-6 py-8">
        <Breadcrumb className="mb-6">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">Home</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/blog">Blog</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{slug}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        
        <article className="max-w-3xl mx-auto">
          <h1 className="text-5xl font-playfair font-bold text-foreground mb-6">
            Blog Post
          </h1>
          <p className="text-muted-foreground text-lg mb-8">
            Full blog post content will be displayed here.
          </p>
          
          <Link to="/blog">
            <Button variant="outline">← Back to Blog</Button>
          </Link>
        </article>
      </div>
    </Layout>
  );
};

export default BlogPost;
