import { ImgHTMLAttributes } from "react";
import { buildSrcSet, optimizedImage } from "@/lib/image";

interface SmartImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, "srcSet"> {
  src: string;
  alt: string;
  /** Candidate widths for the generated srcset. */
  widths: number[];
  /** The `sizes` attribute — tells the browser which candidate to download. */
  sizes: string;
  /** Intrinsic width/height used to reserve layout space (prevents CLS). */
  intrinsicWidth: number;
  intrinsicHeight: number;
  /** Set for the LCP image: eager loading + high fetch priority. */
  priority?: boolean;
  quality?: number;
  resize?: "cover" | "contain" | "fill";
}

/**
 * Responsive, CDN-optimized image. Serves WebP/AVIF automatically (content
 * negotiation), reserves layout space, and lazy-loads everything but the LCP image.
 */
const SmartImage = ({
  src,
  alt,
  widths,
  sizes,
  intrinsicWidth,
  intrinsicHeight,
  priority = false,
  quality = 82,
  resize = "cover",
  ...rest
}: SmartImageProps) => {
  const aspectRatio = intrinsicWidth / intrinsicHeight;
  const fallbackWidth = widths[Math.min(widths.length - 1, 2)];

  return (
    <img
      src={optimizedImage(src, {
        width: fallbackWidth,
        height: resize === "contain" ? undefined : Math.round(fallbackWidth / aspectRatio),
        quality,
        resize,
      })}
      srcSet={buildSrcSet(src, widths, {
        quality,
        resize,
        aspectRatio: resize === "contain" ? undefined : aspectRatio,
      })}
      sizes={sizes}
      alt={alt}
      width={intrinsicWidth}
      height={intrinsicHeight}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : "auto"}
      decoding={priority ? "sync" : "async"}
      {...rest}
    />
  );
};

export default SmartImage;
