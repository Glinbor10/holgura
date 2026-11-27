import { dateInMonth, monthOf, monthsInRange } from './dates';
import type { Cents, IsoDate, Month, RecurringExpense } from './types';

export interface PendingRecurring {
  recurringId: string;
  month: Month;
  date: IsoDate;
  amountCents: Cents;
  categoryId: string;
}

export const recurringKey = (recurringId: string, month: Month): string => `${recurringId}|${month}`;

/** Expenses that should exist by `today` but have not been generated yet. */
export const pendingRecurringExpenses = (
  recurring: RecurringExpense[],
  generated: Set<string>,
  today: IsoDate,
): PendingRecurring[] =>
  recurring
    .filter((item) => item.active)
    .flatMap((item) =>
      monthsInRange(item.startMonth, monthOf(today))
        .map((month) => ({ item, month, date: dateInMonth(month, item.dayOfMonth) }))
        .filter(({ item: { id }, month, date }) => date <= today && !generated.has(recurringKey(id, month))),
    )
    .map(({ item, month, date }) => ({
      recurringId: item.id,
      month,
      date,
      amountCents: item.amountCents,
      categoryId: item.categoryId,
    }));
