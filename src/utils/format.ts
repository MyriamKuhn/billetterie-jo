export function formatCurrency(value: number, locale = 'en', currency = 'EUR') {
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(value);
}

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

export function formatTime(
  isoDate?: string,
  locale = 'en',
  options: Intl.DateTimeFormatOptions = { hour: 'numeric', minute: 'numeric' }
) {
  if (!isoDate) return '';
  const d = new Date(isoDate);
  if (isNaN(d.getTime())) return '';
  let formatted = new Intl.DateTimeFormat(locale, options).format(d);
  // French locale: replace ':' with 'h' e.g. '14h30'
  if (locale.startsWith('fr')) {
    formatted = formatted.replace(/^(\d{1,2}):(\d{2})$/, '$1h$2');
  }
  // German locale: append ' Uhr' e.g. '14:30 Uhr'
  else if (locale.startsWith('de')) {
    formatted = formatted + ' Uhr';
  }
  return formatted;
}