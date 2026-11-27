import { describe, expect, it } from 'vitest';
import { applyTemplate, defaultFundsMonth } from './payrollSplit';
import type { PayrollTemplate } from './types';

const template: PayrollTemplate = {
  lines: [{ destinationId: 'savings', amountCents: 30000 }],
  remainderDestinationId: 'spending',
  fundsNextMonth: true,
};

describe('applyTemplate', () => {
  it('sends fixed lines to their destination and the rest to the remainder destination', () => {
    expect(applyTemplate(150000, template)).toEqual({
      ok: true,
      allocations: [
        { destinationId: 'savings', amountCents: 30000 },
        { destinationId: 'spending', amountCents: 120000 },
      ],
    });
  });

  it('fails when fixed lines exceed the payroll', () => {
    expect(applyTemplate(20000, template)).toEqual({ ok: false, error: 'FIXED_LINES_EXCEED_AMOUNT' });
  });

  it('omits the remainder when the fixed lines use the whole payroll', () => {
    const result = applyTemplate(30000, template);
    expect(result).toEqual({ ok: true, allocations: [{ destinationId: 'savings', amountCents: 30000 }] });
  });

  it('merges lines that target the same destination as the remainder', () => {
    const merged = applyTemplate(100000, {
      ...template,
      lines: [{ destinationId: 'spending', amountCents: 10000 }],
    });
    expect(merged).toEqual({ ok: true, allocations: [{ destinationId: 'spending', amountCents: 100000 }] });
  });
});

describe('defaultFundsMonth', () => {
  it('funds the following month when configured so', () => {
    expect(defaultFundsMonth('2026-11-28', true)).toBe('2026-12');
  });

  it('funds the same month otherwise', () => {
    expect(defaultFundsMonth('2026-11-28', false)).toBe('2026-11');
  });
});
