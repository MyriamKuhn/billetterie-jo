import { render } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

// Import the store module and spy on its export
import * as languageStore from '../stores/useLanguageStore';
// Stub dependencies to avoid rendering inner components that require context
vi.mock('../components/ProductsFilters', () => ({ __esModule: true, ProductsFilters: () => null }));
vi.mock('../components/ProductGrid', () => ({ __esModule: true, ProductGrid: () => null }));
vi.mock('../components/OlympicLoader', () => ({ __esModule: true, default: () => null }));
vi.mock('../components/Seo', () => ({ __esModule: true, default: () => null }));
vi.mock('../components/PageWrapper', () => ({ __esModule: true, PageWrapper: ({  }: any) => null }));
vi.mock('../components/ErrorDisplay', () => ({ __esModule: true, ErrorDisplay: () => null }));
vi.mock('../components/ProductDetailsModal', () => ({ __esModule: true, ProductDetailsModal: () => null }));
vi.mock('@mui/material/Box', () => ({ __esModule: true, default: ({  }: any) => null }));
vi.mock('@mui/material/Pagination', () => ({ __esModule: true, default: () => null }));
vi.mock('@mui/material/Typography', () => ({ __esModule: true, default: () => null }));

import ProductsPage from './ProductsPage';

describe('ProductsPage useLanguageStore selector', () => {
  it('should call useLanguageStore with selector that returns lang property', () => {
    // Spy on the hook
    const spy = vi.spyOn(languageStore, 'useLanguageStore').mockReturnValue('en');

    render(<ProductsPage />);

    expect(spy).toHaveBeenCalled(); // at least once
    const selector = spy.mock.calls[0][0];
    const fakeState = { lang: 'fr', setLang: () => {} } as any;
    expect(typeof selector).toBe('function');
    expect(selector(fakeState)).toBe('fr');

    spy.mockRestore();
  });
});