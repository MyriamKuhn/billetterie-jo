import { useState } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Stack from '@mui/material/Stack'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import Drawer from '@mui/material/Drawer'
import MenuIcon from '@mui/icons-material/Menu'
import CloseIcon from '@mui/icons-material/Close'
import { FilterSelect } from '../FilterSelect'
import { useTranslation } from 'react-i18next';
import { useTheme } from '@mui/material/styles';
import type { AdminReportsFilters } from '../../types/admin'
import { SortControl } from '../SortControl'

interface Props {
  filters: AdminReportsFilters
  onChange: (f: Partial<AdminReportsFilters>) => void
}

export function AdminReportsFilter({ filters, onChange }: Props) {
  const { t } = useTranslation('reports')
  const theme = useTheme()
  const [open, setOpen] = useState(false)

  // Liste des champs de tri pour le SortControl
  const sortFields = [
    { value: 'sales_count' as const,  label: t('filters.sales_count') },
  ];

  const content = (
    <Box sx={{ width: 260, py: 2, px: 1 }}>
      <Typography variant="h6" gutterBottom>
        {t('filters.title')}
        </Typography>
      <Stack spacing={2} sx={{ mx: 1 }}>
        {/* Tri (SortControl générique) */}
        <SortControl
          fields={sortFields}
          sortBy={filters.sort_by}
          order={filters.sort_order}
          onSortChange={(newField, newOrder) =>
            onChange({ sort_by: newField, sort_order: newOrder, page: 1 })
          }
          label={t('filters.sort_by')}
        />

        {/* Par page */}
        <FilterSelect<string>
          label={t('filters.per_page')}
          value={String(filters.per_page)}
          options={['5','10','25','50','100']}
          onChange={selected => {
            const per = parseInt(selected, 10)
            onChange({ per_page: per, page: 1 })
          }}
        />

        {/* Réinitialiser */}
        <Button
          variant="outlined"
          fullWidth
          onClick={() =>
            onChange({
              sort_by: 'sales_count',
              sort_order: 'desc',
              per_page: 5,
              page: 1,
            })
          }
        >
          {t('filters.reset')}
        </Button>
      </Stack>
    </Box>
  )

  return (
    <>
      {/* Desktop */}
      <Box
        component="aside"
        sx={{
          display: { xs: 'none', md: 'block' },
          position: 'sticky',
          top: theme.mixins.toolbar.minHeight,
          bgcolor: 'background.paper',
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: 1,
          width: 260,
        }}
      >
        {content}
      </Box>

      {/* Mobile */}
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
  )
}