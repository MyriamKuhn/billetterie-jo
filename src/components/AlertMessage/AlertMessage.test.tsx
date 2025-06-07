import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import AlertMessage from './AlertMessage';

describe('AlertMessage component', () => {
  it('renders error message with correct color and role', () => {
    render(<AlertMessage message="Something went wrong" severity="error" />);

    const alert = screen.getByRole('alert');
    expect(alert).toBeInTheDocument();
    expect(alert).toHaveTextContent('Something went wrong');

    // MUI applies theme color; error maps to theme.palette.error.main (rgb(211,47,47))
    expect(alert).toHaveStyle({ color: 'rgb(211, 47, 47)' });
  });

  it('renders success message without role and with success color', () => {
    render(<AlertMessage message="Operation successful" severity="success" />);

    // no role attribute for success
    const text = screen.getByText('Operation successful');
    expect(text).toBeInTheDocument();
    expect(text).not.toHaveAttribute('role');

    // success.main maps to rgb(46,125,50)
    expect(text).toHaveStyle({ color: 'rgb(46, 125, 50)' });
  });
});
