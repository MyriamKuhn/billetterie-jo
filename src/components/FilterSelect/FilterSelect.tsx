import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';

interface FilterSelectProps<T extends (string|number)> {
  label: string;
  value: T;
  options: T[];
  onChange: (v: T) => void;
}

/**
 * 
 * A reusable select dropdown wrapped in MUI FormControl, allowing selection from a list of string or number options.
 * 
 */
export function FilterSelect<T extends (string|number)>({
  label, value, options, onChange
}: FilterSelectProps<T>) {
  return (
    <FormControl size="small" fullWidth>

      {/* The InputLabel is tied to the Select via the label prop */}
      <InputLabel>{label}</InputLabel>

      {/* Select component controlled by the `value` prop */}
      <Select
        label={label}
        value={value}
        onChange={e => onChange(e.target.value as T)}
      >
        {/* Render each option as a MenuItem */}
        {options.map(o => (
          <MenuItem key={o} value={o}>{o}</MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}
