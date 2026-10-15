// Generates public/sitemap.xml at build time from Supabase products + blog routes.

import { readFileSync, writeFileSync } from "fs";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";
import { SITE_URL } from '../src/lib/site';

const BASE_URL = SITE_URL;

// Match Vite's local environment loading without printing credentials.
try {
  for (const line of readFileSync(resolve('.env'), 'utf8').split(/\r?\n/)) {
    const match = line.match(/^(VITE_SUPABASE_URL|VITE_SUPABASE_PUBLISHABLE_KEY)=(.*)$/);
    if (match && !process.env[match[1]]) process.env[match[1]] = match[2].trim().replace(/^['"]|['"]$/g, '');
  }
} catch { /* Hosted builds may provide these variables directly. */ }

interface SitemapEntry {
  path: string;
  lastmod?: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
}

const staticEntries: SitemapEntry[] = [
  { path: "/", changefreq: "daily", priority: "1.0" },
  { path: "/collections", changefreq: "daily", priority: "0.9" },
  { path: "/dresses", changefreq: "daily", priority: "0.9" },
  { path: "/sarees", changefreq: "daily", priority: "0.9" },
  { path: "/blog", changefreq: "weekly", priority: "0.8" },
  { path: "/about", changefreq: "monthly", priority: "0.7" },
  { path: "/contact", changefreq: "monthly", priority: "0.7" },
  { path: "/reels", changefreq: "weekly", priority: "0.6" },
  { path: "/become-a-partner", changefreq: "monthly", priority: "0.5" },
];

const blogSlugs = [
  "kanchipuram-silk-saree-guide",
  "how-to-drape-saree",
];

async function fetchProductEntries(): Promise<SitemapEntry[]> {
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    throw new Error('[sitemap] Missing product connection; existing sitemap was not overwritten.');
  }
  try {
    const supabase = createClient(url, key);
    const { data, error } = await supabase
      .from("products")
      .select("id, updated_at")
      .order("updated_at", { ascending: false });
    if (error) throw error;
    return (data || []).map((p: { id: number; updated_at: string | null }) => ({
      path: `/product/${p.id}`,
      // Product-specific timestamp includes changes to visible price/availability.
      // Never substitute the build date or generation time.
      lastmod: p.updated_at && Number.isFinite(Date.parse(p.updated_at)) ? new Date(p.updated_at).toISOString().slice(0, 10) : undefined,
      changefreq: "weekly",
      priority: "0.8",
    }));
  } catch (err) {
    throw new Error('[sitemap] Product retrieval failed; existing sitemap was not overwritten.', { cause: err });
  }
}

async function fetchBrandEntries(): Promise<SitemapEntry[]> {
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return [];
  const client = createClient(url, key);
  const { data, error } = await client.rpc('get_partner_brands', {});
  if (error) throw new Error('[sitemap] Brand retrieval failed; existing sitemap was not overwritten.');
  const used = new Set<string>();
  return [...(data || [])].sort((a, b) => a.id.localeCompare(b.id)).map(row => {
    const base = row.brand_name.normalize('NFKC').toLowerCase().replace(/['’]/g, '').replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-+|-+$/g, '') || 'designer';
    let slug = base;
    let suffix = 2;
    while (used.has(slug)) slug = `${base}-${suffix++}`;
    used.add(slug);
    return { path: `/brand/${slug}`, changefreq: 'weekly', priority: '0.5' };
  });
}

function render(entries: SitemapEntry[]) {
  const urls = entries.map((e) =>
    [
      `  <url>`,
      `    <loc>${`${BASE_URL}${e.path}`.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</loc>`,
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
  const brandEntries = await fetchBrandEntries();
  const blogEntries: SitemapEntry[] = blogSlugs.map((slug) => ({
    path: `/blog/${slug}`,
    changefreq: "monthly",
    priority: "0.6",
  }));
  const entries = [...staticEntries, ...blogEntries, ...productEntries, ...brandEntries];
  writeFileSync(resolve("public/sitemap.xml"), render(entries));
  console.log(`[sitemap] wrote ${entries.length} entries`);
})();