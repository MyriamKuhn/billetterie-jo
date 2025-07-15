/**
 * Formats a number as a localized currency string.
 *
 * @param value    The numeric value to format.
 * @param locale   A BCP 47 language tag, e.g. 'en', 'fr', 'de'. Defaults to 'en'.
 * @param currency ISO 4217 currency code, e.g. 'EUR', 'USD'. Defaults to 'EUR'.
 * @returns        The formatted currency string.
 */
export function formatCurrency(value: number, locale = 'en', currency = 'EUR') {
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(value);
}

/**
 * Formats an ISO‑8601 date string as a localized date.
 *
 * @param isoDate  The ISO date string to format (e.g. '2025-07-15T12:34:56Z').
 * @param locale   A BCP 47 language tag. Defaults to 'en'.
 * @param options  Intl.DateTimeFormatOptions for customizing the output.
 *                 Defaults to { day: 'numeric', month: 'long', year: 'numeric' }.
 * @returns        The formatted date, or an empty string if input is invalid.
 */
export function formatDate(
  isoDate?: string,
  locale = 'en',
  options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' }
) {
  if (!isoDate) return '';
  const d = new Date(isoDate);
  if (isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat(locale, options).format(d);
}

/**
 * Formats an ISO‑8601 date string as a localized time.
 * Applies locale-specific tweaks:
 *  - French: replaces ':' with 'h' (e.g. '14h30')
 *  - German: appends ' Uhr' (e.g. '14:30 Uhr')
 *
 * @param isoDate  The ISO date string to format.
 * @param locale   A BCP 47 language tag. Defaults to 'en'.
 * @param options  Intl.DateTimeFormatOptions for customizing the time.
 *                 Defaults to { hour: 'numeric', minute: 'numeric' }.
 * @returns        The formatted time, or an empty string if input is invalid.
 */
export function formatTime(
  isoDate?: string,
  locale = 'en',
  options: Intl.DateTimeFormatOptions = { hour: 'numeric', minute: 'numeric' }
) {
  if (!isoDate) return '';
  const d = new Date(isoDate);
  if (isNaN(d.getTime())) return '';
  let formatted = new Intl.DateTimeFormat(locale, options).format(d);
  // French style: '14h30'
  if (locale.startsWith('fr')) {
    formatted = formatted.replace(/^(\d{1,2}):(\d{2})$/, '$1h$2');
  }
  // German style: append ' Uhr'
  else if (locale.startsWith('de')) {
    formatted = formatted + ' Uhr';
  }
  return formatted;
}