import Container from '@mui/material/Container';
import Card      from '@mui/material/Card';
import type { PropsWithChildren } from 'react';

interface PageWrapperProps {
  children: React.ReactNode;
  disableCard?: boolean;
}

/**
 * Wraps page content in a responsive Container, optionally inside a Card for framed layout.
 * This component is useful for maintaining consistent padding and layout across different pages.
 */
export function PageWrapper({ children, disableCard = false }: PropsWithChildren<PageWrapperProps>) {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {disableCard ? (
        // When disableCard is true, render children directly
        children
      ) : (
        // Otherwise, wrap children in a Card for visual grouping
        <Card>
          {children}
        </Card>
      )}
    </Container>
  );
}
