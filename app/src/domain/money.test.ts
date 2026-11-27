import { describe, expect, it } from 'vitest';
import { centsToInput, formatEuros, parseEuros } from './money';

describe('parseEuros', () => {
  it('parses comma and dot decimals into cents', () => {
    expect(parseEuros('12,50')).toBe(1250);
    expect(parseEuros('12.5')).toBe(1250);
    expect(parseEuros('12')).toBe(1200);
    expect(parseEuros('0,10')).toBe(10);
  });

  it('rejects empty, zero, negative and malformed input', () => {
    expect(parseEuros('')).toBeNull();
    expect(parseEuros('0')).toBeNull();
    expect(parseEuros('-5')).toBeNull();
    expect(parseEuros('abc')).toBeNull();
    expect(parseEuros('1,234')).toBeNull();
  });
});

describe('formatEuros', () => {
  it('formats cents as euros', () => {
    const text = formatEuros(1250).replace(/\s/g, ' ');
    expect(text).toContain('12,50');
    expect(text).toContain('€');
  });

  it('keeps the sign of negative amounts', () => {
    expect(formatEuros(-4000)).toContain('-');
  });
});

describe('centsToInput', () => {
  it('turns cents into the text a user would type', () => {
    expect(centsToInput(1250)).toBe('12,50');
    expect(centsToInput(5)).toBe('0,05');
    expect(centsToInput(0)).toBe('');
  });

  it('round-trips with parseEuros', () => {
    expect(parseEuros(centsToInput(123456))).toBe(123456);
  });
});
