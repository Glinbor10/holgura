export type Cents = number;
/** ISO local date, e.g. "2026-11-28". */
export type IsoDate = string;
/** Calendar month, e.g. "2026-11". */
export type Month = string;

export type DestinationKind = 'SPENDING' | 'SAVINGS';

export interface Destination {
  id: string;
  name: string;
  kind: DestinationKind;
  initialCents: Cents;
  archived: boolean;
}

export interface Category {
  id: string;
  name: string;
  archived: boolean;
}

export interface Allocation {
  destinationId: string;
  amountCents: Cents;
}

export type TransactionType = 'INCOME' | 'EXPENSE' | 'TRANSFER';

export interface Transaction {
  id: string;
  type: TransactionType;
  date: IsoDate;
  amountCents: Cents;
  categoryId?: string;
  note?: string;
  /** INCOME only: month this income funds. Defaults to the month of `date`. */
  fundsMonth?: Month;
  /** INCOME only: how the income is split between destinations. */
  allocations?: Allocation[];
  /** TRANSFER only. */
  fromDestinationId?: string;
  toDestinationId?: string;
  /** EXPENSE generated from a recurring expense. */
  recurringId?: string;
}

export type ClosingAction = 'TO_SAVINGS' | 'CARRY' | 'COVER_FROM_SAVINGS';

export interface MonthClosing {
  month: Month;
  action: ClosingAction;
  /** Amount carried into the following month (can be negative). */
  carryOutCents: Cents;
  /** Id of the transfer created by this closing, if any. */
  transferId?: string;
}

export interface RecurringExpense {
  id: string;
  name: string;
  amountCents: Cents;
  categoryId: string;
  dayOfMonth: number;
  active: boolean;
  /** First month for which expenses are generated. */
  startMonth: Month;
}

export interface PayrollTemplate {
  /** Usual net payroll, to prefill the "payroll arrived" screen. Optional. */
  amountCents?: Cents;
  /** Fixed lines; whatever is left goes to `remainderDestinationId`. */
  lines: Allocation[];
  remainderDestinationId: string;
  /** If true, a payroll funds the month after the one it is received in. */
  fundsNextMonth: boolean;
}
