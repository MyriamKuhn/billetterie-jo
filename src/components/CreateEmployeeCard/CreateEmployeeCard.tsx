import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import { useTranslation } from 'react-i18next';

interface Props {
  onCreate: () => void;
}

export function CreateEmployeeCard({ onCreate }: Props) {
  const { t } = useTranslation('users');
  return (
    <Card sx={{ p:2, minWidth: 240, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          {t('employee.create_new')}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {t('employee.create_intro')}
        </Typography>
      </CardContent>
      <Box sx={{ p:2, pt:0 }}>
        <Button fullWidth variant="contained" onClick={onCreate}>
          {t('employee.create_button')}
        </Button>
      </Box>
    </Card>
  );
}