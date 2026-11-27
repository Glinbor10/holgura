import { describe, expect, it } from 'vitest';
import { allowance, available, destinationBalance } from './balances';
import { SAVINGS, SPENDING, expense, income, transfer } from './testFixtures';
import type { MonthClosing } from './types';

const destinations = [SPENDING, SAVINGS];

describe('destinationBalance', () => {
  it('subtracts expenses from the spending destination', () => {
    const txs = [income('2026-11-28', [{ destinationId: 'spending', amountCents: 120000 }]), expense('2026-12-02', 2000)];
    expect(destinationBalance(SPENDING, txs)).toBe(118000);
  });

  it('adds initial balance, allocations and transfers to savings', () => {
    const savings = { ...SAVINGS, initialCents: 1000 };
    const txs = [
      income('2026-11-28', [{ destinationId: 'savings', amountCents: 30000 }]),
      transfer('2026-11-30', 8500, 'spending', 'savings'),
      transfer('2026-12-03', 500, 'savings', 'spending'),
    ];
    expect(destinationBalance(savings, txs)).toBe(1000 + 30000 + 8500 - 500);
  });
});

describe('allowance and available', () => {
  const octPayroll = income('2026-10-28', [{ destinationId: 'spending', amountCents: 100000 }], '2026-11');
  const novPayroll = income('2026-11-28', [{ destinationId: 'spending', amountCents: 120000 }], '2026-12');

  it('lets a payroll of day 28 fund the following month', () => {
    const txs = [octPayroll, novPayroll, expense('2026-11-10', 90000), expense('2026-12-03', 30000)];
    expect(available('2026-11', destinations, txs, [])).toBe(10000);
    expect(available('2026-12', destinations, txs, [])).toBe(90000);
  });

  it('only counts the spending part of a split income', () => {
    const split = income(
      '2026-11-28',
      [
        { destinationId: 'savings', amountCents: 30000 },
        { destinationId: 'spending', amountCents: 120000 },
      ],
      '2026-12',
    );
    expect(allowance('2026-12', destinations, [split], [])).toBe(120000);
  });

  it('ignores transfers when computing available', () => {
    const txs = [octPayroll, transfer('2026-11-15', 5000, 'spending', 'savings')];
    expect(available('2026-11', destinations, txs, [])).toBe(100000);
  });

  it('adds the carry-out of the previous closing', () => {
    const closing: MonthClosing = { month: '2026-11', action: 'CARRY', carryOutCents: 8500 };
    expect(allowance('2026-12', destinations, [novPayroll], [closing])).toBe(120000 + 8500);
  });

  it('funds the month of the income date when fundsMonth is missing', () => {
    const txs = [income('2026-11-03', [{ destinationId: 'spending', amountCents: 5000 }])];
    expect(allowance('2026-11', destinations, txs, [])).toBe(5000);
  });
});
