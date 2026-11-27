import { lastDayOfMonth, nextMonth } from './dates';
import type { Cents, ClosingAction, IsoDate, Month, MonthClosing } from './types';

export interface ClosingOptions {
  kind: 'SURPLUS' | 'DEFICIT' | 'EVEN';
  actions: ClosingAction[];
}

export const closingOptions = (availableCents: Cents): ClosingOptions => {
  if (availableCents > 0) {
    return { kind: 'SURPLUS', actions: ['TO_SAVINGS', 'CARRY'] };
  }
  if (availableCents < 0) {
    return { kind: 'DEFICIT', actions: ['COVER_FROM_SAVINGS', 'CARRY'] };
  }
  return { kind: 'EVEN', actions: [] };
};

const lastClosed = (closings: MonthClosing[]): Month | undefined =>
  closings.map((closing) => closing.month).sort().at(-1);

/** A month can be closed once it has ended, and only in chronological order. */
export const canClose = (month: Month, today: IsoDate, closings: MonthClosing[], firstMonth: Month): boolean => {
  if (lastDayOfMonth(month) >= today) {
    return false;
  }
  const last = lastClosed(closings);
  return month === (last === undefined ? firstMonth : nextMonth(last));
};

export const canReopen = (month: Month, closings: MonthClosing[]): boolean => lastClosed(closings) === month;

export interface ClosingTransfer {
  date: IsoDate;
  amountCents: Cents;
  fromDestinationId: string;
  toDestinationId: string;
}

export const buildClosing = (
  month: Month,
  availableCents: Cents,
  action: ClosingAction,
  ids: { spendingId: string; savingsId: string },
): { closing: MonthClosing; transfer?: ClosingTransfer } => {
  const date = lastDayOfMonth(month);
  if (action === 'TO_SAVINGS' && availableCents > 0) {
    const transfer = {
      date,
      amountCents: availableCents,
      fromDestinationId: ids.spendingId,
      toDestinationId: ids.savingsId,
    };
    return { closing: { month, action, carryOutCents: 0 }, transfer };
  }
  if (action === 'COVER_FROM_SAVINGS' && availableCents < 0) {
    const transfer = {
      date,
      amountCents: -availableCents,
      fromDestinationId: ids.savingsId,
      toDestinationId: ids.spendingId,
    };
    return { closing: { month, action, carryOutCents: 0 }, transfer };
  }
  if (action === 'CARRY') {
    return { closing: { month, action, carryOutCents: availableCents } };
  }
  throw new Error(`Action ${action} does not apply to a balance of ${availableCents} cents`);
};

/** The month the user should close next, or null if there is none yet. */
export const nextMonthToClose = (
  firstMonth: Month | undefined,
  closings: MonthClosing[],
  today: IsoDate,
): Month | null => {
  if (firstMonth === undefined) {
    return null;
  }
  const last = lastClosed(closings);
  const candidate = last === undefined ? firstMonth : nextMonth(last);
  return lastDayOfMonth(candidate) < today ? candidate : null;
};
