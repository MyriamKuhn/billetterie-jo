import React, { type ReactNode } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import { withTranslation, type WithTranslation } from 'react-i18next';
import { logError } from '../../utils/logger';
import Seo from '../Seo';

interface Props extends WithTranslation {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  reloadKey: number;
}

class ErrorBoundaryInner extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, reloadKey: 0 };
  }

  static getDerivedStateFromError(_: Error): Pick<State, 'hasError'> {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    logError('ErrorBoundary', { error, info });
  }

  handleReload = () => {
    this.setState(({ reloadKey }) => ({
      hasError: false,
      reloadKey: reloadKey + 1,
    }));
  };

  render() {
    const { t, children } = this.props;
    if (this.state.hasError) {
      return (
        <>
          <Seo title={t('errors.seoTitle')} description={t('errors.seoDescription')} />
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
            <Button
              variant="text"
              onClick={() => (window.location.href = '/')}
              sx={{ ml: 2 }}
            >
              {t('errors.home')}
            </Button>
          </Box>
        </>
      );
    }

    // On donne une nouvelle key quand on recharge pour « reset » les enfants
    return React.Children.map(children, (child) =>
      React.isValidElement(child)
        ? React.cloneElement(child, { key: `reload-${this.state.reloadKey}` })
        : child
    );
  }
}

// on wrappe avec withTranslation pour injecter `t`
export const ErrorBoundary = withTranslation()(ErrorBoundaryInner);
export { ErrorBoundaryInner };