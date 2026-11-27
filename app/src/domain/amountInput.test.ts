import { describe, expect, it } from 'vitest';
import { pressKey } from './amountInput';

const type = (keys: string[]) => keys.reduce((text, key) => pressKey(text, key), '');

describe('pressKey', () => {
  it('builds an amount digit by digit', () => {
    expect(type(['1', '2', ',', '5', '0'])).toBe('12,50');
  });

  it('starts a decimal with a leading zero', () => {
    expect(type([','])).toBe('0,');
  });

  it('replaces a lone zero instead of stacking leading zeros', () => {
    expect(type(['0', '5'])).toBe('5');
  });

  it('accepts only one comma and two decimals', () => {
    expect(type(['1', ',', ',', '2', '3', '4'])).toBe('1,23');
  });

  it('limits the integer part', () => {
    expect(type(['1', '2', '3', '4', '5', '6', '7', '8'])).toBe('1234567');
  });

  it('removes the last character with backspace and survives an empty value', () => {
    expect(pressKey('12,5', 'back')).toBe('12,');
    expect(pressKey('', 'back')).toBe('');
  });
});
