import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SortControl, type SortOrder } from './SortControl';

// Mock react-i18next
vi.mock('react-i18next', () => ({
  __esModule: true,
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { changeLanguage: async () => {} },
  }),
}));

describe('<SortControl />', () => {
  const fields = [
    { value: 'name', label: 'Name' },
    { value: 'price', label: 'Price' },
  ];
  let onSortChange: (sortBy: string, order: SortOrder) => void;

  beforeEach(() => {
    onSortChange = vi.fn();
  });

  it('renders the legend label and both field buttons', () => {
    render(
      <SortControl
        fields={fields}
        sortBy="name"
        order="asc"
        onSortChange={onSortChange}
        label="Test Label"
      />
    );

    // Legend
    expect(screen.getByText('Test Label')).toBeInTheDocument();
    // Field buttons
    expect(screen.getByRole('button', { name: 'name' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'price' })).toBeInTheDocument();
    // Order buttons
    expect(screen.getByRole('button', { name: 'sorting.ascendant' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'sorting.descendant' })).toBeInTheDocument();
  });

  it('calls onSortChange with new field and same order when a field button is clicked', () => {
    render(
      <SortControl
        fields={fields}
        sortBy="name"
        order="desc"
        onSortChange={onSortChange}
        label="L"
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'price' }));
    expect(onSortChange).toHaveBeenCalledTimes(1);
    expect(onSortChange).toHaveBeenCalledWith('price', 'desc');
  });

  it('does not call onSortChange when clicking the already-selected field', () => {
    render(
      <SortControl
        fields={fields}
        sortBy="name"
        order="asc"
        onSortChange={onSortChange}
        label="L"
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'name' }));
    expect(onSortChange).not.toHaveBeenCalled();
  });

  it('calls onSortChange with same field and new order when an order button is clicked', () => {
    render(
      <SortControl
        fields={fields}
        sortBy="price"
        order="asc"
        onSortChange={onSortChange}
        label="L"
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'sorting.descendant' }));
    expect(onSortChange).toHaveBeenCalledTimes(1);
    expect(onSortChange).toHaveBeenCalledWith('price', 'desc');
  });

  it('does not call onSortChange when clicking the already-selected order', () => {
    render(
      <SortControl
        fields={fields}
        sortBy="price"
        order="desc"
        onSortChange={onSortChange}
        label="L"
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'sorting.descendant' }));
    expect(onSortChange).not.toHaveBeenCalled();
  });
});
