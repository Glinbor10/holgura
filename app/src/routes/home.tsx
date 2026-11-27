import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import PaymentsIcon from '@mui/icons-material/Payments';
import RepeatIcon from '@mui/icons-material/Repeat';
import { Alert, Box, Button, Chip, Stack, Typography } from '@mui/material';
import { useState, type ReactElement } from 'react';
import { Link } from 'react-router-dom';
import { BalanceChart } from '../components/BalanceChart';
import { Money } from '../components/Money';
import { firstMonthWithActivity } from '../data/mutations';
import { allowance, available, destinationBalance } from '../domain/balances';
import { isBackupDue } from '../domain/backupReminder';
import { nextMonthToClose } from '../domain/closing';
import { monthOf } from '../domain/dates';
import { formatEuros } from '../domain/money';
import { availableByDay, dailyPace, daysLeftInMonth, spendingByCategory } from '../domain/pace';
import { monthlySavings } from '../domain/savings';
import { useRootData } from './root';
import { CategoryBadge, Ledger, categoryName, categoryStyle, monthLabel } from './shared';

const QUICK_ACTIONS: { to: string; label: string; icon: ReactElement }[] = [
  { to: '/add?kind=expense', label: 'Gasto', icon: <ArrowUpwardIcon /> },
  { to: '/add?kind=income', label: 'Ingreso', icon: <ArrowDownwardIcon /> },
  { to: '/payroll', label: 'Nómina', icon: <PaymentsIcon /> },
  { to: '/recurring', label: 'Fijos', icon: <RepeatIcon /> },
];

const ACCOUNT_GRADIENTS = [
  'linear-gradient(135deg, #3B55F0 0%, #7A5CFA 100%)',
  'linear-gradient(135deg, #0E9F6E 0%, #0A6E8A 100%)',
  'linear-gradient(135deg, #F5A524 0%, #E5484D 100%)',
];

export const HomeScreen = () => {
  const { data, today } = useRootData();
  const [scrub, setScrub] = useState<number | null>(null);
  const month = monthOf(today);
  const left = available(month, data.destinations, data.transactions, data.closings);
  const budget = allowance(month, data.destinations, data.transactions, data.closings);
  const todayIndex = Number(today.slice(8)) - 1;
  const series = availableByDay(month, budget, data.transactions);
  const shown = scrub === null ? left : series[scrub];
  const pace = dailyPace(left, today);
  const daysLeft = daysLeftInMonth(today);
  const toClose = nextMonthToClose(firstMonthWithActivity(data), data.closings, today);
  const backupDue = isBackupDue(data.lastExportAt, today, data.transactions.length > 0);
  const accounts = data.destinations.filter((destination) => !destination.archived);
  const savedThisMonth = monthlySavings(month, data.destinations, data.transactions);
  const byCategory = spendingByCategory(month, data.transactions).slice(0, 6);
  const totalSpent = byCategory.reduce((sum, item) => sum + item.cents, 0);
  const recent = [...data.transactions].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);

  return (
    <Stack spacing={3.5}>
      {toClose ? (
        <Alert severity="warning" action={<Button component={Link} to="/close" color="inherit">Cerrar</Button>}>
          {monthLabel(toClose)} ya terminó y sigue sin cerrar.
        </Alert>
      ) : null}
      {backupDue ? (
        <Alert severity="info" action={<Button component={Link} to="/settings" color="inherit">Exportar</Button>}>
          Tus datos solo están en este móvil. Guarda una copia de seguridad.
        </Alert>
      ) : null}

      <Box>
        <Typography sx={{ color: 'text.secondary', fontWeight: 700, minHeight: 24 }}>
          {scrub === null ? `Disponible en ${monthLabel(month).split(' ')[0].toLowerCase()}` : `Día ${scrub + 1} de ${monthLabel(month).split(' ')[0].toLowerCase()}`}
        </Typography>
        <Money cents={shown} size="clamp(2.9rem, 16vw, 4rem)" color={shown < 0 ? 'var(--mui-palette-error-main)' : undefined} />
        <Stack direction="row" sx={{ gap: 1, mt: 1.5, flexWrap: 'wrap', minHeight: 32 }}>
          <Chip label={left > 0 ? `${formatEuros(pace)} al día, ${daysLeft} ${daysLeft === 1 ? 'día' : 'días'}` : 'Presupuesto agotado'} />
          <Chip
            label={`${savedThisMonth >= 0 ? '+' : ''}${formatEuros(savedThisMonth)} ahorrados`}
            sx={{ color: 'info.main', bgcolor: 'color-mix(in srgb, var(--mui-palette-info-main) 16%, transparent)' }}
          />
        </Stack>
        <Box sx={{ mt: 2.5 }}>
          <BalanceChart
            values={series.slice(0, todayIndex + 1)}
            totalDays={series.length}
            startCents={budget}
            activeIndex={scrub}
            onScrub={setScrub}
          />
        </Box>
      </Box>

      <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
        {QUICK_ACTIONS.map((action) => (
          <Stack key={action.label} component={Link} to={action.to} viewTransition sx={{ alignItems: 'center', gap: 0.75, textDecoration: 'none', color: 'text.primary', width: 72 }}>
            <Box sx={{ width: 56, height: 56, borderRadius: '50%', display: 'grid', placeItems: 'center', bgcolor: 'action.hover', color: 'primary.main' }}>
              {action.icon}
            </Box>
            <Typography sx={{ fontSize: 13, fontWeight: 700 }}>{action.label}</Typography>
          </Stack>
        ))}
      </Stack>

      <Box
        sx={{
          display: 'flex',
          gap: 1.5,
          overflowX: 'auto',
          scrollSnapType: 'x mandatory',
          mx: { xs: -2, sm: -3 },
          px: { xs: 2, sm: 3 },
          scrollbarWidth: 'none',
          '&::-webkit-scrollbar': { display: 'none' },
        }}
      >
        {accounts.map((account, index) => (
          <Box
            key={account.id}
            sx={{
              flex: '0 0 72%',
              maxWidth: 280,
              minHeight: 124,
              scrollSnapAlign: 'start',
              p: 2.5,
              borderRadius: '24px',
              color: '#fff',
              background: ACCOUNT_GRADIENTS[index % ACCOUNT_GRADIENTS.length],
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <Typography sx={{ fontWeight: 700, opacity: 0.85 }}>{account.name}</Typography>
            <Money cents={destinationBalance(account, data.transactions)} size="1.9rem" />
          </Box>
        ))}
      </Box>

      {byCategory.length > 0 ? (
        <Box>
          <Typography variant="h6" sx={{ mb: 1.5 }}>
            En qué gastas
          </Typography>
          <Box sx={{ display: 'flex', gap: '3px', height: 12, borderRadius: 6, overflow: 'hidden', mb: 2 }}>
            {byCategory.map((item) => (
              <Box key={item.categoryId} sx={{ flex: item.cents, bgcolor: categoryStyle(categoryName(data, item.categoryId)).color }} />
            ))}
          </Box>
          {byCategory.map((item) => {
            const name = categoryName(data, item.categoryId);
            return (
              <Stack key={item.categoryId} direction="row" sx={{ alignItems: 'center', gap: 1.5, py: 1 }}>
                <CategoryBadge name={name} size={36} />
                <Typography sx={{ flex: 1, fontWeight: 700 }}>{name}</Typography>
                <Typography sx={{ color: 'text.secondary', fontWeight: 700 }}>
                  {Math.round((item.cents / totalSpent) * 100)}%
                </Typography>
                <Typography sx={{ fontWeight: 800, minWidth: 84, textAlign: 'right' }}>{formatEuros(item.cents)}</Typography>
              </Stack>
            );
          })}
        </Box>
      ) : null}

      <Box>
        <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="h6">Últimos movimientos</Typography>
          {recent.length > 0 ? (
            <Button component={Link} to="/movements" viewTransition size="small">
              Ver todos
            </Button>
          ) : null}
        </Stack>
        {recent.length === 0 ? (
          <Stack spacing={2} sx={{ alignItems: 'flex-start' }}>
            <Typography sx={{ color: 'text.secondary' }}>
              Todavía no hay movimientos. Apunta tu nómina para ver cuánto puedes gastar cada día.
            </Typography>
            <Button component={Link} to="/payroll" variant="contained">
              Ha llegado la nómina
            </Button>
          </Stack>
        ) : (
          <Ledger data={data} transactions={recent} today={today} />
        )}
      </Box>
    </Stack>
  );
};
