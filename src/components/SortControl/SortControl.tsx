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
  /** Array of fields the user can sort by */
  fields: Array<{ value: F; label: React.ReactNode }>;
  /** Currently selected sort field */
  sortBy: F;
  /** Current sort order ('asc' or 'desc') */
  order: SortOrder;
  /** Callback invoked when either the field or order changes */
  onSortChange: (sortBy: F, order: SortOrder) => void;
  /** Label text displayed above the control */
  label: String;
}

/**
 * SortControl:
 * - Renders a group of toggle buttons for selecting the sort field.
 * - Renders a second group for choosing ascending or descending order.
 * - Calls `onSortChange` with updated values when user interacts.
 */
export function SortControl<F extends SortField>({
  fields,
  sortBy,
  order,
  onSortChange,
  label
}: SortControlProps<F>) {
  const { t } = useTranslation();

  // Handler when the sort field changes
  const handleField = (_: React.MouseEvent<HTMLElement>, newField: F) => {
    if (newField) onSortChange(newField, order);
  };

  // Handler when the sort order changes
  const handleOrder = (_: React.MouseEvent<HTMLElement>, newOrder: SortOrder) => {
    if (newOrder) onSortChange(sortBy, newOrder);
  };

  return (
    <FormControl component="fieldset" fullWidth>
      {/* Legend / label for the control */}
      <FormLabel component="legend" sx={{ mb: 1 }}>
        {label}
      </FormLabel>
      <Box sx={{ display: 'flex', gap: 1 }}>
        {/* Toggle buttons for selecting the sort field */}
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

        {/* Toggle buttons for selecting ascending/descending order */}
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
