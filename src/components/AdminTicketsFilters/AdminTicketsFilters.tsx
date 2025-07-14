import type { TicketStatus } from '../../types/tickets'
import { useCallback, useMemo, useState } from 'react'
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
import { useUsers } from '../../hooks/useUsers'
import { useAuthStore } from '../../stores/useAuthStore'
import Autocomplete from '@mui/material/Autocomplete'
import TextField from '@mui/material/TextField'
import CircularProgress from '@mui/material/CircularProgress'

interface Props {
  filters: AdminTicketFilters
  onChange: (f: Partial<AdminTicketFilters>) => void
}

/**
 * AdminTicketsFilters
 *
 * Renders filtering controls for the admin ticket list,
 * including status select, user autocomplete, pagination size,
 * and supports both desktop (sidebar) and mobile (drawer) layouts.
 */
export function AdminTicketsFilters({ filters, onChange }: Props) {
  const { t } = useTranslation('orders')
  const theme = useTheme()
  const [open, setOpen] = useState(false)

  // Retrieve auth token for API calls
  const token = useAuthStore((state) => state.authToken)

  // Fetch all users once, for the user filter autocomplete.
  const userFetchParams = useMemo(
    () => ({ firstname: '', lastname: '', email: '', perPage: 1000000000, page: 1 }),
    [filters.per_page]
  )
  const { users, loading: usersLoading } = useUsers(
    userFetchParams,
    token!,
    'user'
  )

  // Prepare the options array for the Autocomplete:
  // - First entry: "All users"
  // - Then each user formatted as "Firstname Lastname (email)"
  const allOption = useMemo(() => ({ label: t('filters.user_all'), id: undefined }), [t])
  const allOptions = useMemo(
    () => [allOption, ...users.map(u => ({ label: `${u.firstname} ${u.lastname} (${u.email})`, id: u.id }))],
    [users, allOption]
  )

  // Status filter: map status code to translated label
  const statusMap: Record<string, string> = {
    '': t('filters.status_all'),
    issued: t('filters.status_issued'),
    used: t('filters.status_used'),
    refunded: t('filters.status_refunded'),
    cancelled: t('filters.status_cancelled'),
  }
  const statusOptions = Object.values(statusMap)
  const labelToStatus = Object.fromEntries(
    Object.entries(statusMap).map(([k, v]) => [v, k])
  ) as Record<string, TicketStatus>
  const currentStatusLabel = statusMap[filters.status]

  // Handler for user selection changes.
  const handleUserChange = useCallback(
    (_: any, option: { label: string; id?: number } | null, reason?: string) => {
      if (reason === 'clear') {
        onChange({ user_id: undefined, page: 1 })
      } else {
        onChange({ user_id: option?.id, page: 1 })
      }
    },
    [onChange]
  )

  // The main filter content shared by both desktop and mobile layouts.
  const content = (
    <Box sx={{ width: 260, py: 2, px: 1 }}>
      <Typography variant="h6" gutterBottom>
        {t('filters.title')}
        </Typography>
      <Stack spacing={2} sx={{ mx: 1 }}>
        {/* Status filter dropdown */}
        <FilterSelect<string>
          label={t('filters.status_label')}
          value={currentStatusLabel}
          options={statusOptions}
          onChange={label => onChange({ status: labelToStatus[label], page: 1 })}
        />

        {/* User filter autocomplete */}
        <Autocomplete
          clearText={t('filters.clear_user')}
          size="small"
          options={allOptions}
          loading={usersLoading}
          value={allOptions.find(o => o.id === filters.user_id) ?? allOption}
          onChange={handleUserChange}
          isOptionEqualToValue={(option, value) => option.id === value.id}
          getOptionLabel={option => option.label}
          filterOptions={(options, { inputValue }) =>
            options.filter(o =>
              o.label.toLowerCase().includes(inputValue.toLowerCase())
            )
          }
          renderInput={params => (
            <TextField
              {...params}
              label={t('filters.user')}
              InputProps={{
                ...params.InputProps,
                endAdornment: (
                  <>
                    {usersLoading && <CircularProgress size={16} />}
                    {params.InputProps.endAdornment}
                  </>
                ),
              }}
            />
          )}
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

        {/* Reset all filters button */}
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
      {/* Desktop layout: fixed sidebar */}
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

      {/* Mobile layout: drawer toggled by menu icon */}
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