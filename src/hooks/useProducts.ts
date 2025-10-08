import { useState, useMemo } from 'react';
import { Product, Filter, SortOption } from '@/types/product';
import { products as allProducts } from '@/data/products';

export const useProducts = () => {
  const [filters, setFilters] = useState<Filter>({
    priceRange: [0, 50000],
    fabricTypes: [],
    colors: [],
    occasions: [],
    regions: [],
  });
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredProducts = useMemo(() => {
    let filtered = [...allProducts];

    // Apply search
    if (searchQuery) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply price filter
    filtered = filtered.filter(
      product => product.price >= filters.priceRange[0] && product.price <= filters.priceRange[1]
    );

    // Apply fabric type filter
    if (filters.fabricTypes.length > 0) {
      filtered = filtered.filter(product =>
        filters.fabricTypes.includes(product.fabricType)
      );
    }

    // Apply color filter
    if (filters.colors.length > 0) {
      filtered = filtered.filter(product =>
        filters.colors.includes(product.color)
      );
    }

    // Apply occasion filter
    if (filters.occasions.length > 0) {
      filtered = filtered.filter(product =>
        filters.occasions.includes(product.occasion)
      );
    }

    // Apply region filter
    if (filters.regions.length > 0) {
      filtered = filtered.filter(product =>
        filters.regions.includes(product.region)
      );
    }

    // Apply sorting
    switch (sortBy) {
      case 'price-asc':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'popularity':
        filtered.sort((a, b) => (b.reviews || 0) - (a.reviews || 0));
        break;
      case 'newest':
        filtered.sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0));
        break;
    }

    return filtered;
  }, [filters, sortBy, searchQuery]);

  return {
    products: filteredProducts,
    filters,
    setFilters,
    sortBy,
    setSortBy,
    searchQuery,
    setSearchQuery,
  };
};
