import Container from '@mui/material/Container';
import Card      from '@mui/material/Card';
import type { PropsWithChildren } from 'react';

interface PageWrapperProps {
  children: React.ReactNode;
  disableCard?: boolean;
}

export function PageWrapper({ children, disableCard = false }: PropsWithChildren<PageWrapperProps>) {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {disableCard ? (
        children
      ) : (
        <Card>
          {children}
        </Card>
      )}
    </Container>
  );
}
