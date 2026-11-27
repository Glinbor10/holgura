import { destinationBalance } from './balances';
import { monthOf, monthsInRange } from './dates';
import type { Cents, Destination, Month, Transaction } from './types';

/** Net money that entered savings destinations during a month. */
export const monthlySavings = (month: Month, destinations: Destination[], transactions: Transaction[]): Cents => {
  const savingsIds = new Set(destinations.filter((d) => d.kind === 'SAVINGS').map((d) => d.id));
  return transactions
    .filter((tx) => monthOf(tx.date) === month)
    .reduce((sum, tx) => {
      if (tx.type === 'INCOME') {
        const received = (tx.allocations ?? [])
          .filter((allocation) => savingsIds.has(allocation.destinationId))
          .reduce((total, allocation) => total + allocation.amountCents, 0);
        return sum + received;
      }
      if (tx.type === 'TRANSFER') {
        const into = savingsIds.has(tx.toDestinationId ?? '') ? tx.amountCents : 0;
        const out = savingsIds.has(tx.fromDestinationId ?? '') ? tx.amountCents : 0;
        return sum + into - out;
      }
      return sum;
    }, 0);
};

export const accumulatedSavings = (destinations: Destination[], transactions: Transaction[]): Cents =>
  destinations
    .filter((d) => d.kind === 'SAVINGS')
    .reduce((sum, d) => sum + destinationBalance(d, transactions), 0);

export const savingsHistory = (
  firstMonth: Month,
  currentMonth: Month,
  destinations: Destination[],
  transactions: Transaction[],
): { month: Month; savingsCents: Cents }[] =>
  monthsInRange(firstMonth, currentMonth).map((month) => ({
    month,
    savingsCents: monthlySavings(month, destinations, transactions),
  }));
