/**
 * Image optimization helpers.
 *
 * Product/banner/category images live in Supabase Storage, which exposes an
 * on-the-fly image transformation endpoint. We rewrite public object URLs to the
 * render endpoint so the CDN returns a correctly sized, high-quality image and
 * automatically negotiates WebP/AVIF via the browser's Accept header.
 */

const OBJECT_PATH = "/storage/v1/object/public/";
const RENDER_PATH = "/storage/v1/render/image/public/";

export interface ImageTransform {
  width?: number;
  height?: number;
  /** 20-100. Defaults to 82 — visually lossless for luxury photography. */
  quality?: number;
  resize?: "cover" | "contain" | "fill";
}

export const isTransformable = (url?: string | null): boolean =>
  !!url && url.includes(OBJECT_PATH);

/** Returns a CDN-transformed URL when possible, otherwise the original. */
export const optimizedImage = (
  url?: string | null,
  { width, height, quality = 82, resize = "cover" }: ImageTransform = {},
): string => {
  if (!url) return "";
  if (!isTransformable(url)) return url;

  const base = url.replace(OBJECT_PATH, RENDER_PATH);
  const params = new URLSearchParams();
  if (width) params.set("width", String(Math.round(width)));
  if (height) params.set("height", String(Math.round(height)));
  params.set("quality", String(quality));
  if (width || height) params.set("resize", resize);
  return `${base}?${params.toString()}`;
};

/** Builds a `srcset` string across the given widths, preserving aspect ratio. */
export const buildSrcSet = (
  url: string | null | undefined,
  widths: number[],
  opts: Omit<ImageTransform, "width" | "height"> & { aspectRatio?: number } = {},
): string | undefined => {
  if (!isTransformable(url)) return undefined;
  const { aspectRatio, ...rest } = opts;
  return widths
    .map((w) => {
      const height = aspectRatio ? Math.round(w / aspectRatio) : undefined;
      return `${optimizedImage(url, { ...rest, width: w, height })} ${w}w`;
    })
    .join(", ");
};

export const PRODUCT_CARD_WIDTHS = [200, 320, 480, 640, 800];
export const PRODUCT_DETAIL_WIDTHS = [480, 768, 1024, 1440];
export const HERO_WIDTHS = [640, 960, 1280, 1600, 1920];
export const THUMBNAIL_WIDTHS = [80, 160, 240];
