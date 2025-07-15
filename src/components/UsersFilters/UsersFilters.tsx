import { useState } from 'react';
import { useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Drawer from '@mui/material/Drawer';
import MenuIcon from '@mui/icons-material/Menu';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import { FilterField }   from '../FilterField';
import { FilterSelect }  from '../FilterSelect';
import CloseIcon from '@mui/icons-material/Close';
import { useTranslation } from 'react-i18next';

export interface UsersFiltersProps {
  role: 'user' | 'employee';
  filters: {
    firstname: string;
    lastname: string;
    email: string;
    perPage: number;
    page: number;
  };
  onChange: (newFilters: Partial<UsersFiltersProps['filters']>) => void;
}

/**
 * A responsive filter sidebar/drawer for user and employee lists, supporting first name, last name, email filters,
 * items per page selection, and reset functionality. 
 */
export function UsersFilters({
  role,
  filters,
  onChange,
}: UsersFiltersProps) {
  const { t } = useTranslation('users');
  const filterKey = `filters.${role}_per_page` as const;
  const theme = useTheme();
  const [open, setOpen] = useState(false);

  // Shared filter content used in sidebar (desktop) and drawer (mobile)
  const content = (
    <Box sx={{ width: 260, py: 2, px: 1 }}>
      {/* Section title */}
      <Typography variant="h6" gutterBottom>
        {t('filters.title')}
      </Typography>
      <Stack spacing={2} sx={{ mx: 1 }}>
        {/* First name text filter */}
        <FilterField
          label={t('filters.firstname')}
          value={filters.firstname}
          onChange={v => onChange({ firstname:v, page:1 })}
        />

        {/* Last name text filter */}
        <FilterField
          label={t('filters.lastname')}
          value={filters.lastname}
          onChange={v => onChange({ lastname:v, page:1})}
        />

        {/* Email text filter */}
        <FilterField
          label={t('filters.email')}
          value={filters.email}
          onChange={v => onChange({ email:v, page:1})}
        />

        {/* Items per page dropdown */}
        <FilterSelect
          label={t(filterKey)}
          value={filters.perPage}
          options={[5,10,15,20,25,50,100]}
          onChange={v=>onChange({ perPage:v, page:1 })}
        />

        {/* Reset button to clear all filters */}
        <Button
          variant="outlined"
          fullWidth
          onClick={() =>
            onChange({
              firstname: '',
              lastname: '',
              email: '',
              perPage: 10,
              page: 1,
            })
          }
        >
          {t('filters.reset')}
        </Button>
      </Stack>
    </Box>
  );

  return (
    <>
      {/* Desktop sidebar (hidden on xs screens) */}
      <Box
        component="aside"
        sx={{
          display: { xs: 'none', md: 'block' },
          position: 'sticky',
          top: theme.mixins.toolbar.minHeight,
          bgcolor: 'background.paper',
          border: t => `1px solid ${t.palette.divider}`,
          borderRadius: 1,
          width: 260,
        }}
      >
        {content}
      </Box>

      {/* Mobile drawer (visible only on xs screens) */}
      <Box sx={{ display: { xs: 'block', md: 'none' }, mb: 2 }}>
        {/* Button to open the filter drawer */}
        <IconButton onClick={() => setOpen(true)} aria-label={t('filters.title')}>
          <MenuIcon />
        </IconButton>
        {/* Drawer containing the same filter content */}
        <Drawer open={open} onClose={() => setOpen(false)} keepMounted>
          <Box sx={{ position: 'relative' }}>
            {/* Close button inside drawer */}
            <IconButton
              onClick={() => setOpen(false)}
              size="small"
              sx={{
                position: 'absolute',
                top: 8,
                right: 8,
              }}
              aria-label={t('filters.close')}
            >
              <CloseIcon />
            </IconButton>
            {content}
          </Box>
        </Drawer>
      </Box>
    </>
  );
}

