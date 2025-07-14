import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { useTranslation } from 'react-i18next'
import type { ReportProductSales } from '../../types/admin'
import { AdminReportCard } from '../AdminReportCard'
import { AdminReportDownloadCard } from '../AdminReportDownloadCard'
import dayjs from 'dayjs'

interface AdminReportGridProps {
  /**
   * Array of sales report entries to display
   * Each item contains product_id, product_name, and sales_count
   */
  reports: ReportProductSales[]
}

/**
 * AdminReportsGrid
 *
 * Displays an admin interface for viewing and exporting sales reports.
 * - If no reports are available, shows a "no reports" message.
 * - Otherwise, renders:
 *    1. A download card allowing export of all reports with today's date in filename
 *    2. A list of AdminReportCard components, one per report
 */
export function AdminReportsGrid({ reports }: AdminReportGridProps) {
  const { t } = useTranslation('reports')

  // Empty state: no reports available
  if (reports.length === 0) {
    return (
      <Typography variant="h4" sx={{ textAlign: 'center' }}>
        {t('errors.no_reports')}
      </Typography>
    );
  }

   // Normal state: render download option and report cards
  return (
    <Box sx={{ display: 'flex', gap: 4, justifyContent: { xs: 'center', md: 'flex-start' }, flexWrap: { xs: 'wrap', md: 'nowrap' }, flexDirection: { xs: 'row', md: 'column' }}}>
      {/*
        Download card with dynamic filename including current date
        Uses dayjs to format today's date for the filename
      */}
      <AdminReportDownloadCard
        filename= {t('export.filename', { today: dayjs().format('YYYY-MM-DD') } )}
      />
      {/* Render one AdminReportCard per report entry */}
      {reports.map(report => (
        <AdminReportCard
          key={report.product_id}
          report={report}
        />
      ))}
    </Box>
  )
}