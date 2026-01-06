import Layout from "@/components/Layout";
import ProductCard from "@/components/ProductCard";
import FilterSidebar from "@/components/FilterSidebar";
import { useProducts } from "@/hooks/useProducts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loading } from "@/components/ui/loading";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { X, SlidersHorizontal } from "lucide-react";
import { useState } from "react";
import SEO, { getBreadcrumbSchema } from "@/components/SEO";

const Collections = () => {
  const { products, filters, setFilters, filterOptions, sortBy, setSortBy, loading, maxPrice } = useProducts();
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const clearFilter = (category: keyof typeof filters, value?: string) => {
    if (value) {
      const currentValues = filters[category] as string[];
      setFilters({ ...filters, [category]: currentValues.filter(v => v !== value) });
    } else {
      setFilters({
        priceRange: [0, maxPrice],
        fabricTypes: [],
        colors: [],
        occasions: [],
        regions: [],
        categories: [],
      });
    }
  };

  const activeFiltersCount = 
    filters.fabricTypes.length + 
    filters.colors.length + 
    filters.occasions.length + 
    filters.regions.length +
    filters.categories.length;

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-6 py-8 flex justify-center items-center min-h-[60vh]">
          <Loading />
        </div>
      </Layout>
    );
  }

  const breadcrumbSchema = getBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Collections', url: '/collections' },
  ]);

  return (
    <Layout>
      <SEO 
        title="Saree Collections | Vastra — Shop Traditional Indian Sarees"
        description="Explore our curated collection of handcrafted Indian sarees. Filter by fabric, color, occasion, and region. Free shipping on orders above ₹2000."
        canonical="/collections"
        structuredData={breadcrumbSchema}
      />
      <div className="container mx-auto px-6 py-8">
        <Breadcrumb className="mb-6">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">Home</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Collections</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        
        <div className="flex flex-col gap-4 mb-6 md:mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-4xl font-playfair font-bold text-foreground mb-1 md:mb-2">
                Our Collections
              </h1>
              <p className="text-sm md:text-base text-muted-foreground">
                {products.length} {products.length === 1 ? 'saree' : 'sarees'} found
              </p>
            </div>
            
            <div className="flex gap-2 w-full md:w-auto">
              <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" className="flex-1 md:flex-none gap-2 h-11">
                    <SlidersHorizontal className="h-4 w-4" />
                    <span className="md:inline">Filters</span>
                    {activeFiltersCount > 0 && (
                      <Badge variant="secondary" className="ml-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                        {activeFiltersCount}
                      </Badge>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[85vw] sm:w-[400px] overflow-y-auto">
                  <SheetHeader className="mb-6">
                    <SheetTitle>Filters</SheetTitle>
                  </SheetHeader>
                  <FilterSidebar filters={filters} onFilterChange={setFilters} maxPrice={maxPrice} filterOptions={filterOptions} />
                </SheetContent>
              </Sheet>

              <Select value={sortBy} onValueChange={(value) => setSortBy(value as any)}>
                <SelectTrigger className="flex-1 md:flex-none md:w-48 h-11">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Default</SelectItem>
                  <SelectItem value="newest">Newest Arrivals</SelectItem>
                  <SelectItem value="popularity">Most Popular</SelectItem>
                  <SelectItem value="price-asc">Price: Low to High</SelectItem>
                  <SelectItem value="price-desc">Price: High to Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {activeFiltersCount > 0 && (
          <div className="mb-4 md:mb-6 flex flex-wrap gap-2 items-center">
            <span className="text-xs md:text-sm text-muted-foreground w-full md:w-auto mb-1 md:mb-0">Active filters:</span>
            {filters.fabricTypes.map(fabric => (
              <Badge key={fabric} variant="secondary" className="gap-1 text-xs h-7">
                {fabric}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4 p-0 hover:bg-transparent"
                  onClick={() => clearFilter('fabricTypes', fabric)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            ))}
            {filters.colors.map(color => (
              <Badge key={color} variant="secondary" className="gap-1 text-xs h-7">
                {color}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4 p-0 hover:bg-transparent"
                  onClick={() => clearFilter('colors', color)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            ))}
            {filters.occasions.map(occasion => (
              <Badge key={occasion} variant="secondary" className="gap-1 text-xs h-7">
                {occasion}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4 p-0 hover:bg-transparent"
                  onClick={() => clearFilter('occasions', occasion)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            ))}
            {filters.regions.map(region => (
              <Badge key={region} variant="secondary" className="gap-1 text-xs h-7">
                {region}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4 p-0 hover:bg-transparent"
                  onClick={() => clearFilter('regions', region)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            ))}
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => clearFilter('fabricTypes')}>
              Clear all
            </Button>
          </div>
        )}

        <div>
            {products.length === 0 ? (
              <div className="text-center py-12 md:py-20 px-4">
                <p className="text-muted-foreground text-base md:text-lg mb-4">No sarees found matching your criteria</p>
                <Button onClick={() => clearFilter('fabricTypes')} className="h-11">Clear all filters</Button>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
                {products.map((product) => (
                  <ProductCard key={product.id} {...product} />
                ))}
              </div>
            )}
        </div>
      </div>
    </Layout>
  );
};

export default Collections;
