import { describe, it, expect } from 'vitest';
import { formatCurrency, formatDate } from './format';

// Tests for formatCurrency
// Covers default behavior, various locales, negative, zero, fractions, large numbers, and special grouping rules

describe('formatCurrency', () => {
  it('formats number with default locale and currency', () => {
    const value = 1234.56;
    const expected = new Intl.NumberFormat('en', { style: 'currency', currency: 'EUR' }).format(value);
    expect(formatCurrency(value)).toBe(expected);
  });

  it('formats USD in en-US locale', () => {
    const value = 1234.56;
    const expected = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
    expect(formatCurrency(value, 'en-US', 'USD')).toBe(expected);
  });

  it('formats EUR in fr-FR locale', () => {
    const value = 1234.56;
    const expected = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value);
    expect(formatCurrency(value, 'fr-FR', 'EUR')).toBe(expected);
  });

  it('formats EUR in de-DE locale', () => {
    const value = 1234.56;
    const expected = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(value);
    expect(formatCurrency(value, 'de-DE', 'EUR')).toBe(expected);
  });

  it('formats JPY in ja-JP locale (no decimals)', () => {
    const value = 1234.56;
    const expected = new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }).format(value);
    expect(formatCurrency(value, 'ja-JP', 'JPY')).toBe(expected);
  });

  it('formats negative values correctly', () => {
    const value = -50.75;
    const expected = new Intl.NumberFormat('en', { style: 'currency', currency: 'EUR' }).format(value);
    expect(formatCurrency(value)).toBe(expected);
  });

  it('formats zero value', () => {
    const value = 0;
    const expected = new Intl.NumberFormat('en', { style: 'currency', currency: 'EUR' }).format(value);
    expect(formatCurrency(value)).toBe(expected);
  });

  it('formats fraction less than 1', () => {
    const value = 0.5;
    const expected = new Intl.NumberFormat('en', { style: 'currency', currency: 'EUR' }).format(value);
    expect(formatCurrency(value)).toBe(expected);
  });

  it('formats large values with proper grouping', () => {
    const value = 1_000_000_000;
    const expected = new Intl.NumberFormat('en', { style: 'currency', currency: 'EUR' }).format(value);
    expect(formatCurrency(value)).toBe(expected);
  });

  it('formats in hi-IN locale with lakhs and crores grouping', () => {
    const value = 12_345_678.9;
    const expected = new Intl.NumberFormat('hi-IN', { style: 'currency', currency: 'INR' }).format(value);
    expect(formatCurrency(value, 'hi-IN', 'INR')).toBe(expected);
  });
});

// Tests for formatDate
// Covers undefined, invalid, default options, various locales, timezone offsets, and custom date-time options

describe('formatDate', () => {
  it('returns empty string for undefined input', () => {
    expect(formatDate()).toBe('');
  });

  it('returns empty string for invalid date string', () => {
    expect(formatDate('invalid-date')).toBe('');
  });

  it('formats date with default locale and options', () => {
    const iso = '2025-07-14T00:00:00Z';
    const expected = new Intl.DateTimeFormat('en', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(iso));
    expect(formatDate(iso)).toBe(expected);
  });

  it('formats date in fr-FR locale', () => {
    const iso = '2025-12-25T00:00:00Z';
    const expected = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(iso));
    expect(formatDate(iso, 'fr-FR')).toBe(expected);
  });

  it('formats date in de-DE locale', () => {
    const iso = '2021-03-15T00:00:00Z';
    const expected = new Intl.DateTimeFormat('de-DE', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(iso));
    expect(formatDate(iso, 'de-DE')).toBe(expected);
  });

  it('handles timezone offsets correctly', () => {
    const isoOffset = '2025-07-14T02:30:00+05:30';
    const expected = new Intl.DateTimeFormat('en-CA', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(isoOffset));
    expect(formatDate(isoOffset, 'en-CA')).toBe(expected);
  });

  it('applies custom date-time format options including time', () => {
    const iso = '2025-01-02T15:45:00Z';
    const options = { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' } as const;
    const expected = new Intl.DateTimeFormat('en-US', options).format(new Date(iso));
    expect(formatDate(iso, 'en-US', options)).toBe(expected);
  });

  it('formats UTC midnight correctly in en-GB locale', () => {
    const iso = '2020-01-01T00:00:00Z';
    const expected = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(iso));
    expect(formatDate(iso, 'en-GB')).toBe(expected);
  });

  it('formats with weekday and short month', () => {
    const iso = '2025-12-25T10:00:00Z';
    const options = { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' } as const;
    const expected = new Intl.DateTimeFormat('en-US', options).format(new Date(iso));
    expect(formatDate(iso, 'en-US', options)).toBe(expected);
  });
});

import { formatTime } from './format';

describe('formatTime', () => {
  it('returns empty string for undefined input', () => {
    expect(formatTime()).toBe('');
  });

  it('returns empty string for invalid date string', () => {
    expect(formatTime('not-a-date')).toBe('');
  });

  it('formats time with default locale (en) and default options', () => {
    const iso = '2025-07-14T14:30:00Z';
    // on en, Intl.DateTimeFormat('en', options).format
    const expected = new Intl.DateTimeFormat('en', { hour: 'numeric', minute: 'numeric' }).format(new Date(iso));
    expect(formatTime(iso)).toBe(expected);
  });

  it('formats time in fr-FR locale, replacing ":" with "h"', () => {
    const iso = '2025-07-14T14:30:00Z';
    const raw = new Intl.DateTimeFormat('fr-FR', { hour: 'numeric', minute: 'numeric' }).format(new Date(iso));
    const expected = raw.replace(/^(\d{1,2}):(\d{2})$/, '$1h$2');
    expect(formatTime(iso, 'fr-FR')).toBe(expected);
  });

  it('formats time in de-DE locale, appending " Uhr"', () => {
    const iso = '2025-07-14T14:30:00Z';
    const raw = new Intl.DateTimeFormat('de-DE', { hour: 'numeric', minute: 'numeric' }).format(new Date(iso));
    const expected = `${raw} Uhr`;
    expect(formatTime(iso, 'de-DE')).toBe(expected);
  });

  it('applies custom time format options (including seconds)', () => {
    const iso = '2025-07-14T14:30:45Z';
    const options = { hour: '2-digit', minute: '2-digit', second: '2-digit' } as const;
    const expected = new Intl.DateTimeFormat('en-US', options).format(new Date(iso));
    expect(formatTime(iso, 'en-US', options)).toBe(expected);
  });

  it('uses locale correctly when hour is single digit (e.g. 9:05)', () => {
    const iso = '2025-07-14T09:05:00Z';
    // UTC 09:05 → local 11:05 (CEST)
    const rawEn = new Intl.DateTimeFormat('en', { hour: 'numeric', minute: 'numeric' }).format(new Date(iso));
    expect(formatTime(iso)).toBe(rawEn);

    const rawFr = new Intl.DateTimeFormat('fr-FR', { hour: 'numeric', minute: 'numeric' }).format(new Date(iso));
    const expectedFr = rawFr.replace(/^(\d{1,2}):(\d{2})$/, '$1h$2');
    expect(formatTime(iso, 'fr-FR')).toBe(expectedFr);
  });
});


