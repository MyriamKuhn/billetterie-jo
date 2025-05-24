import { render, screen, cleanup } from '@testing-library/react';
import LegalSection from './LegalSection';

describe('LegalSection', () => {
  afterEach(cleanup);

  it('renders title, content and default divider when not last section', () => {
    render(
      <LegalSection
        id="test-id"
        title="Section Title"
        content="Some plain text content."
      />
    );

    // Titre en h6
    const heading = screen.getByRole('heading', { level: 6 });
    expect(heading).toHaveTextContent('Section Title');

    // Contenu brut
    expect(screen.getByText('Some plain text content.')).toBeInTheDocument();

    // Divider (hr) présent
    expect(screen.getByRole('separator')).toBeInTheDocument();
  });

  it('does not render divider when isLast is true', () => {
    render(
      <LegalSection
        id="test-id"
        title="Last Section"
        content="No divider here."
        isLast={true}
      />
    );

    // Pas de separator
    expect(screen.queryByRole('separator')).toBeNull();
  });

  it('renders URL segments as links', () => {
    const url = 'https://example.com';
    render(
      <LegalSection
        id="sec-url"
        title="URL Section"
        content={`Visit ${url} now.`}
      />
    );

    // Le texte URL devient un lien clickable
    const link = screen.getByRole('link', { name: url });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', url);
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('renders email segments as mailto links', () => {
    const email = 'user@example.com';
    render(
      <LegalSection
        id="sec-email"
        title="Email Section"
        content={`Contact: ${email}`}
      />
    );

    // Le texte email devient un lien mailto
    const mailLink = screen.getByRole('link', { name: email });
    expect(mailLink).toBeInTheDocument();
    expect(mailLink).toHaveAttribute('href', `mailto:${email}`);
  });
});
