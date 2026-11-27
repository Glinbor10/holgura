import { describe, expect, it } from 'vitest';
import { accumulatedSavings, monthlySavings, savingsHistory } from './savings';
import { SAVINGS, SPENDING, expense, income, transfer } from './testFixtures';

const destinations = [SPENDING, SAVINGS];

describe('monthlySavings', () => {
  it('adds payroll split and closing transfer into savings', () => {
    const txs = [
      income('2026-11-28', [
        { destinationId: 'savings', amountCents: 30000 },
        { destinationId: 'spending', amountCents: 120000 },
      ]),
      transfer('2026-11-30', 8500, 'spending', 'savings'),
    ];
    expect(monthlySavings('2026-11', destinations, txs)).toBe(38500);
  });

  it('subtracts withdrawals from savings', () => {
    const txs = [transfer('2026-11-10', 4000, 'savings', 'spending'), transfer('2026-11-30', 10000, 'spending', 'savings')];
    expect(monthlySavings('2026-11', destinations, txs)).toBe(6000);
  });

  it('ignores movements of other months and plain expenses', () => {
    const txs = [transfer('2026-12-01', 5000, 'spending', 'savings'), expense('2026-11-05', 1000)];
    expect(monthlySavings('2026-11', destinations, txs)).toBe(0);
  });
});

describe('accumulatedSavings', () => {
  it('is the sum of the balances of every savings destination', () => {
    const second = { ...SAVINGS, id: 'savings2', initialCents: 500 };
    const txs = [transfer('2026-11-30', 2000, 'spending', 'savings'), transfer('2026-11-30', 1000, 'spending', 'savings2')];
    expect(accumulatedSavings([SPENDING, SAVINGS, second], txs)).toBe(2000 + 1000 + 500);
  });
});

describe('savingsHistory', () => {
  it('lists each month from the first one to the current with its savings', () => {
    const txs = [transfer('2026-10-30', 200, 'spending', 'savings'), transfer('2026-12-02', 150, 'spending', 'savings')];
    expect(savingsHistory('2026-10', '2026-12', destinations, txs)).toEqual([
      { month: '2026-10', savingsCents: 200 },
      { month: '2026-11', savingsCents: 0 },
      { month: '2026-12', savingsCents: 150 },
    ]);
  });
});
