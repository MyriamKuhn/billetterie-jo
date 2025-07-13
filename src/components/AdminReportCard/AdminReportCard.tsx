import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import { useTranslation } from 'react-i18next'
import type { ReportProductSales } from '../../types/admin'

interface ReportCardProps {
  report: ReportProductSales
}

export function AdminReportCard({ report }: ReportCardProps) {
  const { t } = useTranslation('reports')

  return (
    <Card sx={{ p:2, display: 'flex', flexDirection: 'column', gap: 1 }}>
      <CardContent>
        <Typography variant="h6">#{report.product_id} - {report.product_name}</Typography>
        <Typography variant="body2" color="textSecondary">
          {t('reports.sales_count', { count: report.sales_count })}
        </Typography>
      </CardContent>
    </Card>
  );
}
