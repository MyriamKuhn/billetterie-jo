import React, { type ReactNode } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export default class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState & { reloadKey: number }
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, reloadKey: 0 };
  }

  static getDerivedStateFromError(_: Error): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error', error, info);
  }

  handleReload = () => {
    // remet hasError à false et incrémente reloadKey
    this.setState(({ reloadKey }) => ({
      hasError: false,
      reloadKey: reloadKey + 1
    }));
  };

  render() {
    if (this.state.hasError) {
      return (
        <Box sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h5" gutterBottom>
            Oops… une erreur est survenue
          </Typography>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Nous n'avons pas pu charger la page. Veuillez réessayer.
          </Typography>
          <Button variant="contained" onClick={this.handleReload}>
            Réessayer
          </Button>
        </Box>
      );
    }

    // On clone les children en leur passant un `key` unique
    return React.Children.map(this.props.children, child =>
      React.isValidElement(child)
        ? React.cloneElement(child, { key: `reload-${this.state.reloadKey}` })
        : child
    );
  }
}
