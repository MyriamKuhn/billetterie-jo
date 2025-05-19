import { Card, Container } from '@mui/material';
import type { PropsWithChildren } from 'react';

interface PageWrapperProps {
  children: React.ReactNode;
}

export function PageWrapper({ children }: PropsWithChildren<PageWrapperProps>) {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Card>
        {children}
      </Card>
    </Container>
  );
}
