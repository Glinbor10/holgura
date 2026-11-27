import { describe, expect, it } from 'vitest';
import { isBackupDue } from './backupReminder';

describe('isBackupDue', () => {
  it('is due when the last export was more than 30 days ago', () => {
    expect(isBackupDue('2026-10-01', '2026-11-01', true)).toBe(true);
  });

  it('is not due within 30 days', () => {
    expect(isBackupDue('2026-10-10', '2026-11-01', true)).toBe(false);
  });

  it('is due when there is data and it was never exported', () => {
    expect(isBackupDue(undefined, '2026-11-01', true)).toBe(true);
  });

  it('is not due when there is no data to lose', () => {
    expect(isBackupDue(undefined, '2026-11-01', false)).toBe(false);
  });
});
