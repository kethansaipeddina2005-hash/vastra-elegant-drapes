import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ReviewForm } from './ReviewForm';
import { ReviewList } from './ReviewList';
import { StarRating } from './StarRating';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  photos: string[];
  created_at: string;
  profiles?: {
    full_name: string | null;
  } | null;
}

interface ProductReviewsProps {
  productId: number;
  productRating?: number;
  productReviewCount?: number;
}

export const ProductReviews = ({ productId, productRating = 0, productReviewCount = 0 }: ProductReviewsProps) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [displayCount, setDisplayCount] = useState(3);

  const fetchReviews = async () => {
    try {
      const { data: reviewsData, error } = await supabase
        .from('reviews')
        .select('id, rating, comment, photos, created_at, user_id')
        .eq('product_id', productId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch profiles for the reviews
      if (reviewsData && reviewsData.length > 0) {
        const userIds = [...new Set(reviewsData.map((r) => r.user_id))];
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', userIds);

        const profilesMap = new Map(profilesData?.map((p) => [p.id, p]) || []);

        const reviewsWithProfiles = reviewsData.map((review) => ({
          ...review,
          profiles: profilesMap.get(review.user_id) || null,
        }));

        setReviews(reviewsWithProfiles);
      } else {
        setReviews([]);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [productId]);

  const ratingDistribution = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
    percentage: reviews.length > 0
      ? (reviews.filter((r) => r.rating === star).length / reviews.length) * 100
      : 0,
  }));

  return (
    <div className="space-y-6">
      {/* Rating Summary */}
      <div className="flex flex-col md:flex-row gap-6 p-4 bg-muted/20 rounded-lg">
        <div className="text-center md:text-left">
          <div className="text-4xl font-bold text-foreground">
            {productRating?.toFixed(1) || '0.0'}
          </div>
          <StarRating rating={Math.round(productRating || 0)} size="md" />
          <p className="text-sm text-muted-foreground mt-1">
            {productReviewCount || 0} {productReviewCount === 1 ? 'review' : 'reviews'}
          </p>
        </div>
        
        <div className="flex-1 space-y-1.5">
          {ratingDistribution.map(({ star, count, percentage }) => (
            <div key={star} className="flex items-center gap-2 text-sm">
              <span className="w-3">{star}</span>
              <StarRating rating={1} maxRating={1} size="sm" />
              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-gold transition-all duration-300"
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <span className="text-muted-foreground w-8 text-right">{count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Write Review Toggle */}
      <Button
        variant="outline"
        onClick={() => setShowForm(!showForm)}
        className="w-full justify-between"
      >
        Write a Review
        {showForm ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </Button>

      {/* Review Form */}
      {showForm && (
        <ReviewForm
          productId={productId}
          onReviewAdded={() => {
            fetchReviews();
            setShowForm(false);
          }}
        />
      )}

      {/* Reviews List */}
      <ReviewList reviews={reviews.slice(0, displayCount)} loading={loading} />

      {/* Load More */}
      {reviews.length > displayCount && (
        <Button
          variant="ghost"
          onClick={() => setDisplayCount((prev) => prev + 5)}
          className="w-full"
        >
          Show More Reviews ({reviews.length - displayCount} remaining)
        </Button>
      )}
    </div>
  );
};
