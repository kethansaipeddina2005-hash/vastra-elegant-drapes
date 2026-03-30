import { useEffect, useState, useRef, TouchEvent } from 'react';
import { ChevronLeft, ChevronRight, Expand } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ImageLightbox } from './ImageLightbox';
import FitCheckSlide from './FitCheckSlide';
import { useIsMobile } from '@/hooks/use-mobile';

interface MediaCarouselProps {
  images?: string[];
  videos?: string[];
  className?: string;
  productName?: string;
  productUrl?: string;
  showFitCheck?: boolean;
}

type MediaItem = {
  type: 'image' | 'video' | 'fitcheck';
  url: string;
};

export const MediaCarousel = ({ images = [], videos = [], className, productName, productUrl, showFitCheck = true }: MediaCarouselProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const isMobile = useIsMobile();
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const enableFitCheck = false;

  const mediaItems: MediaItem[] = [
    ...images.map(url => ({ type: 'image' as const, url })),
    ...videos.map(url => ({ type: 'video' as const, url })),
    ...(enableFitCheck ? [{ type: 'fitcheck' as const, url: '' }] : []),
  ];

  const totalItems = mediaItems.length;

  useEffect(() => {
    setCurrentIndex((prev) => Math.min(prev, Math.max(totalItems - 1, 0)));
  }, [totalItems]);

  if (totalItems === 0) {
    return (
      <div className={cn("w-full aspect-[4/3] bg-muted rounded-lg flex items-center justify-center", className)}>
        <p className="text-muted-foreground">No media available</p>
      </div>
    );
  }

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? totalItems - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === totalItems - 1 ? 0 : prev + 1));
  };

  const handleTouchStart = (e: TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
    touchEndX.current = null;
  };

  const handleTouchMove = (e: TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (touchStartX.current === null || touchEndX.current === null) return;
    const diff = touchStartX.current - touchEndX.current;
    const minSwipe = 50;
    if (diff > minSwipe) handleNext();
    else if (diff < -minSwipe) handlePrevious();
    touchStartX.current = null;
    touchEndX.current = null;
  };

  const currentMedia = mediaItems[currentIndex];

  const handleImageClick = () => {
    if (currentMedia.type === 'image') {
      setIsLightboxOpen(true);
    }
  };

  return (
    <>
      <div className={cn("relative w-full group", className)}>
        {/* Main Media Container */}
        <div
          className="relative w-full aspect-[4/3] bg-muted/20 rounded-lg overflow-hidden"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="absolute inset-0 transition-transform duration-500 ease-out">
            {currentMedia.type === 'image' ? (
              <div className="relative w-full h-full group/image">
                <img
                  src={currentMedia.url}
                  alt={`Media ${currentIndex + 1}`}
                  className="w-full h-full object-contain cursor-pointer"
                  onClick={handleImageClick}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleImageClick}
                  className="absolute top-4 right-4 h-10 w-10 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background/90 opacity-0 group-hover/image:opacity-100 transition-opacity duration-300"
                >
                  <Expand className="h-5 w-5" />
                </Button>
              </div>
            ) : currentMedia.type === 'fitcheck' ? (
              <FitCheckSlide
                sareeImageUrl={images[0] || ''}
                sareeName={productName || 'this saree'}
                className="w-full h-full"
              />
            ) : (
              <video
                src={currentMedia.url}
                controls
                className="w-full h-full object-contain"
                key={currentMedia.url}
              />
            )}
          </div>

          {/* Navigation Arrows - always visible on mobile */}
          {totalItems > 1 && (
            <>
              <Button
                variant="ghost"
                size="icon"
                onClick={handlePrevious}
                className={cn(
                  "absolute left-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background/90 transition-opacity duration-300 shadow-lg",
                  isMobile ? "opacity-70" : "opacity-0 group-hover:opacity-100"
                )}
              >
                <ChevronLeft className="h-6 w-6" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleNext}
                className={cn(
                  "absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background/90 transition-opacity duration-300 shadow-lg",
                  isMobile ? "opacity-70" : "opacity-0 group-hover:opacity-100"
                )}
              >
                <ChevronRight className="h-6 w-6" />
              </Button>
            </>
          )}

          {/* Media Counter */}
          {totalItems > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-background/80 backdrop-blur-sm rounded-full text-sm font-medium">
              {currentIndex + 1} / {totalItems}
            </div>
          )}

          {/* Media Type Badge */}
          <div className="absolute top-4 left-4 px-2 py-1 bg-background/80 backdrop-blur-sm rounded text-xs font-medium">
            {currentMedia.type === 'image' ? 'Photo' : currentMedia.type === 'fitcheck' ? '✨ Try-On' : 'Video'}
          </div>
        </div>

        {/* Thumbnail Navigation */}
        {totalItems > 1 && (
          <div className="mt-4 flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
            {mediaItems.map((item, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={cn(
                  "relative flex-shrink-0 w-16 h-16 md:w-20 md:h-20 rounded-lg overflow-hidden border-2 transition-all duration-300",
                  currentIndex === index
                    ? "border-primary scale-105 shadow-lg"
                    : "border-transparent hover:border-muted opacity-60 hover:opacity-100"
                )}
              >
                {item.type === 'image' ? (
                  <img
                    src={item.url}
                    alt={`Thumbnail ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                ) : item.type === 'fitcheck' ? (
                  <div className="relative w-full h-full bg-gradient-to-br from-primary/10 to-accent/20 flex items-center justify-center">
                    <span className="text-lg">✨</span>
                  </div>
                ) : (
                  <div className="relative w-full h-full bg-black">
                    <video
                      src={item.url}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                      <div className="w-6 h-6 rounded-full bg-white/90 flex items-center justify-center">
                        <div className="w-0 h-0 border-t-4 border-t-transparent border-l-6 border-l-black border-b-4 border-b-transparent ml-0.5" />
                      </div>
                    </div>
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Image Lightbox */}
      <ImageLightbox
        images={images}
        currentIndex={images.indexOf(currentMedia.type === 'image' ? currentMedia.url : '')}
        isOpen={isLightboxOpen}
        onClose={() => setIsLightboxOpen(false)}
        onNavigate={(index) => {
          const imageOnlyIndex = mediaItems.findIndex((item, i) => item.type === 'image' && images.indexOf(item.url) === index);
          if (imageOnlyIndex !== -1) setCurrentIndex(imageOnlyIndex);
        }}
        productName={productName}
        productUrl={productUrl}
      />
    </>
  );
};
