import { render } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

// ─── ❶ Stub de react-helmet pour exposer directement les enfants ───────
vi.mock('react-helmet', () => ({
  __esModule: true,
  Helmet: ({ children }: any) => <>{children}</>,
}));

// ─── ❷ Stub i18next pour t() et i18n.language ───────────────────────────────
vi.mock('react-i18next', () => ({
  __esModule: true,
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'fr' },
  }),
}));

import Seo from './Seo';

const BASE_URL = 'https://jo2024.mkcodecreations.dev';

describe('<Seo /> defaults', () => {
  beforeEach(() => render(<Seo />));

  it('définit la meta Content-Language', () => {
    const contentLang = document.querySelector('meta[http-equiv="Content-Language"]');
    expect(contentLang).toHaveAttribute('content', 'fr');
  });

  it('affiche <title> et métas par défaut', () => {
    const title = document.querySelector('title');
    expect(title).toHaveTextContent('seo.title');

    const desc = document.querySelector('meta[name="description"]');
    expect(desc).toHaveAttribute('content', 'seo.description');

    const keywords = document.querySelector('meta[name="keywords"]');
    expect(keywords).toHaveAttribute('content', 'seo.keywords');

    const robots = document.querySelector('meta[name="robots"]');
    expect(robots).toHaveAttribute('content', 'index, follow');

    const contentLang = document.querySelector('meta[http-equiv="Content-Language"]');
    expect(contentLang).toHaveAttribute('content', 'fr');
  });

  it('génère un lien canonical et Open Graph / Twitter', () => {
    const canon = document.querySelector('link[rel="canonical"]');
    expect(canon).toHaveAttribute('href', `${BASE_URL}/`);

    expect(document.querySelector('meta[property="og:type"]')).toHaveAttribute('content', 'website');
    expect(document.querySelector('meta[property="og:url"]')).toHaveAttribute('content', `${BASE_URL}/`);
    expect(document.querySelector('meta[property="og:title"]')).toHaveAttribute('content', 'seo.title');
    expect(document.querySelector('meta[property="og:description"]')).toHaveAttribute('content', 'seo.description');
    expect(document.querySelector('meta[property="og:image"]')).toHaveAttribute(
      'content',
      `${BASE_URL}/assets/og-image.png`
    );

    expect(document.querySelector('meta[name="twitter:card"]')).toHaveAttribute(
      'content',
      'summary_large_image'
    );
    expect(document.querySelector('meta[name="twitter:title"]')).toHaveAttribute(
      'content',
      'seo.title'
    );
    expect(document.querySelector('meta[name="twitter:description"]')).toHaveAttribute(
      'content',
      'seo.description'
    );
    expect(document.querySelector('meta[name="twitter:image"]')).toHaveAttribute(
      'content',
      `${BASE_URL}/assets/twitter-card.png`
    );
  });

  it('émet le script JSON-LD correct', () => {
    const script = document.querySelector('script[type="application/ld+json"]');
    expect(script).toBeTruthy();
    const json = JSON.parse(script!.textContent || '');
    expect(json).toMatchObject({
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "seo.title",
      url: BASE_URL,
      logo: `${BASE_URL}/assets/logos/jo_logo.png`, 
      description: "seo.description",
      contactPoint: [
        {
          "@type": "ContactPoint",
          contactType: "Developer",
          areaServed: "FR, DE, EN",
          availableLanguage: ["French","English","German"],
        }
      ],
    });
  });
});

describe('<Seo /> with props', () => {
  beforeEach(() =>
    render(
      <Seo
        title="Mon Titre"
        description="Ma Description"
        noIndex
      />
    )
  );

  it('écrase le <title> et la meta description', () => {
    const title = document.querySelector('title');
    expect(title).toHaveTextContent('Mon Titre');

    const desc = document.querySelector('meta[name="description"]');
    expect(desc).toHaveAttribute('content', 'Ma Description');
  });

  it('positionne robots en noindex,nofollow', () => {
    const robots = document.querySelector('meta[name="robots"]');
    expect(robots).toHaveAttribute('content', 'noindex, nofollow');
  });

  it('met à jour Open Graph et Twitter avec les props', () => {
    expect(document.querySelector('meta[property="og:title"]')).toHaveAttribute(
      'content',
      'Mon Titre'
    );
    expect(document.querySelector('meta[property="og:description"]')).toHaveAttribute(
      'content',
      'Ma Description'
    );
    expect(document.querySelector('meta[name="twitter:title"]')).toHaveAttribute(
      'content',
      'Mon Titre'
    );
    expect(document.querySelector('meta[name="twitter:description"]')).toHaveAttribute(
      'content',
      'Ma Description'
    );
  });
});
