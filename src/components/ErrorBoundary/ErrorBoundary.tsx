import React, { type ReactNode } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import { withTranslation, type WithTranslation } from 'react-i18next';
import { logError } from '../../utils/logger';
import Seo from '../Seo';
import { PageWrapper } from '../PageWrapper';

interface Props extends WithTranslation {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  reloadKey: number;
}

/**
 * ErrorBoundary is a React component that catches JavaScript errors in its child component tree,
 * logs those errors, and displays a fallback UI with options to retry or go back to the home page.
 * It uses the `withTranslation` HOC to provide translation capabilities.
 * It also includes SEO metadata for better search engine indexing.
 */
class ErrorBoundaryInner extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    // Initialize state: no error yet, reloadKey = 0
    this.state = { hasError: false, reloadKey: 0 };
  }

  // React lifecycle: if an error is thrown in children, set hasError=true
  static getDerivedStateFromError(_: Error): Pick<State, 'hasError'> {
    return { hasError: true };
  }

  // React lifecycle: log the error details for debugging/monitoring
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    logError('ErrorBoundary', { error, info });
  }

  // Handler for the "Retry" button: clear error and increment reloadKey
  handleReload = () => {
    this.setState(({ reloadKey }) => ({
      hasError: false,
      reloadKey: reloadKey + 1,
    }));
  };

  render() {
    const { t, children } = this.props;
    // If an error occurred, render the fallback UI
    if (this.state.hasError) {
      return (
        <>
          {/* SEO tags for the error page */}
          <Seo title={t('errors.seoTitle')} description={t('errors.seoDescription')} />
          {/* Layout wrapper */}
          <PageWrapper>
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="h4" gutterBottom>
                {t('errors.title')}
              </Typography>
              <Typography variant="h5" sx={{ mb: 2 }}>
                {t('errors.unexpected')}
              </Typography>
              <Button variant="contained" onClick={this.handleReload}>
                {t('errors.retry')}
              </Button>
              {/* Home button: navigate to root */}
              <Button
                variant="text"
                onClick={() => (window.location.href = '/')}
                sx={{ ml: 2 }}
              >
                {t('errors.home')}
              </Button>
            </Box>
          </PageWrapper>
        </>
      );
    }

    // No error: clone children with a key based on reloadKey so that
    // when reloadKey increments, they remount from scratch
    return React.Children.map(children, (child) =>
      React.isValidElement(child)
        ? React.cloneElement(child, { key: `reload-${this.state.reloadKey}` })
        : child
    );
  }
}

// Wrap withTranslation HOC to inject the `t` function as a prop
export const ErrorBoundary = withTranslation()(ErrorBoundaryInner);
export { ErrorBoundaryInner };