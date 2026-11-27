import CloseIcon from '@mui/icons-material/Close';
import { Alert, Box, Button, IconButton, InputAdornment, Stack, TextField, Typography } from '@mui/material';
import { useState } from 'react';
import { Form, redirect, useActionData, useNavigate, useParams, type ActionFunctionArgs } from 'react-router-dom';
import { CategoryPicker } from '../components/CategoryPicker';
import { errorMessage } from '../data/errors';
import { updateTransaction } from '../data/mutations';
import { mutate } from '../data/store';
import { centsToInput, parseEuros } from '../domain/money';
import type { Transaction } from '../domain/types';
import { useRootData } from './root';

export const editAction = async ({ request, params }: ActionFunctionArgs) => {
  const form = await request.formData();
  const date = String(form.get('date') ?? '');
  const note = String(form.get('note') ?? '').trim() || undefined;
  const amountField = form.get('amount');
  const amount = amountField === null ? undefined : parseEuros(String(amountField));
  if (date === '' || amount === null) {
    return { error: 'Escribe un importe mayor que 0 y elige una fecha.' };
  }
  const patch: Partial<Transaction> = { date, note };
  if (form.get('categoryId')) {
    patch.categoryId = String(form.get('categoryId'));
  }
  if (form.get('fundsMonth')) {
    patch.fundsMonth = String(form.get('fundsMonth'));
  }
  if (amount !== undefined) {
    patch.amountCents = amount;
    if (form.get('singleDestinationId')) {
      patch.allocations = [{ destinationId: String(form.get('singleDestinationId')), amountCents: amount }];
    }
  }
  try {
    await mutate((data) => updateTransaction(data, String(params.id), patch));
  } catch (error) {
    return { error: errorMessage(error) };
  }
  return redirect('/movements');
};

export const EditScreen = () => {
  const { data } = useRootData();
  const { id } = useParams();
  const navigate = useNavigate();
  const result = useActionData() as { error?: string } | undefined;
  const tx = data.transactions.find((item) => item.id === id);
  const categories = data.categories.filter((category) => !category.archived || category.id === tx?.categoryId);
  const [categoryId, setCategoryId] = useState(tx?.categoryId ?? '');

  if (!tx) {
    return (
      <Stack spacing={2} sx={{ alignItems: 'flex-start', pt: 4 }}>
        <Typography variant="h5">No encuentro ese movimiento</Typography>
        <Typography sx={{ color: 'text.secondary' }}>Puede que lo hayas borrado. Vuelve a la lista para ver el resto.</Typography>
        <Button variant="contained" onClick={() => navigate('/movements')}>
          Ir a movimientos
        </Button>
      </Stack>
    );
  }

  const singleAllocation = tx.type === 'INCOME' && tx.allocations?.length === 1 ? tx.allocations[0] : undefined;
  const amountEditable = tx.type === 'EXPENSE' || singleAllocation !== undefined;

  return (
    <Form method="post">
      <Stack spacing={3} sx={{ minHeight: 'calc(100dvh - 32px)' }}>
        <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h5">{tx.type === 'EXPENSE' ? 'Editar gasto' : 'Editar ingreso'}</Typography>
          <IconButton aria-label="Cerrar sin guardar" onClick={() => navigate(-1)}>
            <CloseIcon />
          </IconButton>
        </Stack>

        {result?.error ? <Alert severity="error">{result.error}</Alert> : null}

        {amountEditable ? (
          <TextField
            name="amount"
            variant="standard"
            defaultValue={centsToInput(tx.amountCents)}
            required
            sx={{ alignSelf: 'center' }}
            slotProps={{
              htmlInput: { inputMode: 'decimal', 'aria-label': 'Importe en euros', style: { textAlign: 'center' } },
              input: {
                disableUnderline: true,
                sx: { fontSize: 'clamp(3rem, 16vw, 4.2rem)', fontWeight: 800, letterSpacing: '-0.04em' },
                endAdornment: (
                  <InputAdornment position="end" sx={{ '& p': { fontSize: '2.2rem', fontWeight: 700, color: 'text.secondary' } }}>
                    €
                  </InputAdornment>
                ),
              },
            }}
          />
        ) : (
          <Alert severity="info">Este ingreso tiene un reparto entre destinos. Para cambiar el importe, bórralo y vuelve a apuntarlo.</Alert>
        )}
        {singleAllocation ? <input type="hidden" name="singleDestinationId" value={singleAllocation.destinationId} /> : null}

        {tx.type === 'EXPENSE' ? (
          <Box>
            <input type="hidden" name="categoryId" value={categoryId} />
            <CategoryPicker categories={categories} value={categoryId} onChange={setCategoryId} />
          </Box>
        ) : null}

        <Stack direction="row" spacing={1.5}>
          <TextField name="date" label="Fecha" type="date" defaultValue={tx.date} required fullWidth slotProps={{ inputLabel: { shrink: true } }} />
          {tx.type === 'INCOME' ? (
            <TextField
              name="fundsMonth"
              label="Mes que financia"
              type="month"
              defaultValue={tx.fundsMonth ?? tx.date.slice(0, 7)}
              fullWidth
              slotProps={{ inputLabel: { shrink: true } }}
            />
          ) : null}
        </Stack>
        <TextField name="note" label="Nota (opcional)" defaultValue={tx.note ?? ''} />

        <Box sx={{ flex: 1 }} />
        <Box sx={{ pb: 'calc(8px + env(safe-area-inset-bottom))' }}>
          <Button type="submit" variant="contained" size="large" fullWidth>
            Guardar cambios
          </Button>
        </Box>
      </Stack>
    </Form>
  );
};
