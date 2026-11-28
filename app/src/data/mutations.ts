import { firstTransactionDate } from '../domain/activity';
import { available, destinationBalance } from '../domain/balances';
import { buildClosing, canClose, canReopen } from '../domain/closing';
import { monthOf } from '../domain/dates';
import { pendingRecurringExpenses, recurringKey } from '../domain/recurring';
import type {
  Allocation,
  Cents,
  ClosingAction,
  DestinationKind,
  IsoDate,
  Month,
  PayrollTemplate,
  RecurringExpense,
  Transaction,
} from '../domain/types';
import type { AppData } from './appData';

const newId = (): string => crypto.randomUUID();

const isClosed = (data: AppData, date: IsoDate): boolean => data.closings.some((c) => c.month === monthOf(date));

const assertOpen = (data: AppData, date: IsoDate): void => {
  if (isClosed(data, date)) {
    throw new Error('MONTH_CLOSED');
  }
};

const withTransaction = (data: AppData, tx: Transaction): AppData => {
  assertOpen(data, tx.date);
  return { ...data, transactions: [...data.transactions, tx] };
};

export const addExpense = (
  data: AppData,
  input: { date: IsoDate; amountCents: Cents; categoryId: string; note?: string; recurringId?: string },
): AppData => withTransaction(data, { id: newId(), type: 'EXPENSE', ...input });

export const addIncome = (
  data: AppData,
  input: { date: IsoDate; allocations: Allocation[]; fundsMonth: Month; note?: string },
): AppData =>
  withTransaction(data, {
    id: newId(),
    type: 'INCOME',
    date: input.date,
    amountCents: input.allocations.reduce((sum, a) => sum + a.amountCents, 0),
    allocations: input.allocations,
    fundsMonth: input.fundsMonth,
    note: input.note,
  });

export const updateTransaction = (data: AppData, id: string, patch: Partial<Transaction>): AppData => {
  const current = data.transactions.find((tx) => tx.id === id);
  if (!current) {
    throw new Error('NOT_FOUND');
  }
  const updated = { ...current, ...patch };
  assertOpen(data, current.date);
  assertOpen(data, updated.date);
  return { ...data, transactions: data.transactions.map((tx) => (tx.id === id ? updated : tx)) };
};

export const deleteTransaction = (data: AppData, id: string): AppData => {
  const current = data.transactions.find((tx) => tx.id === id);
  if (!current) {
    throw new Error('NOT_FOUND');
  }
  assertOpen(data, current.date);
  const skipped = current.recurringId ? [...(data.skippedRecurring ?? []), recurringKey(current.recurringId, monthOf(current.date))] : data.skippedRecurring;
  return { ...data, transactions: data.transactions.filter((tx) => tx.id !== id), skippedRecurring: skipped };
};

/** Creates the recurring expenses that are due by `today` and not generated yet. */
export const generateRecurring = (data: AppData, today: IsoDate): AppData => {
  const skipped = data.skippedRecurring ?? [];
  // A skip only matters while its expense exists and the month is not before the expense's start month.
  const stillMatters = skipped.filter((key) => {
    const item = data.recurring.find((recurring) => recurring.id === key.slice(0, key.lastIndexOf('|')));
    return item !== undefined && key.slice(key.lastIndexOf('|') + 1) >= item.startMonth;
  });
  const generated = new Set([
    ...data.transactions.filter((tx) => tx.recurringId).map((tx) => recurringKey(tx.recurringId!, monthOf(tx.date))),
    ...stillMatters,
  ]);
  const created: Transaction[] = pendingRecurringExpenses(data.recurring, generated, today)
    .filter((item) => !isClosed(data, item.date))
    .map((item) => ({
      id: newId(),
      type: 'EXPENSE',
      date: item.date,
      amountCents: item.amountCents,
      categoryId: item.categoryId,
      recurringId: item.recurringId,
    }));
  const pruned = stillMatters.length !== skipped.length;
  return created.length === 0 && !pruned
    ? data
    : { ...data, transactions: [...data.transactions, ...created], ...(pruned ? { skippedRecurring: stillMatters } : {}) };
};

export const addRecurring = (
  data: AppData,
  input: Pick<RecurringExpense, 'name' | 'amountCents' | 'categoryId' | 'dayOfMonth'>,
  today: IsoDate,
): AppData => ({
  ...data,
  recurring: [...data.recurring, { id: newId(), active: true, startMonth: monthOf(today), ...input }],
});

/** Reactivating a recurring expense restarts it from the current month so no gap is backfilled. */
export const updateRecurring = (
  data: AppData,
  id: string,
  patch: Partial<Omit<RecurringExpense, 'id' | 'startMonth'>>,
  today: IsoDate,
): AppData => ({
  ...data,
  recurring: data.recurring.map((item) => {
    if (item.id !== id) {
      return item;
    }
    const reactivated = patch.active === true && !item.active;
    return { ...item, ...patch, startMonth: reactivated ? monthOf(today) : item.startMonth };
  }),
});

export const deleteRecurring = (data: AppData, id: string): AppData => ({
  ...data,
  recurring: data.recurring.filter((item) => item.id !== id),
});

export const firstMonthWithActivity = (data: AppData): Month | undefined => firstTransactionDate(data.transactions)?.slice(0, 7);

export const closeMonth = (data: AppData, month: Month, action: ClosingAction, today: IsoDate): AppData => {
  const firstMonth = firstMonthWithActivity(data);
  if (firstMonth === undefined || !canClose(month, today, data.closings, firstMonth)) {
    throw new Error('CANNOT_CLOSE');
  }
  const spending = data.destinations.find((d) => d.kind === 'SPENDING' && !d.archived);
  const savings = data.destinations.find((d) => d.kind === 'SAVINGS' && !d.archived);
  if (!spending || !savings) {
    throw new Error('MISSING_DESTINATIONS');
  }
  const remaining = available(month, data.destinations, data.transactions, data.closings);
  const { closing, transfer } = buildClosing(month, remaining, action, {
    spendingId: spending.id,
    savingsId: savings.id,
  });
  if (!transfer) {
    return { ...data, closings: [...data.closings, closing] };
  }
  const transferTx: Transaction = { id: newId(), type: 'TRANSFER', ...transfer };
  return {
    ...data,
    transactions: [...data.transactions, transferTx],
    closings: [...data.closings, { ...closing, transferId: transferTx.id }],
  };
};

export const reopenMonth = (data: AppData, month: Month): AppData => {
  if (!canReopen(month, data.closings)) {
    throw new Error('CANNOT_REOPEN');
  }
  const closing = data.closings.find((c) => c.month === month);
  return {
    ...data,
    transactions: data.transactions.filter((tx) => tx.id !== closing?.transferId),
    closings: data.closings.filter((c) => c.month !== month),
  };
};

export const addDestination = (data: AppData, input: { name: string; kind: DestinationKind }): AppData => {
  if (input.kind === 'SPENDING' && data.destinations.some((d) => d.kind === 'SPENDING' && !d.archived)) {
    throw new Error('SPENDING_ALREADY_EXISTS');
  }
  return {
    ...data,
    destinations: [...data.destinations, { id: newId(), initialCents: 0, archived: false, ...input }],
  };
};

export const renameDestination = (data: AppData, id: string, name: string): AppData => ({
  ...data,
  destinations: data.destinations.map((d) => (d.id === id ? { ...d, name } : d)),
});

export const archiveDestination = (data: AppData, id: string): AppData => {
  const destination = data.destinations.find((d) => d.id === id);
  if (!destination) {
    throw new Error('NOT_FOUND');
  }
  if (destination.kind === 'SPENDING') {
    throw new Error('CANNOT_ARCHIVE_SPENDING');
  }
  if (destinationBalance(destination, data.transactions) !== 0) {
    throw new Error('DESTINATION_HAS_BALANCE');
  }
  return { ...data, destinations: data.destinations.map((d) => (d.id === id ? { ...d, archived: true } : d)) };
};

export const addCategory = (data: AppData, name: string): AppData => ({
  ...data,
  categories: [...data.categories, { id: newId(), name, archived: false }],
});

export const renameCategory = (data: AppData, id: string, name: string): AppData => ({
  ...data,
  categories: data.categories.map((c) => (c.id === id ? { ...c, name } : c)),
});

export const archiveCategory = (data: AppData, id: string): AppData => ({
  ...data,
  categories: data.categories.map((c) => (c.id === id ? { ...c, archived: true } : c)),
});

export const setPayrollTemplate = (data: AppData, payrollTemplate: PayrollTemplate): AppData => ({
  ...data,
  payrollTemplate,
});

/** Sets how much a savings destination gets from each payroll (0 clears it). Spending gets the rest. */
export const setPayrollLine = (data: AppData, destinationId: string, amountCents: Cents): AppData => {
  if (data.destinations.find((d) => d.id === destinationId)?.kind === 'SPENDING') {
    throw new Error('SPENDING_GETS_THE_REST');
  }
  const others = data.payrollTemplate.lines.filter((line) => line.destinationId !== destinationId);
  const lines = amountCents > 0 ? [...others, { destinationId, amountCents }] : others;
  return { ...data, payrollTemplate: { ...data.payrollTemplate, lines } };
};

/** Sets the savings the user already had when starting to use the app (the savings balance starts from it). */
export const setStartingSavings = (data: AppData, amountCents: Cents): AppData => {
  if (amountCents < 0) {
    throw new Error('NEGATIVE_AMOUNT');
  }
  return {
    ...data,
    destinations: data.destinations.map((d) => (d.kind === 'SAVINGS' && !d.archived ? { ...d, initialCents: amountCents } : d)),
  };
};
