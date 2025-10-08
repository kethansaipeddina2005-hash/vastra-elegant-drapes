import Layout from "@/components/Layout";

const Wishlist = () => {
  return (
    <Layout>
      <div className="container mx-auto px-6 py-8">
        <h1 className="text-4xl font-playfair font-bold text-foreground mb-8">
          My Wishlist
        </h1>
        <p className="text-muted-foreground text-lg">
          Your wishlist is empty. Start adding items you love!
        </p>
      </div>
    </Layout>
  );
};

export default Wishlist;
