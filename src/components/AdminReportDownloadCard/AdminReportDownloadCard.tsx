import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import DownloadIcon from '@mui/icons-material/Download';
import { exportData } from '../../utils/exportData';
import { useAuthStore } from '../../stores/useAuthStore';
import { useLanguageStore } from '../../stores/useLanguageStore';
import type { AdminReportsResponse } from '../../types/admin';
import axios from 'axios';
import { API_BASE_URL } from '../../config';
import { useState } from 'react';
import { useCustomSnackbar } from '../../hooks/useCustomSnackbar';
import { useTranslation } from 'react-i18next';
import { logError } from '../../utils/logger';

interface AdminReportDownloadCardProps {
  filename?: string;  // Base filename for exports (defaults to 'sales_report')
}

/**
 * AdminReportDownloadCard
 *
 * Renders a card with controls to download the sales report as CSV or Excel.
 * - Fetches sales data from the API in one request.
 * - Uses `exportData` utility to trigger file download.
 * - Shows a spinner and disables buttons while loading.
 * - Logs errors and shows notifications on success/failure.
 */
export function AdminReportDownloadCard({ filename = 'sales_report' }: AdminReportDownloadCardProps) {
  const { t } = useTranslation('reports');
  const token = useAuthStore((state) => state.authToken);
  const lang = useLanguageStore((state) => state.lang);
  const { notify } = useCustomSnackbar();

  // Loading state flag
  const [loading, setLoading] = useState(false);

  // Column headers mapping for export
  const headersMap = {
    product_id:    t('export.product_id'),
    product_name:  t('export.product_name'),
    sales_count:   t('export.sales_count'),
  };

  // Sheet name for Excel export
  const sheetName = t('export.sheetname');

  // Fixed filters for the API request
  const filters = {
      sort_by: 'sales_count',
      sort_order: 'desc',
      per_page: 100,
      page: 1,
    }
    
  /**
   * Fetch report data and export in the given format.
   * @param type 'csv' or 'xlsx'
   */
  const fetchAndExport = async (type: 'csv' | 'xlsx') => {
    setLoading(true);
    try {
      // 1) Fetch all report entries from the API
      const res = await axios.get<AdminReportsResponse>(
        `${API_BASE_URL}/api/tickets/admin/sales`,
        {
          params: filters,
          headers: {
            Authorization: `Bearer ${token}`,
            'Accept-Language': lang,
          }
        }
      );
      // 2) Trigger the export with the fetched data
      exportData(res.data.data, filename, type, sheetName, headersMap);
      // Notify user of success
      notify(t('reports.success'), 'success');
    } catch (err) {
      // Log the error for debugging
      logError('DownloadAdminReport', err);
      // Notify user of failure
      notify(t('errors.download'), 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardContent>
        {/* Title and description */}
        <Typography variant="h6">{t('reports.download_title')}</Typography>
        <Typography variant="subtitle1" color="text.secondary">
          {t('reports.download_description')}
        </Typography>
      </CardContent>
      <CardActions>
        {/* CSV Download Button */}
        <Button
          startIcon={
            loading ? <CircularProgress size={16} /> : <DownloadIcon />
          }
          variant='outlined'
          onClick={() => fetchAndExport('csv')}
          size="small"
          disabled={loading}
        >
          CSV
        </Button>
        {/* Excel Download Button */}
        <Button
          startIcon={
            loading ? <CircularProgress size={16} /> : <DownloadIcon />
          }
          variant='outlined'
          onClick={() => fetchAndExport('xlsx')}
          size="small"
          disabled={loading}
        >
          Excel
        </Button>
      </CardActions>
    </Card>
  );
}