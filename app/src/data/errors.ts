const MESSAGES: Record<string, string> = {
  MONTH_CLOSED: 'Ese mes está cerrado. Reábrelo primero (solo se puede reabrir el último cerrado).',
  CANNOT_CLOSE: 'No se puede cerrar ese mes: debe haber terminado y cerrarse en orden.',
  CANNOT_REOPEN: 'Solo se puede reabrir el último mes cerrado.',
  SPENDING_ALREADY_EXISTS: 'Ya existe un destino de gastos activo.',
  CANNOT_ARCHIVE_SPENDING: 'El destino de gastos no se puede archivar.',
  DESTINATION_HAS_BALANCE: 'El destino tiene saldo. Déjalo en 0 antes de archivarlo.',
  SPENDING_GETS_THE_REST: 'El destino de gastos recibe siempre lo que queda de la nómina.',
  NEGATIVE_AMOUNT: 'El importe no puede ser negativo.',
  MISSING_DESTINATIONS: 'Hacen falta un destino de gastos y uno de ahorro activos.',
};

export const errorMessage = (error: unknown): string =>
  error instanceof Error ? (MESSAGES[error.message] ?? 'Ha ocurrido un error inesperado.') : 'Ha ocurrido un error inesperado.';
