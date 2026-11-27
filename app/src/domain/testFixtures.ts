import type { Destination, Transaction } from './types';

export const SPENDING: Destination = {
  id: 'spending',
  name: 'Gastos',
  kind: 'SPENDING',
  initialCents: 0,
  archived: false,
};

export const SAVINGS: Destination = {
  id: 'savings',
  name: 'Ahorro',
  kind: 'SAVINGS',
  initialCents: 0,
  archived: false,
};

let counter = 0;
const nextId = () => `tx${++counter}`;

export const income = (
  date: string,
  allocations: { destinationId: string; amountCents: number }[],
  fundsMonth?: string,
): Transaction => ({
  id: nextId(),
  type: 'INCOME',
  date,
  amountCents: allocations.reduce((sum, a) => sum + a.amountCents, 0),
  allocations,
  fundsMonth,
});

export const expense = (date: string, amountCents: number): Transaction => ({
  id: nextId(),
  type: 'EXPENSE',
  date,
  amountCents,
});

export const transfer = (
  date: string,
  amountCents: number,
  fromDestinationId: string,
  toDestinationId: string,
): Transaction => ({
  id: nextId(),
  type: 'TRANSFER',
  date,
  amountCents,
  fromDestinationId,
  toDestinationId,
});
