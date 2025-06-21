import { useState } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Stack from '@mui/material/Stack'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import Drawer from '@mui/material/Drawer'
import MenuIcon from '@mui/icons-material/Menu'
import CloseIcon from '@mui/icons-material/Close'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import dayjs, { Dayjs } from 'dayjs'
import { FilterSelect } from '../FilterSelect'
import type { InvoiceFilters, InvoiceStatus } from '../../types/invoices'
import { useTranslation } from 'react-i18next';
import { useTheme } from '@mui/material/styles';
import { SortControl }   from '../SortControl';

interface Props {
  filters: InvoiceFilters
  onChange: (f: Partial<InvoiceFilters>) => void
}

export function InvoicesFilters({ filters, onChange }: Props) {
  const { t } = useTranslation('invoices');
  const theme = useTheme();
  const [open, setOpen] = useState(false)

  // 1) Mapping code → label pour le statut
  const statusToLabel: Record<InvoiceStatus, string> = {
    '': t('filters.status_all'),    
    pending: t('filters.status_pending'),
    paid: t('filters.status_paid'),
    failed: t('filters.status_failed'),
    refunded: t('filters.status_refunded'),
  }
  
  // Inverse : label -> code
  const labelToStatus: Record<string, InvoiceStatus> = Object.entries(statusToLabel).reduce(
    (acc, [code, label]) => {
      acc[label] = code as InvoiceStatus
      return acc
    },
    {} as Record<string, InvoiceStatus>
  )
  const statusOptionsLabels = Object.values(statusToLabel)
  const currentStatusLabel = statusToLabel[filters.status]


  // 2) Mapping code → label pour sort_by (champ de tri)
  // On passe les clés de tri attendues par l'API : 'created_at' | 'amount' | 'uuid'
  const sortByToLabel: Record<InvoiceFilters['sort_by'], string> = {
    created_at: t('filters.sort_by_date'),
    amount:     t('filters.sort_by_amount'),
    uuid:       t('filters.sort_by_uuid'),
  }
  // Transformer en tableau d’objets { value, label } pour SortControl
  const sortFields: Array<{ value: InvoiceFilters['sort_by']; label: React.ReactNode }> =
    (Object.entries(sortByToLabel) as Array<[InvoiceFilters['sort_by'], string]>).map(
      ([value, label]) => ({ value, label })
    )
  
  // 3) Pour per_page on garde un FilterSelect (ou autre UI), on peut laisser tel quel
  const perPageOptionsLabels = [5, 10, 15, 25, 50, 100].map(n => String(n))
  const currentPerPageLabel = String(filters.per_page)

  const content = (
    <Box sx={{ width: 260, py: 2, px: 1 }}>
      <Typography variant="h6" gutterBottom>
        {t('filters.title')}
      </Typography>
      <Stack spacing={2} sx={{ mx: 1 }}>
        {/* Statut */}
        <FilterSelect<string>
          label={t('filters.status_label')}
          value={currentStatusLabel}
          options={statusOptionsLabels}
          onChange={selectedLabel => {
            const statusCode = labelToStatus[selectedLabel] ?? ''
            onChange({ status: statusCode, page: 1 })
          }}
        />

        {/* Date “Du” */}
        <DatePicker
          label={t('filters.date_from_label')}
          value={filters.date_from ? dayjs(filters.date_from) : null}
          onChange={(d: Dayjs | null) =>
            onChange({ date_from: d?.format('YYYY-MM-DD') || '', page: 1 })
          }
          slotProps={{ textField: { size: 'small', fullWidth: true } }}
        />

        {/* Date “Au” */}
        <DatePicker
          label={t('filters.date_to_label') || 'Au'}
          value={filters.date_to ? dayjs(filters.date_to) : null}
          onChange={(d: Dayjs | null) =>
            onChange({ date_to: d?.format('YYYY-MM-DD') || '', page: 1 })
          }
          slotProps={{ textField: { size: 'small', fullWidth: true } }}
        />

        {/* Tri (SortControl) */}
        <SortControl<InvoiceFilters['sort_by']>
          fields={sortFields}
          sortBy={filters.sort_by}
          order={filters.sort_order}
          onSortChange={(newField, newOrder) => {
            onChange({ sort_by: newField, sort_order: newOrder, page: 1 })
          }}
          label={t('filters.sort_by_label')}
        />

        {/* Par page */}
        <FilterSelect<string>
          label={t('filters.per_page_label')}
          value={currentPerPageLabel}
          options={perPageOptionsLabels}
          onChange={selectedLabel => {
            const perPageNum = parseInt(selectedLabel, 10) || 15
            onChange({ per_page: perPageNum, page: 1 })
          }}
        />

        {/* Réinitialiser */}
        <Button
          variant="outlined"
          fullWidth
          onClick={() =>
            onChange({
              status: '',
              date_from: '',
              date_to: '',
              sort_by: 'created_at',
              sort_order: 'desc',
              per_page: 15,
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
          border: t => `1px solid ${t.palette.divider}`,
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
