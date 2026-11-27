import { lastDayOfMonth, monthOf } from './dates';
import type { Cents, IsoDate, Month, Transaction } from './types';

/** Expenses per day of the month; index 0 is day 1. */
export const dailySpending = (month: Month, transactions: Transaction[]): Cents[] => {
  const days: Cents[] = Array(Number(lastDayOfMonth(month).slice(8))).fill(0);
  for (const tx of transactions) {
    if (tx.type === 'EXPENSE' && monthOf(tx.date) === month) {
      days[Number(tx.date.slice(8)) - 1] += tx.amountCents;
    }
  }
  return days;
};

/** Days left in the month, counting today. */
export const daysLeftInMonth = (today: IsoDate): number =>
  Number(lastDayOfMonth(monthOf(today)).slice(8)) - Number(today.slice(8)) + 1;

/** How much can be spent each remaining day to finish the month at zero. */
export const dailyPace = (leftCents: Cents, today: IsoDate): Cents =>
  leftCents > 0 ? Math.floor(leftCents / daysLeftInMonth(today)) : 0;

/** Money still available at the end of each day of the month, starting from the month allowance. */
export const availableByDay = (month: Month, allowanceCents: Cents, transactions: Transaction[]): Cents[] => {
  let left = allowanceCents;
  return dailySpending(month, transactions).map((spent) => (left -= spent));
};

/** Expenses of the month grouped by category, biggest first. */
export const spendingByCategory = (
  month: Month,
  transactions: Transaction[],
): { categoryId: string; cents: Cents }[] => {
  const totals = new Map<string, Cents>();
  for (const tx of transactions) {
    if (tx.type === 'EXPENSE' && monthOf(tx.date) === month) {
      const key = tx.categoryId ?? '';
      totals.set(key, (totals.get(key) ?? 0) + tx.amountCents);
    }
  }
  return [...totals].map(([categoryId, cents]) => ({ categoryId, cents })).sort((a, b) => b.cents - a.cents);
};
