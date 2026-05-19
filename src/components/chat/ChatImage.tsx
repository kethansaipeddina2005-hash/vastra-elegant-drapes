import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

/** Resolve a chat-images storage path (or legacy public URL) to a short-lived signed URL. */
export const resolveChatImagePath = (stored: string): string | null => {
  if (!stored) return null;
  if (stored.startsWith("http")) {
    const m = stored.match(/chat-images\/(.+?)(?:\?|$)/);
    return m?.[1] ?? null;
  }
  return stored;
};

interface ChatImageProps {
  src: string;
  alt?: string;
  className?: string;
}

const ChatImage = ({ src, alt, className }: ChatImageProps) => {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const path = resolveChatImagePath(src);
    if (!path) {
      setUrl(null);
      return;
    }
    supabase.storage
      .from("chat-images")
      .createSignedUrl(path, 60 * 60)
      .then(({ data }) => {
        if (active) setUrl(data?.signedUrl ?? null);
      });
    return () => {
      active = false;
    };
  }, [src]);

  if (!url) {
    return <div className={cn("bg-muted animate-pulse rounded", className)} />;
  }

  return (
    <a href={url} target="_blank" rel="noopener noreferrer">
      <img src={url} alt={alt} className={className} />
    </a>
  );
};

export default ChatImage;