import { Product } from "@/types/product";
import saree1 from "@/assets/saree-1.jpg";
import saree2 from "@/assets/saree-2.jpg";
import saree3 from "@/assets/saree-3.jpg";
import saree4 from "@/assets/saree-4.jpg";
import saree5 from "@/assets/saree-5.jpg";
import saree6 from "@/assets/saree-6.jpg";

export const products: Product[] = [
  {
    id: 1,
    name: "Golden Elegance Silk",
    price: 12999,
    description: "Exquisite silk saree with golden zari work, perfect for special occasions. Handcrafted by master weavers.",
    image: saree1,
    images: [saree1],
    fabricType: "Silk",
    color: "Gold",
    occasion: "Wedding",
    region: "Banarasi",
    stockQuantity: 10,
    isNew: true,
    rating: 4.8,
    reviews: 24,
  },
  {
    id: 2,
    name: "Cream Dream Banarasi",
    price: 15499,
    description: "Luxurious Banarasi silk saree in elegant cream with intricate weaving patterns.",
    image: saree2,
    images: [saree2],
    fabricType: "Silk",
    color: "Cream",
    occasion: "Wedding",
    region: "Banarasi",
    stockQuantity: 8,
    rating: 4.9,
    reviews: 31,
  },
  {
    id: 3,
    name: "Traditional Weave",
    price: 18999,
    description: "Heritage handloom saree with traditional motifs and superior craftsmanship.",
    image: saree3,
    images: [saree3],
    fabricType: "Cotton",
    color: "Multicolor",
    occasion: "Festival",
    region: "Chanderi",
    stockQuantity: 15,
    isOnSale: true,
    rating: 4.7,
    reviews: 18,
  },
  {
    id: 4,
    name: "Zari Work Masterpiece",
    price: 14999,
    description: "Stunning saree featuring intricate zari work and elegant drape.",
    image: saree4,
    images: [saree4],
    fabricType: "Silk",
    color: "Beige",
    occasion: "Formal",
    region: "Banarasi",
    stockQuantity: 12,
    rating: 4.6,
    reviews: 22,
  },
  {
    id: 5,
    name: "Kanjivaram Heritage",
    price: 22999,
    description: "Premium Kanjivaram silk saree with temple borders and rich colors.",
    image: saree5,
    images: [saree5],
    fabricType: "Silk",
    color: "Red",
    occasion: "Wedding",
    region: "Kanjivaram",
    stockQuantity: 5,
    isNew: true,
    rating: 5.0,
    reviews: 42,
  },
  {
    id: 6,
    name: "Ivory Handcrafted",
    price: 16499,
    description: "Delicate ivory saree with handcrafted embellishments and fine detailing.",
    image: saree6,
    images: [saree6],
    fabricType: "Georgette",
    color: "Ivory",
    occasion: "Casual",
    region: "Lucknow",
    stockQuantity: 20,
    rating: 4.5,
    reviews: 15,
  },
];

export const fabricTypes = ["Silk", "Cotton", "Georgette", "Chiffon", "Chanderi"];
export const colors = ["Gold", "Cream", "Red", "Beige", "Ivory", "Multicolor", "Blue", "Green"];
export const occasions = ["Wedding", "Festival", "Casual", "Formal", "Party"];
export const regions = ["Banarasi", "Kanjivaram", "Chanderi", "Lucknow", "Mysore"];
