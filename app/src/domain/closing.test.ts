import { describe, expect, it } from 'vitest';
import { buildClosing, canClose, canReopen, closingOptions, nextMonthToClose } from './closing';
import type { MonthClosing } from './types';

const closed = (month: string): MonthClosing => ({ month, action: 'CARRY', carryOutCents: 0 });

describe('closingOptions', () => {
  it('offers savings or carry for a surplus', () => {
    expect(closingOptions(8500)).toEqual({ kind: 'SURPLUS', actions: ['TO_SAVINGS', 'CARRY'] });
  });

  it('offers cover or carry for a deficit', () => {
    expect(closingOptions(-4000)).toEqual({ kind: 'DEFICIT', actions: ['COVER_FROM_SAVINGS', 'CARRY'] });
  });

  it('offers nothing to decide when the month is even', () => {
    expect(closingOptions(0)).toEqual({ kind: 'EVEN', actions: [] });
  });
});

describe('canClose', () => {
  it('rejects a month that has not finished', () => {
    expect(canClose('2026-11', '2026-11-15', [], '2026-11')).toBe(false);
  });

  it('allows the first month with activity once it has finished', () => {
    expect(canClose('2026-10', '2026-11-15', [], '2026-10')).toBe(true);
  });

  it('rejects a first closing later than the first month with activity', () => {
    expect(canClose('2026-11', '2026-12-15', [], '2026-10')).toBe(false);
  });

  it('only allows the month right after the last closed one', () => {
    const closings = [closed('2026-10')];
    expect(canClose('2026-12', '2027-01-05', closings, '2026-10')).toBe(false);
    expect(canClose('2026-11', '2027-01-05', closings, '2026-10')).toBe(true);
  });
});

describe('buildClosing', () => {
  const ids = { spendingId: 'spending', savingsId: 'savings' };

  it('moves a surplus to savings with a transfer dated on the last day of the month', () => {
    const result = buildClosing('2026-11', 8500, 'TO_SAVINGS', ids);
    expect(result.closing).toEqual({ month: '2026-11', action: 'TO_SAVINGS', carryOutCents: 0 });
    expect(result.transfer).toEqual({
      date: '2026-11-30',
      amountCents: 8500,
      fromDestinationId: 'spending',
      toDestinationId: 'savings',
    });
  });

  it('carries a surplus without creating a transfer', () => {
    const result = buildClosing('2026-11', 8500, 'CARRY', ids);
    expect(result.closing.carryOutCents).toBe(8500);
    expect(result.transfer).toBeUndefined();
  });

  it('covers a deficit from savings', () => {
    const result = buildClosing('2026-11', -4000, 'COVER_FROM_SAVINGS', ids);
    expect(result.closing.carryOutCents).toBe(0);
    expect(result.transfer).toEqual({
      date: '2026-11-30',
      amountCents: 4000,
      fromDestinationId: 'savings',
      toDestinationId: 'spending',
    });
  });

  it('carries a deficit as a negative amount', () => {
    expect(buildClosing('2026-11', -4000, 'CARRY', ids).closing.carryOutCents).toBe(-4000);
  });

  it('rejects an action that does not fit the sign of the balance', () => {
    expect(() => buildClosing('2026-11', -4000, 'TO_SAVINGS', ids)).toThrow();
    expect(() => buildClosing('2026-11', 8500, 'COVER_FROM_SAVINGS', ids)).toThrow();
  });
});

describe('canReopen', () => {
  it('only allows reopening the last closed month', () => {
    const closings = [closed('2026-10'), closed('2026-11')];
    expect(canReopen('2026-11', closings)).toBe(true);
    expect(canReopen('2026-10', closings)).toBe(false);
  });
});

describe('nextMonthToClose', () => {
  it('is the first month with activity when nothing is closed yet', () => {
    expect(nextMonthToClose('2026-10', [], '2026-11-15')).toBe('2026-10');
  });

  it('is the month after the last closed one', () => {
    expect(nextMonthToClose('2026-10', [closed('2026-10')], '2026-12-05')).toBe('2026-11');
  });

  it('is null while that month has not ended', () => {
    expect(nextMonthToClose('2026-10', [closed('2026-10')], '2026-11-15')).toBeNull();
  });

  it('is null when there is no activity', () => {
    expect(nextMonthToClose(undefined, [], '2026-11-15')).toBeNull();
  });
});
