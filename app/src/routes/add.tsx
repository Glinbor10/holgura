import BackspaceOutlinedIcon from '@mui/icons-material/BackspaceOutlined';
import CloseIcon from '@mui/icons-material/Close';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Alert, Box, Button, ButtonBase, Collapse, IconButton, InputAdornment, Stack, TextField, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import { useState } from 'react';
import { Form, Link, redirect, useActionData, useSearchParams, type ActionFunctionArgs } from 'react-router-dom';
import { CategoryPicker } from '../components/CategoryPicker';
import { errorMessage } from '../data/errors';
import { addExpense, addIncome } from '../data/mutations';
import { mutate } from '../data/store';
import { pressKey } from '../domain/amountInput';
import { monthOf } from '../domain/dates';
import { centsToInput, formatEuros, parseEuros } from '../domain/money';
import { applyTemplate, defaultFundsMonth } from '../domain/payrollSplit';
import { useRootData } from './root';

type Kind = 'expense' | 'income' | 'payroll';

const KEY_ROWS = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  [',', '0', 'back'],
];

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
    } else {
      const allocations = [...form.entries()]
        .filter(([key]) => key.startsWith('alloc-'))
        .map(([key, value]) => ({ destinationId: key.slice('alloc-'.length), amountCents: parseEuros(String(value)) ?? 0 }))
        .filter((allocation) => allocation.amountCents > 0);
      if (allocations.reduce((sum, allocation) => sum + allocation.amountCents, 0) !== amount) {
        return { error: 'El reparto tiene que sumar exactamente el importe de la nómina.' };
      }
      await mutate((data) => addIncome(data, { date, allocations, fundsMonth: String(form.get('fundsMonth')), note }));
    }
  } catch (error) {
    return { error: errorMessage(error) };
  }
  return redirect('/');
};

const isKind = (value: string | null): value is Kind => value === 'expense' || value === 'income' || value === 'payroll';

export const AddScreen = () => {
  const { data, today } = useRootData();
  const result = useActionData() as { error?: string } | undefined;
  const [params] = useSearchParams();
  const destinations = data.destinations.filter((destination) => !destination.archived);
  const categories = data.categories.filter((category) => !category.archived);
  const initialKind = params.get('kind');
  const [kind, setKind] = useState<Kind>(isKind(initialKind) ? initialKind : 'expense');
  const [amountText, setAmountText] = useState('');
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? '');
  const [destinationId, setDestinationId] = useState(destinations.find((d) => d.kind === 'SPENDING')?.id ?? '');
  const [manual, setManual] = useState<Record<string, string> | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const amount = parseEuros(amountText);
  const split = applyTemplate(amount ?? 0, data.payrollTemplate);
  const previewOf = (id: string): string =>
    split.ok ? centsToInput(split.allocations.find((allocation) => allocation.destinationId === id)?.amountCents ?? 0) : '';
  const allocationText = (id: string): string => manual?.[id] ?? previewOf(id);
  const editAllocation = (id: string, value: string) =>
    setManual({ ...Object.fromEntries(destinations.map((d) => [d.id, allocationText(d.id)])), [id]: value });
  const fundsMonth = kind === 'payroll' ? defaultFundsMonth(today, data.payrollTemplate.fundsNextMonth) : monthOf(today);
  const submitLabel = amount === null ? 'Escribe un importe' : `Guardar ${formatEuros(amount)}`;

  return (
    <Form method="post">
      <Stack spacing={2.5} sx={{ minHeight: 'calc(100dvh - 32px)' }}>
        <Stack direction="row" sx={{ alignItems: 'center', gap: 1.5 }}>
          <ToggleButtonGroup
            exclusive
            fullWidth
            value={kind}
            onChange={(_event, value: Kind | null) => setKind(value ?? kind)}
            sx={{ flex: 1, '& .MuiToggleButtonGroup-grouped': { borderRadius: '999px !important', marginLeft: '0 !important', border: 0 } }}
          >
            <ToggleButton value="expense">Gasto</ToggleButton>
            <ToggleButton value="income">Ingreso</ToggleButton>
            <ToggleButton value="payroll">Nómina</ToggleButton>
          </ToggleButtonGroup>
          <IconButton component={Link} to="/" viewTransition aria-label="Cerrar sin guardar">
            <CloseIcon />
          </IconButton>
        </Stack>

        <input type="hidden" name="kind" value={kind} />
        <input type="hidden" name="amount" value={amountText} />
        <input type="hidden" name="categoryId" value={categoryId} />
        <input type="hidden" name="destinationId" value={destinationId} />

        {result?.error ? <Alert severity="error">{result.error}</Alert> : null}

        <Box sx={{ textAlign: 'center', py: 1 }} aria-live="polite">
          <Typography
            component="span"
            sx={{ fontSize: 'clamp(3.2rem, 18vw, 4.6rem)', fontWeight: 800, letterSpacing: '-0.04em', color: amountText ? 'text.primary' : 'text.secondary' }}
          >
            {amountText || '0'}
          </Typography>
          <Typography component="span" sx={{ fontSize: '2.4rem', fontWeight: 700, color: 'text.secondary', ml: 0.75 }}>
            €
          </Typography>
        </Box>

        {kind === 'expense' ? (
          <CategoryPicker categories={categories} value={categoryId} onChange={setCategoryId} />
        ) : null}

        {kind === 'income' ? (
          <Stack direction="row" sx={{ gap: 1, flexWrap: 'wrap' }}>
            {destinations.map((destination) => (
              <Button
                key={destination.id}
                onClick={() => setDestinationId(destination.id)}
                variant={destination.id === destinationId ? 'contained' : 'outlined'}
                color={destination.id === destinationId ? 'primary' : 'inherit'}
                sx={{ borderColor: 'divider' }}
              >
                {destination.name}
              </Button>
            ))}
          </Stack>
        ) : null}

        {kind === 'payroll' ? (
          <Stack spacing={1.25}>
            <Typography sx={{ fontWeight: 800 }}>Reparto</Typography>
            {destinations.map((destination) => (
              <TextField
                key={destination.id}
                name={`alloc-${destination.id}`}
                label={destination.name}
                value={allocationText(destination.id)}
                onChange={(event) => editAllocation(destination.id, event.target.value)}
                slotProps={{ htmlInput: { inputMode: 'decimal' }, input: { endAdornment: <InputAdornment position="end">€</InputAdornment> } }}
              />
            ))}
            {split.ok ? null : <Alert severity="warning">Las cantidades fijas de tu plantilla superan esta nómina. Ajusta el reparto a mano.</Alert>}
            {manual ? (
              <Box>
                <Button onClick={() => setManual(null)}>Volver al reparto de la plantilla</Button>
              </Box>
            ) : null}
          </Stack>
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

        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 0.5 }}>
          {KEY_ROWS.flat().map((key) => (
            <ButtonBase
              key={key}
              onClick={() => setAmountText(pressKey(amountText, key))}
              aria-label={key === 'back' ? 'Borrar último dígito' : key === ',' ? 'Coma decimal' : key}
              sx={{ height: 56, borderRadius: '16px', fontSize: '1.65rem', fontWeight: 700, '&:active': { bgcolor: 'action.hover' } }}
            >
              {key === 'back' ? <BackspaceOutlinedIcon /> : key}
            </ButtonBase>
          ))}
        </Box>

        <Box sx={{ pb: 'calc(8px + env(safe-area-inset-bottom))' }}>
          <Button type="submit" variant="contained" size="large" fullWidth disabled={amount === null}>
            {submitLabel}
          </Button>
        </Box>
      </Stack>
    </Form>
  );
};
