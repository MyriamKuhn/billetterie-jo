import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { FilterSelect } from './FilterSelect';

describe('<FilterSelect />', () => {
  it('affiche la valeur initiale (string) et déclenche onChange', () => {
    const onChange = vi.fn();
    render(
      <FilterSelect
        label="Fruit"
        value="Apple"
        options={['Apple', 'Banana', 'Cherry']}
        onChange={onChange}
      />
    );

    // Vérifie la valeur initiale
    expect(screen.getByDisplayValue('Apple')).toBeInTheDocument();

    // Ouvre la liste et sélectionne "Cherry"
    const combobox = screen.getByRole('combobox');
    fireEvent.mouseDown(combobox);
    const optionCherry = screen.getByRole('option', { name: 'Cherry' });
    fireEvent.click(optionCherry);
    expect(onChange).toHaveBeenCalledWith('Cherry');
  });

  it('affiche la valeur initiale (number) et déclenche onChange', () => {
    const onChange = vi.fn();
    render(
      <FilterSelect
        label="Count"
        value={2}
        options={[1, 2, 3, 5]}
        onChange={onChange}
      />
    );

    // Vérifie la valeur initiale
    expect(screen.getByDisplayValue('2')).toBeInTheDocument();

    // Ouvre la liste et sélectionne "5"
    const combobox = screen.getByRole('combobox');
    fireEvent.mouseDown(combobox);
    const optionFive = screen.getByRole('option', { name: '5' });
    fireEvent.click(optionFive);
    expect(onChange).toHaveBeenCalledWith(5);
  });
});