import type { SizeChart } from '@/lib/sizing';
export interface Product {
  sizingEnabled?: boolean;
  sizeChart?: SizeChart;
  selectedSize?: string | null;
  id: number;
  name: string;
  price: number;
  foreignPrice?: number | null;
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
  returnDays?: number | null;
  discountPercentage?: number;
  showLowStockBadge?: boolean;
  categoryIds?: string[];
  categoryNames?: string[];
  partnerId?: string | null;
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
