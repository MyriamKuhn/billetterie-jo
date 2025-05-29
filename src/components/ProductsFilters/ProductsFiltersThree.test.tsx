import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Dayjs } from 'dayjs';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { ProductsFilters } from './ProductsFilters';

// Mock translation
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

// Capture DatePicker onChange prop for null-fallback
let capturedOnChange: ((val: Dayjs | null) => void) | null = null;
vi.mock('@mui/x-date-pickers/DatePicker', () => ({
  __esModule: true,
  DatePicker: ({ onChange }: any) => {
    capturedOnChange = onChange;
    return null;
  },
}));

describe('ProductsFilters Reset and DatePicker fallback', () => {
  const initialFilters = {
    name: 'abc',
    category: 'cat',
    location: 'loc',
    date: '2025-01-01',
    places: 2,
    sortBy: 'price' as const,
    order: 'desc' as const,
    perPage: 50,
    page: 3,
  };

  it('calls onChange with defaults when clicking Reset', () => {
    const onChange = vi.fn();
    render(
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <ThemeProvider theme={createTheme()}>
          <ProductsFilters filters={initialFilters} onChange={onChange} />
        </ThemeProvider>
      </LocalizationProvider>
    );

    const resetButton = screen.getByRole('button', { name: 'filters.reset' });
    fireEvent.click(resetButton);

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith({
      name: '',
      category: '',
      location: '',
      date: '',
      places: 0,
      sortBy: 'name',
      order: 'asc',
      perPage: 15,
      page: 1,
    });
  });

  it('falls back to empty string when DatePicker onChange null', () => {
    const onChange = vi.fn();
    render(
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <ThemeProvider theme={createTheme()}>
          <ProductsFilters filters={initialFilters} onChange={onChange} />
        </ThemeProvider>
      </LocalizationProvider>
    );

    expect(typeof capturedOnChange).toBe('function');
    capturedOnChange!(null);
    expect(onChange).toHaveBeenCalledWith({ date: '', page: 1 });
  });
});
