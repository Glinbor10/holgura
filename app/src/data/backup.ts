import { CURRENT_SCHEMA_VERSION, type AppData } from './appData';

export type BackupError = 'INVALID_JSON' | 'INVALID_FORMAT' | 'UNSUPPORTED_VERSION';
export type BackupResult = { ok: true; data: AppData } | { ok: false; error: BackupError };

type Json = Record<string, unknown>;

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const MONTH = /^\d{4}-\d{2}$/;

const isObject = (value: unknown): value is Json => typeof value === 'object' && value !== null && !Array.isArray(value);
const isCents = (value: unknown): boolean => Number.isInteger(value);
const isDate = (value: unknown): boolean => typeof value === 'string' && ISO_DATE.test(value);
const isMonth = (value: unknown): boolean => typeof value === 'string' && MONTH.test(value);
const everyObject = (value: unknown, check: (item: Json) => boolean): boolean =>
  Array.isArray(value) && value.every((item) => isObject(item) && typeof item.id !== 'undefined' && check(item));

const isValidFormat = (data: Json): boolean => {
  const template = data.payrollTemplate;
  return (
    everyObject(data.destinations, (d) => (d.kind === 'SPENDING' || d.kind === 'SAVINGS') && isCents(d.initialCents)) &&
    everyObject(data.categories, (c) => typeof c.name === 'string') &&
    everyObject(
      data.transactions,
      (tx) =>
        ['INCOME', 'EXPENSE', 'TRANSFER'].includes(String(tx.type)) &&
        isDate(tx.date) &&
        isCents(tx.amountCents) &&
        (tx.fundsMonth === undefined || isMonth(tx.fundsMonth)) &&
        (tx.allocations === undefined ||
          (Array.isArray(tx.allocations) && tx.allocations.every((a) => isObject(a) && isCents(a.amountCents)))),
    ) &&
    everyObject(
      data.recurring,
      (r) => isCents(r.amountCents) && Number.isInteger(r.dayOfMonth) && isMonth(r.startMonth),
    ) &&
    Array.isArray(data.closings) &&
    data.closings.every((c) => isObject(c) && isMonth(c.month) && isCents(c.carryOutCents)) &&
    isObject(template) &&
    Array.isArray(template.lines)
  );
};

export const serializeBackup = (data: AppData, today: string): string =>
  JSON.stringify({ ...data, lastExportAt: today }, null, 2);

/** Validates a backup file without touching any stored data. */
export const parseBackup = (text: string): BackupResult => {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { ok: false, error: 'INVALID_JSON' };
  }
  if (!isObject(parsed) || !Number.isInteger(parsed.schemaVersion)) {
    return { ok: false, error: 'INVALID_FORMAT' };
  }
  if ((parsed.schemaVersion as number) > CURRENT_SCHEMA_VERSION) {
    return { ok: false, error: 'UNSUPPORTED_VERSION' };
  }
  return isValidFormat(parsed) ? { ok: true, data: parsed as unknown as AppData } : { ok: false, error: 'INVALID_FORMAT' };
};
