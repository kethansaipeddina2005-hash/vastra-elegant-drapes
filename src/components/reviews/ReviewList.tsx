import { useMemo, useState } from 'react';
import { StarRating } from './StarRating';
import { format } from 'date-fns';
import { ImageLightbox } from '@/components/ImageLightbox';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { BadgeCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  photos: string[];
  created_at: string;
  order_item_id?: string | null;
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
  const [filter, setFilter] = useState<'all' | 'photos' | 5 | 4 | 3 | 2 | 1>('all');
  const [sort, setSort] = useState<'recent' | 'highest' | 'lowest'>('recent');

  const openLightbox = (photos: string[], index: number) => {
    setLightboxImages(photos);
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const filteredSorted = useMemo(() => {
    let list = [...reviews];
    if (filter === 'photos') list = list.filter((r) => r.photos && r.photos.length > 0);
    else if (typeof filter === 'number') list = list.filter((r) => r.rating === filter);
    if (sort === 'recent') list.sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
    else if (sort === 'highest') list.sort((a, b) => b.rating - a.rating);
    else if (sort === 'lowest') list.sort((a, b) => a.rating - b.rating);
    return list;
  }, [reviews, filter, sort]);

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

  const chips: { value: typeof filter; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'photos', label: 'With photos' },
    { value: 5, label: '5★' },
    { value: 4, label: '4★' },
    { value: 3, label: '3★' },
    { value: 2, label: '2★' },
    { value: 1, label: '1★' },
  ];

  return (
    <>
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <div className="flex flex-wrap gap-1.5">
          {chips.map((c) => (
            <button
              key={String(c.value)}
              onClick={() => setFilter(c.value)}
              className={cn(
                'text-xs px-2.5 py-1 rounded-full border transition-colors',
                filter === c.value
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background border-border text-muted-foreground hover:border-primary/50',
              )}
            >
              {c.label}
            </button>
          ))}
        </div>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as typeof sort)}
          className="ml-auto text-xs px-2 py-1 rounded-md border border-border bg-background"
          aria-label="Sort reviews"
        >
          <option value="recent">Most recent</option>
          <option value="highest">Highest rated</option>
          <option value="lowest">Lowest rated</option>
        </select>
      </div>

      {filteredSorted.length === 0 ? (
        <div className="text-center py-6 text-sm text-muted-foreground">
          No reviews match this filter.
        </div>
      ) : (
      <div className="space-y-4">
        {filteredSorted.map((review) => (
          <div key={review.id} className="p-4 bg-muted/20 rounded-lg space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-xs bg-primary/10 text-primary">
                    {review.profiles?.full_name?.charAt(0)?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-medium">
                      {review.profiles?.full_name || 'Anonymous'}
                    </p>
                    {review.order_item_id && (
                      <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full border border-emerald-200">
                        <BadgeCheck className="h-3 w-3" />
                        Verified Purchase
                      </span>
                    )}
                  </div>
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
                      loading="lazy"
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
      )}

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
