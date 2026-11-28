import CloseIcon from '@mui/icons-material/Close';
import { Alert, Box, Button, Chip, IconButton, Stack, Typography } from '@mui/material';
import { useState } from 'react';
import { Form, Link, redirect, useActionData, type ActionFunctionArgs } from 'react-router-dom';
import { AmountDisplay, Keypad } from '../components/AmountPad';
import { errorMessage } from '../data/errors';
import { addIncome } from '../data/mutations';
import { mutate } from '../data/store';
import { monthOf, nextMonth, todayIso } from '../domain/dates';
import { centsToInput, formatEuros, parseEuros } from '../domain/money';
import { PAYROLL_NOTE, applyTemplate, defaultFundsMonth } from '../domain/payrollSplit';
import { INSET_BOTTOM, INSET_TOP } from '../insets';
import { useRootData } from './root';
import { destinationName, monthLabel } from './shared';

export const payrollAction = async ({ request }: ActionFunctionArgs) => {
  const form = await request.formData();
  const amount = parseEuros(String(form.get('amount') ?? ''));
  if (amount === null) {
    return { error: 'Escribe el importe de la nómina.' };
  }
  try {
    await mutate((data) => {
      const split = applyTemplate(amount, data.payrollTemplate);
      if (!split.ok) {
        throw new Error('FIXED_LINES_EXCEED_AMOUNT');
      }
      return addIncome(data, { date: todayIso(), allocations: split.allocations, fundsMonth: String(form.get('fundsMonth')), note: PAYROLL_NOTE, isPayroll: true });
    });
  } catch (error) {
    return { error: errorMessage(error) };
  }
  return redirect('/');
};

export const PayrollScreen = () => {
  const { data, today } = useRootData();
  const result = useActionData() as { error?: string } | undefined;
  const template = data.payrollTemplate;
  const [amountText, setAmountText] = useState(template.amountCents ? centsToInput(template.amountCents) : '');
  const [fundsMonth, setFundsMonth] = useState(defaultFundsMonth(today, template.fundsNextMonth));
  const amount = parseEuros(amountText);
  const split = applyTemplate(amount ?? 0, template);
  const months = [monthOf(today), nextMonth(monthOf(today)), nextMonth(nextMonth(monthOf(today)))];

  return (
    <Form method="post">
      <Stack spacing={2.5} sx={{ minHeight: `calc(100dvh - 32px - ${INSET_TOP})` }}>
        <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h5" sx={{ fontWeight: 800 }}>
            Ha llegado la nómina
          </Typography>
          <IconButton component={Link} to="/" viewTransition aria-label="Cerrar sin guardar">
            <CloseIcon />
          </IconButton>
        </Stack>

        <input type="hidden" name="amount" value={amountText} />
        <input type="hidden" name="fundsMonth" value={fundsMonth} />

        {result?.error ? <Alert severity="error">{result.error}</Alert> : null}

        <AmountDisplay text={amountText} />

        <Box>
          <Typography sx={{ fontWeight: 800, mb: 1 }}>¿Para qué mes es?</Typography>
          <Stack direction="row" sx={{ gap: 1, flexWrap: 'wrap' }}>
            {months.map((month) => (
              <Chip
                key={month}
                label={monthLabel(month)}
                onClick={() => setFundsMonth(month)}
                color={month === fundsMonth ? 'primary' : 'default'}
                variant={month === fundsMonth ? 'filled' : 'outlined'}
              />
            ))}
          </Stack>
        </Box>

        {split.ok ? (
          amount === null ? null : (
            <Box>
              <Typography sx={{ fontWeight: 800, mb: 0.5 }}>Así se reparte</Typography>
              {split.allocations.map((allocation) => (
                <Stack key={allocation.destinationId} direction="row" sx={{ justifyContent: 'space-between', py: 0.25 }}>
                  <Typography sx={{ color: 'text.secondary' }}>{destinationName(data, allocation.destinationId)}</Typography>
                  <Typography sx={{ fontWeight: 700 }}>{formatEuros(allocation.amountCents)}</Typography>
                </Stack>
              ))}
              <Button component={Link} to="/settings" size="small" sx={{ mt: 0.5, ml: -1 }}>
                Cambiar en Configuración
              </Button>
            </Box>
          )
        ) : (
          <Alert severity="warning" action={<Button component={Link} to="/settings" color="inherit">Configuración</Button>}>
            Lo que va a cada destino supera esta nómina.
          </Alert>
        )}

        <Box sx={{ flex: 1 }} />

        <Keypad text={amountText} onChange={setAmountText} />

        <Box sx={{ pb: `calc(8px + ${INSET_BOTTOM})` }}>
          <Button type="submit" variant="contained" size="large" fullWidth disabled={amount === null || !split.ok}>
            {amount === null ? 'Escribe un importe' : `Registrar ${formatEuros(amount)}`}
          </Button>
        </Box>
      </Stack>
    </Form>
  );
};
