import { describe, expect, it } from 'vitest';
import { isBackupDue } from './backupReminder';

describe('isBackupDue', () => {
  it('is due when the last export was more than 30 days ago', () => {
    expect(isBackupDue('2026-10-01', '2026-09-01', '2026-11-01')).toBe(true);
  });

  it('is not due within 30 days of the last export', () => {
    expect(isBackupDue('2026-10-10', '2026-09-01', '2026-11-01')).toBe(false);
  });

  it('counts from the first movement when it was never exported', () => {
    expect(isBackupDue(undefined, '2026-09-01', '2026-11-01')).toBe(true);
    expect(isBackupDue(undefined, '2026-10-20', '2026-11-01')).toBe(false);
  });

  it('is not due when there is no data to lose', () => {
    expect(isBackupDue(undefined, undefined, '2026-11-01')).toBe(false);
  });
});
