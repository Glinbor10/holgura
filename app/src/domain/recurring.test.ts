import { describe, expect, it } from 'vitest';
import { pendingRecurringExpenses } from './recurring';
import type { RecurringExpense } from './types';

const rent: RecurringExpense = {
  id: 'rent',
  name: 'Rent',
  amountCents: 60000,
  categoryId: 'home',
  dayOfMonth: 5,
  active: true,
  startMonth: '2026-10',
};

describe('pendingRecurringExpenses', () => {
  it('generates every missing month up to today', () => {
    const pending = pendingRecurringExpenses([rent], new Set(), '2026-12-10');
    expect(pending.map((p) => p.date)).toEqual(['2026-10-05', '2026-11-05', '2026-12-05']);
  });

  it('only generates the months that are not already generated', () => {
    const pending = pendingRecurringExpenses([rent], new Set(['rent|2026-10']), '2026-12-10');
    expect(pending.map((p) => p.date)).toEqual(['2026-11-05', '2026-12-05']);
  });

  it('is idempotent once everything is generated', () => {
    const generated = new Set(['rent|2026-10', 'rent|2026-11', 'rent|2026-12']);
    expect(pendingRecurringExpenses([rent], generated, '2026-12-10')).toEqual([]);
  });

  it('does not generate a month whose day has not arrived yet', () => {
    const late = { ...rent, dayOfMonth: 15 };
    const pending = pendingRecurringExpenses([late], new Set(), '2026-12-10');
    expect(pending.map((p) => p.date)).toEqual(['2026-10-15', '2026-11-15']);
  });

  it('uses the last day of short months for day 31', () => {
    const end = { ...rent, dayOfMonth: 31, startMonth: '2026-02' };
    const pending = pendingRecurringExpenses([end], new Set(), '2026-03-31');
    expect(pending.map((p) => p.date)).toEqual(['2026-02-28', '2026-03-31']);
  });

  it('skips inactive recurring expenses', () => {
    expect(pendingRecurringExpenses([{ ...rent, active: false }], new Set(), '2026-12-10')).toEqual([]);
  });

  it('uses the current template amount for new months', () => {
    const raised = { ...rent, amountCents: 65000 };
    const pending = pendingRecurringExpenses([raised], new Set(['rent|2026-10', 'rent|2026-11']), '2026-12-10');
    expect(pending).toEqual([
      { recurringId: 'rent', month: '2026-12', date: '2026-12-05', amountCents: 65000, categoryId: 'home' },
    ]);
  });
});
