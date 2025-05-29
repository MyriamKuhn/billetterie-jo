import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, beforeEach, expect, vi } from 'vitest';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';

// Mock Drawer to expose its props as data attributes for test coverage
vi.mock('@mui/material/Drawer', () => ({
  __esModule: true,
  default: ({ open, onClose, keepMounted, children }: any) => (
    <div data-testid="drawer" data-open={open} data-keep-mounted={keepMounted} onClick={onClose}>
      {children}
    </div>
  ),
}));

// Mock useTranslation to return identity t
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

import { ProductsFilters } from './ProductsFilters';

describe('ProductsFilters Drawer behavior via mocked Drawer', () => {
  const defaultFilters = {
    name: '',
    category: '',
    location: '',
    date: '',
    places: 0,
    sortBy: 'name' as const,
    order: 'asc' as const,
    perPage: 15,
    page: 1,
  };
  const onChange = vi.fn();
  const theme = createTheme();

  beforeEach(() => {
    onChange.mockClear();
  });

  const renderComponent = () =>
    render(
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <ThemeProvider theme={theme}>
          <ProductsFilters filters={defaultFilters} onChange={onChange} />
        </ThemeProvider>
      </LocalizationProvider>
    );

  it('toggles Drawer open prop and calls onClose handler', () => {
    renderComponent();

    // Drawer initially mounted with open=false, keepMounted true
    const drawer = screen.getByTestId('drawer');
    expect(drawer).toHaveAttribute('data-open', 'false');
    expect(drawer).toHaveAttribute('data-keep-mounted', 'true');

    // Open drawer by clicking menu button
    const menuButton = screen.getByRole('button', { name: 'filters.title' });
    fireEvent.click(menuButton);
    expect(drawer).toHaveAttribute('data-open', 'true');

    // Close drawer by triggering onClose via click on mocked drawer container
    fireEvent.click(drawer);
    expect(drawer).toHaveAttribute('data-open', 'false');
  });
});
