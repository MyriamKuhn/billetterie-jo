import { render, screen, fireEvent, act, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import QuantityInput from './QuantityInput';

// On contourne la stricte correspondance de CartItem en le typant any
type MinimalCartItem = any;

describe('<QuantityInput /> – couverture 100 %', () => {
  let adjustQtyMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    adjustQtyMock = vi.fn();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    cleanup();
  });

  const baseItem: MinimalCartItem = {
    id: '1',
    name: 'Test',
    price: 10,
    quantity: 2,
    availableQuantity: 5,
    image: 'img.png',
    date: '2025-01-01',
    location: 'Loc',
    inStock: true,
    sale: 0,
  };

  it('affiche la quantité initiale et boutons +/- actifs/inactifs selon bounds', () => {
    render(
      <QuantityInput item={{ ...baseItem, quantity: 2 }} adjustQty={adjustQtyMock} debounceMs={500} />
    );
    const input = screen.getByRole('textbox') as HTMLInputElement;
    expect(input.value).toBe('2');
    const [decrement, increment] = screen.getAllByRole('button');
    expect(decrement).not.toHaveAttribute('disabled');
    expect(increment).not.toHaveAttribute('disabled');

    cleanup();

    render(
      <QuantityInput item={{ ...baseItem, quantity: 0 }} adjustQty={adjustQtyMock} debounceMs={500} />
    );
    const [dec0] = screen.getAllByRole('button');
    expect(dec0).toHaveAttribute('disabled');

    cleanup();

    render(
      <QuantityInput item={{ ...baseItem, quantity: 5 }} adjustQty={adjustQtyMock} debounceMs={500} />
    );
    const [, inc5] = screen.getAllByRole('button');
    expect(inc5).toHaveAttribute('disabled');
  });

  it('clic sur + et - appelle adjustQty immédiatement avec clamp', () => {
    render(
      <QuantityInput item={{ ...baseItem, quantity: 2 }} adjustQty={adjustQtyMock} debounceMs={500} />
    );
    const [decrement, increment] = screen.getAllByRole('button');
    fireEvent.click(decrement);
    expect(adjustQtyMock).toHaveBeenCalledWith(expect.objectContaining({ id: '1' }), 1);
    adjustQtyMock.mockClear();
    fireEvent.click(increment);
    expect(adjustQtyMock).toHaveBeenCalledWith(expect.objectContaining({ id: '1' }), 3);
  });

  it('saisie d’une nouvelle valeur déclenche debounce et adjustQty avec la valeur', () => {
    render(
      <QuantityInput item={{ ...baseItem, quantity: 2 }} adjustQty={adjustQtyMock} debounceMs={500} />
    );
    const input = screen.getByRole('textbox') as HTMLInputElement;

    act(() => {
      fireEvent.change(input, { target: { value: '4' } });
      vi.advanceTimersByTime(500);
    });

    expect(adjustQtyMock).toHaveBeenCalledWith(expect.objectContaining({ id: '1' }), 4);
    expect(input.value).toBe('4');
  });

  it('ne fait rien si on entre la même valeur que quantity', () => {
    render(
      <QuantityInput item={{ ...baseItem, quantity: 2 }} adjustQty={adjustQtyMock} debounceMs={500} />
    );
    const input = screen.getByRole('textbox') as HTMLInputElement;

    act(() => {
      fireEvent.change(input, { target: { value: '2' } });
      vi.advanceTimersByTime(500);
    });

    expect(adjustQtyMock).not.toHaveBeenCalled();
  });

  it('saisie d’une valeur vide n’appelle pas adjustQty', () => {
    render(
      <QuantityInput item={{ ...baseItem, quantity: 2 }} adjustQty={adjustQtyMock} debounceMs={500} />
    );
    const input = screen.getByRole('textbox') as HTMLInputElement;

    act(() => {
      fireEvent.change(input, { target: { value: '' } });
      vi.advanceTimersByTime(1000);
    });

    expect(adjustQtyMock).not.toHaveBeenCalled();
  });

  it('saisie de caractères non numériques n’affecte pas inputValue', () => {
    render(
      <QuantityInput item={{ ...baseItem, quantity: 2 }} adjustQty={adjustQtyMock} debounceMs={500} />
    );
    const input = screen.getByRole('textbox') as HTMLInputElement;
    expect(input.value).toBe('2');

    act(() => {
      fireEvent.change(input, { target: { value: 'abc' } });
    });

    expect(input.value).toBe('2');
  });

  it('saisie d’une valeur supérieure à availableQuantity clamped', () => {
    render(
      <QuantityInput item={{ ...baseItem, quantity: 2 }} adjustQty={adjustQtyMock} debounceMs={500} />
    );
    const input = screen.getByRole('textbox') as HTMLInputElement;

    act(() => {
      fireEvent.change(input, { target: { value: '10' } });
      vi.advanceTimersByTime(500);
    });

    expect(adjustQtyMock).toHaveBeenCalledWith(expect.objectContaining({ id: '1' }), 5);
    expect(input.value).toBe('5');
  });

  it('mise à jour item.quantity répercute inputValue via useEffect', () => {
    const { rerender } = render(
      <QuantityInput item={{ ...baseItem, quantity: 2 }} adjustQty={adjustQtyMock} debounceMs={500} />
    );
    const input = screen.getByRole('textbox') as HTMLInputElement;
    expect(input.value).toBe('2');

    rerender(
      <QuantityInput item={{ ...baseItem, quantity: 4 }} adjustQty={adjustQtyMock} debounceMs={500} />
    );
    expect(input.value).toBe('4');
  });

  it('ne déclenche pas adjustQty quand rawVal est NaN', () => {
    // Stub global.isNaN pour forcer rawVal invalid
    const origIsNaN = global.isNaN;
    (global as any).isNaN = () => true;

    render(
      <QuantityInput item={{ ...baseItem, quantity: 2 }} adjustQty={adjustQtyMock} debounceMs={500} />
    );
    const input = screen.getByRole('textbox') as HTMLInputElement;

    act(() => {
      fireEvent.change(input, { target: { value: '3' } });
      vi.advanceTimersByTime(500);
    });

    expect(adjustQtyMock).not.toHaveBeenCalled();
    (global as any).isNaN = origIsNaN;
  });

  it('annule l’ancien debounce quand on change avant expiration', () => {
    const clearSpy = vi.spyOn(window, 'clearTimeout');
    render(
      <QuantityInput item={{ ...baseItem, quantity: 2 }} adjustQty={adjustQtyMock} debounceMs={500} />
    );
    const input = screen.getByRole('textbox') as HTMLInputElement;

    act(() => {
      fireEvent.change(input, { target: { value: '3' } });
      fireEvent.change(input, { target: { value: '4' } });
      vi.advanceTimersByTime(500);
    });

    expect(clearSpy).toHaveBeenCalled();
    clearSpy.mockRestore();
  });

  it('clamp à 0 quand rawVal négatif (isNaN false et Number < 0)', () => {
    // Stub global.isNaN pour rawVal valide
    const origIsNaN = global.isNaN;
    (global as any).isNaN = () => false;
    // Stub window.Number pour retourner négatif
    const FakeNumber: any = () => -5;
    FakeNumber.isNaN = Number.isNaN;
    (window as any).Number = FakeNumber;

    render(
      <QuantityInput item={{ ...baseItem, quantity: 2 }} adjustQty={adjustQtyMock} debounceMs={500} />
    );
    const input = screen.getByRole('textbox') as HTMLInputElement;

    act(() => {
      fireEvent.change(input, { target: { value: '3' } });
      vi.advanceTimersByTime(500);
    });

    expect(adjustQtyMock).toHaveBeenCalledWith(expect.objectContaining({ id: '1' }), 0);
    expect(input.value).toBe('0');

    (global as any).isNaN = origIsNaN;
    (window as any).Number = Number;
  });

  it('annule le debounce existant lors du démontage', () => {
    const clearSpy = vi.spyOn(window, 'clearTimeout');
    const { unmount } = render(
      <QuantityInput item={{ ...baseItem, quantity: 2 }} adjustQty={adjustQtyMock} debounceMs={500} />
    );
    const input = screen.getByRole('textbox') as HTMLInputElement;

    act(() => {
      fireEvent.change(input, { target: { value: '3' } });
      // Ne pas avancer le timer, on démonte immédiatement
      unmount();
    });

    expect(clearSpy).toHaveBeenCalled();
    clearSpy.mockRestore();
  });

  it('nettoie le timer de debounce lors du démontage', () => {
    const clearSpy = vi.spyOn(window, 'clearTimeout');

    const { unmount } = render(
      <QuantityInput item={{ ...baseItem, quantity: 2 }} adjustQty={adjustQtyMock} debounceMs={500} />
    );
    const input = screen.getByRole('textbox') as HTMLInputElement;

    // 1) Changer l’input pour déclencher l’effet et mettre un timer
    act(() => {
      fireEvent.change(input, { target: { value: '3' } });
    });

    // 2) Démonter le composant avant que le timer ne se déclenche
    act(() => {
      unmount();
    });

    expect(clearSpy).toHaveBeenCalled();
    clearSpy.mockRestore();
  });
});
