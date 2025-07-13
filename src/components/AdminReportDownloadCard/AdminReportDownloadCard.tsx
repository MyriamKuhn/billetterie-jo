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
  filename?: string;
}

export function AdminReportDownloadCard({ filename = 'sales_report' }: AdminReportDownloadCardProps) {
  const { t } = useTranslation('reports');
  const token = useAuthStore((state) => state.authToken);
  const lang = useLanguageStore((state) => state.lang);
  const { notify } = useCustomSnackbar();

  const [loading, setLoading] = useState(false);

  const headersMap = {
    product_id:    t('export.product_id'),
    product_name:  t('export.product_name'),
    sales_count:   t('export.sales_count'),
  };

  const sheetName = t('export.sheetname');

  const filters = {
      sort_by: 'sales_count',
      sort_order: 'desc',
      per_page: 100,
      page: 1,
    }
    
  const fetchAndExport = async (type: 'csv' | 'xlsx') => {
    setLoading(true);
    try {
      // 1) on récupère tout en une seule fois
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
      // 2) on export
      exportData(res.data.data, filename, type, sheetName, headersMap);
      notify(t('reports.success'), 'success');
    } catch (err) {
      logError('DownloadAdminReport', err);
      notify(t('errors.download'), 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6">{t('reports.download_title')}</Typography>
        <Typography variant="subtitle1" color="text.secondary">
          {t('reports.download_description')}
        </Typography>
      </CardContent>
      <CardActions>
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