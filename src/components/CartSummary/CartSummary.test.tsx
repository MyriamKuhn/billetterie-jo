import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CartSummary } from './CartSummary';
import { MemoryRouter } from 'react-router-dom';

// ─── Mocks ────────────────────────────────────────────────────────────────────
// 1) Stub de react-i18next pour faire « t('clé', { total:'...' }) → "clé:..." »
vi.mock('react-i18next', () => ({
  __esModule: true,
  useTranslation: () => ({
    t: (key: string, opts?: any) =>
      opts && opts.total !== undefined ? `${key}:${opts.total}` : key,
  }),
}));

// 2) Stub de formatCurrency pour renvoyer « `${lang}-${currency}-${value.toFixed(2)}` »
vi.mock('../../utils/format', () => ({
  __esModule: true,
  formatCurrency: (value: number, lang: string, currency: string) =>
    `${lang}-${currency}-${value.toFixed(2)}`,
}));

describe('<CartSummary />', () => {
  let onCgvChange: ReturnType<typeof vi.fn>;
  let onPay: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    onCgvChange = vi.fn();
    onPay = vi.fn();
  });

  it('desktop – affiche le total et Checkout désactivé quand acceptedCGV=false', () => {
    render(
      <MemoryRouter>
        <CartSummary
          total={123.0}
          acceptedCGV={false}
          onCgvChange={onCgvChange}
          onPay={onPay}
          lang="fr-FR"
          isMobile={false}
        />
      </MemoryRouter>
    );

    // 1) Le <Typography variant="h6"> doit contenir "table.total_price:fr-FR-EUR-123.00"
    expect(
      screen.getByRole('heading', { level: 6 })
    ).toHaveTextContent('table.total_price:fr-FR-EUR-123.00');

    // 2) Le bouton "Checkout" est désactivé
    const checkoutBtn = screen.getByRole('button', { name: 'checkout.checkout' });
    expect(checkoutBtn).toBeDisabled();

    // 3) Le texte CGV (desktop) utilise "checkout.accept_cgv_link_text"
    expect(screen.getByText(/checkout.accept_cgv_prefix/)).toBeInTheDocument();
    const termsLink = screen.getByRole('link', { name: 'checkout.accept_cgv_link_text' });
    expect(termsLink).toHaveAttribute('href', '/terms');
    expect(termsLink).toHaveAttribute('target', '_blank');

    // 4) Le lien "Continue Shopping" pointe vers "/tickets"
    const continueLink = screen.getByRole('link', { name: 'checkout.continue_shopping' });
    expect(continueLink).toHaveAttribute('href', '/tickets');
  });

  it('desktop – when acceptedCGV=true, Checkout enabled & onPay called once clicked; checkbox change fires onCgvChange', () => {
    render(
      <MemoryRouter>
        <CartSummary
          total={42}
          acceptedCGV={true}
          onCgvChange={onCgvChange}
          onPay={onPay}
          lang="de-DE"
          isMobile={false}
        />
      </MemoryRouter>
    );

    // Bouton Checkout doit être activé
    const checkoutBtn = screen.getByRole('button', { name: 'checkout.checkout' });
    expect(checkoutBtn).toBeEnabled();

    // Cliquer sur Checkout déclenche onPay
    fireEvent.click(checkoutBtn);
    expect(onPay).toHaveBeenCalledTimes(1);

    // La checkbox est cochée → décocher appelle onCgvChange(false)
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeChecked();
    fireEvent.click(checkbox);
    expect(onCgvChange).toHaveBeenCalledWith(false);
  });

  it('mobile – affiche total et Checkout variant mobile, lien CGV mobile, bouton Continue Shopping', () => {
    render(
      <MemoryRouter>
        <CartSummary
          total={5.5}
          acceptedCGV={false}
          onCgvChange={onCgvChange}
          onPay={onPay}
          lang="es-ES"
          isMobile={true}
        />
      </MemoryRouter>
    );

    // 1) Total : "table.total_price:es-ES-EUR-5.50"
    expect(
      screen.getByRole('heading', { level: 6 })
    ).toHaveTextContent('table.total_price:es-ES-EUR-5.50');

    // 2) Checkout est désactivé
    const checkoutBtn = screen.getByRole('button', { name: 'checkout.checkout' });
    expect(checkoutBtn).toBeDisabled();

    // 3) Lien CGV en mobile utilise "checkout.accept_cgv_link_text_mobile"
    const mobileLink = screen.getByRole('link', { name: 'checkout.accept_cgv_link_text_mobile' });
    expect(mobileLink).toHaveAttribute('href', '/terms');
    expect(mobileLink).toHaveAttribute('target', '_blank');

    // 4) Checkbox non cochée → cliquer appelle onCgvChange(true)
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).not.toBeChecked();
    fireEvent.click(checkbox);
    expect(onCgvChange).toHaveBeenCalledWith(true);

    // 5) Lien "Continue Shopping" vers "/tickets"
    const continueLink = screen.getByRole('link', { name: 'checkout.continue_shopping' });
    expect(continueLink).toHaveAttribute('href', '/tickets');
  });

  it('mobile – when acceptedCGV=true, Checkout enabled & onPay callback', () => {
    render(
      <MemoryRouter>
        <CartSummary
          total={0}
          acceptedCGV={true}
          onCgvChange={onCgvChange}
          onPay={onPay}
          lang="it-IT"
          isMobile={true}
        />
      </MemoryRouter>
    );

    const checkoutBtn = screen.getByRole('button', { name: 'checkout.checkout' });
    expect(checkoutBtn).toBeEnabled();

    fireEvent.click(checkoutBtn);
    expect(onPay).toHaveBeenCalledTimes(1);
  });
});
