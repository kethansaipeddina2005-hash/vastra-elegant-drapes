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
  title = 'Vastra Luxe — Luxury Designer Sarees | Grace in Every Drape',
  description = 'Shop luxury designer sarees at Vastra Luxe. Exclusive handcrafted Kanchipuram, Banarasi & bridal silk sarees with worldwide shipping and WhatsApp video shopping.',
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
      <meta property="og:site_name" content="Vastra Luxe" />
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
  name: 'Vastra Luxe',
  description: 'Luxury designer sarees — exclusive handcrafted Kanchipuram, Banarasi and bridal silk sarees with worldwide shipping.',
  url: window.location.origin,
  logo: `${window.location.origin}/logo.jpg`,
  sameAs: [
    'https://www.instagram.com/vastraluxe',
    'https://www.facebook.com/vastraluxe',
  ],
  contactPoint: {
    '@type': 'ContactPoint',
    telephone: '+91-79979-09061',
    contactType: 'customer service',
    areaServed: ['IN', 'US', 'CA', 'GB', 'AU', 'AE', 'SG', 'DE'],
    availableLanguage: ['English', 'Hindi'],
  },
});

export const getWebsiteSchema = () => ({
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Vastra Luxe',
  url: window.location.origin,
  potentialAction: {
    '@type': 'SearchAction',
    target: `${window.location.origin}/collections?search={search_term_string}`,
    'query-input': 'required name=search_term_string',
  },
});

export const getFAQSchema = (faqs: { question: string; answer: string }[]) => ({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqs.map((f) => ({
    '@type': 'Question',
    name: f.question,
    acceptedAnswer: { '@type': 'Answer', text: f.answer },
  })),
});

export const getLocalBusinessSchema = () => ({
  '@context': 'https://schema.org',
  '@type': 'Store',
  name: 'Vastra Luxe',
  image: `${window.location.origin}/logo.jpg`,
  '@id': window.location.origin,
  url: window.location.origin,
  telephone: '+91-79979-09061',
  priceRange: '₹₹₹',
  address: {
    '@type': 'PostalAddress',
    addressCountry: 'IN',
  },
  areaServed: ['IN', 'US', 'CA', 'GB', 'AU', 'AE', 'SG', 'DE'],
});

export const getProductSchema = (product: {
  name: string;
  description: string;
  price: number;
  images: string[];
  rating?: number;
  reviewCount?: number;
  inStock?: boolean;
  sku?: string | number;
  brand?: string;
  currency?: string;
  reviews?: { author: string; rating: number; text: string; date: string }[];
}) => ({
  '@context': 'https://schema.org',
  '@type': 'Product',
  name: product.name,
  description: product.description,
  image: product.images,
  ...(product.sku !== undefined && { sku: String(product.sku) }),
  brand: {
    '@type': 'Brand',
    name: product.brand || 'Vastra',
  },
  offers: {
    '@type': 'Offer',
    price: product.price,
    priceCurrency: product.currency || 'INR',
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
  ...(product.reviews && product.reviews.length > 0 && {
    review: product.reviews.map((r) => ({
      '@type': 'Review',
      author: { '@type': 'Person', name: r.author },
      reviewRating: { '@type': 'Rating', ratingValue: r.rating, bestRating: 5 },
      reviewBody: r.text,
      datePublished: r.date,
    })),
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
