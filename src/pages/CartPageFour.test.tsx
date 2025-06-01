import { render } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

// Stub i18n initialization to prevent i18next.use errors
vi.mock('../i18n', () => ({}));

// 1) Stub react-i18next
vi.mock('react-i18next', () => ({
  __esModule: true,
  initReactI18next: { type: 'translator' },
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { changeLanguage: async () => {} },
  }),
}));

// 2) Stub useLanguageStore so we can spy on it
import * as languageStore from '../stores/useLanguageStore';
vi.mock('../stores/useLanguageStore', () => ({
  __esModule: true,
  useLanguageStore: vi.fn((selector: any) => selector({ lang: 'en' })),
}));

// 3) Stub useCartStore including getState to avoid undefined getState
vi.mock('../stores/useCartStore', () => {
  function store(selector: any) {
    return selector({ items: [] });
  }
  store.getState = () => ({ addItem: () => {} });
  return {
    __esModule: true,
    useCartStore: store,
  };
});

// 4) Stub other dependencies so CartPage renders without errors
vi.mock('../components/OlympicLoader', () => ({ __esModule: true, default: () => null }));
vi.mock('../components/Seo', () => ({ __esModule: true, default: () => null }));
vi.mock('../components/ErrorDisplay', () => ({ __esModule: true, ErrorDisplay: () => null }));
vi.mock('../components/CartItemDisplay', () => ({ __esModule: true, CartItemDisplay: () => null }));
vi.mock('../components/CartSummary', () => ({ __esModule: true, CartSummary: () => null }));
vi.mock('@mui/material/useMediaQuery', () => ({ __esModule: true, default: () => false }));
vi.mock('@mui/material/styles', () => ({ __esModule: true, useTheme: () => ({ breakpoints: { down: () => '' } }) }));
vi.mock('../hooks/useCustomSnackbar', () => ({ __esModule: true, useCustomSnackbar: () => ({ notify: () => {} }) }));
vi.mock('../hooks/useReloadCart', () => ({ __esModule: true, useReloadCart: () => ({ loading: false, hasError: false, reload: () => {} }) }));

import CartPage from './CartPage';

describe('CartPage useLanguageStore selector', () => {
  it('should call useLanguageStore with a selector that returns lang', () => {
    const spy = vi.spyOn(languageStore, 'useLanguageStore').mockReturnValue('fr');

    render(<CartPage />);

    expect(spy).toHaveBeenCalled();
    const selector = spy.mock.calls[0][0];
    const fakeState = { lang: 'de', setLang: () => {} } as any;
    expect(typeof selector).toBe('function');
    expect(selector(fakeState)).toBe('de');

    spy.mockRestore();
  });
});
