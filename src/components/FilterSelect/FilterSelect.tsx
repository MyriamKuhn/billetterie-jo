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

export function FilterSelect<T extends (string|number)>({
  label, value, options, onChange
}: FilterSelectProps<T>) {
  return (
    <FormControl size="small" fullWidth>
      <InputLabel>{label}</InputLabel>
      <Select
        label={label}
        value={value}
        onChange={e => onChange(e.target.value as T)}
      >
        {options.map(o => (
          <MenuItem key={o} value={o}>{o}</MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}
