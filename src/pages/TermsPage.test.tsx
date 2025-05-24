import { render, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// 1️⃣ Stub PageWrapper
vi.mock('../components/PageWrapper', () => ({
  __esModule: true,
  PageWrapper: ({ children }: any) => <div data-testid="pagewrapper">{children}</div>,
}));

// 2️⃣ Stub Seo
const seoCalls: Array<{ title: string; description: string }> = [];
vi.mock('../components/Seo', () => ({
  __esModule: true,
  default: ({ title, description }: any) => {
    seoCalls.push({ title, description });
    return null;
  },
}));

// 3️⃣ Stub TableOfContents
let tocProps: any = {};
vi.mock('../components/TableOfContents', () => ({
  __esModule: true,
  TableOfContents: (props: any) => {
    tocProps = props;
    return <div data-testid="toc" />;
  },
}));

// 4️⃣ Stub LegalSection for content rendering
vi.mock('../components/LegalSection', () => ({
  __esModule: true,
  default: ({ id, title, content, isLast }: any) => (
    <section data-testid={`section-${id}`} id={id} data-is-last={isLast}>
      <h6>{title}</h6>
      <p>{content}</p>
    </section>
  ),
}));

// 5️⃣ Stub useTranslation
const translations: Record<string,string> = {
  'terms.seoTitle': 'SEO TITLE',
  'terms.seoDescription': 'SEO DESC',
};
vi.mock('react-i18next', () => ({
  __esModule: true,
  useTranslation: () => ({ t: (key:string) => translations[key] ?? key }),
}));

// 6️⃣ Import component under test
import TermsPage from './TermsPage';

// Sections fixture
const sections: [string,string][] = [
  ['subtitleIntroduction', 'introduction'],
  ['subtitleDefinition', 'definition'],
  ['subtitleApplication', 'application'],
  ['subtitleOrder', 'order'],
  ['subtitleUserPrizes', 'prizes'],
  ['subtitleDelivery', 'delivery'],
  ['subtitleCancellation', 'cancellation'],
  ['subtitleResponsibility', 'responsibility'],
  ['subtitlePersonalData', 'personalData'],
  ['subtitleIntellectualProperty', 'intellectualProperty'],
  ['subtitleGoverningLaw', 'governingLaw'],
  ['subtitleContact', 'contact'],
  ['subtitleUpdate', 'update'],
];

describe('<TermsPage />', () => {
  beforeEach(() => {
    cleanup();
    seoCalls.length = 0;
    tocProps = {};
  });

  it('calls Seo with translated props and renders wrapper', () => {
    render(<TermsPage />);
    expect(seoCalls).toEqual([{ title: 'SEO TITLE', description: 'SEO DESC' }]);
    expect(screen.getByTestId('pagewrapper')).toBeInTheDocument();
  });

  it('renders TableOfContents with correct props', () => {
    render(<TermsPage />);
    expect(screen.getByTestId('toc')).toBeInTheDocument();
    expect(tocProps.namespace).toBe('terms');
    expect(tocProps.titleKey).toBe('terms.subtitleTableOfContents');
    expect(tocProps.sections).toEqual(sections);
    expect(typeof tocProps.makeId).toBe('function');
  });

  it('renders all legal sections via LegalSection', () => {
    render(<TermsPage />);
    sections.forEach(([subKey,_], idx) => {
      const id = subKey.replace(/([A-Z])/g, '-$1').toLowerCase();
      const section = screen.getByTestId(`section-${id}`);
      expect(section).toHaveAttribute('id', id);
      expect(section).toHaveAttribute('data-is-last', `${idx === sections.length-1}`);
      expect(section).toBeInTheDocument();
    });
  });
});
