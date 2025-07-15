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
  filters: AdminReportsFilters      // Current filter values
  onChange: (f: Partial<AdminReportsFilters>) => void   // Callback to update filters
}

/**
 * AdminReportsFilter
 *
 * Renders filtering controls for the admin reports screen:
 * - SortControl to pick sort field and direction
 * - FilterSelect to choose items per page
 * - Reset button to restore defaults
 * 
 * Displays as a sticky sidebar on desktop, and within a Drawer on mobile.
 */
export function AdminReportsFilter({ filters, onChange }: Props) {
  const { t } = useTranslation('reports')
  const theme = useTheme()
  const [open, setOpen] = useState(false) // Tracks mobile drawer open state

  // Define available sort fields (value + label)
  const sortFields = [
    { value: 'sales_count' as const,  label: t('filters.sales_count') },
  ];

  // Shared content for both desktop and mobile views
  const content = (
    <Box sx={{ width: 260, py: 2, px: 1 }}>
      {/* Section title */}
      <Typography variant="h6" gutterBottom>
        {t('filters.title')}
        </Typography>
      <Stack spacing={2} sx={{ mx: 1 }}>
        {/* Generic sort control */}
        <SortControl
          fields={sortFields}
          sortBy={filters.sort_by}
          order={filters.sort_order}
          onSortChange={(newField, newOrder) =>
            onChange({ sort_by: newField, sort_order: newOrder, page: 1 })
          }
          label={t('filters.sort_by')}
        />

        {/* Items per page selector */}
        <FilterSelect<string>
          label={t('filters.per_page')}
          value={String(filters.per_page)}
          options={['5','10','25','50','100']}
          onChange={selected => {
            const per = parseInt(selected, 10)
            onChange({ per_page: per, page: 1 })
          }}
        />

        {/* Reset button restores default filter values */}
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
      {/* Desktop sidebar (hidden on xs) */}
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

      {/* Mobile: menu icon + Drawer */}
      <Box sx={{ display: { xs: 'block', md: 'none' }, mb: 2 }}>
        <IconButton onClick={() => setOpen(true)} aria-label={t('filters.title')}>
          <MenuIcon />
        </IconButton>
        {/* Drawer containing the same content */}
        <Drawer open={open} onClose={() => setOpen(false)} keepMounted>
          <Box sx={{ position: 'relative' }}>
            {/* Close button inside Drawer */}
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