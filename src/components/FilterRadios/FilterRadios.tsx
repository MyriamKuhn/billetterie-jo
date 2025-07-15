import FormControl from '@mui/material/FormControl';
import FormLabel from '@mui/material/FormLabel';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Radio from '@mui/material/Radio';

interface FilterRadiosProps<T extends string> {
  legend: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}

/**
 * 
 * A reusable radio-button group wrapped in MUI FormControl, allowing selection among provided options.
 * 
 */
export function FilterRadios<T extends string>({
  legend, value, options, onChange
}: FilterRadiosProps<T>) {

  return (
    <FormControl component="fieldset">
      {/* Legend for the group */}
      <FormLabel component="legend">{legend}</FormLabel>

      {/* Radio buttons laid out in a row */}
      <RadioGroup
        row
        value={value}
        onChange={(_, v) => onChange(v as T)}
      >
        {options.map(o => (
          <FormControlLabel
            key={o.value}
            value={o.value}
            control={<Radio size="small" />}
            label={o.label}
          />
        ))}
      </RadioGroup>
    </FormControl>
  );
}
