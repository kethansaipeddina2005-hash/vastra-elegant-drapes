export interface Product {
  id: number;
  name: string;
  price: number;
  description: string;
  image: string;
  images?: string[];
  fabricType: string;
  color: string;
  occasion: string;
  region: string;
  stockQuantity: number;
  isNew?: boolean;
  isOnSale?: boolean;
  rating?: number;
  reviews?: number;
}

export interface Filter {
  priceRange: [number, number];
  fabricTypes: string[];
  colors: string[];
  occasions: string[];
  regions: string[];
}

export type SortOption = 'price-asc' | 'price-desc' | 'popularity' | 'newest';
