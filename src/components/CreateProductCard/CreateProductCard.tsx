import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import { useTranslation } from 'react-i18next';

interface Props {
  onCreate: () => void;
}

/**
 * 
 * This component displays a card prompting admins to create a new product, with localized title, description, and action button.
 * It is designed to be used in an admin interface for managing products.
 * 
 */
export function CreateProductCard({ onCreate }: Props) {
  const { t } = useTranslation('adminProducts');
  return (
    <Card sx={{ p:2, minWidth: 240, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      {/* CardContent holds the heading and introductory text */}
      <CardContent>
        <Typography variant="h6" gutterBottom>
          {t('products.create_new')}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {t('products.create_intro')}
        </Typography>
      </CardContent>

      {/* Box wraps the button, with padding and no top padding to separate from content */}
      <Box sx={{ p:2, pt:0 }}>
        <Button fullWidth variant="contained" onClick={onCreate}>
          {t('products.create_button')}
        </Button>
      </Box>
    </Card>
  );
}
