// src/components/LegalPageLayout/LegalPageLayout.test.tsx
import { render, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// 1️⃣ Stub PageWrapper
vi.mock('../PageWrapper', () => ({
  __esModule: true,
  PageWrapper: ({ children }: any) => <div data-testid="pagewrapper">{children}</div>,
}));

// 2️⃣ Stub Seo, on capture les appels
const seoCalls: Array<{ title: string; description: string }> = [];
vi.mock('../Seo', () => ({
  __esModule: true,
  default: ({ title, description }: any) => {
    seoCalls.push({ title, description });
    return null;
  },
}));

// 3️⃣ Stub TableOfContents pour vérifier les props passées
vi.mock('../TableOfContents', () => ({
  __esModule: true,
  TableOfContents: ({ sections, makeId, namespace, titleKey }: any) => (
    <div
      data-testid="toc"
      data-sections={JSON.stringify(sections.map((s: any) => [...s]))}
      data-namespace={namespace}
      data-titlekey={titleKey}
      // on stocke aussi un exemple d'ID généré
      data-sampleid={makeId(sections[0][0])}
    />
  ),
}));

// 4️⃣ Stub LegalSection pour vérifier son rendu et ses props
vi.mock('../LegalSection', () => ({
  __esModule: true,
  default: ({ id, title, content, isLast }: any) => (
    <div
      data-testid={`section-${id}`}
      data-is-last={String(isLast)}
      data-title={title}
      data-content={content}
    />
  ),
}));

// 5️⃣ Stub MUI components
vi.mock('@mui/material/Typography', () => ({
  __esModule: true,
  default: ({ variant, gutterBottom, children }: any) => {
    const Tag = variant === 'h4' ? 'h4' : 'div';
    return (
      <Tag data-variant={variant} data-gutter={String(!!gutterBottom)}>
        {children}
      </Tag>
    );
  },
}));
vi.mock('@mui/material/Box', () => ({
  __esModule: true,
  default: ({ children }: any) => <div data-testid="box">{children}</div>,
}));
vi.mock('@mui/material/Stack', () => ({
  __esModule: true,
  default: ({ children }: any) => <div data-testid="stack">{children}</div>,
}));

// 6️⃣ Stub useTranslation
vi.mock('react-i18next', () => ({
  __esModule: true,
  useTranslation: () => ({
    t: (key: string) => `${key}-translated`,
  }),
}));

// 7️⃣ Import du composant sous test
import LegalPageLayout from './LegalPageLayout';

describe('<LegalPageLayout />', () => {
  const sections: [string, string][] = [
    ['secA', 'textA'],
    ['secB', 'textB'],
  ];

  beforeEach(() => {
    cleanup();
    seoCalls.length = 0;
  });

  it('calls Seo with translated props and wraps in PageWrapper', () => {
    render(
      <LegalPageLayout
        namespace="legal"
        seoTitle="legal.seoTitle"
        seoDescription="legal.seoDescription"
        pageTitle="legal.title"
        sections={sections}
      />
    );

    // Seo appelé avec t(seoTitle) et t(seoDescription)
    expect(seoCalls).toEqual([
      { title: 'legal.seoTitle-translated', description: 'legal.seoDescription-translated' },
    ]);

    // PageWrapper présent
    expect(screen.getByTestId('pagewrapper')).toBeInTheDocument();
  });

  it('renders the page title via Typography', () => {
    render(
      <LegalPageLayout
        namespace="legal"
        seoTitle="legal.seoTitle"
        seoDescription="legal.seoDescription"
        pageTitle="legal.title"
        sections={sections}
      />
    );

    // Titre h4 avec traduction
    const h4 = screen.getByRole('heading', { level: 4 });
    expect(h4).toHaveTextContent('legal.title-translated');
    expect(h4).toHaveAttribute('data-variant', 'h4');
    expect(h4).toHaveAttribute('data-gutter', 'true');
  });

  it('passes correct props to TableOfContents', () => {
    render(
      <LegalPageLayout
        namespace="legalNS"
        seoTitle="x"
        seoDescription="y"
        pageTitle="z"
        sections={sections}
      />
    );

    const toc = screen.getByTestId('toc');
    // sections serialisées
    expect(JSON.parse(toc.getAttribute('data-sections')!)).toEqual([
      ['secA', 'textA'],
      ['secB', 'textB'],
    ]);
    expect(toc).toHaveAttribute('data-namespace', 'legalNS');
    expect(toc).toHaveAttribute('data-titlekey', 'legalNS.subtitleTableOfContents');
    // exemple de makeId sur 'secA' => 'sec-a'
    expect(toc).toHaveAttribute('data-sampleid', 'sec-a');
  });

  it('renders a LegalSection per section with correct props', () => {
    render(
      <LegalPageLayout
        namespace="abc"
        seoTitle="x"
        seoDescription="y"
        pageTitle="z"
        sections={sections}
      />
    );

    // Deux sections
    const secA = screen.getByTestId('section-sec-a');
    const secB = screen.getByTestId('section-sec-b');
    expect(secA).toHaveAttribute('data-title', 'abc.secA-translated');
    expect(secA).toHaveAttribute('data-content', 'abc.textA-translated');
    expect(secA).toHaveAttribute('data-is-last', 'false');

    expect(secB).toHaveAttribute('data-title', 'abc.secB-translated');
    expect(secB).toHaveAttribute('data-content', 'abc.textB-translated');
    // dernière => isLast=true
    expect(secB).toHaveAttribute('data-is-last', 'true');
  });
});
