import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  canonical?: string;
  ogImage?: string;
  ogType?: 'website' | 'article' | 'product';
  noIndex?: boolean;
  structuredData?: object;
}

const SEO = ({
  title = 'Vastra — Grace in Every Drape',
  description = 'Discover elegant handcrafted Indian sarees at Vastra. Traditional craftsmanship meets modern style. Shop authentic Banarasi, Kanjivaram, Chanderi sarees.',
  canonical,
  ogImage = '/og-image.jpg',
  ogType = 'website',
  noIndex = false,
  structuredData,
}: SEOProps) => {
  const siteUrl = window.location.origin;
  const fullCanonical = canonical ? `${siteUrl}${canonical}` : window.location.href;
  const fullOgImage = ogImage.startsWith('http') ? ogImage : `${siteUrl}${ogImage}`;

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{title}</title>
      <meta name="title" content={title} />
      <meta name="description" content={description} />
      
      {/* Canonical URL */}
      <link rel="canonical" href={fullCanonical} />
      
      {/* Robots */}
      {noIndex && <meta name="robots" content="noindex, nofollow" />}
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={fullCanonical} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={fullOgImage} />
      <meta property="og:site_name" content="Vastra" />
      <meta property="og:locale" content="en_IN" />
      
      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={fullCanonical} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={fullOgImage} />
      
      {/* Structured Data */}
      {structuredData && (
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      )}
    </Helmet>
  );
};

export default SEO;

// Structured Data Helpers
export const getOrganizationSchema = () => ({
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Vastra',
  description: 'Elegant handcrafted Indian sarees with traditional craftsmanship',
  url: window.location.origin,
  logo: `${window.location.origin}/logo.jpg`,
  sameAs: [
    'https://www.instagram.com/vastra',
    'https://www.facebook.com/vastra',
  ],
  contactPoint: {
    '@type': 'ContactPoint',
    telephone: '+91-9876543210',
    contactType: 'customer service',
    areaServed: 'IN',
    availableLanguage: ['English', 'Hindi'],
  },
});

export const getWebsiteSchema = () => ({
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Vastra',
  url: window.location.origin,
  potentialAction: {
    '@type': 'SearchAction',
    target: `${window.location.origin}/collections?search={search_term_string}`,
    'query-input': 'required name=search_term_string',
  },
});

export const getProductSchema = (product: {
  name: string;
  description: string;
  price: number;
  images: string[];
  rating?: number;
  reviewCount?: number;
  inStock?: boolean;
}) => ({
  '@context': 'https://schema.org',
  '@type': 'Product',
  name: product.name,
  description: product.description,
  image: product.images,
  offers: {
    '@type': 'Offer',
    price: product.price,
    priceCurrency: 'INR',
    availability: product.inStock !== false 
      ? 'https://schema.org/InStock' 
      : 'https://schema.org/OutOfStock',
    seller: {
      '@type': 'Organization',
      name: 'Vastra',
    },
  },
  ...(product.rating && product.reviewCount && {
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: product.rating,
      reviewCount: product.reviewCount,
    },
  }),
});

export const getBreadcrumbSchema = (items: { name: string; url: string }[]) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map((item, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: item.name,
    item: `${window.location.origin}${item.url}`,
  })),
});

export const getArticleSchema = (article: {
  title: string;
  description: string;
  datePublished: string;
  author?: string;
}) => ({
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: article.title,
  description: article.description,
  datePublished: article.datePublished,
  author: {
    '@type': 'Organization',
    name: article.author || 'Vastra',
  },
  publisher: {
    '@type': 'Organization',
    name: 'Vastra',
    logo: {
      '@type': 'ImageObject',
      url: `${window.location.origin}/logo.jpg`,
    },
  },
});
