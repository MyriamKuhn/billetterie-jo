import { render, screen, fireEvent, within, cleanup, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import CartPreview from './CartPreview';
import { ThemeProvider, createTheme } from '@mui/material/styles';

// ─── ❶ Préparation des variables modifiables ──────────────────────────────────
let storeState: { items: any[] } = { items: [] };
const mockAddItem = vi.fn();
let mockLoading = false;
let mockHasError = false;
let mockIsReloading = false;
const mockReload = vi.fn();
const mockNotify = vi.fn();

// ─── ❷ Mocks des modules ───────────────────────────────────────────────────────
vi.mock('react-i18next', () => ({
  __esModule: true,
  useTranslation: () => ({
    t: (key: string, opts?: any) =>
      opts && opts.count !== undefined ? `${key}:${opts.count}` : key,
  }),
}));

vi.mock('../../stores/useLanguageStore', () => ({
  __esModule: true,
  useLanguageStore: (selector: any) => selector({ lang: 'en' }),
}));

vi.mock('../../stores/useCartStore', () => {
  const useCartStore = (selector: any) => selector(storeState);
  useCartStore.getState = () => ({ addItem: mockAddItem });
  return {
    __esModule: true,
    useCartStore,
  };
});

vi.mock('../../hooks/useReloadCart', () => ({
  __esModule: true,
  useReloadCart: () => ({
    loading: mockLoading,
    hasError: mockHasError,
    reload: mockReload,
    isReloading: mockIsReloading,
  }),
}));

vi.mock('../../hooks/useStockChangeNotifier', () => ({
  __esModule: true,
  useStockChangeNotifier: () => {},
}));

vi.mock('../../hooks/useCustomSnackbar', () => ({
  __esModule: true,
  useCustomSnackbar: () => ({ notify: mockNotify }),
}));

vi.mock('../../utils/format', () => ({
  __esModule: true,
  formatCurrency: (v: number) => `$${v.toFixed(2)}`,
}));

vi.mock('react-router-dom', () => ({
  __esModule: true,
  Link: (props: any) => <a data-testid={`link-${props.to}`} {...props}>{props.children}</a>,
}));

vi.mock('../OlympicLoader', () => ({
  __esModule: true,
  default: () => <div data-testid="loader" />,
}));

describe('<CartPreview />', () => {
  beforeEach(() => {
    mockNotify.mockClear();
    mockAddItem.mockClear();
    mockReload.mockClear();
    mockLoading = false;
    mockHasError = false;
    mockIsReloading = false;
    storeState.items = [];
    cleanup();
  });

  function renderWithTheme() {
    const theme = createTheme();
    return render(
      <ThemeProvider theme={theme}>
        <CartPreview />
      </ThemeProvider>
    );
  }

  async function openPopover() {
    fireEvent.click(screen.getByLabelText('common:navbar.cart'));
    return screen.findByRole('list');
  }

  it('shows badge count and opens popover, calling reload', () => {
    storeState.items = [{ id: 'a', name: 'Item A', quantity: 2, price: 10, availableQuantity: 5 }];
    renderWithTheme();

    const badgeBtn = screen.getByLabelText('common:navbar.cart');
    expect(within(badgeBtn).getByText('2')).toBeInTheDocument();

    // Popover fermé par défaut
    expect(screen.queryByRole('presentation')).toBeNull();

    // Ouvre le popover et vérifie reload()
    fireEvent.click(badgeBtn);
    expect(mockReload).toHaveBeenCalled();
    expect(screen.getByRole('presentation')).toBeInTheDocument();
  });

  it('shows loader when loading is true', async () => {
    mockLoading = true;
    renderWithTheme();

    fireEvent.click(screen.getByLabelText('common:navbar.cart'));
    expect(await screen.findByTestId('loader')).toBeInTheDocument();
  });

  it('shows error message when hasError is true', async () => {
    mockHasError = true;
    renderWithTheme();

    fireEvent.click(screen.getByLabelText('common:navbar.cart'));
    expect(await screen.findByText('cart:cart.unavailable')).toBeInTheDocument();
  });

  it('shows empty message when no items', async () => {
    storeState.items = [];
    renderWithTheme();

    fireEvent.click(screen.getByLabelText('common:navbar.cart'));
    expect(await screen.findByText('cart:cart.empty')).toBeInTheDocument();
  });

  it('renders items list and total with actions enabled', async () => {
    storeState.items = [
      { id: '1', name: 'Item1', quantity: 2, price: 5, availableQuantity: 5 },
      { id: '2', name: 'Item2', quantity: 1, price: 10, availableQuantity: 1 },
    ];
    renderWithTheme();

    fireEvent.click(screen.getByLabelText('common:navbar.cart'));
    const list = await screen.findByRole('list');
    const items = within(list).getAllByRole('listitem');
    expect(items).toHaveLength(2);

    expect(within(items[0]).getByText('Item1')).toBeInTheDocument();
    expect(within(items[0]).getByText('$5.00')).toBeInTheDocument();
    expect(within(items[1]).getByText('Item2')).toBeInTheDocument();
    expect(within(items[1]).getByText('$10.00')).toBeInTheDocument();

    // Total = 2*5 + 1*10 = 20
    expect(screen.getByText(/cart:cart.total/)).toHaveTextContent('20.00');

    const viewBtn = screen.getByTestId('link-/cart');
    expect(viewBtn).toBeInTheDocument();
    expect(viewBtn).not.toHaveAttribute('disabled');
  });

  it('adjustQty: bouton + désactivé quand quantity === availableQuantity, et ne déclenche pas de notification', async () => {
    storeState.items = [
      { id: 'x', name: 'X', quantity: 2, price: 5, availableQuantity: 2 }
    ];
    renderWithTheme();

    fireEvent.click(screen.getByLabelText('common:navbar.cart'));
    const list = await screen.findByRole('list');
    const listItem = within(list).getByText('X').closest('li')!;

    // Le bouton "+" doit être disabled
    const addBtn = within(listItem).getAllByRole('button')[1];
    expect(addBtn).toBeDisabled();

    fireEvent.click(addBtn);
    expect(mockNotify).not.toHaveBeenCalled();
  });

  it('hides view button when loading', async () => {
    storeState.items = [{ id: 'z', name: 'Z', quantity: 1, price: 3, availableQuantity: 5 }];
    mockLoading = true;
    renderWithTheme();

    fireEvent.click(screen.getByLabelText('common:navbar.cart'));
    expect(await screen.findByTestId('loader')).toBeInTheDocument();

    // Le lien "view cart" ne doit pas exister
    expect(screen.queryByTestId('link-/cart')).toBeNull();
  });

  it('adjustQty : delta > 0 quand < available => appelle addItem et notify add_success', async () => {
    storeState.items = [
      { id: 'a', name: 'A', quantity: 1, price: 10, availableQuantity: 5 }
    ];
    mockAddItem.mockImplementation((_id: string, newQty: number, _avail: number) => {
      storeState.items[0].quantity = newQty;
      return Promise.resolve(true);
    });

    renderWithTheme();
    const list = await openPopover();
    const listItem = within(list).getByText('A').closest('li')!;
    const addBtn = within(listItem).getAllByRole('button')[1];
    fireEvent.click(addBtn);

    await waitFor(() => {
      expect(mockAddItem).toHaveBeenCalledWith('a', 2, 5);
      expect(mockNotify).toHaveBeenCalledWith('cart:cart.add_success', 'success');
    });

    // Recliquer pour couvrir une deuxième fois la branche « delta > 0 »
    const addBtnDeux = within(listItem).getAllByRole('button')[1];
    fireEvent.click(addBtnDeux);
    await waitFor(() => {
      expect(mockAddItem).toHaveBeenCalledWith('a', 3, 5);
      expect(mockNotify).toHaveBeenCalledWith('cart:cart.add_success', 'success');
    });
  });

  it('adjustQty : delta < 0 quand quantity > 0 => appelle addItem et notify remove_success', async () => {
    storeState.items = [
      { id: 'b', name: 'B', quantity: 2, price: 5, availableQuantity: 5 }
    ];
    mockAddItem.mockImplementation((_id: string, newQty: number, _avail: number) => {
      storeState.items[0].quantity = newQty;
      return Promise.resolve(true);
    });

    renderWithTheme();
    const list = await openPopover();
    const listItem = within(list).getByText('B').closest('li')!;
    const removeBtn = within(listItem).getAllByRole('button')[0];
    fireEvent.click(removeBtn);

    await waitFor(() => {
      expect(mockAddItem).toHaveBeenCalledWith('b', 1, 5);
      expect(mockNotify).toHaveBeenCalledWith('cart:cart.remove_success', 'success');
    });

    // Deuxième clic pour couvrir à nouveau « delta < 0 »
    const removeBtnDeux = within(listItem).getAllByRole('button')[0];
    fireEvent.click(removeBtnDeux);
    await waitFor(() => {
      expect(mockAddItem).toHaveBeenCalledWith('b', 0, 5);
      expect(mockNotify).toHaveBeenCalledWith('cart:cart.remove_success', 'success');
    });
  });

  it('adjustQty : si addItem rejette (throw) => notifie error_update', async () => {
    storeState.items = [
      { id: 'd', name: 'D', quantity: 1, price: 4, availableQuantity: 5 }
    ];
    mockAddItem.mockRejectedValue(new Error('fail'));

    renderWithTheme();
    const list = await openPopover();
    const listItem = within(list).getByText('D').closest('li')!;
    const addBtn = within(listItem).getAllByRole('button')[1];
    fireEvent.click(addBtn);

    await waitFor(() => {
      expect(mockAddItem).toHaveBeenCalledWith('d', 2, 5);
      expect(mockNotify).toHaveBeenCalledWith('cart:errors.error_update', 'error');
    });
  });

  it('adjustQty: delta > 0 jusqu’à available puis delta > available → not_enough_stock', async () => {
    // 1) On place un item quantity = 1 et availableQuantity = 2
    storeState.items = [
      { id: 'c', name: 'C', quantity: 1, price: 7, availableQuantity: 2 }
    ];
    mockAddItem.mockImplementation((_id: string, newQty: number, _avail: number) => {
      storeState.items[0].quantity = newQty;
      return Promise.resolve(true);
    });

    renderWithTheme();
    const list = await openPopover();
    const listItem = within(list).getByText('C').closest('li')!;

    // Premier clic : 1 → 2 (== available)
    const addBtn = within(listItem).getAllByRole('button')[1];
    fireEvent.click(addBtn);
    await waitFor(() => {
      expect(mockAddItem).toHaveBeenCalledWith('c', 2, 2);
      expect(mockNotify).toHaveBeenCalledWith('cart:cart.add_success', 'success');
    });

    // Deuxième clic : 2 → 3 (> available) → not_enough_stock
    fireEvent.click(addBtn);
    await waitFor(() => {
      expect(mockAddItem).not.toHaveBeenCalledWith('c', 3, 2);
      expect(mockNotify).toHaveBeenCalledWith('cart:cart.not_enough_stock:2', 'warning');
    });
  });

  it('ferme le popover lorsqu’on clique sur le bouton "View Cart"', async () => {
    // 1) Préparer un item pour que le popover affiche une liste
    storeState.items = [
      { id: 'e', name: 'E', quantity: 1, price: 8, availableQuantity: 5 }
    ];

    renderWithTheme();

    // 2) Ouvrir le popover
    fireEvent.click(screen.getByLabelText('common:navbar.cart'));

    // 3) Récupérer et cliquer sur le bouton "View Cart"
    const viewBtn = screen.getByTestId('link-/cart');
    fireEvent.click(viewBtn);

    // 4) S’assurer que le popover (la liste) n’est plus dans le DOM
    await waitFor(() => {
      expect(screen.queryByRole('list')).toBeNull();
    });
  });
});
