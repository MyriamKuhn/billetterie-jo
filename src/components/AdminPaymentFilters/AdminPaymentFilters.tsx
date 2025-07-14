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
import type { AdminPaymentFilters, AdminPaymentsStatus } from '../../types/admin'
import { FilterField } from '../FilterField'

interface Props {
  filters: AdminPaymentFilters
  onChange: (f: Partial<AdminPaymentFilters>) => void
}

/**
 * Sidebar and mobile drawer for payment list filters.
 *
 * - Provides search, status, method, and pagination filters.
 * - Calls onChange with updated filter and resets page to 1.
 */
export function AdminPaymentFilters({ filters, onChange }: Props) {
  const { t } = useTranslation('payments')
  const theme = useTheme()
  const [open, setOpen] = useState(false)

  // Map internal status keys to translated labels
  const statusMap: Record<string, string> = {
    '': t('filters.status_all'),
    pending: t('filters.status_pending'),
    paid: t('filters.status_paid'),
    failed: t('filters.status_failed'),
    refunded: t('filters.status_refunded'),
  }
  const statusOptions = Object.values(statusMap)
  // Reverse lookup from label back to status key
  const labelToStatus = Object.fromEntries(
    Object.entries(statusMap).map(([k, v]) => [v, k])
  ) as Record<string, AdminPaymentsStatus>
  const currentStatusLabel = statusMap[filters.status]

  // Prepare payment method select options and reverse map
  const paymentMethods = ['', 'paypal', 'stripe', 'free']
  const paymentMethodOptions = paymentMethods.map(method => t(`filters.payment_method_${method}`))
  const currentPaymentMethod = paymentMethods.includes(filters.payment_method)
    ? t(`filters.payment_method_${filters.payment_method}`)
    : t('filters.payment_method_all')
  const labelToPaymentMethod = Object.fromEntries(
    paymentMethods.map(method => [t(`filters.payment_method_${method}`), method])
  ) as Record<string, '' | 'paypal' | 'stripe' | 'free'>

  // Shared content for both desktop sidebar and mobile drawer
  const content = (
    <Box sx={{ width: 260, py: 2, px: 1 }}>
      <Typography variant="h6" gutterBottom>
        {t('filters.title')}
        </Typography>
      <Stack spacing={2} sx={{ mx: 1 }}>
        {/* Free-text search filter */}
        <FilterField
          label={t('filters.name')}
          value={filters.q}
          onChange={v => onChange({ q:v, page:1 })}
        />

        {/* Status dropdown */}
        <FilterSelect<string>
          label={t('filters.status_label')}
          value={currentStatusLabel}
          options={statusOptions}
          onChange={label => onChange({ status: labelToStatus[label], page: 1 })}
        />

        {/* Payment method dropdown */}
        <FilterSelect<string>
          label={t('filters.payment_method_label')}
          value={currentPaymentMethod}
          options={paymentMethodOptions}
          onChange={label => onChange({ payment_method: labelToPaymentMethod[label], page: 1 })}
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

        {/* Reset all filters */}
        <Button
          variant="outlined"
          fullWidth
          onClick={() =>
            onChange({
              q: '',
              status: '',
              payment_method: '',
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
      {/* Desktop sidebar: visible on md+ */}
      <Box
        component="aside"
        sx={{
          display: { xs: 'none', md: 'block' },
          position: 'sticky',
          top: theme.mixins.toolbar.minHeight,  // stick below app bar
          bgcolor: 'background.paper',
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: 1,
          width: 260,
        }}
      >
        {content}
      </Box>

      {/* Mobile view: menu button toggles drawer */}
      <Box sx={{ display: { xs: 'block', md: 'none' }, mb: 2 }}>
        <IconButton onClick={() => setOpen(true)} aria-label={t('filters.title')}>
          <MenuIcon />
        </IconButton>
        <Drawer open={open} onClose={() => setOpen(false)} keepMounted>
          <Box sx={{ position: 'relative' }}>
            {/* Close icon inside drawer */}
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