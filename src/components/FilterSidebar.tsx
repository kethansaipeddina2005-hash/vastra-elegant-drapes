import { Filter } from "@/types/product";
import { Checkbox } from "./ui/checkbox";
import { Label } from "./ui/label";
import { Slider } from "./ui/slider";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { FilterOptions } from "@/hooks/useProducts";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./ui/collapsible";
import { ChevronDown } from "lucide-react";
import { useState } from "react";

interface FilterSidebarProps {
  filters: Filter;
  onFilterChange: (filters: Filter) => void;
  maxPrice?: number;
  filterOptions?: FilterOptions;
}

const FilterSidebar = ({ filters, onFilterChange, maxPrice = 50000, filterOptions }: FilterSidebarProps) => {
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  const handlePriceChange = (value: number[]) => {
    onFilterChange({ ...filters, priceRange: [value[0], value[1]] });
  };

  const handleCheckboxChange = (category: keyof Filter, value: string) => {
    const currentValues = filters[category] as string[];
    const newValues = currentValues.includes(value)
      ? currentValues.filter(v => v !== value)
      : [...currentValues, value];
    onFilterChange({ ...filters, [category]: newValues });
  };

  const fabricTypes = filterOptions?.fabricTypes || [];
  const colors = filterOptions?.colors || [];
  const occasions = filterOptions?.occasions || [];
  const regions = filterOptions?.regions || [];
  const categories = filterOptions?.categories || [];
  const categoryTree = filterOptions?.categoryTree || [];

  const hasCategoryTree = categoryTree.length > 0 && categoryTree.some(c => c.children.length > 0);

  return (
    <div className="space-y-6">
      {categories.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Category</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {hasCategoryTree ? (
              categoryTree.map(main => {
                const subs = main.children;
                if (subs.length === 0) {
                  // Main category with no children – show as simple checkbox
                  return (
                    <div key={main.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`category-${main.name}`}
                        checked={filters.categories.includes(main.name)}
                        onCheckedChange={() => handleCheckboxChange('categories', main.name)}
                      />
                      <Label htmlFor={`category-${main.name}`} className="cursor-pointer font-medium">
                        {main.name}
                      </Label>
                    </div>
                  );
                }
                return (
                  <Collapsible
                    key={main.id}
                    open={openGroups[main.id] !== false}
                    onOpenChange={(open) => setOpenGroups(prev => ({ ...prev, [main.id]: open }))}
                  >
                    <CollapsibleTrigger className="flex items-center justify-between w-full py-1 text-sm font-semibold text-foreground hover:text-primary transition-colors">
                      <span>{main.name}</span>
                      <ChevronDown className="h-4 w-4 transition-transform data-[state=open]:rotate-180" />
                    </CollapsibleTrigger>
                    <CollapsibleContent className="pl-4 space-y-2 pt-1">
                      {subs.map(sub => (
                        <div key={sub.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`category-${sub.name}`}
                            checked={filters.categories.includes(sub.name)}
                            onCheckedChange={() => handleCheckboxChange('categories', sub.name)}
                          />
                          <Label htmlFor={`category-${sub.name}`} className="cursor-pointer text-sm">
                            {sub.name}
                          </Label>
                        </div>
                      ))}
                    </CollapsibleContent>
                  </Collapsible>
                );
              })
            ) : (
              categories.map(category => (
                <div key={category} className="flex items-center space-x-2">
                  <Checkbox
                    id={`category-${category}`}
                    checked={filters.categories.includes(category)}
                    onCheckedChange={() => handleCheckboxChange('categories', category)}
                  />
                  <Label htmlFor={`category-${category}`} className="cursor-pointer">
                    {category}
                  </Label>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Price Range</CardTitle>
        </CardHeader>
        <CardContent>
          <Slider
            min={0}
            max={maxPrice}
            step={1000}
            value={filters.priceRange}
            onValueChange={handlePriceChange}
            className="mb-4"
          />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>₹{filters.priceRange[0].toLocaleString()}</span>
            <span>₹{filters.priceRange[1].toLocaleString()}</span>
          </div>
        </CardContent>
      </Card>

      {fabricTypes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Fabric Type</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {fabricTypes.map(fabric => (
              <div key={fabric} className="flex items-center space-x-2">
                <Checkbox
                  id={`fabric-${fabric}`}
                  checked={filters.fabricTypes.includes(fabric)}
                  onCheckedChange={() => handleCheckboxChange('fabricTypes', fabric)}
                />
                <Label htmlFor={`fabric-${fabric}`} className="cursor-pointer">
                  {fabric}
                </Label>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {colors.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Color</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {colors.map(color => (
              <div key={color} className="flex items-center space-x-2">
                <Checkbox
                  id={`color-${color}`}
                  checked={filters.colors.includes(color)}
                  onCheckedChange={() => handleCheckboxChange('colors', color)}
                />
                <Label htmlFor={`color-${color}`} className="cursor-pointer">
                  {color}
                </Label>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {occasions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Occasion</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {occasions.map(occasion => (
              <div key={occasion} className="flex items-center space-x-2">
                <Checkbox
                  id={`occasion-${occasion}`}
                  checked={filters.occasions.includes(occasion)}
                  onCheckedChange={() => handleCheckboxChange('occasions', occasion)}
                />
                <Label htmlFor={`occasion-${occasion}`} className="cursor-pointer">
                  {occasion}
                </Label>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {regions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Region</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {regions.map(region => (
              <div key={region} className="flex items-center space-x-2">
                <Checkbox
                  id={`region-${region}`}
                  checked={filters.regions.includes(region)}
                  onCheckedChange={() => handleCheckboxChange('regions', region)}
                />
                <Label htmlFor={`region-${region}`} className="cursor-pointer">
                  {region}
                </Label>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default FilterSidebar;
