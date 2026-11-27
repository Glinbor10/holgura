import type { IsoDate } from './types';

const BACKUP_INTERVAL_DAYS = 30;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

const daysBetween = (from: IsoDate, to: IsoDate): number =>
  Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / MS_PER_DAY);

/** Data only lives on the phone, so remind the user to export a copy regularly. */
export const isBackupDue = (lastExportAt: IsoDate | undefined, today: IsoDate, hasData: boolean): boolean =>
  lastExportAt === undefined ? hasData : daysBetween(lastExportAt, today) > BACKUP_INTERVAL_DAYS;
