import { useSnackbar, type VariantType, type SnackbarMessage } from 'notistack';
import { withCustomSnackbar } from '../utils/withCustomSnackbar';
import { useCallback } from 'react';

export function useCustomSnackbar() {
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();

  const notify = useCallback(
    (
      message: SnackbarMessage,
      variant: VariantType = 'default',
      autoHideDuration = 3000
    ) => {
      enqueueSnackbar(message, {
        variant,
        autoHideDuration,
        content: withCustomSnackbar(variant, closeSnackbar)
      });
    },
    [enqueueSnackbar, closeSnackbar]
  );

  return { notify };
}