import type {
  Category,
  Destination,
  IsoDate,
  MonthClosing,
  PayrollTemplate,
  RecurringExpense,
  Transaction,
} from '../domain/types';

export const CURRENT_SCHEMA_VERSION = 1;

/** Everything the app stores. It is also exactly what a backup contains. */
export interface AppData {
  schemaVersion: number;
  destinations: Destination[];
  categories: Category[];
  transactions: Transaction[];
  payrollTemplate: PayrollTemplate;
  recurring: RecurringExpense[];
  closings: MonthClosing[];
  /** Recurring occurrences ("id|month") the user deleted, so they are not generated again. */
  skippedRecurring?: string[];
  lastExportAt?: IsoDate;
}

export const SPENDING_ID = 'spending';
export const SAVINGS_ID = 'savings';

const DEFAULT_CATEGORIES = ['Comida', 'Transporte', 'Casa', 'Ocio', 'Salud', 'Otros'];

export const createInitialData = (): AppData => ({
  schemaVersion: CURRENT_SCHEMA_VERSION,
  destinations: [
    { id: SPENDING_ID, name: 'Gastos', kind: 'SPENDING', initialCents: 0, archived: false },
    { id: SAVINGS_ID, name: 'Ahorro', kind: 'SAVINGS', initialCents: 0, archived: false },
  ],
  categories: DEFAULT_CATEGORIES.map((name) => ({ id: `cat-${name.toLowerCase()}`, name, archived: false })),
  transactions: [],
  payrollTemplate: { lines: [], remainderDestinationId: SPENDING_ID, fundsNextMonth: true },
  recurring: [],
  closings: [],
});

/** The one active destination of a kind. The interface only shows "available" and "saved", so there is one of each. */
export const spendingDestination = (data: AppData): Destination | undefined => data.destinations.find((d) => d.kind === 'SPENDING' && !d.archived);
export const savingsDestination = (data: AppData): Destination | undefined => data.destinations.find((d) => d.kind === 'SAVINGS' && !d.archived);

/** Persistence port: one implementation per platform (SQLite on Android, localStorage on web). */
export interface Repository {
  load(): Promise<AppData | null>;
  save(data: AppData): Promise<void>;
}
