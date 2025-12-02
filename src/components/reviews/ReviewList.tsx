import { useState } from 'react';
import { StarRating } from './StarRating';
import { format } from 'date-fns';
import { ImageLightbox } from '@/components/ImageLightbox';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

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

interface ReviewListProps {
  reviews: Review[];
  loading?: boolean;
}

export const ReviewList = ({ reviews, loading }: ReviewListProps) => {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxImages, setLightboxImages] = useState<string[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const openLightbox = (photos: string[], index: number) => {
    setLightboxImages(photos);
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse space-y-2 p-4 bg-muted/20 rounded-lg">
            <div className="h-4 bg-muted rounded w-24" />
            <div className="h-3 bg-muted rounded w-full" />
            <div className="h-3 bg-muted rounded w-3/4" />
          </div>
        ))}
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No reviews yet. Be the first to review this product!</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {reviews.map((review) => (
          <div key={review.id} className="p-4 bg-muted/20 rounded-lg space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-xs bg-primary/10 text-primary">
                    {review.profiles?.full_name?.charAt(0)?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">
                    {review.profiles?.full_name || 'Anonymous'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(review.created_at), 'MMM d, yyyy')}
                  </p>
                </div>
              </div>
              <StarRating rating={review.rating} size="sm" />
            </div>

            {review.comment && (
              <p className="text-sm text-muted-foreground leading-relaxed">
                {review.comment}
              </p>
            )}

            {review.photos && review.photos.length > 0 && (
              <div className="flex gap-2 pt-2">
                {review.photos.map((photo, index) => (
                  <button
                    key={index}
                    onClick={() => openLightbox(review.photos, index)}
                    className="w-16 h-16 rounded-lg overflow-hidden hover:opacity-80 transition-opacity"
                  >
                    <img
                      src={photo}
                      alt={`Review photo ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <ImageLightbox
        images={lightboxImages}
        currentIndex={lightboxIndex}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        onNavigate={setLightboxIndex}
      />
    </>
  );
};
