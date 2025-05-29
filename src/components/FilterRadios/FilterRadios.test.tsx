import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { FilterRadios } from './FilterRadios';

describe('<FilterRadios />', () => {
  const legend = 'Choix';
  const options = [
    { value: 'red' as const, label: 'Rouge' },
    { value: 'green' as const, label: 'Vert' },
    { value: 'blue' as const, label: 'Bleu' },
  ];

  it('affiche la légende et les radios avec la valeur initiale cochée', () => {
    const onChange = vi.fn();
    render(
      <FilterRadios
        legend={legend}
        value="green"
        options={options}
        onChange={onChange}
      />
    );

    // Le fieldset est accessible et contient la légende
    const groupFieldset = screen.getByRole('group', { name: legend });
    expect(groupFieldset).toBeInTheDocument();

    // Le radiogroup existe
    const radiogroup = screen.getByRole('radiogroup');
    expect(radiogroup).toBeInTheDocument();

    // On trouve les trois boutons radio et la valeur "green" est cochée
    const radioRouge = screen.getByRole('radio', { name: 'Rouge' });
    const radioVert  = screen.getByRole('radio', { name: 'Vert' });
    const radioBleu  = screen.getByRole('radio', { name: 'Bleu' });

    expect(radioRouge).not.toBeChecked();
    expect(radioVert).toBeChecked();
    expect(radioBleu).not.toBeChecked();
  });

  it('déclenche onChange avec la bonne valeur quand on clique sur une autre radio', () => {
    const onChange = vi.fn();
    render(
      <FilterRadios
        legend={legend}
        value="red"
        options={options}
        onChange={onChange}
      />
    );

    // Cliquer sur "Bleu"
    const radioBleu = screen.getByLabelText('Bleu');
    fireEvent.click(radioBleu);

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('blue');
  });
});
