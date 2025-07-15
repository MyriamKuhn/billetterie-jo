import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Skeleton from '@mui/material/Skeleton'
import { useTheme } from '@mui/material/styles'

/**
 * Display a skeleton placeholder for a ticket card.
 * This component is used to show a loading state while the actual ticket data is being fetched. 
 */
export function TicketCardSkeleton() {
  const theme = useTheme()
  // Wrapper box matching the flex sizing of TicketCard
  return (
    <Box sx={{ flex: { xs: '1 1 calc(33% - 32px)', md: '1 1 100%' }, minWidth: { xs: 280, md: 'auto' }, maxWidth: { xs: 320, md: '100%' } }}>
      <Card
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          alignItems: { xs: 'stretch', md: 'center' },
          p: 2,
          gap: 1,
        }}
      >
        {/* Skeleton placeholder for the QR code area */}
        <Skeleton
          variant="rectangular"
          sx={{
            width: { xs: '100%', md: 200 },
            height: { xs: 150, md: 200 },
            bgcolor: theme.palette.action.hover,
          }}
        />

        {/* Skeleton placeholders for the main content */}
        <CardContent sx={{ flexGrow: 1 }}>
          {/* Title line */}
          <Skeleton variant="text" width="60%" height={32} />
          {/* Token placeholder */}
          <Skeleton variant="text" width="40%" sx={{ mt: 1, mb: 1 }} />
          {/* Date/location lines */}
          <Skeleton variant="text" width="50%" sx={{ mt: 1 }} />
          <Skeleton variant="text" width="70%" sx={{ mt: 0.5 }} />
          {/* Places line */}
          <Skeleton variant="text" width="30%" sx={{ mt: 0.5 }} />
          {/* Status chip placeholder */}
          <Skeleton variant="rectangular" width={80} height={24} sx={{ mt: 2, borderRadius: 1 }} />
        </CardContent>

        {/* Skeleton placeholders for action buttons */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'row', md: 'column' },
            justifyContent: 'center',
            alignItems: 'center',
            gap: 1,
          }}
        >
          {/* Boutons skeleton */}
          <Skeleton variant="rectangular" width={120} height={36} />
          <Skeleton variant="rectangular" width={120} height={36} />
        </Box>
      </Card>
    </Box>
  )
}
