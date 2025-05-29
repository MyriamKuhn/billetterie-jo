import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// 0️⃣ Mock react-i18next
vi.mock('react-i18next', () => ({
  __esModule: true,
  useTranslation: () => ({
    t: (key: string, opts?: { count?: number }) =>
      opts && opts.count != null ? `${key}:${opts.count}` : key,
    i18n: { changeLanguage: async () => {} },
  }),
}));

// 1️⃣ Mock useLanguageStore
vi.mock('../stores/useLanguageStore', () => ({
  __esModule: true,
  useLanguageStore: vi.fn(() => 'fr'),
}));

// 2️⃣ Mock useProducts
const mockUseProducts = vi.fn();
vi.mock('../hooks/useProducts', () => ({
  __esModule: true,
  useProducts: (...args: any[]) => mockUseProducts(...args),
}));

// 3️⃣ Mock child components & MUI
vi.mock('../components/OlympicLoader', () => ({ __esModule: true, default: () => <div data-testid="loader" /> }));
vi.mock('../components/Seo', () => ({ __esModule: true, default: (props: any) => <div data-testid="seo" {...props} /> }));
vi.mock('../components/PageWrapper', () => ({ __esModule: true, PageWrapper: (p: any) => <div data-testid="pagewrapper">{p.children}</div> }));
vi.mock('../components/ProductsFilters', () => ({
  __esModule: true,
  ProductsFilters: (p: any) => (
    <div data-testid="filters">
      <button data-testid="apply-filter" onClick={() => p.onChange({ page: 2 })} />
      <div data-props={JSON.stringify(p.filters)} />
    </div>
  )
}));
vi.mock('../components/ProductGrid', () => ({
  __esModule: true,
  ProductGrid: (p: any) => (
    <div data-testid="grid">
      <span data-testid="price">{p.fmtCur(123.45)}</span>
      <span data-testid="date">{p.fmtDate('2025-08-01')}</span>
      {p.products.map((x: any) => (
        <button key={x.id} data-testid={`view-${x.id}`} onClick={() => p.onViewDetails(x.id)}>
          view-{x.id}
        </button>
      ))}
    </div>
  )
}));
vi.mock('../components/ErrorDisplay', () => ({
  __esModule: true,
  ErrorDisplay: (p: any) => (
    <div data-testid="error">
      <button data-testid="retry" onClick={p.onRetry} />
      <pre data-testid="error-props">{JSON.stringify(p)}</pre>
    </div>
  )
}));
vi.mock('../components/ProductDetailsModal', () => ({
  __esModule: true,
  ProductDetailsModal: (p: any) => (
    <div data-testid="modal" data-props={JSON.stringify(p)}>
      <button data-testid="close" onClick={p.onClose} />
    </div>
  )
}));
vi.mock('@mui/material/Box', () => ({ __esModule: true, default: (p: any) => <div data-testid="box-mock">{p.children}</div> }));
vi.mock('@mui/material/Pagination', () => ({
  __esModule: true,
  default: (p: any) => (
    <div
      data-testid="pagination-mock"
      data-page={p.page}
      data-count={p.count}
      onClick={() => p.onChange(null, 3)}
    />
  )
}));
vi.mock('@mui/material/Typography', () => ({ __esModule: true, default: (p: any) => <div data-testid="typography-mock">{p.children}</div> }));

import TicketsPage from './TicketsPage';

describe('<TicketsPage />', () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('affiche le loader quand loading=true', () => {
    mockUseProducts.mockReturnValue({ products: [], total:0, loading:true, error:null, validationErrors:null });
    render(<TicketsPage />);
    expect(screen.getByTestId('loader')).toBeInTheDocument();
  });

  it('affiche ErrorDisplay si error non-null et permet de retry', () => {
    mockUseProducts.mockReturnValue({ products: [], total:0, loading:false, error:'err', validationErrors:null });
    render(<TicketsPage />);
    expect(screen.getByTestId('error')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('retry'));
    expect(mockUseProducts).toHaveBeenCalled();
  });

  it('rend <Seo>, <Typography> et <PageWrapper> quand pas d’erreur ni loading', () => {
    mockUseProducts.mockReturnValue({ products: [], total:0, loading:false, error:null, validationErrors:null });
    render(<TicketsPage />);
    expect(screen.getByTestId('seo')).toHaveAttribute('title','tickets.seo_title');
    expect(screen.getByTestId('seo')).toHaveAttribute('description','tickets.seo_description');
    expect(screen.getByTestId('typography-mock').textContent).toBe('tickets.title');
    expect(screen.getByTestId('pagewrapper')).toBeInTheDocument();
  });

  it('affiche la grille mais pas la pagination si products vide', () => {
    mockUseProducts.mockReturnValue({ products: [], total:0, loading:false, error:null, validationErrors:null });
    render(<TicketsPage />);
    // ProductGrid doit être rendu, même sans produits
    expect(screen.getByTestId('grid')).toBeInTheDocument();
    // Mais pas de pagination quand products.length === 0
    expect(screen.queryByTestId('pagination-mock')).toBeNull();
  });

  it('affiche la grille et la pagination quand produits dispo', () => {
    mockUseProducts.mockReturnValue({ products:[{id:1},{id:2}], total:45, loading:false, error:null, validationErrors:null });
    render(<TicketsPage />);
    expect(screen.getByTestId('grid')).toBeInTheDocument();
    const pag = screen.getByTestId('pagination-mock');
    expect(pag).toHaveAttribute('data-count','3');
    expect(pag).toHaveAttribute('data-page','1');
  });

  it('affiche pagination même si total=0 et products non vide', () => {
    mockUseProducts.mockReturnValue({ products:[{id:1}], total:0, loading:false, error:null, validationErrors:null });
    render(<TicketsPage />);
    const pag = screen.getByTestId('pagination-mock');
    expect(pag).toHaveAttribute('data-count','1');
    expect(pag).toHaveAttribute('data-page','1');
  });

  it('change page quand on clique sur pagination', async () => {
    mockUseProducts.mockReturnValue({ products:[{id:1}], total:90, loading:false, error:null, validationErrors:null });
    render(<TicketsPage />);
    fireEvent.click(screen.getByTestId('pagination-mock'));
    await waitFor(() => {
      expect(mockUseProducts).toHaveBeenLastCalledWith(expect.objectContaining({ page:3 }), 'fr');
    });
  });

  it('applique les filtres via ProductsFilters onChange', async () => {
    mockUseProducts.mockReturnValue({ products:[], total:0, loading:false, error:null, validationErrors:null });
    render(<TicketsPage />);
    fireEvent.click(screen.getByTestId('apply-filter'));
    await waitFor(() => {
      expect(mockUseProducts).toHaveBeenLastCalledWith(expect.objectContaining({ page:2 }), 'fr');
    });
  });

  it('expose fmtCur et fmtDate correctement dans ProductGrid', () => {
    mockUseProducts.mockReturnValue({ products:[], total:0, loading:false, error:null, validationErrors:null });
    render(<TicketsPage />);
    expect(screen.getByTestId('price').textContent).toBe(
      new Intl.NumberFormat('fr',{style:'currency',currency:'EUR'}).format(123.45)
    );
    expect(screen.getByTestId('date').textContent).toBe(
      new Intl.DateTimeFormat('fr',{day:'numeric',month:'long',year:'numeric'}).format(new Date('2025-08-01'))
    );
  });

  it('nettoie filters suivant validationErrors spécifiques', async () => {
    const cases: Array<[Partial<Record<string,any>>, Partial<Record<string,any>>]> = [
      [{ sort_by:['x'] }, { sortBy:'name', order:'asc' }],
      [{ date:['x'] },      { date:'' }],
      [{ name:['x'] },      { name:'' }],
      [{ category:['x'] },  { category:'' }],
      [{ location:['x'] },  { location:'' }],
      [{ places:['x'] },    { places:0 }],
    ];

    for ( const [errs, expected] of cases ) {
      mockUseProducts.mockReturnValue({ products:[], total:0, loading:false, error:null, validationErrors:errs });
      render(<TicketsPage />);
      await waitFor(() => {
        const f = JSON.parse(screen.getByTestId('filters').querySelector('div')!.getAttribute('data-props')!);
        for ( const [k,v] of Object.entries(expected) ) {
          expect((f as any)[k]).toEqual(v);
        }
      });
      cleanup();
    }
  });

  it('ré-exécute useProducts quand validationErrors={} (effet sans cleanup)', async () => {
    mockUseProducts.mockReturnValue({ products:[], total:0, loading:false, error:null, validationErrors:{} });
    render(<TicketsPage />);
    await waitFor(() => {
      expect(mockUseProducts).toHaveBeenCalledTimes(2);
    });
  });

  it('ouvre et ferme le modal en passant productId et lang', () => {
    mockUseProducts.mockReturnValue({ products:[{id:99}], total:1, loading:false, error:null, validationErrors:null });
    render(<TicketsPage />);
    // ouverture
    fireEvent.click(screen.getByTestId('view-99'));
    let modal = JSON.parse(screen.getByTestId('modal').getAttribute('data-props')!);
    expect(modal.open).toBe(true);
    expect(modal.productId).toBe(99);
    expect(modal.lang).toBe('fr');
    // fermeture
    fireEvent.click(screen.getByTestId('close'));
    modal = JSON.parse(screen.getByTestId('modal').getAttribute('data-props')!);
    expect(modal.open).toBe(false);
    expect(modal.productId).toBeNull();
  });

  it('passe les filtres initiaux à ProductsFilters', () => {
    mockUseProducts.mockReturnValue({
      products: [], total: 0, loading: false, error: null, validationErrors: null
    });
    render(<TicketsPage />);
    const filtersDiv = screen.getByTestId('filters').querySelector('div')!;
    const f = JSON.parse(filtersDiv.getAttribute('data-props')!);
    expect(f).toEqual({
      name:     '',
      category: '',
      location: '',
      date:     '',
      places:    0,
      sortBy:   'name',
      order:    'asc',
      perPage:  15,
      page:     1,
    });
  });

  it('nettoie tous les champs de filters quand toutes les validationErrors sont présentes', async () => {
    mockUseProducts.mockReturnValue({
      products: [], total: 0, loading: false, error: null,
      validationErrors: {
        sort_by: ['x'], date: ['x'], name: ['x'],
        category: ['x'], location: ['x'], places: ['x']
      }
    });
    render(<TicketsPage />);
    await waitFor(() => {
      const f = JSON.parse(
        screen.getByTestId('filters').querySelector('div')!.getAttribute('data-props')!
      );
      expect(f).toEqual({
        name:     '',
        category: '',
        location: '',
        date:     '',
        places:    0,
        sortBy:   'name',
        order:    'asc',
        perPage:  15,
        page:     1,
      });
    });
  });

  // Cas 1: on passe de error=true → error=false via retry
  it('après retry, quitte ErrorDisplay et rend le contenu principal', async () => {
    let calls = 0;
    mockUseProducts.mockImplementation(() => {
      calls++;
      // 1ère exécution → error
      if (calls === 1) {
        return { products: [], total:0, loading:false, error:'fail', validationErrors:null };
      }
      // 2ᵉ exécution → plus d’erreur
      return { products: [], total:0, loading:false, error:null, validationErrors:null };
    });

    render(<TicketsPage />);
    // on est en mode error
    expect(screen.getByTestId('error')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('retry'));
    // wait for the second render without error
    await waitFor(() => {
      expect(screen.queryByTestId('error')).toBeNull();
      // et retombe sur le contenu normal
      expect(screen.getByTestId('pagewrapper')).toBeInTheDocument();
    });
  });

  // Cas 2: cleanup de plusieurs champs en même temps
  it('nettoie plusieurs champs simultanément via useEffect', async () => {
    mockUseProducts.mockReturnValue({
      products: [], total:0, loading:false, error:null,
      validationErrors: {
        sort_by: ['x'],
        date: ['x'],
        name: ['x'],
        category: ['x'],
      }
    });

    render(<TicketsPage />);
    await waitFor(() => {
      const f = JSON.parse(
        screen.getByTestId('filters').querySelector('div')!.getAttribute('data-props')!
      );
      // on a vidangé sortBy / order, date, name et category en même temps
      expect(f.sortBy).toBe('name');
      expect(f.order).toBe('asc');
      expect(f.date).toBe('');
      expect(f.name).toBe('');
      expect(f.category).toBe('');
      // les autres restent par défaut
      expect(f.location).toBe('');
      expect(f.places).toBe(0);
    });
  });

  it("n'appelle pas setFilters quand validationErrors est null", () => {
    // validationErrors = null → useEffect ne doit pas appeler setFilters
    mockUseProducts.mockReturnValue({
      products: [], total: 0, loading: false, error: null, validationErrors: null
    });
    render(<TicketsPage />);
    // un seul appel (celui du render initial)
    expect(mockUseProducts).toHaveBeenCalledTimes(1);
  });

  it('ignore les clés inconnues dans validationErrors mais déclenche l’effet', async () => {
    // validationErrors truthy mais uniquement avec une clé inconnue
    mockUseProducts.mockReturnValue({
      products: [], total: 0, loading: false, error: null,
      validationErrors: { foo: ['err'] }
    });
    render(<TicketsPage />);
    // l’effet doit quand même appeler setFilters (cleanup = {}) → deuxième appel
    await waitFor(() => {
      expect(mockUseProducts).toHaveBeenCalledTimes(2);
    });
    // et les filtres doivent rester aux valeurs par défaut
    const f = JSON.parse(
      screen.getByTestId('filters').querySelector('div')!.getAttribute('data-props')!
    );
    expect(f).toEqual({
      name:     '',
      category: '',
      location: '',
      date:     '',
      places:    0,
      sortBy:   'name',
      order:    'asc',
      perPage:  15,
      page:     1,
    });
  });

  it('passe les bons props à ErrorDisplay (incluant showHome/homeButtonText)', () => {
    mockUseProducts.mockReturnValue({
      products: [], total: 0, loading: false, error: 'oops', validationErrors: null
    });
    render(<TicketsPage />);
    // on affiche ErrorDisplay
    const errorProps = JSON.parse(screen.getByTestId('error-props').textContent!);
    expect(errorProps.title).toBe('errors.title');
    expect(errorProps.message).toBe('errors.unexpected');
    expect(errorProps.showRetry).toBe(true);
    expect(errorProps.retryButtonText).toBe('errors.retry');
    expect(errorProps.showHome).toBe(true);
    expect(errorProps.homeButtonText).toBe('errors.home');
  });

  it('initialise ProductDetailsModal fermé avec lang correct', () => {
    mockUseProducts.mockReturnValue({
      products: [], total: 0, loading: false, error: null, validationErrors: null
    });
    render(<TicketsPage />);
    const modalProps = JSON.parse(screen.getByTestId('modal').getAttribute('data-props')!);
    expect(modalProps.open).toBe(false);
    expect(modalProps.productId).toBeNull();
    expect(modalProps.lang).toBe('fr');
  });
});
