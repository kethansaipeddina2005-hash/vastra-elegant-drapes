import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import SEO from "@/components/SEO";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);

  // Master category URLs like /dresses or /sarees come from the database
  useEffect(() => {
    const slug = location.pathname.replace(/^\/+|\/+$/g, "").toLowerCase();
    if (!slug || slug.includes("/")) { setChecking(false); return; }
    supabase.from("categories").select("name").eq("slug", slug).eq("is_active", true).maybeSingle()
      .then(({ data }) => {
        if (data) navigate(`/collections?category=${encodeURIComponent(data.name)}`, { replace: true });
        else setChecking(false);
      });
  }, [location.pathname]);

  useEffect(() => {
    if (checking) return;
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname, checking]);

  if (checking) return null;

  return (
    <>
    <SEO
      title="Page Not Found — Vastra Luxe"
      description="The page you are looking for is not available. Browse our luxury designer saree collections instead."
      noIndex
    />
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold">404</h1>
        <p className="mb-4 text-xl text-gray-600">Oops! Page not found</p>
        <a href="/" className="text-blue-500 underline hover:text-blue-700">
          Return to Home
        </a>
      </div>
    </div>
    </>
  );
};

export default NotFound;
