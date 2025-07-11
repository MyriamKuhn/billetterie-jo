import type { TicketStatus } from '../../types/tickets'
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
import type { AdminTicketFilters } from '../../types/admin'
import { FilterField } from '../FilterField'

interface Props {
  filters: AdminTicketFilters
  onChange: (f: Partial<AdminTicketFilters>) => void
}

export function AdminTicketsFilters({ filters, onChange }: Props) {
  const { t } = useTranslation('orders')
  const theme = useTheme()
  const [open, setOpen] = useState(false)

  // Options de statut : adapter selon vos statuts exacts
  const statusToLabel: Record<TicketStatus, string> = {
    '': t('filters.status_all'),
    issued: t('filters.status_issued'),
    used: t('filters.status_used'),
    refunded: t('filters.status_refunded'),
    cancelled: t('filters.status_cancelled'),
  }
  
  const labelToStatus: Record<string, TicketStatus> = Object.entries(statusToLabel).reduce(
      (acc, [code, label]) => {
        acc[label] = code as TicketStatus
        return acc
      },
      {} as Record<string, TicketStatus>
    )
    const statusOptionsLabels = Object.values(statusToLabel)
    const currentStatusLabel = statusToLabel[filters.status]

  const content = (
    <Box sx={{ width: 260, py: 2, px: 1 }}>
      <Typography variant="h6" gutterBottom>
        {t('filters.title')}
        </Typography>
      <Stack spacing={2} sx={{ mx: 1 }}>
        {/* Filtre par statut */}
        <FilterSelect<string>
          label={t('filters.status_label')}
          value={currentStatusLabel}
          options={statusOptionsLabels}
          onChange={selectedLabel => {
            const statusCode = labelToStatus[selectedLabel]
            onChange({ status: statusCode, page: 1 })
          }}
        />

        {/* Filtre par utilisateur */}
        <FilterField
          label={t('filters.user_id')}
          type="number"
          value={filters.user_id != null ? String(filters.user_id) : ''}
          onChange={v => {
            const n = v === '' ? undefined : parseInt(v, 10)
            onChange({ user_id: n, page: 1 })
          }}
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
              status: '',
              user_id: undefined,
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