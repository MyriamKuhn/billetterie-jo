import { Typography } from '@mui/material';
import { PageWrapper } from '../components/PageWrapper';
import { Seo } from '../components/Seo';

export default function HomePage() {
  return (
    <>
      <Seo />
      <PageWrapper>
        <Typography variant="h4" gutterBottom>
          Welcome to the JO Ticketing App!
        </Typography>
        <Typography>
          Ici tu pourras naviguer entre les pages d’accueil, de présentation des produits, 
          la gestion du panier, etc.
        </Typography>
      </PageWrapper>
    </>
  );
}
