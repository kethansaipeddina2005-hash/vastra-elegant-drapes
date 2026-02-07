import { Skeleton } from "@/components/ui/skeleton";

const ProductDetailSkeleton = () => (
  <div className="container mx-auto px-4 py-4 max-w-6xl">
    <Skeleton className="h-4 w-48 mb-3" />
    <div className="grid md:grid-cols-2 gap-4 md:gap-6 mb-6">
      <Skeleton className="aspect-square w-full rounded-lg" />
      <div className="space-y-3">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-7 w-32" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-32 w-full rounded-lg" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    </div>
  </div>
);

export default ProductDetailSkeleton;
