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
import { useState, useEffect } from "react";
import { Link, Navigate, useSearchParams } from "react-router-dom";
import SEO, { getBreadcrumbSchema } from "@/components/SEO";
import { ProductGridSkeleton } from "@/components/skeletons/ProductCardSkeleton";

const Collections = ({ category = '' }: { category?: 'Dresses' | 'Sarees' | '' }) => {
  const { products, filters, setFilters, filterOptions, sortBy, setSortBy, searchQuery, setSearchQuery, loading, maxPrice } = useProducts();
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [searchParams] = useSearchParams();
  const isDresses = category === 'Dresses';
  const heading = isDresses ? 'Premium Dresses for Women' : category === 'Sarees' ? 'Exclusive Luxury Sarees for Special Occasions' : 'Premium Dresses & Luxury Sarees';
  const seoTitle = isDresses ? 'Premium Dresses for Women | Vastra Luxe' : category === 'Sarees' ? 'Luxury Silk & Premium Sarees | Vastra Luxe' : 'Dresses & Saree Collections | Vastra Luxe';
  const description = isDresses
    ? 'Discover premium dresses at Vastra Luxe. Explore individual designs, fabrics, colors and available size charts to find a style for your special occasion.'
    : category === 'Sarees'
      ? 'Explore luxury sarees, premium silk sarees and unique designs at Vastra Luxe. Compare fabrics, colors, prices and availability in our exclusive sarees collection.'
      : 'Explore premium dresses and luxury sarees at Vastra Luxe. Browse fabrics, colors, occasions and available sizes across our two collections.';
  const canonical = category ? `/${category.toLowerCase()}` : '/collections';
  const legacyCategory = searchParams.get('category');

  // Sync URL search params with hook
  useEffect(() => {
    const search = searchParams.get('search') || '';
    const selectedCategory = category || searchParams.get('category') || '';
    setSearchQuery(search);
    setFilters(prev => ({ ...prev, categories: selectedCategory ? [selectedCategory] : [] }));
  }, [searchParams, category]);

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
        categories: category ? [category] : [],
      });
    }
  };

  const activeFiltersCount = 
    filters.fabricTypes.length + 
    filters.colors.length + 
    filters.occasions.length + 
    filters.regions.length +
    filters.categories.length;

  if (!category && (legacyCategory === 'Dresses' || legacyCategory === 'Sarees')) {
    const params = new URLSearchParams(searchParams);
    params.delete('category');
    return <Navigate replace to={`/${legacyCategory.toLowerCase()}${params.size ? `?${params}` : ''}`} />;
  }

  const breadcrumbSchema = getBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Collections', url: '/collections' },
    ...(category ? [{ name: category, url: canonical }] : []),
  ]);

  return (
    <Layout>
      <SEO 
        title={seoTitle}
        description={description}
        canonical={canonical}
        noIndex={searchParams.has('search') || searchParams.has('category')}
        structuredData={breadcrumbSchema}
      />
      <div className="container mx-auto px-4 py-8">
        <Breadcrumb className="mb-6">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">Home</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{category || 'Collections'}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        
        <div className="flex flex-col gap-4 mb-6 md:mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-4xl font-playfair font-bold text-foreground mb-1 md:mb-2">
                {heading}
              </h1>
              <p className="text-sm md:text-base text-muted-foreground">
                {products.length} {products.length === 1 ? 'product' : 'products'} found
              </p>
              {category === 'Sarees' && <p className="mt-3 max-w-3xl text-sm md:text-base text-muted-foreground leading-relaxed">
                Discover luxury sarees through color, texture and the details of each design. Explore premium sarees and silk sarees for occasion dressing, comparing the listed fabric, border and pallu photographs, price and available stock before choosing.
              </p>}
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
            {loading ? <ProductGridSkeleton count={8} /> : products.length === 0 ? (
              <div className="text-center py-12 md:py-20 px-4">
                <p className="text-muted-foreground text-base md:text-lg mb-4">No products found matching your criteria</p>
                <Button onClick={() => clearFilter('fabricTypes')} className="h-11">Clear all filters</Button>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
                {products.map((product, index) => (
                  <ProductCard key={product.id} {...product} priority={index < 2} />
                ))}
              </div>
            )}
        </div>
        {category && <section className="mt-12 border-t border-border pt-8 space-y-4 max-w-3xl text-sm text-muted-foreground leading-relaxed">
          <h2 className="text-xl font-playfair font-semibold text-foreground">{isDresses ? 'Choose your dress and size' : 'Unique sarees, chosen for your occasion'}</h2>
          <p>{isDresses
            ? 'Start with the silhouette, fabric and color shown on each dress. Check the product’s occasion details when choosing an outfit for a wedding, festival or family celebration. Compare the available size chart with your measurements, using the units shown, and select an in-stock size before adding it to your cart.'
            : 'A unique saree is a personal choice: compare the fabric, color, region and occasion listed for each design. For silk sarees, look closely at the border, pallu and motifs in the photographs. Choose a color and drape that suit your wedding, festival or family occasion. Our exclusive sarees selection does not imply that every design is one-of-a-kind or will never be restocked; current availability is shown on the product page.'}</p>
          <h2 className="text-xl font-playfair font-semibold text-foreground">{isDresses ? 'Measurements and customization' : 'Product details and care'}</h2>
          <p>{isDresses
            ? 'Measure against the named columns in the individual product’s chart; different designs may use different measurements. A size chart lists the offered sizes and does not by itself mean made-to-measure tailoring is available. Ask about any design, fabric or fit changes through the product enquiry before ordering; availability must be confirmed for that dress.'
            : 'Read the individual description and care details before ordering. Care needs vary by fabric and embellishment; confirm any missing instructions through the product enquiry. For delicate silk, protect it from prolonged sunlight and damp storage, and confirm suitable cleaning with a textile-care professional.'}</p>
          <p>Check the product’s stock and return details, then review delivery charges and your address at checkout. Explore our <Link to={isDresses ? '/sarees' : '/dresses'} className="text-primary underline underline-offset-4">{isDresses ? 'Sarees' : 'Dresses'}</Link> collection for more occasion styles.</p>
        </section>}
      </div>
    </Layout>
  );
};

export default Collections;
