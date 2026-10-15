// Official public origin. Keep preview origins out of indexable SEO URLs.
export const SITE_URL = 'https://www.vastraluxe.com';

export function getSiteUrl(path = '/') {
  const parsed = new URL(path, `${SITE_URL}/`);
  return `${SITE_URL}${parsed.pathname}`;
}