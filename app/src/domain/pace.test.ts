import { describe, expect, it } from 'vitest';
import { availableByDay, dailyPace, dailySpending, daysLeftInMonth, spendingByCategory } from './pace';
import { expense, income } from './testFixtures';

describe('dailySpending', () => {
  it('sums the expenses of each day of the month', () => {
    const txs = [expense('2026-11-01', 500), expense('2026-11-01', 250), expense('2026-11-30', 1000)];
    const days = dailySpending('2026-11', txs);
    expect(days).toHaveLength(30);
    expect(days[0]).toBe(750);
    expect(days[29]).toBe(1000);
    expect(days[1]).toBe(0);
  });

  it('ignores other months and movements that are not expenses', () => {
    const txs = [expense('2026-10-31', 999), income('2026-11-05', [{ destinationId: 'spending', amountCents: 5000 }])];
    expect(dailySpending('2026-11', txs).every((cents) => cents === 0)).toBe(true);
  });
});

describe('daysLeftInMonth', () => {
  it('counts today and the days after it', () => {
    expect(daysLeftInMonth('2026-11-26')).toBe(5);
    expect(daysLeftInMonth('2026-11-30')).toBe(1);
  });
});

describe('dailyPace', () => {
  it('splits what is left over the remaining days', () => {
    expect(dailyPace(15000, '2026-11-26')).toBe(3000);
  });

  it('is zero when nothing is left or the balance is negative', () => {
    expect(dailyPace(0, '2026-11-26')).toBe(0);
    expect(dailyPace(-500, '2026-11-26')).toBe(0);
  });
});

describe('availableByDay', () => {
  it('starts from the allowance and drops with each day of spending', () => {
    const txs = [expense('2026-11-01', 5000), expense('2026-11-03', 2000)];
    const series = availableByDay('2026-11', 100000, txs);
    expect(series).toHaveLength(30);
    expect(series.slice(0, 4)).toEqual([95000, 95000, 93000, 93000]);
    expect(series[29]).toBe(93000);
  });

  it('ignores spending from other months', () => {
    expect(availableByDay('2026-11', 1000, [expense('2026-10-30', 400)])[0]).toBe(1000);
  });
});

describe('spendingByCategory', () => {
  it('groups the month expenses by category, biggest first', () => {
    const txs = [
      { ...expense('2026-11-02', 300), categoryId: 'food' },
      { ...expense('2026-11-05', 900), categoryId: 'home' },
      { ...expense('2026-11-09', 200), categoryId: 'food' },
      { ...expense('2026-10-09', 5000), categoryId: 'home' },
      income('2026-11-01', [{ destinationId: 'spending', amountCents: 9999 }]),
    ];
    expect(spendingByCategory('2026-11', txs)).toEqual([
      { categoryId: 'home', cents: 900 },
      { categoryId: 'food', cents: 500 },
    ]);
  });
});
