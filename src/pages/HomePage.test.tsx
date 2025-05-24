import { render, screen } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { HelmetProvider } from 'react-helmet-async';
import HomePage from './HomePage';

// mocks images et i18n comme précédemment…
vi.mock('../../assets/home/jo-hero.jpg',    () => ({ default: 'jo-hero.jpg' }));
vi.mock('../../assets/home/opening.jpg',    () => ({ default: 'opening.jpg' }));
vi.mock('../../assets/home/athletics.webp', () => ({ default: 'athletics.webp' }));
vi.mock('../../assets/home/swimming.webp',  () => ({ default: 'swimming.webp' }));
vi.mock('../../assets/home/judo.jpg',       () => ({ default: 'judo.jpg' }));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'fr', changeLanguage: vi.fn() },
  }),
}));

describe('HomePage', () => {
  beforeEach(() => {
    render(
      <HelmetProvider>
        <HomePage />
      </HelmetProvider>
    );
  });

  it('affiche le hero avec titre et sous-titre', () => {
    expect(screen.getByRole('heading', { level: 2, name: 'hero.title' })).toBeVisible();
    expect(screen.getByText('hero.subtitle')).toBeVisible();
  });

  it('affiche la section historique', () => {
    expect(screen.getByRole('heading', { level: 3, name: 'history.title' })).toBeInTheDocument();
    expect(screen.getByText('history.text')).toBeInTheDocument();
  });

  it('propose un CTA vers /tickets', () => {
    const link = screen.getByRole('link', { name: 'cta.title' });
    expect(link).toHaveAttribute('href', '/tickets');
  });

  it('rend le bon nombre de cartes d’événements', () => {
    const imgs = screen.getAllByRole('img');
    // 4 cartes d’événements → 4 <img>
    expect(imgs).toHaveLength(4);
  });

  it('chaque carte a le bon alt et la bonne description', () => {
    const mapping = [
      { id: 1, file: 'opening',    title: 'events.item1.title', desc: 'events.item1.description' },
      { id: 2, file: 'athletics', title: 'events.item2.title', desc: 'events.item2.description' },
      { id: 3, file: 'swimming',  title: 'events.item3.title', desc: 'events.item3.description' },
      { id: 4, file: 'judo',      title: 'events.item4.title', desc: 'events.item4.description' },
    ];
    mapping.forEach(({ file, title, desc }) => {
      const img = screen.getByRole('img', { name: title });
      expect(img).toHaveAttribute('src', expect.stringContaining(file));
      expect(screen.getByText(desc)).toBeVisible();
    });
  });
});

