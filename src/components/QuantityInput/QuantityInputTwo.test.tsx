import { render, screen, fireEvent, act, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import QuantityInput from './QuantityInput';

type MinimalCartItem = any;

describe('<QuantityInput /> – couvre le debounceMs par défaut', () => {
  let adjustQtyMock: ReturnType<typeof vi.fn>;

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

  beforeEach(() => {
    adjustQtyMock = vi.fn();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    cleanup();
  });

  it('utilise 500ms quand aucun debounceMs n’est passé en prop', () => {
    render(<QuantityInput item={{ ...baseItem }} adjustQty={adjustQtyMock} />);
    const input = screen.getByRole('textbox') as HTMLInputElement;

    act(() => {
      fireEvent.change(input, { target: { value: '4' } });
      // Avancer de 499ms – rien ne doit se passer
      vi.advanceTimersByTime(499);
    });
    expect(adjustQtyMock).not.toHaveBeenCalled();

    act(() => {
      // Avancer de 1ms supplémentaire => 500ms total déclenche adjustQty
      vi.advanceTimersByTime(1);
    });
    expect(adjustQtyMock).toHaveBeenCalledWith(expect.objectContaining({ id: '1' }), 4);
  });
});
