import { Typography, Box, Divider } from '@mui/material';
import { PageWrapper } from '../components/PageWrapper';
import Seo from '../components/Seo';

const lorem = `
Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus lacinia odio vitae vestibulum vestibulum. 
Cras venenatis euismod malesuada. Nullam ac erat ante. Sed vehicula mauris sit amet neque ultricies, 
a interdum tortor scelerisque. Integer pretium posuere felis, vitae tristique lacus blandit at.
`;

export default function HomePage() {
  return (
    <>
      <Seo />
      <PageWrapper>
        <Typography variant="h4" gutterBottom>
          Welcome to the JO Ticketing App!
        </Typography>
        <Typography paragraph>
          Ici tu pourras naviguer entre les pages d’accueil, de présentation des produits, 
          la gestion du panier, etc.
        </Typography>

        {/* Sections de test pour scroll */}
        {[...Array(10)].map((_, idx) => (
          <Box key={idx} mb={4}>
            <Typography variant="h5" gutterBottom>
              Section de test #{idx + 1}
            </Typography>
            <Typography paragraph>
              {lorem}
            </Typography>
            <Divider />
          </Box>
        ))}
      </PageWrapper>
    </>
  );
}

