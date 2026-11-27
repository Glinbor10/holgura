import type { IsoDate, Month } from './types';

const pad = (value: number) => String(value).padStart(2, '0');

export const monthOf = (date: IsoDate): Month => date.slice(0, 7);

const shiftMonth = (month: Month, delta: number): Month => {
  const [year, monthNumber] = month.split('-').map(Number);
  const index = year * 12 + (monthNumber - 1) + delta;
  return `${Math.floor(index / 12)}-${pad((index % 12) + 1)}`;
};

export const nextMonth = (month: Month): Month => shiftMonth(month, 1);

export const prevMonth = (month: Month): Month => shiftMonth(month, -1);

const daysInMonth = (month: Month): number => {
  const [year, monthNumber] = month.split('-').map(Number);
  return new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
};

export const lastDayOfMonth = (month: Month): IsoDate => `${month}-${pad(daysInMonth(month))}`;

/** Date for `day` in `month`, clamped to the last day when the month is shorter. */
export const dateInMonth = (month: Month, day: number): IsoDate =>
  `${month}-${pad(Math.min(day, daysInMonth(month)))}`;

/** Inclusive list of months; empty when `from` is after `to`. */
export const monthsInRange = (from: Month, to: Month): Month[] => {
  const months: Month[] = [];
  for (let month = from; month <= to; month = nextMonth(month)) {
    months.push(month);
  }
  return months;
};

/** Today as an ISO local date (no UTC shift). */
export const todayIso = (): IsoDate => {
  const now = new Date();
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
};
