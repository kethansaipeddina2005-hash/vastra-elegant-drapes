// Generates public/sitemap.xml at build time from Supabase products + blog routes.

import { writeFileSync } from "fs";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";

const BASE_URL = "https://vastra-elegant-drapes.lovable.app";

interface SitemapEntry {
  path: string;
  lastmod?: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
}

const staticEntries: SitemapEntry[] = [
  { path: "/", changefreq: "daily", priority: "1.0" },
  { path: "/collections", changefreq: "daily", priority: "0.9" },
  { path: "/blog", changefreq: "weekly", priority: "0.8" },
  { path: "/about", changefreq: "monthly", priority: "0.7" },
  { path: "/contact", changefreq: "monthly", priority: "0.7" },
  { path: "/reels", changefreq: "weekly", priority: "0.6" },
];

const blogSlugs = [
  "how-to-drape-saree",
  "caring-for-silk-sarees",
  "banarasi-silk-history",
  "wedding-saree-guide",
  "sustainable-sarees",
  "regional-saree-styles",
];

async function fetchProductEntries(): Promise<SitemapEntry[]> {
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    console.warn("[sitemap] Supabase env vars missing; skipping dynamic product entries.");
    return [];
  }
  try {
    const supabase = createClient(url, key);
    const { data, error } = await supabase
      .from("products")
      .select("id, updated_at")
      .order("updated_at", { ascending: false });
    if (error) throw error;
    return (data || []).map((p: any) => ({
      path: `/product/${p.id}`,
      lastmod: p.updated_at ? new Date(p.updated_at).toISOString().slice(0, 10) : undefined,
      changefreq: "weekly",
      priority: "0.8",
    }));
  } catch (err) {
    console.warn("[sitemap] Failed to fetch products:", err);
    return [];
  }
}

function render(entries: SitemapEntry[]) {
  const urls = entries.map((e) =>
    [
      `  <url>`,
      `    <loc>${BASE_URL}${e.path}</loc>`,
      e.lastmod ? `    <lastmod>${e.lastmod}</lastmod>` : null,
      e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
      e.priority ? `    <priority>${e.priority}</priority>` : null,
      `  </url>`,
    ]
      .filter(Boolean)
      .join("\n"),
  );
  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
    ...urls,
    `</urlset>`,
  ].join("\n");
}

(async () => {
  const productEntries = await fetchProductEntries();
  const blogEntries: SitemapEntry[] = blogSlugs.map((slug) => ({
    path: `/blog/${slug}`,
    changefreq: "monthly",
    priority: "0.6",
  }));
  const entries = [...staticEntries, ...blogEntries, ...productEntries];
  writeFileSync(resolve("public/sitemap.xml"), render(entries));
  console.log(`[sitemap] wrote ${entries.length} entries`);
})();