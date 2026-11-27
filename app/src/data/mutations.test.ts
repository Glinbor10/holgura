import { describe, expect, it } from 'vitest';
import { SAVINGS_ID, SPENDING_ID, createInitialData } from './appData';
import {
  addDestination,
  addExpense,
  addIncome,
  archiveDestination,
  closeMonth,
  deleteTransaction,
  generateRecurring,
  reopenMonth,
  setPayrollLine,
} from './mutations';
import { available, destinationBalance } from '../domain/balances';

const seed = () =>
  addIncome(createInitialData(), {
    date: '2026-10-28',
    allocations: [{ destinationId: SPENDING_ID, amountCents: 100000 }],
    fundsMonth: '2026-11',
  });

// The first month with activity (October) must be closed before November, as the spec requires.
const closeOctober = (data: ReturnType<typeof seed>) => closeMonth(data, '2026-10', 'CARRY', '2026-11-02');

describe('closing a month', () => {
  it('moves a surplus to savings and reopening undoes it', () => {
    const data = addExpense(seed(), { date: '2026-11-10', amountCents: 91500, categoryId: 'cat-casa' });
    const closed = closeMonth(closeOctober(data), '2026-11', 'TO_SAVINGS', '2026-12-02');
    const savings = closed.destinations.find((d) => d.id === SAVINGS_ID)!;
    expect(destinationBalance(savings, closed.transactions)).toBe(8500);
    expect(closed.closings.map((c) => c.month)).toEqual(['2026-10', '2026-11']);

    const reopened = reopenMonth(closed, '2026-11');
    expect(destinationBalance(savings, reopened.transactions)).toBe(0);
    expect(reopened.closings.map((c) => c.month)).toEqual(['2026-10']);
  });

  it('carries the surplus into the next month', () => {
    const data = addExpense(seed(), { date: '2026-11-10', amountCents: 91500, categoryId: 'cat-casa' });
    const closed = closeMonth(closeOctober(data), '2026-11', 'CARRY', '2026-12-02');
    expect(available('2026-12', closed.destinations, closed.transactions, closed.closings)).toBe(8500);
  });

  it('refuses to close a month that has not ended', () => {
    expect(() => closeMonth(closeOctober(seed()), '2026-11', 'CARRY', '2026-11-15')).toThrow();
  });

  it('locks the movements of a closed month', () => {
    const data = addExpense(seed(), { date: '2026-11-10', amountCents: 500, categoryId: 'cat-casa' });
    const closed = closeMonth(closeOctober(data), '2026-11', 'CARRY', '2026-12-02');
    const expenseId = closed.transactions.find((tx) => tx.type === 'EXPENSE')!.id;
    expect(() => deleteTransaction(closed, expenseId)).toThrow();
    expect(() => addExpense(closed, { date: '2026-11-20', amountCents: 100, categoryId: 'cat-casa' })).toThrow();
  });

  it('refuses to reopen a month that is not the last closed one', () => {
    const closed = closeMonth(closeOctober(seed()), '2026-11', 'CARRY', '2026-12-02');
    expect(() => reopenMonth(closed, '2026-10')).toThrow();
  });
});

describe('recurring expenses', () => {
  const withRent = () => ({
    ...createInitialData(),
    recurring: [
      {
        id: 'rent',
        name: 'Rent',
        amountCents: 60000,
        categoryId: 'cat-casa',
        dayOfMonth: 5,
        active: true,
        startMonth: '2026-10',
      },
    ],
  });

  it('creates the missing expenses once, even when run twice', () => {
    const once = generateRecurring(withRent(), '2026-12-10');
    const twice = generateRecurring(once, '2026-12-10');
    expect(twice.transactions.map((tx) => tx.date)).toEqual(['2026-10-05', '2026-11-05', '2026-12-05']);
  });

  it('does not bring back a generated expense the user deleted', () => {
    const generated = generateRecurring(withRent(), '2026-12-10');
    const november = generated.transactions.find((tx) => tx.date === '2026-11-05')!;
    const deleted = deleteTransaction(generated, november.id);
    const reloaded = generateRecurring(deleted, '2026-12-10');
    expect(reloaded.transactions.map((tx) => tx.date)).toEqual(['2026-10-05', '2026-12-05']);
  });

  it('still generates the next month after deleting one occurrence', () => {
    const generated = generateRecurring(withRent(), '2026-11-10');
    const october = generated.transactions.find((tx) => tx.date === '2026-10-05')!;
    const later = generateRecurring(deleteTransaction(generated, october.id), '2026-12-10');
    expect(later.transactions.map((tx) => tx.date)).toEqual(['2026-11-05', '2026-12-05']);
  });
});

describe('destinations', () => {
  it('rejects a second spending destination', () => {
    expect(() => addDestination(createInitialData(), { name: 'Other', kind: 'SPENDING' })).toThrow();
  });

  it('rejects archiving a destination with balance', () => {
    const data = addIncome(createInitialData(), {
      date: '2026-11-03',
      allocations: [{ destinationId: SAVINGS_ID, amountCents: 5000 }],
      fundsMonth: '2026-11',
    });
    expect(() => archiveDestination(data, SAVINGS_ID)).toThrow();
  });
});

describe('payroll amount per destination', () => {
  it('sets, replaces and clears the amount a destination gets from each payroll', () => {
    const base = createInitialData();
    const set = setPayrollLine(base, SAVINGS_ID, 30000);
    expect(set.payrollTemplate.lines).toEqual([{ destinationId: SAVINGS_ID, amountCents: 30000 }]);
    const replaced = setPayrollLine(set, SAVINGS_ID, 45000);
    expect(replaced.payrollTemplate.lines).toEqual([{ destinationId: SAVINGS_ID, amountCents: 45000 }]);
    expect(setPayrollLine(replaced, SAVINGS_ID, 0).payrollTemplate.lines).toEqual([]);
  });

  it('refuses to set a fixed amount on the spending destination, which gets the rest', () => {
    expect(() => setPayrollLine(createInitialData(), SPENDING_ID, 1000)).toThrow('SPENDING_GETS_THE_REST');
  });
});
