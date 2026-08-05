import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';

/**
 * Emits `noindex, nofollow` for private / transactional routes so crawlers
 * only spend budget on public, indexable storefront pages.
 */
const NOINDEX_PREFIXES = [
  '/account',
  '/admin',
  '/collaborator',
  '/cart',
  '/checkout',
  '/payment',
  '/thank-you',
];

const RouteMeta = () => {
  const { pathname } = useLocation();
  const isPrivate = NOINDEX_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

  if (!isPrivate) return null;

  return (
    <Helmet>
      <meta name="robots" content="noindex, nofollow" />
      <meta name="googlebot" content="noindex, nofollow" />
    </Helmet>
  );
};

export default RouteMeta;