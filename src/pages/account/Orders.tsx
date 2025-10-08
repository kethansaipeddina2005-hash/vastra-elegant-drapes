import Layout from "@/components/Layout";

const Orders = () => {
  return (
    <Layout>
      <div className="container mx-auto px-6 py-8">
        <h1 className="text-4xl font-playfair font-bold text-foreground mb-8">
          Order History
        </h1>
        <p className="text-muted-foreground text-lg">
          You haven't placed any orders yet.
        </p>
      </div>
    </Layout>
  );
};

export default Orders;
