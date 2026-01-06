export interface Product {
  id: number;
  name: string;
  price: number;
  description: string;
  image: string;
  images?: string[];
  videos?: string[];
  fabricType: string;
  color: string;
  occasion: string;
  region: string;
  stockQuantity: number;
  isNew?: boolean;
  isOnSale?: boolean;
  rating?: number;
  reviews?: number;
  categoryId?: string;
  categoryName?: string;
}

export interface Filter {
  priceRange: [number, number];
  fabricTypes: string[];
  colors: string[];
  occasions: string[];
  regions: string[];
  categories: string[];
}

export type SortOption = 'none' | 'price-asc' | 'price-desc' | 'popularity' | 'newest';
