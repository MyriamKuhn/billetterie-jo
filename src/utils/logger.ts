export function logError(context: string, err: unknown) {
  if (import.meta.env.MODE === 'development') {
    console.error(`[${context}]`, err);
  } else {
    // plus tard : envoi au server si VITE_SENTRY_DSN est défini
  }
}

export function logWarn(context: string, warn: unknown) {
  if (import.meta.env.MODE === 'development') {
    console.warn(`[${context}]`, warn);
  } else {
    // plus tard : envoi au server si VITE_SENTRY_DSN est défini
  }
}

export function logInfo(context: string, info: unknown) {
  if (import.meta.env.MODE === 'development') {
    console.log(`[${context}]`, info);
  } else {
    // plus tard : envoi au server si VITE_SENTRY_DSN est défini
  }
}