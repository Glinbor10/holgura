import { monthOf, prevMonth } from './dates';
import type { Cents, Destination, Month, MonthClosing, Transaction } from './types';

/** Running balance of a destination; it never resets between months. */
export const destinationBalance = (destination: Destination, transactions: Transaction[]): Cents =>
  transactions.reduce((balance, tx) => {
    if (tx.type === 'INCOME') {
      const received = (tx.allocations ?? [])
        .filter((allocation) => allocation.destinationId === destination.id)
        .reduce((sum, allocation) => sum + allocation.amountCents, 0);
      return balance + received;
    }
    if (tx.type === 'EXPENSE') {
      return destination.kind === 'SPENDING' ? balance - tx.amountCents : balance;
    }
    const into = tx.toDestinationId === destination.id ? tx.amountCents : 0;
    const out = tx.fromDestinationId === destination.id ? tx.amountCents : 0;
    return balance + into - out;
  }, destination.initialCents);

export const carryIn = (month: Month, closings: MonthClosing[]): Cents =>
  closings.find((closing) => closing.month === prevMonth(month))?.carryOutCents ?? 0;

/** Budget for a month: carry-in plus the spending part of the incomes that fund it. */
export const allowance = (
  month: Month,
  destinations: Destination[],
  transactions: Transaction[],
  closings: MonthClosing[],
): Cents => {
  const spendingIds = new Set(destinations.filter((d) => d.kind === 'SPENDING').map((d) => d.id));
  const funded = transactions
    .filter((tx) => tx.type === 'INCOME' && (tx.fundsMonth ?? monthOf(tx.date)) === month)
    .flatMap((tx) => tx.allocations ?? [])
    .filter((allocation) => spendingIds.has(allocation.destinationId))
    .reduce((sum, allocation) => sum + allocation.amountCents, 0);
  return carryIn(month, closings) + funded;
};

/** What is left to spend in a month. Transfers do not count. */
export const available = (
  month: Month,
  destinations: Destination[],
  transactions: Transaction[],
  closings: MonthClosing[],
): Cents => {
  const spent = transactions
    .filter((tx) => tx.type === 'EXPENSE' && monthOf(tx.date) === month)
    .reduce((sum, tx) => sum + tx.amountCents, 0);
  return allowance(month, destinations, transactions, closings) - spent;
};
