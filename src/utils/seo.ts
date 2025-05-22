import type { TFunction } from 'i18next';

const BASE_URL = 'https://jo2024.mkcodecreations.dev';

export function makeJsonLd(t: TFunction) {
  return {
    "@context": "https://schema.org",
    "@type":    "WebSite",
    "name":     t('seo.title'),
    "url":      BASE_URL,
    "logo":     `${BASE_URL}/assets/logos/jo_logo.png`,
    "description": t('seo.description'),
    "contactPoint": [{
      "@type": "ContactPoint",
      "contactType": "Developer",
      "areaServed": "FR, DE, EN",
      "availableLanguage": ["French","English","German"]
    }],
  }
}
