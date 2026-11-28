import type { IsoDate, Transaction } from './types';

/** Date of the oldest movement. ISO dates compare correctly as plain strings, so no sorting is needed. */
export const firstTransactionDate = (transactions: Transaction[]): IsoDate | undefined =>
  transactions.reduce<IsoDate | undefined>((first, tx) => (first === undefined || tx.date < first ? tx.date : first), undefined);

/** The `count` newest movements, newest first, in one pass. Movements of the same day keep their order. */
export const latestTransactions = (transactions: Transaction[], count: number): Transaction[] => {
  const newest: Transaction[] = [];
  for (const tx of transactions) {
    if (newest.length < count || tx.date > newest[newest.length - 1].date) {
      let position = newest.length;
      while (position > 0 && newest[position - 1].date < tx.date) {
        position -= 1;
      }
      newest.splice(position, 0, tx);
      if (newest.length > count) {
        newest.pop();
      }
    }
  }
  return newest;
};
