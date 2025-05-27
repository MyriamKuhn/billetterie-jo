import { useState } from 'react';
import { useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Drawer from '@mui/material/Drawer';
import MenuIcon from '@mui/icons-material/Menu';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs, { Dayjs } from 'dayjs';
import { FilterField }   from '../FilterField';
import { FilterSelect }  from '../FilterSelect';
import { FilterRadios }  from '../FilterRadios';
import { SortControl }   from '../SortControl';
import CloseIcon from '@mui/icons-material/Close';
import { useTranslation } from 'react-i18next';

interface ProductsFiltersProps {
  filters: {
    name: string;
    category: string;
    location: string;
    date: string;
    places: number;
    sortBy: 'name' | 'price' | 'date';
    order: 'asc' | 'desc';
    perPage: number;
    page: number;
  };
  onChange: (newFilters: Partial<ProductsFiltersProps['filters']>) => void;
}

export function ProductsFilters({
  filters,
  onChange,
}: ProductsFiltersProps) {
  const { t } = useTranslation('ticket');
  const theme = useTheme();
  const [open, setOpen] = useState(false);

  // Liste des champs de tri pour le SortControl
  const sortFields = [
    { value: 'name' as const,  label: t('filters.name') },
    { value: 'price' as const, label: t('filters.price') },
    { value: 'date' as const,  label: t('filters.date') },
  ];

  const content = (
    <Box sx={{ width: 260, py: 2, px: 1 }}>
      <Typography variant="h6" gutterBottom>
        {t('filters.title')}
      </Typography>
      <Stack spacing={2} sx={{ mx: 1 }}>
        {/* Nom */}
        <FilterField
          label={t('filters.name')}
          value={filters.name}
          onChange={v => onChange({ name:v, page:1 })}
        />

        {/* Catégorie */}
        <FilterField
          label={t('filters.category')}
          value={filters.category}
          onChange={v => onChange({ category:v, page:1})}
        />

        {/* Lieu */}
        <FilterField
          label={t('filters.location')}
          value={filters.location}
          onChange={v => onChange({ location:v, page:1})}
        />

        {/* Date */}
        <DatePicker
          label={t('filters.date')}
          value={filters.date ? dayjs(filters.date) : null}
          onChange={(newVal: Dayjs | null) =>
            onChange({ date: newVal?.format('YYYY-MM-DD') || '', page: 1 })
          }
          slotProps={{
            textField: {
              size: 'small',
              fullWidth: true,
              InputLabelProps: { shrink: true },
            },
          }}
        />

        {/* Places (radio) */}
        <FilterRadios
          legend={t('filters.places')}
          value={filters.places.toString()}
          options={[
            {value:'0', label:t('filters.all_places')},
            {value:'1', label:t('filters.one_place')},
            {value:'2', label:t('filters.two_places')},
            {value:'4', label:t('filters.four_places')},
          ]}
          onChange={v=> onChange({ places:Number(v), page:1 })}
        />

        {/* Tri (SortControl générique) */}
        <SortControl
          fields={sortFields}
          sortBy={filters.sortBy}
          order={filters.order}
          onSortChange={(newField, newOrder) =>
            onChange({ sortBy: newField, order: newOrder, page: 1 })
          }
          label={t('filters.sort_by')}
        />

        {/* Offres par page */}
        <FilterSelect
          label={t('filters.offers_per_page')}
          value={filters.perPage}
          options={[1,5,10,15,25,50,100]}
          onChange={v=>onChange({ perPage:v, page:1 })}
        />

        {/* Réinitialiser */}
        <Button
          variant="outlined"
          fullWidth
          onClick={() =>
            onChange({
              name: '',
              category: '',
              location: '',
              date: '',
              places: 0,
              sortBy: 'name',
              order: 'asc',
              perPage: 15,
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
      {/* Sidebar desktop */}
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

      {/* Drawer mobile */}
      <Box sx={{ display: { xs: 'block', md: 'none' }, mb: 2 }}>
        <IconButton onClick={() => setOpen(true)} aria-label={t('filters.title')}>
          <MenuIcon />
        </IconButton>
        <Drawer open={open} onClose={() => setOpen(false)} keepMounted>
          <Box sx={{ position: 'relative' }}>
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

