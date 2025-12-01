import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface MediaCarouselProps {
  images?: string[];
  videos?: string[];
  className?: string;
}

type MediaItem = {
  type: 'image' | 'video';
  url: string;
};

export const MediaCarousel = ({ images = [], videos = [], className }: MediaCarouselProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Combine images and videos into a single media array
  const mediaItems: MediaItem[] = [
    ...images.map(url => ({ type: 'image' as const, url })),
    ...videos.map(url => ({ type: 'video' as const, url }))
  ];

  const totalItems = mediaItems.length;

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

  const currentMedia = mediaItems[currentIndex];

  return (
    <div className={cn("relative w-full group", className)}>
      {/* Main Media Container */}
      <div className="relative w-full aspect-[4/3] bg-muted/20 rounded-lg overflow-hidden">
        <div
          className="absolute inset-0 transition-transform duration-500 ease-out"
          style={{ transform: `translateX(0)` }}
        >
          {currentMedia.type === 'image' ? (
            <img
              src={currentMedia.url}
              alt={`Media ${currentIndex + 1}`}
              className="w-full h-full object-contain"
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

        {/* Navigation Arrows */}
        {totalItems > 1 && (
          <>
            <Button
              variant="ghost"
              size="icon"
              onClick={handlePrevious}
              className="absolute left-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background/90 opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-lg"
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background/90 opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-lg"
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
          {currentMedia.type === 'image' ? 'Photo' : 'Video'}
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
  );
};
