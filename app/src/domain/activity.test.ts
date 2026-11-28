import { describe, expect, it } from 'vitest';
import { firstTransactionDate, latestTransactions } from './activity';
import type { Transaction } from './types';

const tx = (id: string, date: string): Transaction => ({ id, type: 'EXPENSE', date, amountCents: 100 });

describe('firstTransactionDate', () => {
  it('is the oldest date, whatever the order', () => {
    expect(firstTransactionDate([tx('a', '2026-03-10'), tx('b', '2025-12-31'), tx('c', '2026-01-02')])).toBe('2025-12-31');
  });

  it('is undefined when there are no movements', () => {
    expect(firstTransactionDate([])).toBeUndefined();
  });
});

describe('latestTransactions', () => {
  const all = [tx('a', '2026-03-10'), tx('b', '2026-03-12'), tx('c', '2026-01-02'), tx('d', '2026-03-11'), tx('e', '2025-12-31')];

  it('returns the newest ones first, without needing the whole list sorted', () => {
    expect(latestTransactions(all, 3).map((t) => t.id)).toEqual(['b', 'd', 'a']);
  });

  it('returns everything, newest first, when there are fewer than asked', () => {
    expect(latestTransactions(all, 10).map((t) => t.id)).toEqual(['b', 'd', 'a', 'c', 'e']);
  });

  it('keeps the original order between movements of the same day', () => {
    const sameDay = [tx('first', '2026-03-10'), tx('second', '2026-03-10'), tx('older', '2026-03-01')];
    expect(latestTransactions(sameDay, 2).map((t) => t.id)).toEqual(['first', 'second']);
  });
});
