import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';

// 1) Stub lourd (MUI, icône, i18n, Link) — inchangé
vi.mock('@mui/material', () => ({
  __esModule: true,
  IconButton:       (p: any) => <button {...p} />,
  Badge:            ({ badgeContent, children }: any) => (
                      <span data-testid="badge">{badgeContent}{children}</span>
                    ),
  Popover:          ({ open, children }: any) =>
                      open ? <div data-testid="popover">{children}</div> : null,
  List:             ({ children }: any) => <ul data-testid="list">{children}</ul>,
  ListItem:         ({ children }: any) => <li>{children}</li>,
  ListItemText:     ({ primary, secondary }: any) => (
                      <div data-testid="item-text">
                        <span>{primary}</span><span>{secondary}</span>
                      </div>
                    ),
  Button:           (p: any) => <a {...p} />,
  Typography:       (p: any) => <p {...p}>{p.children}</p>,
  Box:              (p: any) => <div {...p}>{p.children}</div>,
}));

vi.mock('@mui/icons-material', () => ({
  __esModule: true,
  ShoppingCart: () => <span data-testid="shopping-cart" />,
}));

vi.mock('react-i18next', () => ({
  __esModule: true,
  useTranslation: () => ({ t: (k: string) => k }),
}));

vi.mock('react-router-dom', () => ({
  __esModule: true,
  Link: ({ to, children, ...p }: any) => <a href={to} {...p}>{children}</a>,
}));

// 2) On importe le store **réel** et le composant à tester
import { useCartStore } from '../../stores/cartStore';
import { CartPreview }   from './CartPreview';

describe('<CartPreview />', () => {
  beforeEach(() => {
    useCartStore.setState({ items: [] });
  });

  it('liste les articles, total et lien "cart.view" quand panier plein', () => {
    useCartStore.setState({
      items: [
        { id: 'a', name: 'Article A', quantity: 2, price: 3.5 },
        { id: 'b', name: 'Article B', quantity: 1, price: 10 },
      ],
    });

    render(<CartPreview />);
    fireEvent.click(screen.getByRole('button', { name: 'navbar.cart' }));

    // Total (regex tolérant les espaces)
    expect(
      screen.getByText(/cart\.total\s*:\s*17\.00\s*€/)
    ).toBeInTheDocument();

    // Et le bouton "view" est en fait un <a> stubé
    const viewLink = screen.getByText('cart.view');
    expect(viewLink.tagName).toBe('A');
    expect(viewLink).toHaveAttribute('to', '/cart');
  });
});