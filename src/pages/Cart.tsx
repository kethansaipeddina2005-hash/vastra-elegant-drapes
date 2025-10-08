import Layout from "@/components/Layout";

const Cart = () => {
  return (
    <Layout>
      <div className="container mx-auto px-6 py-8">
        <h1 className="text-4xl font-playfair font-bold text-foreground mb-8">
          Shopping Cart
        </h1>
        <p className="text-muted-foreground text-lg">
          Your cart is empty. Start shopping to add items here.
        </p>
      </div>
    </Layout>
  );
};

export default Cart;
