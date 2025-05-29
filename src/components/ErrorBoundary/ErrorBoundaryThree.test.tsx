import React from 'react';
import { describe, it, expect } from 'vitest';
import { ErrorBoundaryInner } from './ErrorBoundary';
import type { TFunction } from 'i18next';

// Mock minimaliste de la fonction de traduction
const tMock = ((key: string) => key) as TFunction;
;(tMock as any).$TFunctionBrand = {};

// Props nécessaires pour l'instance
const defaultTranslationProps = {
  t: tMock,
  i18n: {} as any,
  tReady: true,
  children: null as any,
};

describe('ErrorBoundaryInner React.isValidElement branch', () => {
  it('returns primitive children an array containing the primitive when not a React element', () => {
    const primitiveChild = 123;
    const props = { ...defaultTranslationProps, children: primitiveChild };
    const comp = new ErrorBoundaryInner(props);
    comp.state = { hasError: false, reloadKey: 42 };

    const output = comp.render();
    // Should return an array containing the primitive
    expect(Array.isArray(output)).toBe(true);
    expect((output as any[])[0]).toBe(primitiveChild);
  });

    it('clones valid React elements with new key but same props', () => {
    const element = <div data-test="foo">Bar</div>;
    const props = { ...defaultTranslationProps, children: element };
    const comp = new ErrorBoundaryInner(props);
    comp.state = { hasError: false, reloadKey: 9 };

    const result = comp.render();
    expect(Array.isArray(result)).toBe(true);
    // Cast result to array of ReactElement with any props
    const clones = result as React.ReactElement<any, any>[];
    const cloned = clones[0];
    // Should be recognized as valid React element
    expect(React.isValidElement(cloned)).toBe(true);
    // Key should start with reload-9
    expect(cloned.key).toMatch(/^reload-9/);
    // Cast cloned.props to any for inspection
    const clonedProps = (cloned.props as any);
    // Props preserved from original element
    expect(clonedProps['data-test']).toBe('foo');
    expect(clonedProps.children).toBe('Bar');
  });
});
