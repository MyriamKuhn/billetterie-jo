import type { TicketFilters, TicketStatus } from '../../types/tickets'
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
import { useTranslation } from 'react-i18next';
import { useTheme } from '@mui/material/styles';

interface Props {
  filters: TicketFilters
  onChange: (f: Partial<TicketFilters>) => void
}

/**
 * A responsive filter sidebar/drawer for ticket listings, including status select, event date range, items per page, and reset button.
 */
export function TicketsFilters({ filters, onChange }: Props) {
  const { t } = useTranslation('tickets')
  const theme = useTheme()
  const [open, setOpen] = useState(false)

  // Map ticket statuses to their localized labels
  const statusToLabel: Record<TicketStatus, string> = {
    '': t('filters.status_all'),
    issued: t('filters.status_issued'),
    used: t('filters.status_used'),
    refunded: t('filters.status_refunded'),
    cancelled: t('filters.status_cancelled'),
  }
  
  // Reverse map from label back to status code
  const labelToStatus: Record<string, TicketStatus> = Object.entries(statusToLabel).reduce(
      (acc, [code, label]) => {
        acc[label] = code as TicketStatus
        return acc
      },
      {} as Record<string, TicketStatus>
    )
    const statusOptionsLabels = Object.values(statusToLabel)
    const currentStatusLabel = statusToLabel[filters.status]

  // Shared content for both desktop sidebar and mobile drawer
  const content = (
    <Box sx={{ width: 260, py: 2, px: 1 }}>
      <Typography variant="h6" gutterBottom>
        {t('filters.title')}
        </Typography>

      {/* Stack of filter controls */}
      <Stack spacing={2} sx={{ mx: 1 }}>
        {/* Status dropdown */}
        <FilterSelect<string>
          label={t('filters.status_label')}
          value={currentStatusLabel}
          options={statusOptionsLabels}
          onChange={selectedLabel => {
            const statusCode = labelToStatus[selectedLabel]
            onChange({ status: statusCode, page: 1 })
          }}
        />

        {/* Event date "from" picker */}
        <DatePicker
          label={t('filters.event_date_from')}
          value={filters.event_date_from ? dayjs(filters.event_date_from) : null}
          onChange={(d: Dayjs | null) =>
            onChange({ event_date_from: d?.format('YYYY-MM-DD') || '', page: 1 })
          }
          slotProps={{ textField: { size: 'small', fullWidth: true } }}
        />

        {/* Event date "to" picker */}
        <DatePicker
          label={t('filters.event_date_to')}
          value={filters.event_date_to ? dayjs(filters.event_date_to) : null}
          onChange={(d: Dayjs | null) =>
            onChange({ event_date_to: d?.format('YYYY-MM-DD') || '', page: 1 })
          }
          slotProps={{ textField: { size: 'small', fullWidth: true } }}
        />

        {/* Items per page dropdown */}
        <FilterSelect<string>
          label={t('filters.per_page')}
          value={String(filters.per_page)}
          options={['5','10','25','50','100']}
          onChange={selected => {
            const per = parseInt(selected, 10)
            onChange({ per_page: per, page: 1 })
          }}
        />

        {/* Reset button to clear all filters */}
        <Button
          variant="outlined"
          fullWidth
          onClick={() =>
            onChange({
              status: '',
              event_date_from: '',
              event_date_to: '',
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
      {/* Desktop sidebar (visible on md and up) */}
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

      {/* Mobile drawer (visible on xs only) */}
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
  )
}