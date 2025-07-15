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

/**
 * A responsive filter sidebar/drawer for invoices, supporting status, date range, sort, and pagination filters.
 * This component adapts to both desktop and mobile views, providing a consistent user experience.
 * It includes:
 * - Status filter with options for all, pending, paid, failed, and refunded invoices.
 * - Date range filters for "From" and "To" dates.
 * - Sort control for sorting by date, amount, or UUID. 
 */
export function InvoicesFilters({ filters, onChange }: Props) {
  const { t } = useTranslation('invoices');
  const theme = useTheme();
  const [open, setOpen] = useState(false)

  // 1) Map status codes to localized labels
  const statusToLabel: Record<InvoiceStatus, string> = {
    '': t('filters.status_all'),    
    pending: t('filters.status_pending'),
    paid: t('filters.status_paid'),
    failed: t('filters.status_failed'),
    refunded: t('filters.status_refunded'),
  }
  
   // Reverse map from label back to status code
  const labelToStatus: Record<string, InvoiceStatus> = Object.entries(statusToLabel).reduce(
    (acc, [code, label]) => {
      acc[label] = code as InvoiceStatus
      return acc
    },
    {} as Record<string, InvoiceStatus>
  )
  const statusOptionsLabels = Object.values(statusToLabel)  // Array of status labels
  const currentStatusLabel = statusToLabel[filters.status]  // Currently selected status label


  // 2) Map sort_by codes to localized labels and prepare fields array for SortControl
  const sortByToLabel: Record<InvoiceFilters['sort_by'], string> = {
    created_at: t('filters.sort_by_date'),
    amount:     t('filters.sort_by_amount'),
    uuid:       t('filters.sort_by_uuid'),
  }
  const sortFields: Array<{ value: InvoiceFilters['sort_by']; label: React.ReactNode }> =
    (Object.entries(sortByToLabel) as Array<[InvoiceFilters['sort_by'], string]>).map(
      ([value, label]) => ({ value, label })
    )
  
  // 3) Pagination options as strings
  const perPageOptionsLabels = [5, 10, 15, 25, 50, 100].map(n => String(n))
  const currentPerPageLabel = String(filters.per_page)

  // Shared filter content used in sidebar and drawer
  const content = (
    <Box sx={{ width: 260, py: 2, px: 1 }}>
      {/* Title */}
      <Typography variant="h6" gutterBottom>
        {t('filters.title')}
      </Typography>
      <Stack spacing={2} sx={{ mx: 1 }}>
        {/* Status filter */}
        <FilterSelect<string>
          label={t('filters.status_label')}
          value={currentStatusLabel}
          options={statusOptionsLabels}
          onChange={selectedLabel => {
            const statusCode = labelToStatus[selectedLabel] ?? ''
            onChange({ status: statusCode, page: 1 })
          }}
        />

        {/* Date-from filter */}
        <DatePicker
          label={t('filters.date_from_label')}
          value={filters.date_from ? dayjs(filters.date_from) : null}
          onChange={(d: Dayjs | null) =>
            onChange({ date_from: d?.format('YYYY-MM-DD') || '', page: 1 })
          }
          slotProps={{ textField: { size: 'small', fullWidth: true } }}
        />

        {/* Date-to filter */}
        <DatePicker
          label={t('filters.date_to_label')}
          value={filters.date_to ? dayjs(filters.date_to) : null}
          onChange={(d: Dayjs | null) =>
            onChange({ date_to: d?.format('YYYY-MM-DD') || '', page: 1 })
          }
          slotProps={{ textField: { size: 'small', fullWidth: true } }}
        />

        {/* Sort-by control */}
        <SortControl<InvoiceFilters['sort_by']>
          fields={sortFields}
          sortBy={filters.sort_by}
          order={filters.sort_order}
          onSortChange={(newField, newOrder) => {
            onChange({ sort_by: newField, sort_order: newOrder, page: 1 })
          }}
          label={t('filters.sort_by_label')}
        />

        {/* Per-page filter */}
        <FilterSelect<string>
          label={t('filters.per_page_label')}
          value={currentPerPageLabel}
          options={perPageOptionsLabels}
          onChange={selectedLabel => {
            const perPageNum = parseInt(selectedLabel, 10) || 15
            onChange({ per_page: perPageNum, page: 1 })
          }}
        />

        {/* Reset button */}
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
      {/* Desktop sidebar: visible on md+ */}
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

      {/* Mobile filter drawer: visible on xs */}
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
