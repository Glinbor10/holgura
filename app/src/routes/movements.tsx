import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import { Box, IconButton, Stack, Typography } from '@mui/material';
import { Link, useFetcher, useSearchParams, type ActionFunctionArgs } from 'react-router-dom';
import { errorMessage } from '../data/errors';
import { deleteTransaction } from '../data/mutations';
import { mutate } from '../data/store';
import { monthOf, nextMonth, prevMonth } from '../domain/dates';
import { formatEuros } from '../domain/money';
import { useRootData } from './root';
import { ErrorAlert, Ledger, monthLabel } from './shared';

export const movementsAction = async ({ request }: ActionFunctionArgs) => {
  const form = await request.formData();
  try {
    await mutate((data) => deleteTransaction(data, String(form.get('id'))));
  } catch (error) {
    return { error: errorMessage(error) };
  }
  return { error: undefined };
};

const Stat = ({ label, cents, color }: { label: string; cents: number; color?: string }) => (
  <Box sx={{ flex: 1, bgcolor: 'background.paper', borderRadius: '20px', p: 2 }}>
    <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 700 }}>
      {label}
    </Typography>
    <Typography sx={{ fontSize: '1.35rem', fontWeight: 800, letterSpacing: '-0.02em', color }}>{formatEuros(cents)}</Typography>
  </Box>
);

export const MovementsScreen = () => {
  const { data, today } = useRootData();
  const [params, setParams] = useSearchParams();
  const fetcher = useFetcher<{ error?: string }>();
  const month = params.get('month') ?? monthOf(today);
  const closed = data.closings.some((closing) => closing.month === month);
  const items = data.transactions.filter((tx) => monthOf(tx.date) === month);
  const spent = items.filter((tx) => tx.type === 'EXPENSE').reduce((sum, tx) => sum + tx.amountCents, 0);
  const earned = items.filter((tx) => tx.type === 'INCOME').reduce((sum, tx) => sum + tx.amountCents, 0);
  const confirmDelete = (event: { preventDefault: () => void }) => {
    if (!window.confirm('¿Borrar este movimiento?')) {
      event.preventDefault();
    }
  };
  return (
    <Stack spacing={2.5}>
      <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
        <IconButton aria-label="Mes anterior" onClick={() => setParams({ month: prevMonth(month) })}>
          <ChevronLeftIcon />
        </IconButton>
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h5">{monthLabel(month)}</Typography>
          {closed ? <Typography sx={{ color: 'text.secondary' }}>Mes cerrado</Typography> : null}
        </Box>
        <IconButton aria-label="Mes siguiente" onClick={() => setParams({ month: nextMonth(month) })}>
          <ChevronRightIcon />
        </IconButton>
      </Stack>
      <Stack direction="row" spacing={1.5}>
        <Stat label="Gastado" cents={spent} />
        <Stat label="Ingresado" cents={earned} color="var(--mui-palette-success-main)" />
      </Stack>
      <ErrorAlert message={fetcher.data?.error} />
      {items.length === 0 ? (
        <Typography sx={{ color: 'text.secondary', textAlign: 'center', py: 6 }}>
          No hay movimientos en {monthLabel(month).toLowerCase()}.
        </Typography>
      ) : (
        <Ledger
          data={data}
          transactions={items}
          today={today}
          action={(tx) =>
            tx.type === 'TRANSFER' ? null : (
              <Stack direction="row">
                <IconButton component={Link} to={`/edit/${tx.id}`} viewTransition aria-label="Editar movimiento" size="small">
                  <EditOutlinedIcon fontSize="small" />
                </IconButton>
                <fetcher.Form method="post" onSubmit={confirmDelete}>
                  <input type="hidden" name="id" value={tx.id} />
                  <IconButton type="submit" aria-label="Borrar movimiento" size="small">
                    <DeleteOutlinedIcon fontSize="small" />
                  </IconButton>
                </fetcher.Form>
              </Stack>
            )
          }
        />
      )}
    </Stack>
  );
};
