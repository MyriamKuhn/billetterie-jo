import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { useTranslation } from 'react-i18next'
import type { ReportProductSales } from '../../types/admin'
import { AdminReportCard } from '../AdminReportCard'
import { AdminReportDownloadCard } from '../AdminReportDownloadCard'
import dayjs from 'dayjs'

interface AdminReportGridProps {
  reports: ReportProductSales[]
}

export function AdminReportsGrid({ reports }: AdminReportGridProps) {
  const { t } = useTranslation('reports')

  if (reports.length === 0) {
    return (
      <Typography variant="h4" sx={{ textAlign: 'center' }}>
        {t('errors.no_reports')}
      </Typography>
    );
  }

  return (
    <Box sx={{ display: 'flex', gap: 4, justifyContent: { xs: 'center', md: 'flex-start' }, flexWrap: { xs: 'wrap', md: 'nowrap' }, flexDirection: { xs: 'row', md: 'column' }}}>
      <AdminReportDownloadCard
        filename= {t('export.filename', { today: dayjs().format('YYYY-MM-DD') } )}
      />
      {reports.map(report => (
        <AdminReportCard
          key={report.product_id}
          report={report}
        />
      ))}
    </Box>
  )
}