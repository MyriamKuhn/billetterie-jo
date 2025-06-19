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

describe('<QuantityInput /> – couverture disabled branches', () => {
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

  it('initial disabled=true: inputValue reste item.quantity, saisie ne change pas et adjustQty non appelé', () => {
    render(
      <QuantityInput
        item={{ ...baseItem, quantity: 3 }}
        adjustQty={adjustQtyMock}
        debounceMs={500}
        disabled={true}
      />
    );
    const input = screen.getByRole('textbox') as HTMLInputElement;
    // valeur initiale = "3"
    expect(input.value).toBe('3');

    // tenter de changer la saisie
    act(() => {
      fireEvent.change(input, { target: { value: '4' } });
      // Comme disabled=true, handleChange remet inputValue à item.quantity
    });
    expect(input.value).toBe('3');

    // Même si on avance les timers, aucun adjustQty
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(adjustQtyMock).not.toHaveBeenCalled();

    // Les boutons +/- doivent être disabled (prop disabled)
    const buttons = screen.getAllByRole('button');
    // decrement et increment
    buttons.forEach(btn => {
      expect(btn).toBeDisabled();
    });

    // onBlur aussi retombe sur item.quantity
    act(() => {
      // forcer inputValue différent via internal set (simulate improbable cas)
      // mais handleChange empêche. Néanmoins testons onBlur logique:
      fireEvent.blur(input);
    });
    expect(input.value).toBe('3');
  });

  it('transition disabled false → true: inputValue reset à item.quantity et debounce nettoyé', () => {
    // Spy clearTimeout pour vérifier l’annulation du timer
    const clearSpy = vi.spyOn(window, 'clearTimeout');

    // On commence avec disabled=false
    const { rerender } = render(
      <QuantityInput
        item={{ ...baseItem, quantity: 2 }}
        adjustQty={adjustQtyMock}
        debounceMs={500}
        disabled={false}
      />
    );
    const input = screen.getByRole('textbox') as HTMLInputElement;

    // Lancer une modification pour créer un timeout
    act(() => {
      fireEvent.change(input, { target: { value: '4' } });
      // à cet instant, un debounce est programmé
    });
    // Ensuite, on passe disabled=true avant que le timer n’expire
    rerender(
      <QuantityInput
        item={{ ...baseItem, quantity: 2 }}
        adjustQty={adjustQtyMock}
        debounceMs={500}
        disabled={true}
      />
    );
    // Dès le rendu avec disabled=true, inputValue doit repasser à '2'
    expect(input.value).toBe('2');
    // Le timer en cours doit avoir été nettoyé
    expect(clearSpy).toHaveBeenCalled();
    clearSpy.mockRestore();

    // Même si on avance les timers, pas d’appel adjustQty
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(adjustQtyMock).not.toHaveBeenCalled();
  });

  it('effect inputValue: ne déclenche pas adjustQty quand disabled=true même si inputValue change (programmatique)', () => {
    // Pour simuler changement programmatique, on peut rerender avec un autre item.quantity,
    // mais l’effet useEffect([item.quantity]) synchronise inputValue à la nouvelle quantité.
    // Ici, on teste que useEffect sur inputValue ne déclenche rien car disabled=true.

    // Commencer disabled=false pour initialiser inputValue
    const { rerender } = render(
      <QuantityInput
        item={{ ...baseItem, quantity: 2 }}
        adjustQty={adjustQtyMock}
        debounceMs={500}
        disabled={false}
      />
    );
    const input = screen.getByRole('textbox') as HTMLInputElement;
    // Modifier inputValue normalement
    act(() => {
      fireEvent.change(input, { target: { value: '4' } });
      vi.advanceTimersByTime(500);
    });
    expect(adjustQtyMock).toHaveBeenCalledWith(expect.objectContaining({ id: '1' }), 4);
    adjustQtyMock.mockClear();

    // Maintenant rendre disabled=true
    rerender(
      <QuantityInput
        item={{ ...baseItem, quantity: 4 }} // synchronise inputValue à '4'
        adjustQty={adjustQtyMock}
        debounceMs={500}
        disabled={true}
      />
    );
    expect(input.value).toBe('4');

    // Forcer un changement de inputValue (via rerender d’item.quantity différent)
    rerender(
      <QuantityInput
        item={{ ...baseItem, quantity: 1 }}
        adjustQty={adjustQtyMock}
        debounceMs={500}
        disabled={true}
      />
    );
    // inputValue synchronisé à '1' dans useEffect; mais l’effet inputValue ne doit pas appeler adjustQty
    expect(input.value).toBe('1');
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(adjustQtyMock).not.toHaveBeenCalled();
  });

  it('handleChange: quand disabled passe true, inputValue reste item.quantity', () => {
    // Initial disabled=false
    const { rerender } = render(
      <QuantityInput
        item={{ ...baseItem, quantity: 2 }}
        adjustQty={adjustQtyMock}
        debounceMs={500}
        disabled={false}
      />
    );
    const input = screen.getByRole('textbox') as HTMLInputElement;
    // On peut changer
    act(() => {
      fireEvent.change(input, { target: { value: '3' } });
    });
    expect(input.value).toBe('3');

    // Passe disabled=true
    rerender(
      <QuantityInput
        item={{ ...baseItem, quantity: 2 }}
        adjustQty={adjustQtyMock}
        debounceMs={500}
        disabled={true}
      />
    );
    // inputValue doit immédiatement revenir à '2'
    expect(input.value).toBe('2');
  });

  it('onBlur: quand disabled=true, déclenche setInputValue(item.quantity) et la valeur reste item.quantity', () => {
    // Rendre avec disabled=true et quantity=5
    render(
      <QuantityInput
        item={{ ...baseItem, quantity: 5 }}
        adjustQty={adjustQtyMock}
        debounceMs={500}
        disabled={true}
      />
    );
    const input = screen.getByRole('textbox') as HTMLInputElement;
    // Valeur initiale contrôlée = "5"
    expect(input.value).toBe('5');

    // Simuler un blur : le handler onBlur voit disabled=true et appelle setInputValue("5"),
    // mais comme inputValue est déjà "5", il n’y a pas de rerender. Le DOM reste à "5".
    fireEvent.blur(input);

    // On s’attend toujours à "5"
    expect(input.value).toBe('5');
  });
});

describe('<QuantityInput /> – couverture clearTimeout et inputValue empty blur', () => {
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

  it('transition disabled false → true annule le debounce via clearTimeout', () => {
    // On spy sur clearTimeout
    const clearSpy = vi.spyOn(window, 'clearTimeout');

    // 1) Render initial disabled=false, quantity=2
    const { rerender } = render(
      <QuantityInput
        item={{ ...baseItem, quantity: 2 }}
        adjustQty={adjustQtyMock}
        debounceMs={500}
        disabled={false}
      />
    );
    const input = screen.getByRole('textbox') as HTMLInputElement;

    // 2) Modifier l’input pour programmer un debounce
    act(() => {
      fireEvent.change(input, { target: { value: '4' } });
      // NE PAS avancer le timer ici, afin que debounceRef.current reste non null
    });
    // À ce stade, useEffect a créé un timeout (debounceRef.current != null)

    // 3) Rerender avec disabled=true avant que le timeout n'expire
    rerender(
      <QuantityInput
        item={{ ...baseItem, quantity: 2 }}
        adjustQty={adjustQtyMock}
        debounceMs={500}
        disabled={true}
      />
    );
    // L’effet useEffect([disabled, item.quantity]) doit exécuter clearTimeout(debounceRef.current)
    expect(clearSpy).toHaveBeenCalled();
    clearSpy.mockRestore();

    // 4) Même si on avance le timer, adjustQty ne sera pas appelé
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(adjustQtyMock).not.toHaveBeenCalled();
  });

  it('onBlur quand inputValue vide (""), disabled=false : réinitialise à item.quantity', () => {
    // Render avec disabled=false et quantity=3
    render(
      <QuantityInput
        item={{ ...baseItem, quantity: 3 }}
        adjustQty={adjustQtyMock}
        debounceMs={500}
        disabled={false}
      />
    );
    const input = screen.getByRole('textbox') as HTMLInputElement;

    // 1) Simuler saisie vide
    act(() => {
      fireEvent.change(input, { target: { value: '' } });
    });
    // inputValue interne devient '', DOM reflète '' 
    expect(input.value).toBe(''); // on s’attend à ce qu’il soit '' pour couvrir cette branche

    // 2) Simuler blur : la branche !disabled && inputValue === '' doit appeler setInputValue(item.quantity)
    fireEvent.blur(input);
    // Après blur, input.value doit revenir à "3"
    expect(input.value).toBe('3');
  });
});

describe('<QuantityInput /> – couverture clearTimeout(debounceRef.current)', () => {
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

  it('annule le debounce en cours quand disabled passe de false à true avant expiration', () => {
    // Espions sur global.setTimeout et global.clearTimeout
    const setSpy = vi.spyOn(global, 'setTimeout');
    const clearSpy = vi.spyOn(global, 'clearTimeout');

    // 1) Render initial disabled=false, quantity=2
    const { rerender } = render(
      <QuantityInput
        item={{ ...baseItem, quantity: 2 }}
        adjustQty={adjustQtyMock}
        debounceMs={500}
        disabled={false}
      />
    );
    const input = screen.getByRole('textbox') as HTMLInputElement;

    // 2) Modifier l’input pour programmer un debounce
    act(() => {
      fireEvent.change(input, { target: { value: '4' } });
    });
    // Vérifier que setTimeout a été appelé avec la bonne durée
    expect(setSpy).toHaveBeenCalledWith(expect.any(Function), 500);
    // Récupérer l’ID/handle retourné (qui sera un objet avec fakeTimers)
    const calls = setSpy.mock.results;
    expect(calls.length).toBeGreaterThan(0);
    const timeoutHandle = calls[calls.length - 1].value;
    // Vérifier qu’on a bien un handle défini (pas undefined / null)
    expect(timeoutHandle).toBeDefined();

    // 3) Rerender avec disabled=true **avant** d’avancer le timer
    act(() => {
      rerender(
        <QuantityInput
          item={{ ...baseItem, quantity: 2 }}
          adjustQty={adjustQtyMock}
          debounceMs={500}
          disabled={true}
        />
      );
    });

    // 4) Vérifier que clearTimeout a été appelé avec ce même handle
    expect(clearSpy).toHaveBeenCalledWith(timeoutHandle);

    // Nettoyage des spies
    setSpy.mockRestore();
    clearSpy.mockRestore();

    // 5) Si on avance maintenant le timer, adjustQty ne doit pas être appelé
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(adjustQtyMock).not.toHaveBeenCalled();
  });
});

describe('<QuantityInput /> – couverture increment/decrement branches', () => {
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
  });
  afterEach(() => {
    cleanup();
  });

  it('increment/decrement fonctionnent quand disabled=false', () => {
    // quantity initial 2, availableQuantity 5
    render(
      <QuantityInput
        item={{ ...baseItem, quantity: 2, availableQuantity: 5 }}
        adjustQty={adjustQtyMock}
        disabled={false}
      />
    );
    // Récupère les deux boutons: [decrement, increment]
    const buttons = screen.getAllByRole('button');
    const decrementBtn = buttons[0];
    const incrementBtn = buttons[1];

    // Cliquer sur decrement: 2 -> 1
    fireEvent.click(decrementBtn);
    expect(adjustQtyMock).toHaveBeenCalledWith(
      expect.objectContaining({ id: '1' }),
      1
    );
    adjustQtyMock.mockClear();

    // Cliquer sur increment: 2 -> 3
    fireEvent.click(incrementBtn);
    expect(adjustQtyMock).toHaveBeenCalledWith(
      expect.objectContaining({ id: '1' }),
      3
    );
    adjustQtyMock.mockClear();
  });

  it('increment clamp à availableQuantity', () => {
    // quantity initial 5 égale availableQuantity
    render(
      <QuantityInput
        item={{ ...baseItem, quantity: 5, availableQuantity: 5 }}
        adjustQty={adjustQtyMock}
        disabled={false}
      />
    );
    const buttons = screen.getAllByRole('button');
    const decrementBtn = buttons[0];
    const incrementBtn = buttons[1];

    // increment: quantity >= availableQuantity, clamp dans code : Math.min(5+1,5) => 5
    // Mais on s'attend tout de même à appeler adjustQty avec 5 si le code l'appelle.
    // Selon l’implémentation, si quantity >= availableQuantity, on peut appeler adjustQty(item, 5) 
    // ou on peut désactiver le bouton. Actuellement, disabled = disabled || item.quantity >= availableQuantity,
    // donc ici incrementBtn est disabled, et cliquer ne doit rien faire.
    expect(incrementBtn).toBeDisabled();
    fireEvent.click(incrementBtn);
    expect(adjustQtyMock).not.toHaveBeenCalled();

    // decrement doit marcher: 5 -> 4
    expect(decrementBtn).not.toBeDisabled();
    fireEvent.click(decrementBtn);
    expect(adjustQtyMock).toHaveBeenCalledWith(
      expect.objectContaining({ id: '1' }),
      4
    );
  });

  it('decrement clamp à 0', () => {
    // quantity initial 0
    render(
      <QuantityInput
        item={{ ...baseItem, quantity: 0, availableQuantity: 5 }}
        adjustQty={adjustQtyMock}
        disabled={false}
      />
    );
    const buttons = screen.getAllByRole('button');
    const decrementBtn = buttons[0];
    const incrementBtn = buttons[1];

    // decrement: quantity <= 0, bouton disabled
    expect(decrementBtn).toBeDisabled();
    fireEvent.click(decrementBtn);
    expect(adjustQtyMock).not.toHaveBeenCalled();

    // increment: 0 -> 1
    expect(incrementBtn).not.toBeDisabled();
    fireEvent.click(incrementBtn);
    expect(adjustQtyMock).toHaveBeenCalledWith(
      expect.objectContaining({ id: '1' }),
      1
    );
  });

  it('clic ne fait rien quand disabled=true', () => {
    render(
      <QuantityInput
        item={{ ...baseItem, quantity: 2, availableQuantity: 5 }}
        adjustQty={adjustQtyMock}
        disabled={true}
      />
    );
    const buttons = screen.getAllByRole('button');
    const decrementBtn = buttons[0];
    const incrementBtn = buttons[1];

    // Les deux boutons sont disabled ou au moins doivent early-return
    // Ici disabled=true => disabled || condition => disabled=true, donc disabled attr=true
    expect(decrementBtn).toBeDisabled();
    expect(incrementBtn).toBeDisabled();

    // Cliquer ne doit rien appeler
    fireEvent.click(decrementBtn);
    fireEvent.click(incrementBtn);
    expect(adjustQtyMock).not.toHaveBeenCalled();
  });
});