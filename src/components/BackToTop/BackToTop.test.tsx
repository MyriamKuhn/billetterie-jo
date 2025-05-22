import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

// 1️⃣ Mock du module MUI avant d'importer BackToTop
vi.mock('@mui/material', async () => {
  // On importe tout le module original
  const actual = await vi.importActual<typeof import('@mui/material')>('@mui/material');
  return {
    ...actual,
    // On remplace seulement useScrollTrigger par un mock
    useScrollTrigger: vi.fn(),
  };
});

// 2️⃣ Maintenant qu’on a mocké, on peut importer BackToTop
import BackToTop from './BackToTop';

// 3️⃣ Pour typer plus facilement
import type { Mock } from 'vitest';

// On récupère la référence vers le mock
import * as material from '@mui/material';
const mockedUseScrollTrigger = material.useScrollTrigger as unknown as Mock;

describe('BackToTop component', () => {
  beforeEach(() => {
    // Par défaut, on fait comme si la page est en haut
    mockedUseScrollTrigger.mockReturnValue(false);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('n’affiche pas le bouton quand on est en haut de page', () => {
    render(<BackToTop />);
    expect(
      screen.queryByRole('button', { name: /scroll back to top/i })
    ).toBeNull();
  });

  it('affiche le bouton quand on scroll', () => {
    mockedUseScrollTrigger.mockReturnValue(true);
    render(<BackToTop />);
    expect(
      screen.getByRole('button', { name: /scroll back to top/i })
    ).toBeInTheDocument();
  });

  it('appelle scrollIntoView sur l’ancre au clic', () => {
    mockedUseScrollTrigger.mockReturnValue(true);

    // On mocke document.querySelector
    const scrollMock = vi.fn();
    const fakeAnchor = { scrollIntoView: scrollMock };
    const originalQuery = document.querySelector;
    vi.spyOn(document, 'querySelector').mockImplementation((sel) =>
      sel === '#back-to-top-anchor' ? (fakeAnchor as any) : originalQuery(sel)
    );

    render(<BackToTop />);
    fireEvent.click(
      screen.getByRole('button', { name: /scroll back to top/i })
    );

    expect(scrollMock).toHaveBeenCalledWith({
      behavior: 'smooth',
      block: 'center',
    });

    // Restaure querySelector
    (document.querySelector as any).mockRestore();
  });
});
