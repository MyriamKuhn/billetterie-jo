import React from 'react';
import Box from '@mui/material/Box';
import FormControl from '@mui/material/FormControl';
import FormLabel from '@mui/material/FormLabel';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import { useTranslation } from 'react-i18next';

export type SortField = string;
export type SortOrder = 'asc' | 'desc';

interface SortControlProps<F extends SortField> {
  /** liste des champs à trier */
  fields: Array<{ value: F; label: React.ReactNode }>;
  /** champ actuellement sélectionné */
  sortBy: F;
  /** ordre actuel */
  order: SortOrder;
  /** callback quand on change soit le champ, soit l’ordre */
  onSortChange: (sortBy: F, order: SortOrder) => void;
  label: String;
}

export function SortControl<F extends SortField>({
  fields,
  sortBy,
  order,
  onSortChange,
  label
}: SortControlProps<F>) {
  const { t } = useTranslation();
  const handleField = (_: React.MouseEvent<HTMLElement>, newField: F) => {
    if (newField) onSortChange(newField, order);
  };
  const handleOrder = (_: React.MouseEvent<HTMLElement>, newOrder: SortOrder) => {
    if (newOrder) onSortChange(sortBy, newOrder);
  };

  return (
    <FormControl component="fieldset" fullWidth>
      <FormLabel component="legend" sx={{ mb: 1 }}>
        {label}
      </FormLabel>
      <Box sx={{ display: 'flex', gap: 1 }}>
        {/* Groupe Champs (personnalisable) */}
        <ToggleButtonGroup
          value={sortBy}
          exclusive
          size="small"
          onChange={handleField}
          aria-label={t('sorting.title')}
          sx={{ flex: 1 }}
        >
          {fields.map(({ value, label }) => (
            <ToggleButton key={value} value={value} aria-label={String(value)}>
              {label}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>

        {/* Groupe Ordre (toujours le même) */}
        <ToggleButtonGroup
          value={order}
          exclusive
          size="small"
          onChange={handleOrder}
          aria-label={t('sorting.order')}
        >
          <ToggleButton value="asc" aria-label={t('sorting.ascendant')}>
            <ArrowUpwardIcon fontSize="small" />
          </ToggleButton>
          <ToggleButton value="desc" aria-label={t('sorting.descendant')}>
            <ArrowDownwardIcon fontSize="small" />
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>
    </FormControl>
  );
}
