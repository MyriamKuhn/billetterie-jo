import { Typography, Box, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';

export default function UnauthorizedPage() {
  const navigate = useNavigate();
  return (
    <Box sx={{ textAlign: 'center', mt: 8 }}>
      <Typography variant="h4" gutterBottom>
        {`Accès non autorisé`}
      </Typography>
      <Typography variant="body1" sx={{ mb: 2 }}>
        Vous n’avez pas les permissions nécessaires pour accéder à cette page.
      </Typography>
      <Button variant="contained" onClick={() => navigate('/')}>
        Retour à l’accueil
      </Button>
    </Box>
  );
}
