import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { trackPageView } from "@/lib/analytics";

const AnalyticsTracker = () => {
  const location = useLocation();
  useEffect(() => {
    // Defer so document.title reflects the new route (react-helmet-async updates async)
    const t = setTimeout(() => {
      trackPageView(location.pathname + location.search);
    }, 0);
    return () => clearTimeout(t);
  }, [location.pathname, location.search]);
  return null;
};

export default AnalyticsTracker;