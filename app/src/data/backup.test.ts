import { describe, expect, it } from 'vitest';
import { createInitialData } from './appData';
import { parseBackup, serializeBackup } from './backup';

const withData = () => ({
  ...createInitialData(),
  transactions: [
    {
      id: 't1',
      type: 'EXPENSE' as const,
      date: '2026-11-10',
      amountCents: 1250,
      categoryId: 'cat-comida',
    },
  ],
});

describe('backup', () => {
  it('restores exactly what was exported', () => {
    const data = withData();
    const result = parseBackup(serializeBackup(data, '2026-11-30'));
    expect(result).toEqual({ ok: true, data: { ...data, lastExportAt: '2026-11-30' } });
  });

  it('rejects malformed JSON', () => {
    expect(parseBackup('{not json')).toEqual({ ok: false, error: 'INVALID_JSON' });
  });

  it('rejects a backup from a newer app version', () => {
    const future = JSON.stringify({ ...createInitialData(), schemaVersion: 999 });
    expect(parseBackup(future)).toEqual({ ok: false, error: 'UNSUPPORTED_VERSION' });
  });

  it('rejects a backup with missing collections', () => {
    const { transactions: _removed, ...incomplete } = createInitialData();
    expect(parseBackup(JSON.stringify(incomplete))).toEqual({ ok: false, error: 'INVALID_FORMAT' });
  });

  it('rejects amounts that are not integer cents', () => {
    const broken = { ...withData(), transactions: [{ ...withData().transactions[0], amountCents: 12.5 }] };
    expect(parseBackup(JSON.stringify(broken))).toEqual({ ok: false, error: 'INVALID_FORMAT' });
  });

  it('rejects dates that are not ISO dates', () => {
    const broken = { ...withData(), transactions: [{ ...withData().transactions[0], date: '10/11/2026' }] };
    expect(parseBackup(JSON.stringify(broken))).toEqual({ ok: false, error: 'INVALID_FORMAT' });
  });
});
