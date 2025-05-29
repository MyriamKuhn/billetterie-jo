import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, beforeEach, expect, vi } from 'vitest';
import { ErrorBoundaryInner } from './ErrorBoundary';
import type { TFunction } from 'i18next';
import '@testing-library/jest-dom';

// Mock minimaliste de la fonction de traduction
const tMock = ((key: string) => key) as TFunction;
;(tMock as any).$TFunctionBrand = {};

// Props additionnels pour WithTranslation (i18n et tReady)
const defaultTranslationProps = {
  t: tMock,
  i18n: {} as any,
  tReady: true,
};

describe('ErrorBoundaryInner', () => {
  beforeEach(() => {
    // Restore mocks and reset location
    vi.restoreAllMocks();
    delete (window as any).location;
    (window as any).location = { href: '' };
  });

  it('renders children normally when no error occurs', () => {
    render(
      <ErrorBoundaryInner {...defaultTranslationProps}>
        <div data-testid="child">Hello world</div>
      </ErrorBoundaryInner>
    );
    expect(screen.getByTestId('child')).toHaveTextContent('Hello world');
  });

  it('displays fallback UI when a child throws', () => {
    const Bomb = () => { throw new Error('Boom!'); };
    vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ErrorBoundaryInner {...defaultTranslationProps}>
        <Bomb />
      </ErrorBoundaryInner>
    );

    expect(screen.getByRole('heading', { level: 4 })).toHaveTextContent('errors.title');
    expect(screen.getByRole('heading', { level: 5 })).toHaveTextContent('errors.unexpected');
    expect(screen.getByRole('button', { name: 'errors.retry' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'errors.home' })).toBeInTheDocument();
  });

  it('home button navigates to root', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const Bomb = () => { throw new Error('Boom!'); };

    render(
      <ErrorBoundaryInner {...defaultTranslationProps}>
        <Bomb />
      </ErrorBoundaryInner>
    );

    fireEvent.click(screen.getByRole('button', { name: 'errors.home' }));
    expect(window.location.href).toBe('/');
  });
});
