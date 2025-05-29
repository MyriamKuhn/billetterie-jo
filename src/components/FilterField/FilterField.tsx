import TextField from '@mui/material/TextField';
import React from 'react';

interface FilterFieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: React.InputHTMLAttributes<unknown>['type'];
}

export function FilterField({ label, value, onChange, type }: FilterFieldProps) {
  return (
    <TextField
      label={label}
      type={type}
      size="small"
      fullWidth
      value={value}
      onChange={e => onChange(e.target.value)}
      slotProps={{ inputLabel: { shrink: true } }}
    />
  );
}
