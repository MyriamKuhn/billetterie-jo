/**
 * Logs an error message and stack trace, only in development.
 * In production, this could be extended to send errors to a remote logging service
 * if VITE_SENTRY_DSN is configured.
 *
 * @param context  A short identifier for where the error occurred (e.g. function or module name).
 * @param err      The error object or value to log.
 */
export function logError(context: string, err: unknown) {
  if (import.meta.env.MODE === 'development') {
    console.error(`[${context}]`, err);
  } else {
    // TODO: send error to server if VITE_SENTRY_DSN is defined
  }
}

/**
 * Logs a warning message, only in development.
 * In production, this could be extended to send warnings to a remote monitoring service.
 *
 * @param context  A short identifier for where the warning occurred.
 * @param warn     The warning object or value to log.
 */
export function logWarn(context: string, warn: unknown) {
  if (import.meta.env.MODE === 'development') {
    console.warn(`[${context}]`, warn);
  } else {
    // TODO: send error to server if VITE_SENTRY_DSN is defined
  }
}

/**
 * Logs an informational message, only in development.
 * In production, this could be extended to send info-level logs to a monitoring backend.
 *
 * @param context  A short identifier for where the info was generated.
 * @param info     The informational object or value to log.
 */
export function logInfo(context: string, info: unknown) {
  if (import.meta.env.MODE === 'development') {
    console.log(`[${context}]`, info);
  } else {
    // TODO: send error to server if VITE_SENTRY_DSN is defined
  }
}