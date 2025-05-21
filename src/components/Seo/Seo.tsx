import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';

const BASE_URL = 'https://jo2024.mkcodecreations.dev';

interface SeoProps {
  title?: string;
  description?: string;
  noIndex?: boolean;
}

export function Seo({ title, description, noIndex }: SeoProps) {
  const { t, i18n } = useTranslation();
  const locale = i18n.language;           
  const url    = `${BASE_URL}/`;

  const defaultTitle       = t('seo.title');
  const defaultDescription = t('seo.description');

  const jsonLd = {
    "@context": "https://schema.org",
    "@type":    "WebSite",
    "name":     t('seo.title'),
    "url":      BASE_URL,
    "logo":     `${BASE_URL}/assets/jo_logo.png"`,
    "description": t('seo.description'),
    "contactPoint": [{
      "@type": "ContactPoint",
      "contactType": "Developer",
      "areaServed": "FR, DE, EN",
      "availableLanguage": ["French","English","German"]
    }],
  };

  return (
    <Helmet>
      {/* Lang attribute */}
      <html lang={locale} />

      {/* Title & Description */}
      <title>{title ?? defaultTitle}</title>
      <meta name="description" content={description ?? defaultDescription} />
      <meta name="keywords" content={t('seo.keywords')} />
      <meta name="robots" content={noIndex ? 'noindex, nofollow' : 'index, follow'} />
      <meta http-equiv="Content-Language" content="fr" />

      {/* Canonical */}
      <link rel="canonical" href={url} />

      {/* Open Graph */}
      <meta property="og:type"        content="website" />
      <meta property="og:url"         content={url} />
      <meta property="og:title"       content={title ?? defaultTitle} />
      <meta property="og:description" content={description ?? defaultDescription} />
      <meta property="og:image"       content={`${BASE_URL}/assets/og-image.png`} />

      {/* Twitter Card */}
      <meta name="twitter:card"        content="summary_large_image" />
      <meta name="twitter:title"       content={title ?? defaultTitle} />
      <meta name="twitter:description" content={description ?? defaultDescription} />
      <meta name="twitter:image"       content={`${BASE_URL}/assets/twitter-card.png`} />

      {/* Structured Data */}
      <script type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </Helmet>
  );
}
