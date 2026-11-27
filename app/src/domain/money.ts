import type { Cents } from './types';

const AMOUNT_PATTERN = /^(\d+)(?:[.,](\d{1,2}))?$/;

/** Parses a user-typed euro amount ("12,50", "12.5", "12") into cents. Null if invalid or not positive. */
export const parseEuros = (input: string): Cents | null => {
  const match = AMOUNT_PATTERN.exec(input.trim());
  if (!match) {
    return null;
  }
  const cents = Number(match[1]) * 100 + Number((match[2] ?? '').padEnd(2, '0'));
  return cents > 0 ? cents : null;
};

const euroFormat = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', useGrouping: 'always' });

export const formatEuros = (cents: Cents): string => euroFormat.format(cents / 100);

/** Cents as editable input text ("12,50"); empty for zero. */
export const centsToInput = (cents: Cents): string => (cents === 0 ? '' : (cents / 100).toFixed(2).replace('.', ','));
