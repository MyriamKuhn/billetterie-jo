import type { TFunction } from 'i18next';

const BASE_URL = 'https://jo2024.mkcodecreations.dev';

/**
 * Generates a JSON‑LD object for the website, for use in SEO.
 *
 * @param t  i18next translation function, used to localize title and description.
 * @returns  A JSON‑LD structure conforming to schema.org’s WebSite type.
 */
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
