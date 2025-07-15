import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import { useTranslation } from 'react-i18next'
import type { ReportProductSales } from '../../types/admin'

interface ReportCardProps {
  /**
   * Sales report entry for a single product
   */
  report: ReportProductSales
}

/**
 * AdminReportCard
 *
 * Displays:
 * - The product identifier and name
 * - The localized sales count message
 *
 * Relies on i18n key 'reports.sales_count' accepting a { count } variable.
 */
export function AdminReportCard({ report }: ReportCardProps) {
  const { t } = useTranslation('reports')

  return (
    <Card sx={{ p:2, display: 'flex', flexDirection: 'column', gap: 1 }}>
      <CardContent>
        {/* Product title */}
        <Typography variant="h6">#{report.product_id} - {report.product_name}</Typography>
        {/* Localized sales count message */}
        <Typography variant="body2" color="textSecondary">
          {t('reports.sales_count', { count: report.sales_count })}
        </Typography>
      </CardContent>
    </Card>
  );
}
