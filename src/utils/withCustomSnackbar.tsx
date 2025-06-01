import type { SnackbarKey, SnackbarMessage, VariantType } from 'notistack';
import { CustomSnackbar } from '../components/CustomSnackbar';

/**
 * Renvoie un callback `content` à passer à `enqueueSnackbar`
 * @param variant le variant Notistack ('default','success','error',…), 
 * @param closeSnackbar la fonction fournie par Notistack
 */
export function withCustomSnackbar(
  variant: VariantType,
  closeSnackbar: (key: SnackbarKey) => void
) {
  return (key: SnackbarKey, message: SnackbarMessage) => {
    const text = typeof message === 'string' ? message : String(message);
    // Mappe 'default' sur 'info'
    const severity = variant === 'default' ? 'info' : variant;
    return (
      <CustomSnackbar
        message={text}
        severity={severity}
        onClose={() => closeSnackbar(key)}
      />
    );
  };
}
