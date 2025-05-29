import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { FilterField } from './FilterField';

describe('<FilterField />', () => {
  const label = 'Search';

  it('renders with given label and value', () => {
    const onChange = vi.fn();
    render(<FilterField label={label} value="initial" onChange={onChange} />);

    // TextField renders an input with associated label
    const input = screen.getByLabelText(label) as HTMLInputElement;
    expect(input).toBeInTheDocument();
    expect(input.value).toBe('initial');
    // default type is text
    expect(input).toHaveAttribute('type', 'text');
  });

  it('calls onChange with new value on user input', () => {
    const onChange = vi.fn();
    render(<FilterField label={label} value="foo" onChange={onChange} />);

    const input = screen.getByLabelText(label) as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'bar' } });

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('bar');
  });

  it('accepts and applies custom type prop', () => {
    const onChange = vi.fn();
    render(<FilterField label={label} value="secret" onChange={onChange} type="password" />);

    const input = screen.getByLabelText(label) as HTMLInputElement;
    expect(input).toHaveAttribute('type', 'password');
  });

  it('keeps label shrunk via slotProps', () => {
    const onChange = vi.fn();
    render(<FilterField label={label} value="x" onChange={onChange} />);
    // Récupère l'input associé au label
    const input = screen.getByLabelText(label) as HTMLInputElement;
    // L'input a une étiquette <label> associée via labels
    const labelEl = input.labels![0];
    expect(labelEl).toHaveClass('MuiInputLabel-shrink');
  });
});
