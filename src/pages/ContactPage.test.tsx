import { render, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// 1️⃣ Stub react-i18next useTranslation
vi.mock('react-i18next', () => ({
  __esModule: true,
  useTranslation: (ns?: string) => ({
    t: (key: string) => `${ns ? ns + ':' : ''}${key}`,
  }),
}));

// 2️⃣ Stub MUI components
vi.mock('@mui/material/Typography', () => ({
  __esModule: true,
  default: (props: any) => (
    <div data-testid={`Typography:${props.variant}`}>
      {props.children}
    </div>
  ),
}));
vi.mock('@mui/material/Box', () => ({
  __esModule: true,
  default: (props: any) => <div data-testid="Box">{props.children}</div>,
}));
vi.mock('@mui/material/Link', () => ({
  __esModule: true,
  default: (props: any) => (
    <a data-testid="Link" href={props.href}>
      {props.children}
    </a>
  ),
}));
vi.mock('@mui/material/Stack', () => ({
  __esModule: true,
  default: (props: any) => <div data-testid="Stack">{props.children}</div>,
}));

// 3️⃣ Stub PageWrapper & Seo
vi.mock('../components/PageWrapper', () => ({
  __esModule: true,
  PageWrapper: (props: any) => (
    <section data-testid="PageWrapper">{props.children}</section>
  ),
}));
vi.mock('../components/Seo', () => ({
  __esModule: true,
  default: (props: any) => (
    <div
      data-testid="Seo"
      data-title={props.title}
      data-description={props.description}
    />
  ),
}));

import ContactPage from './ContactPage';

describe('<ContactPage />', () => {
  beforeEach(() => {
    cleanup();
  });

  it('renders Seo with correct title and description', () => {
    render(<ContactPage />);
    const seo = screen.getByTestId('Seo');
    expect(seo).toHaveAttribute('data-title', 'contact:contact.seoTitle');
    expect(seo).toHaveAttribute(
      'data-description',
      'contact:contact.seoDescription'
    );
  });

  it('wraps content in PageWrapper', () => {
    render(<ContactPage />);
    expect(screen.getByTestId('PageWrapper')).toBeInTheDocument();
  });

  it('displays the main heading', () => {
    render(<ContactPage />);
    expect(screen.getByTestId('Typography:h4')).toHaveTextContent(
      'contact:contact.title'
    );
  });

  it('renders the intro paragraph', () => {
    render(<ContactPage />);
    expect(screen.getByTestId('Typography:body1')).toHaveTextContent(
      'contact:contact.intro'
    );
  });

  it('renders email and phone links', () => {
    render(<ContactPage />);
    const links = screen.getAllByTestId('Link');
    // email
    expect(links[0]).toHaveAttribute(
      'href',
      'mailto:contact@jo2024-ticketing.com'
    );
    // phone
    expect(links[1]).toHaveAttribute('href', 'tel:+33123456789');
  });

  it('renders address and hours text', () => {
    render(<ContactPage />);
    expect(screen.getByText(/10 rue des Jeux/)).toBeInTheDocument();
    expect(screen.getByText('contact:contact.hours')).toBeInTheDocument();
  });

  it('renders the note in italic style', () => {
    render(<ContactPage />);
    expect(screen.getByTestId('Typography:body2')).toHaveTextContent(
      'contact:contact.note'
    );
  });
});
