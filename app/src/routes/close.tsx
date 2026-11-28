import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { Box, Button, ButtonBase, Stack, Typography } from '@mui/material';
import { Form, redirect, useActionData, type ActionFunctionArgs } from 'react-router-dom';
import { Money } from '../components/Money';
import { PageHeader } from '../components/PageHeader';
import { errorMessage } from '../data/errors';
import { closeMonth, firstMonthWithActivity, reopenMonth } from '../data/mutations';
import { mutate } from '../data/store';
import { available } from '../domain/balances';
import { closingOptions, nextMonthToClose } from '../domain/closing';
import { nextMonth, todayIso } from '../domain/dates';
import { formatEuros } from '../domain/money';
import type { ClosingAction, Month } from '../domain/types';
import { useRootData } from './root';
import { ErrorAlert, capitalize, monthName } from './shared';

export const closeAction = async ({ request }: ActionFunctionArgs) => {
  const form = await request.formData();
  const month = String(form.get('month')) as Month;
  try {
    if (form.get('intent') === 'reopen') {
      await mutate((data) => reopenMonth(data, month));
    } else {
      await mutate((data) => closeMonth(data, month, String(form.get('action')) as ClosingAction, todayIso()));
    }
  } catch (error) {
    return { error: errorMessage(error) };
  }
  return redirect('/history');
};

/** What each closing choice does, in plain words, so nobody has to guess before confirming. */
const describeAction = (action: ClosingAction, leftCents: number, month: Month): { title: string; detail: string } => {
  const amount = formatEuros(Math.abs(leftCents));
  const following = monthName(nextMonth(month));
  if (action === 'TO_SAVINGS') {
    return { title: 'Pasarlo a ahorro', detail: `Mueve ${amount} de Gastos a Ahorro. ${capitalize(following)} empieza de cero.` };
  }
  if (action === 'COVER_FROM_SAVINGS') {
    return { title: 'Cubrirlo con ahorro', detail: `Mueve ${amount} de Ahorro a Gastos para dejar ${monthName(month)} a cero.` };
  }
  return leftCents < 0
    ? { title: 'Arrastrar la deuda', detail: `Resta ${amount} al presupuesto de ${following}.` }
    : { title: 'Arrastrarlo al mes siguiente', detail: `Suma ${amount} al presupuesto de ${following}.` };
};

export const CloseScreen = () => {
  const { data, today } = useRootData();
  const result = useActionData() as { error?: string } | undefined;
  const month = nextMonthToClose(firstMonthWithActivity(data), data.closings, today);
  const lastClosed = data.closings.map((closing) => closing.month).sort().at(-1);
  const left = month ? available(month, data.destinations, data.transactions, data.closings) : 0;
  const options = closingOptions(left);

  return (
    <Stack spacing={3}>
      <PageHeader title={month ? `Cerrar ${monthName(month)}` : 'Cierre de mes'} />
      <ErrorAlert message={result?.error} />

      {month ? (
        <Form method="post">
          <Stack spacing={3}>
            <input type="hidden" name="month" value={month} />
            <Box>
              <Typography sx={{ color: 'text.secondary', fontWeight: 700 }}>
                {options.kind === 'SURPLUS' ? 'Te sobran' : options.kind === 'DEFICIT' ? 'Te has pasado por' : 'Has gastado justo lo previsto'}
              </Typography>
              <Money
                cents={Math.abs(left)}
                size="clamp(2.9rem, 16vw, 4rem)"
                color={options.kind === 'DEFICIT' ? 'var(--mui-palette-error-main)' : undefined}
              />
            </Box>

            {options.kind === 'EVEN' ? (
              <Button type="submit" name="action" value="CARRY" variant="contained" size="large">
                Cerrar {monthName(month)}
              </Button>
            ) : (
              <Stack spacing={1.5}>
                <Typography variant="h6">¿Qué quieres hacer?</Typography>
                {options.actions.map((action) => {
                  const text = describeAction(action, left, month);
                  return (
                    <ButtonBase
                      key={action}
                      type="submit"
                      name="action"
                      value={action}
                      sx={{ width: '100%', textAlign: 'left', gap: 2, p: 2.5, borderRadius: '24px', bgcolor: 'background.paper', justifyContent: 'space-between' }}
                    >
                      <Box>
                        <Typography sx={{ fontWeight: 800 }}>{text.title}</Typography>
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                          {text.detail}
                        </Typography>
                      </Box>
                      <ChevronRightIcon sx={{ color: 'text.secondary' }} />
                    </ButtonBase>
                  );
                })}
              </Stack>
            )}
          </Stack>
        </Form>
      ) : (
        <Typography sx={{ color: 'text.secondary' }}>
          No hay ningún mes pendiente de cerrar. Un mes se puede cerrar cuando termina, siempre en orden.
        </Typography>
      )}

      {lastClosed ? (
        <Form method="post" onSubmit={(event) => (window.confirm(`¿Reabrir ${monthName(lastClosed)}?`) ? undefined : event.preventDefault())}>
          <input type="hidden" name="intent" value="reopen" />
          <input type="hidden" name="month" value={lastClosed} />
          <Stack spacing={0.5} sx={{ alignItems: 'flex-start' }}>
            <Button type="submit" variant="outlined" color="warning">
              Reabrir {monthName(lastClosed)}
            </Button>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Deshace el cierre y borra su transferencia. Solo se puede reabrir el último mes cerrado.
            </Typography>
          </Stack>
        </Form>
      ) : null}
    </Stack>
  );
};
