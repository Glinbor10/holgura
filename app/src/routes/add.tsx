import CloseIcon from '@mui/icons-material/Close';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Alert, Box, Button, Collapse, IconButton, Stack, TextField, Typography } from '@mui/material';
import { useState } from 'react';
import { Form, Link, redirect, useActionData, useSearchParams, type ActionFunctionArgs } from 'react-router-dom';
import { AmountDisplay, Keypad } from '../components/AmountPad';
import { CategoryPicker } from '../components/CategoryPicker';
import { TrendBackdrop } from '../components/TrendBackdrop';
import { errorMessage } from '../data/errors';
import { addExpense, addIncome } from '../data/mutations';
import { mutate } from '../data/store';
import { monthOf } from '../domain/dates';
import { formatEuros, parseEuros } from '../domain/money';
import { INSET_BOTTOM, INSET_TOP } from '../insets';
import { useRootData } from './root';

type Kind = 'expense' | 'income';

export const addAction = async ({ request }: ActionFunctionArgs) => {
  const form = await request.formData();
  const kind = String(form.get('kind'));
  const date = String(form.get('date') ?? '');
  const amount = parseEuros(String(form.get('amount') ?? ''));
  const note = String(form.get('note') ?? '').trim() || undefined;
  if (amount === null || date === '') {
    return { error: 'Escribe un importe mayor que 0 y elige una fecha.' };
  }
  try {
    if (kind === 'expense') {
      await mutate((data) => addExpense(data, { date, amountCents: amount, categoryId: String(form.get('categoryId')), note }));
    } else if (kind === 'income') {
      const allocations = [{ destinationId: String(form.get('destinationId')), amountCents: amount }];
      await mutate((data) => addIncome(data, { date, allocations, fundsMonth: String(form.get('fundsMonth')), note }));
    }
  } catch (error) {
    return { error: errorMessage(error) };
  }
  return redirect('/');
};

const isKind = (value: string | null): value is Kind => value === 'expense' || value === 'income';

export const AddScreen = () => {
  const { data, today } = useRootData();
  const result = useActionData() as { error?: string } | undefined;
  const [params] = useSearchParams();
  const spendingId = data.destinations.find((destination) => destination.kind === 'SPENDING')?.id ?? '';
  const categories = data.categories.filter((category) => !category.archived);
  const initialKind = params.get('kind');
  const kind: Kind = isKind(initialKind) ? initialKind : 'expense';
  const [amountText, setAmountText] = useState('');
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? '');
  const [showDetails, setShowDetails] = useState(false);

  const amount = parseEuros(amountText);
  const fundsMonth = monthOf(today);
  const submitLabel = amount === null ? 'Escribe un importe' : `Guardar ${formatEuros(amount)}`;

  return (
    <Box sx={{ position: 'relative' }}>
      <TrendBackdrop kind={kind} />
      <Form method="post">
      <Stack spacing={2.5} sx={{ position: 'relative', minHeight: `calc(100dvh - 32px - ${INSET_TOP})` }}>
        <Stack direction="row" sx={{ alignItems: 'center', gap: 1.5 }}>
          <Typography variant="h5" sx={{ flex: 1, fontWeight: 800 }}>
            {kind === 'expense' ? 'Nuevo gasto' : 'Nuevo ingreso'}
          </Typography>
          <IconButton component={Link} to="/" viewTransition aria-label="Cerrar sin guardar">
            <CloseIcon />
          </IconButton>
        </Stack>

        <input type="hidden" name="kind" value={kind} />
        <input type="hidden" name="amount" value={amountText} />
        <input type="hidden" name="categoryId" value={categoryId} />
        <input type="hidden" name="destinationId" value={spendingId} />

        {result?.error ? <Alert severity="error">{result.error}</Alert> : null}

        <AmountDisplay text={amountText} />

        {kind === 'expense' ? (
          <CategoryPicker categories={categories} value={categoryId} onChange={setCategoryId} />
        ) : null}

        <Box>
          <Button
            onClick={() => setShowDetails(!showDetails)}
            color="inherit"
            endIcon={<ExpandMoreIcon sx={{ transform: showDetails ? 'rotate(180deg)' : 'none', transition: 'transform 220ms' }} />}
            sx={{ color: 'text.secondary' }}
          >
            Fecha, nota y más
          </Button>
          <Collapse in={showDetails}>
            <Stack spacing={1.5} sx={{ pt: 1.5 }}>
              <Stack direction="row" spacing={1.5}>
                <TextField name="date" label="Fecha" type="date" defaultValue={today} required fullWidth slotProps={{ inputLabel: { shrink: true } }} />
                {kind === 'expense' ? null : (
                  <TextField key={kind} name="fundsMonth" label="Mes que financia" type="month" defaultValue={fundsMonth} required fullWidth slotProps={{ inputLabel: { shrink: true } }} />
                )}
              </Stack>
              <TextField name="note" label="Nota (opcional)" />
            </Stack>
          </Collapse>
        </Box>

        <Box sx={{ flex: 1 }} />

        <Keypad text={amountText} onChange={setAmountText} />

        <Box sx={{ pb: `calc(8px + ${INSET_BOTTOM})` }}>
          <Button type="submit" variant="contained" size="large" fullWidth disabled={amount === null}>
            {submitLabel}
          </Button>
        </Box>
      </Stack>
      </Form>
    </Box>
  );
};
