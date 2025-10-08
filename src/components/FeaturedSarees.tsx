import ProductCard from "./ProductCard";
import { products } from "@/data/products";

const FeaturedSarees = () => {
  return (
    <section id="collections" className="py-20 px-6">
      <div className="container mx-auto">
        <div className="text-center mb-12 space-y-4">
          <h2 className="text-4xl md:text-5xl font-playfair font-bold text-foreground">
            Featured Collection
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Handpicked sarees that celebrate tradition and timeless beauty
          </p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {products.slice(0, 6).map((saree) => (
            <ProductCard 
              key={saree.id}
              id={saree.id}
              image={saree.image}
              name={saree.name}
              price={saree.price}
              isNew={saree.isNew}
              isOnSale={saree.isOnSale}
              rating={saree.rating}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedSarees;
