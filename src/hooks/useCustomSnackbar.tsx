import { useSnackbar, type VariantType, type SnackbarMessage } from 'notistack';
import { withCustomSnackbar } from '../utils/withCustomSnackbar';
import { useCallback } from 'react';

/**
 * Custom hook wrapping notistack's useSnackbar to provide
 * a simplified `notify` API with preconfigured variants
 * and auto-hide durations.
 *
 * Uses a custom content renderer via withCustomSnackbar
 * to display messages according to the app's design.
 *
 * @returns An object containing:
 *   - notify: function to enqueue a snackbar notification.
 */
export function useCustomSnackbar() {
  // Get enqueue and close functions from notistack
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();

  /**
   * Enqueue a snackbar notification with custom content.
   *
   * @param message             The message to display; can be a string or React node.
   * @param variant             The notification variant (e.g., 'success', 'error', 'warning', 'info').
   *                             Defaults to 'default'.
   * @param autoHideDuration    How long (in ms) before the snackbar auto-hides. Defaults to 3000 ms.
   */
  const notify = useCallback(
    (
      message: SnackbarMessage,
      variant: VariantType = 'default',
      autoHideDuration = 3000
    ) => {
      enqueueSnackbar(message, {
        variant,
        autoHideDuration,
        // Use a custom content renderer for consistent styling and actions
        content: withCustomSnackbar(variant, closeSnackbar)
      });
    },
    [enqueueSnackbar, closeSnackbar]
  );

  return { notify };
}