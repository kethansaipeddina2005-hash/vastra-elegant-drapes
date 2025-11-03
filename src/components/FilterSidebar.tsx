import { Filter } from "@/types/product";
import { Checkbox } from "./ui/checkbox";
import { Label } from "./ui/label";
import { Slider } from "./ui/slider";
import { fabricTypes, colors, occasions, regions } from "@/data/products";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

interface FilterSidebarProps {
  filters: Filter;
  onFilterChange: (filters: Filter) => void;
  maxPrice?: number;
}

const FilterSidebar = ({ filters, onFilterChange, maxPrice = 50000 }: FilterSidebarProps) => {
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

  return (
    <div className="space-y-6">
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
    </div>
  );
};

export default FilterSidebar;
