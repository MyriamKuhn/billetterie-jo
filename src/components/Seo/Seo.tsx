import { Helmet } from 'react-helmet';
import { useTranslation } from 'react-i18next';
import { makeJsonLd } from '../../utils/seo';

// Base URL of the site (used for canonical and social previews)
const BASE_URL = 'https://jo2024.mkcodecreations.dev';

interface SeoProps {
  title?: string;
  description?: string;
  noIndex?: boolean;
}

/**
 * Injects SEO meta tags, Open Graph, Twitter Card, and JSON-LD structured data into the document head using react-helmet.
 * This component is designed to enhance the SEO of the page by providing relevant metadata. 
 */
function Seo({ title, description, noIndex }: SeoProps) {
  const { t, i18n } = useTranslation();
  const locale = i18n.language;           
  const url    = `${BASE_URL}/`;

  // Fallback title & description from translations
  const defaultTitle       = t('seo.title');
  const defaultDescription = t('seo.description');
  // Generate structured data using a helper (e.g., Organization, WebSite JSON-LD)
  const jsonLd             = makeJsonLd(t);

  return (
    <Helmet>
      {/* Set the <html> lang attribute */}
      <html lang={locale} />

      {/* Primary SEO tags */}
      <title>{title ?? defaultTitle}</title>
      <meta name="description" content={description ?? defaultDescription} />
      <meta name="keywords" content={t('seo.keywords')} />
      <meta name="robots" content={noIndex ? 'noindex, nofollow' : 'index, follow'} />
      {/* HTML content language header */}
      <meta http-equiv="Content-Language" content="fr" />

      {/* Canonical link for SEO */}
      <link rel="canonical" href={url} />

      {/* Open Graph tags for rich sharing */}
      <meta property="og:type"        content="website" />
      <meta property="og:url"         content={url} />
      <meta property="og:title"       content={title ?? defaultTitle} />
      <meta property="og:description" content={description ?? defaultDescription} />
      <meta property="og:image"       content={`${BASE_URL}/assets/og-image.png`} />

      {/* Twitter Card tags */}
      <meta name="twitter:card"        content="summary_large_image" />
      <meta name="twitter:title"       content={title ?? defaultTitle} />
      <meta name="twitter:description" content={description ?? defaultDescription} />
      <meta name="twitter:image"       content={`${BASE_URL}/assets/twitter-card.png`} />

      {/* JSON-LD structured data injected safely */}
      <script type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </Helmet>
  );
}

export default Seo;
