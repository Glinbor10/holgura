import { describe, expect, it } from 'vitest';
import { dateInMonth, lastDayOfMonth, monthOf, monthsInRange, nextMonth, prevMonth } from './dates';

describe('dates', () => {
  it('extracts the month of a date', () => {
    expect(monthOf('2026-11-28')).toBe('2026-11');
  });

  it('moves across year boundaries', () => {
    expect(nextMonth('2026-12')).toBe('2027-01');
    expect(prevMonth('2026-01')).toBe('2025-12');
  });

  it('clamps the day to the last day of short months', () => {
    expect(dateInMonth('2026-02', 31)).toBe('2026-02-28');
    expect(dateInMonth('2028-02', 31)).toBe('2028-02-29');
    expect(dateInMonth('2026-11', 5)).toBe('2026-11-05');
  });

  it('returns the last day of a month', () => {
    expect(lastDayOfMonth('2026-11')).toBe('2026-11-30');
  });

  it('lists months in an inclusive range', () => {
    expect(monthsInRange('2026-10', '2026-12')).toEqual(['2026-10', '2026-11', '2026-12']);
    expect(monthsInRange('2026-12', '2026-10')).toEqual([]);
  });
});
