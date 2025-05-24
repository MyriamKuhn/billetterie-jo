import { render, screen, within, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Capturer le sx passé au <Box component="nav">
let navSx: any;
// Capturer les appels à Seo
const seoCalls: Array<{ title: string; description: string }> = [];

// 1️⃣ Stub PageWrapper
vi.mock('../components/PageWrapper', () => ({
  __esModule: true,
  PageWrapper: ({ children }: any) => <div data-testid="pagewrapper">{children}</div>,
}));

// 2️⃣ Stub Seo
vi.mock('../components/Seo', () => ({
  __esModule: true,
  default: ({ title, description }: any) => {
    seoCalls.push({ title, description });
    return null;
  },
}));

// 3️⃣ Stub MUI components, y compris Box
vi.mock('@mui/material/Typography', () => ({
  __esModule: true,
  default: ({ variant, gutterBottom, children, component }: any) => {
    const Tag = component || (variant === 'h4' ? 'h4' : variant === 'h6' ? 'h6' : 'div');
    return <Tag data-variant={variant} data-gutter={!!gutterBottom}>{children}</Tag>;
  },
}));

vi.mock('@mui/material/Box', () => ({
  __esModule: true,
  default: ({ component, id, sx, children }: any) => {
    if (component === 'nav') navSx = sx; // capture sx
    const Tag = component || 'div';
    return (
      <Tag
        data-testid={component ? `box-${component}` : `box-${id}`}
        data-sx={JSON.stringify(sx)}
        id={id}
      >
        {children}
      </Tag>
    );
  },
}));

vi.mock('@mui/material/Stack', () => ({
  __esModule: true,
  default: ({ spacing, children }: any) => (
    <div data-testid="stack" data-spacing={spacing}>{children}</div>
  ),
}));

vi.mock('@mui/material/List', () => ({
  __esModule: true,
  default: ({ disablePadding, children }: any) => (
    <ul data-testid="list" data-disable-padding={disablePadding}>{children}</ul>
  ),
}));

vi.mock('@mui/material/ListItemButton', () => ({
  __esModule: true,
  default: ({ href, sx, children }: any) => (
    <li>
      <a data-testid="toc-link" href={href} data-sx={JSON.stringify(sx)}>
        {children}
      </a>
    </li>
  ),
}));

vi.mock('@mui/material/ListItemText', () => ({
  __esModule: true,
  default: ({ primary }: any) => <span data-testid="toc-text">{primary}</span>,
}));

vi.mock('@mui/material/Link', () => ({
  __esModule: true,
  default: ({ href, target, rel, children }: any) => (
    <a data-testid="link" href={href} target={target} rel={rel}>
      {children}
    </a>
  ),
}));

vi.mock('@mui/material/Divider', () => ({
  __esModule: true,
  default: () => <hr data-testid="divider" />,
}));

// 4️⃣ Stub useTranslation
type Translations = Record<string, string>;
const translations: Translations = {
  'legal.seoTitle': 'SEO TITLE',
  'legal.seoDescription': 'SEO DESC',
  'legal.title': 'Mentions Légales',
  'legal.subtitleTableOfContents': 'Table des matières',
  subtitleEditor: 'Éditeur',
  editor: 'Site édité par Example',
  subtitleDirector: 'Directeur',
  director: 'Jean Dupont <jean.dupont@mail.com>',
  subtitleHosting: 'Hébergeur',
  hosting: 'Hébergeur : OVH https://ovh.com',
  subtitleAccessibility: 'Accessibilité',
  accessibility: 'Site accessible.',
  subtitleIntellectualProperty: 'Propriété intellectuelle',
  intellectualProperty: 'Tous droits réservés.',
  subtitlePersonalData: 'Données personnelles',
  personalData: 'Contact: privacy@example.com',
  subtitleCookies: 'Cookies',
  cookies: 'Utilisation de cookies.',
  subtitleLiability: 'Responsabilité',
  liability: 'Aucune responsabilité.',
  subtitleLinks: 'Liens',
  links: 'Voir https://example.com',
  subtitleGoverningLaw: 'Droit applicable',
  governingLaw: 'Droit français.',
  subtitleContact: 'Contact',
  contact: 'Nous contacter',
  subtitleCredits: 'Crédits',
  credits: 'Par Dev Agency',
  subtitleUpdate: 'Mises à jour',
  update: 'Mises à jour régulières.',
  subtitleLastUpdate: 'Dernière mise à jour',
  lastUpdate: '01/01/2024',
};
vi.mock('react-i18next', () => ({
  __esModule: true,
  useTranslation: () => ({
    t: (key: string) =>
      translations[key] ?? translations[key.replace(/^legal\./, '')] ?? key,
  }),
}));

// 5️⃣ Import du composant testé
import LegalMentionsPage from './LegalMentionsPage';

describe('<LegalMentionsPage />', () => {
  beforeEach(() => {
    cleanup();
    seoCalls.length = 0;
    navSx = undefined;
  });

  it('configure Seo avec titre et description', () => {
    render(<LegalMentionsPage />);
    expect(seoCalls).toEqual([{
      title: translations['legal.seoTitle'],
      description: translations['legal.seoDescription'],
    }]);
  });

  it('affiche le titre, la TOC et Box <nav> avec bon sx et border', () => {
    render(<LegalMentionsPage />);
    // Titre principal
    expect(screen.getByRole('heading', { level: 4 }))
      .toHaveTextContent(translations['legal.title']);

    // Table des matières
    const tocLinks = screen.getAllByTestId('toc-link');
    expect(tocLinks).toHaveLength(14);
    expect(tocLinks[0]).toHaveAttribute('href', '#subtitle-editor');

    // Box nav
    const navBox = screen.getByTestId('box-nav');
    const sxObj = JSON.parse(navBox.getAttribute('data-sx')!);
    expect(sxObj).toMatchObject({
      bgcolor: 'background.paper',
      p: 2,
      borderRadius: 1,
    });

    // Tester border()
    const fakeTheme = { palette: { divider: 'rgba(0,0,0,0.12)' } } as any;
    expect(typeof navSx.border).toBe('function');
    expect(navSx.border(fakeTheme)).toBe(`1px solid ${fakeTheme.palette.divider}`);
  });

  it('rend chaque section avec id, h6, contenu, liens et mailto ou texte brut', () => {
    render(<LegalMentionsPage />);
    const sections = [
      ['subtitleEditor','editor'],
      ['subtitleDirector','director'],
      ['subtitleHosting','hosting'],
      ['subtitleAccessibility','accessibility'],
      ['subtitleIntellectualProperty','intellectualProperty'],
      ['subtitlePersonalData','personalData'],
      ['subtitleCookies','cookies'],
      ['subtitleLiability','liability'],
      ['subtitleLinks','links'],
      ['subtitleGoverningLaw','governingLaw'],
      ['subtitleContact','contact'],
      ['subtitleCredits','credits'],
      ['subtitleUpdate','update'],
      ['subtitleLastUpdate','lastUpdate'],
    ] as const;

    sections.forEach(([subKey, textKey]) => {
      const id = subKey.replace(/([A-Z])/g, '-$1').toLowerCase();
      const box = screen.getByTestId(`box-${id}`);

      // En-tête h6
      const h6 = within(box).getByRole('heading', { level: 6 });
      expect(h6).toHaveTextContent(translations[subKey]);

      // Contenu
      const raw = translations[textKey];
      const links = within(box).queryAllByTestId('link');

      if (raw.includes('http')) {
        // URL
        expect(links.length).toBeGreaterThan(0);
        links.forEach(a =>
          expect(a).toHaveAttribute('href', expect.stringMatching(/^https?:\/\//))
        );
      } else if (raw.includes('@')) {
        if (links.length > 0) {
          // mailto
          links.forEach(a =>
            expect(a).toHaveAttribute('href', expect.stringMatching(/^mailto:/))
          );
        } else {
          // fallback texte brut : on cherche l'email exact
          const emailRaw = raw.match(/[\w.+-]+@[\w-]+\.[\w.-]+/)![0];
          const matches = within(box).getAllByText(emailRaw, { exact: false });
          expect(matches.length).toBeGreaterThan(0);
        }
      } else {
        // texte simple
        expect(within(box).getByText(raw)).toBeInTheDocument();
      }
    });

    // Dividers
    const dividers = screen.getAllByTestId('divider');
    expect(dividers).toHaveLength(sections.length - 1);
  });
});
