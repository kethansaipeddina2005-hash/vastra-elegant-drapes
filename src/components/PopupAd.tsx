import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';

interface PopupAdData {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  link_url: string | null;
  link_label: string | null;
  delay_seconds: number;
  auto_close_seconds: number | null;
}

const SESSION_KEY = 'vastra-popup-dismissed';

const getDismissed = (): string[] => {
  try {
    return JSON.parse(sessionStorage.getItem(SESSION_KEY) || '[]');
  } catch {
    return [];
  }
};

const PopupAd = () => {
  const [ad, setAd] = useState<PopupAdData | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let showTimer: ReturnType<typeof setTimeout> | undefined;
    let closeTimer: ReturnType<typeof setTimeout> | undefined;

    (async () => {
      const { data, error } = await supabase
        .from('popup_ads')
        .select('id,title,description,image_url,link_url,link_label,delay_seconds,auto_close_seconds')
        .eq('is_active', true)
        .order('display_order', { ascending: true })
        .limit(10);
      if (error || !data) return;
      const dismissed = getDismissed();
      const next = data.find((d) => !dismissed.includes(d.id));
      if (!next) return;
      setAd(next);
      showTimer = setTimeout(() => {
        setVisible(true);
        if (next.auto_close_seconds && next.auto_close_seconds > 0) {
          closeTimer = setTimeout(
            () => handleClose(next.id),
            next.auto_close_seconds * 1000
          );
        }
      }, Math.max(0, (next.delay_seconds ?? 0) * 1000));
    })();

    return () => {
      if (showTimer) clearTimeout(showTimer);
      if (closeTimer) clearTimeout(closeTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleClose = (id?: string) => {
    setVisible(false);
    const target = id || ad?.id;
    if (target) {
      const dismissed = getDismissed();
      if (!dismissed.includes(target)) {
        sessionStorage.setItem(SESSION_KEY, JSON.stringify([...dismissed, target]));
      }
    }
  };

  if (!ad || !visible) return null;

  const isExternal = ad.link_url?.startsWith('http');

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in"
      onClick={() => handleClose()}
    >
      <div
        className="relative bg-background rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          aria-label="Close"
          onClick={() => handleClose()}
          className="absolute top-3 right-3 z-10 h-8 w-8 rounded-full bg-background/80 hover:bg-background text-foreground flex items-center justify-center shadow-md transition"
        >
          <X className="h-4 w-4" />
        </button>
        {ad.image_url && (
          <img
            src={ad.image_url}
            alt={ad.title}
            className="w-full h-48 object-cover"
          />
        )}
        <div className="p-6 space-y-3">
          <h2 className="text-2xl font-playfair font-bold text-foreground">
            {ad.title}
          </h2>
          {ad.description && (
            <p className="text-muted-foreground whitespace-pre-line">
              {ad.description}
            </p>
          )}
          {ad.link_url && (
            <div className="pt-2">
              {isExternal ? (
                <Button asChild className="w-full">
                  <a
                    href={ad.link_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => handleClose()}
                  >
                    {ad.link_label || 'Learn More'}
                  </a>
                </Button>
              ) : (
                <Button asChild className="w-full">
                  <Link to={ad.link_url} onClick={() => handleClose()}>
                    {ad.link_label || 'Learn More'}
                  </Link>
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PopupAd;