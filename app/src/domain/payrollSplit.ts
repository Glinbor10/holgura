import { monthOf, nextMonth } from './dates';
import type { Allocation, Cents, IsoDate, Month, PayrollTemplate } from './types';

export type SplitResult = { ok: true; allocations: Allocation[] } | { ok: false; error: 'FIXED_LINES_EXCEED_AMOUNT' };

/** Applies the template to a payroll: fixed lines first, the rest to the remainder destination. */
export const applyTemplate = (amountCents: Cents, template: PayrollTemplate): SplitResult => {
  const fixed = template.lines.reduce((sum, line) => sum + line.amountCents, 0);
  if (fixed > amountCents) {
    return { ok: false, error: 'FIXED_LINES_EXCEED_AMOUNT' };
  }
  const lines = [...template.lines, { destinationId: template.remainderDestinationId, amountCents: amountCents - fixed }];
  const merged = new Map<string, Cents>();
  for (const line of lines) {
    merged.set(line.destinationId, (merged.get(line.destinationId) ?? 0) + line.amountCents);
  }
  const allocations = [...merged].map(([destinationId, cents]) => ({ destinationId, amountCents: cents }));
  return { ok: true, allocations: allocations.filter((allocation) => allocation.amountCents > 0) };
};

export const defaultFundsMonth = (date: IsoDate, fundsNextMonth: boolean): Month =>
  fundsNextMonth ? nextMonth(monthOf(date)) : monthOf(date);
