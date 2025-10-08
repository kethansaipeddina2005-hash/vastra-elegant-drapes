import ProductCard from "./ProductCard";
import saree1 from "@/assets/saree-1.jpg";
import saree2 from "@/assets/saree-2.jpg";
import saree3 from "@/assets/saree-3.jpg";
import saree4 from "@/assets/saree-4.jpg";
import saree5 from "@/assets/saree-5.jpg";
import saree6 from "@/assets/saree-6.jpg";

const sarees = [
  { id: 1, image: saree1, name: "Golden Elegance Silk", price: "12,999" },
  { id: 2, image: saree2, name: "Cream Dream Banarasi", price: "15,499" },
  { id: 3, image: saree3, name: "Traditional Weave", price: "18,999" },
  { id: 4, image: saree4, name: "Zari Work Masterpiece", price: "14,999" },
  { id: 5, image: saree5, name: "Kanjivaram Heritage", price: "22,999" },
  { id: 6, image: saree6, name: "Ivory Handcrafted", price: "16,499" },
];

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
          {sarees.map((saree) => (
            <ProductCard 
              key={saree.id}
              image={saree.image}
              name={saree.name}
              price={saree.price}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedSarees;
