import type { SnackbarKey, SnackbarMessage, VariantType } from 'notistack';
import { CustomSnackbar } from '../components/CustomSnackbar';

/**
 * Returns a `content` callback to pass to `enqueueSnackbar`, rendering our custom Snackbar component.
 *
 * @param variant         The Notistack variant ('default', 'success', 'error', etc.).
 * @param closeSnackbar   The function provided by Notistack to close a snackbar by its key.
 * @returns               A function that Notistack will call with (key, message) to render the snackbar content.
 */
export function withCustomSnackbar(
  variant: VariantType,
  closeSnackbar: (key: SnackbarKey) => void
) {
  return (key: SnackbarKey, message: SnackbarMessage) => {
    // Ensure the message is a string
    const text = typeof message === 'string' ? message : String(message);
    // Map the 'default' variant to an 'info' severity for our custom component
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
