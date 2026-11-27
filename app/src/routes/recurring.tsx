import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import { Alert, Box, Button, Collapse, IconButton, InputAdornment, Stack, Switch, TextField, Typography } from '@mui/material';
import { useState } from 'react';
import { useFetcher, type ActionFunctionArgs } from 'react-router-dom';
import { CategoryPicker } from '../components/CategoryPicker';
import { Group, GroupRow } from '../components/Group';
import { Money } from '../components/Money';
import { PageHeader } from '../components/PageHeader';
import { addRecurring, deleteRecurring, updateRecurring } from '../data/mutations';
import { mutate } from '../data/store';
import { todayIso } from '../domain/dates';
import { formatEuros, parseEuros } from '../domain/money';
import { useRootData } from './root';
import { CategoryBadge, categoryName } from './shared';

export const recurringAction = async ({ request }: ActionFunctionArgs) => {
  const form = await request.formData();
  const intent = String(form.get('intent'));
  const id = String(form.get('id'));
  const today = todayIso();
  if (intent === 'add') {
    const amountCents = parseEuros(String(form.get('amount') ?? ''));
    const dayOfMonth = Number(form.get('dayOfMonth'));
    const name = String(form.get('name') ?? '').trim();
    if (amountCents === null || name === '' || !Number.isInteger(dayOfMonth) || dayOfMonth < 1 || dayOfMonth > 31) {
      return { error: 'Revisa el nombre, el importe y el día del mes (de 1 a 31).' };
    }
    await mutate((data) => addRecurring(data, { name, amountCents, categoryId: String(form.get('categoryId')), dayOfMonth }, today));
  } else if (intent === 'toggle') {
    await mutate((data) => updateRecurring(data, id, { active: form.get('active') === 'true' }, today));
  } else if (intent === 'delete') {
    await mutate((data) => deleteRecurring(data, id));
  }
  return { error: undefined };
};

export const RecurringScreen = () => {
  const { data } = useRootData();
  const fetcher = useFetcher<{ error?: string }>();
  const categories = data.categories.filter((category) => !category.archived);
  const [adding, setAdding] = useState(data.recurring.length === 0);
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? '');
  const active = data.recurring.filter((item) => item.active);
  const monthlyTotal = active.reduce((sum, item) => sum + item.amountCents, 0);

  const confirmDelete = (id: string, name: string) => {
    if (window.confirm(`¿Borrar "${name}"? Los gastos que ya se crearon se quedan en tus movimientos.`)) {
      fetcher.submit({ intent: 'delete', id }, { method: 'post' });
    }
  };

  return (
    <Stack spacing={3}>
      <PageHeader title="Gastos fijos" />

      <Box>
        <Typography sx={{ color: 'text.secondary', fontWeight: 700 }}>Cada mes se te descuentan</Typography>
        <Money cents={monthlyTotal} size="clamp(2.6rem, 14vw, 3.5rem)" />
        <Typography sx={{ color: 'text.secondary', mt: 0.5 }}>
          {active.length === 1 ? '1 gasto activo' : `${active.length} gastos activos`}. Se crean solos el día que elijas, al abrir la app.
        </Typography>
      </Box>

      {fetcher.data?.error ? <Alert severity="error">{fetcher.data.error}</Alert> : null}

      {data.recurring.length > 0 ? (
        <Group>
          {data.recurring.map((item) => (
            <GroupRow key={item.id}>
              <CategoryBadge name={categoryName(data, item.categoryId)} />
              <Box sx={{ flex: 1, minWidth: 0, opacity: item.active ? 1 : 0.55 }}>
                <Typography noWrap sx={{ fontWeight: 700 }}>
                  {item.name}
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  <Box component="span" sx={{ fontWeight: 800, color: 'text.primary' }}>
                    {formatEuros(item.amountCents)}
                  </Box>
                  {` · día ${item.dayOfMonth}`}
                </Typography>
              </Box>
              <Switch
                checked={item.active}
                onChange={(event) => fetcher.submit({ intent: 'toggle', id: item.id, active: String(event.target.checked) }, { method: 'post' })}
                slotProps={{ input: { 'aria-label': `${item.name} activo` } }}
              />
              <IconButton aria-label={`Borrar ${item.name}`} size="small" onClick={() => confirmDelete(item.id, item.name)}>
                <DeleteOutlinedIcon fontSize="small" />
              </IconButton>
            </GroupRow>
          ))}
        </Group>
      ) : (
        <Typography sx={{ color: 'text.secondary' }}>
          Aún no tienes gastos fijos. Añade el alquiler, las suscripciones o cualquier pago que se repita cada mes y la app los apuntará por ti.
        </Typography>
      )}

      <Box>
        <Button variant={adding ? 'text' : 'contained'} onClick={() => setAdding(!adding)}>
          {adding ? 'Cancelar' : 'Añadir gasto fijo'}
        </Button>
        <Collapse in={adding}>
          <fetcher.Form method="post" onSubmit={() => setAdding(false)}>
            <Stack spacing={2} sx={{ pt: 2 }}>
              <input type="hidden" name="intent" value="add" />
              <input type="hidden" name="categoryId" value={categoryId} />
              <TextField name="name" label="Nombre (alquiler, gimnasio…)" required />
              <Stack direction="row" spacing={1.5}>
                <TextField
                  name="amount"
                  label="Importe"
                  required
                  fullWidth
                  slotProps={{ htmlInput: { inputMode: 'decimal' }, input: { endAdornment: <InputAdornment position="end">€</InputAdornment> } }}
                />
                <TextField name="dayOfMonth" label="Día del mes" type="number" defaultValue={1} required fullWidth slotProps={{ htmlInput: { min: 1, max: 31 } }} />
              </Stack>
              <CategoryPicker categories={categories} value={categoryId} onChange={setCategoryId} />
              <Button type="submit" variant="contained" size="large">
                Guardar gasto fijo
              </Button>
            </Stack>
          </fetcher.Form>
        </Collapse>
      </Box>
    </Stack>
  );
};
