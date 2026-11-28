import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import PaymentsIcon from '@mui/icons-material/Payments';
import { Alert, Box, Button, Chip, Stack, Typography } from '@mui/material';
import { useMemo, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { BalanceChart } from '../components/BalanceChart';
import { Money } from '../components/Money';
import { savingsDestination } from '../data/appData';
import { firstMonthWithActivity } from '../data/mutations';
import { firstTransactionDate, latestTransactions } from '../domain/activity';
import { allowance, available, destinationBalance } from '../domain/balances';
import { isBackupDue } from '../domain/backupReminder';
import { nextMonthToClose } from '../domain/closing';
import { monthOf } from '../domain/dates';
import { payrollReceived } from '../domain/payrollSplit';
import { formatEuros } from '../domain/money';
import { availableByDay, dailyPace, daysLeftInMonth, spendingByCategory } from '../domain/pace';
import { monthlySavings } from '../domain/savings';
import { useRootData } from './root';
import { CategoryBadge, Ledger, categoryName, categoryStyle, monthLabel } from './shared';

interface BalanceProps {
  monthName: string;
  left: number;
  budget: number;
  series: number[];
  todayIndex: number;
  children: ReactNode;
}

/**
 * The big amount and its chart. The finger-scrub state lives here, so dragging over the chart only re-renders
 * this component and not the whole home screen with its numbers over every movement.
 */
const Balance = ({ monthName, left, budget, series, todayIndex, children }: BalanceProps) => {
  const [scrub, setScrub] = useState<number | null>(null);
  const shown = scrub === null ? left : series[scrub];
  const values = useMemo(() => series.slice(0, todayIndex + 1), [series, todayIndex]);
  return (
    <Box>
      <Typography sx={{ color: 'text.secondary', fontWeight: 700, minHeight: 24 }}>
        {scrub === null ? `Disponible en ${monthName}` : `Día ${scrub + 1} de ${monthName}`}
      </Typography>
      <Money cents={shown} size="clamp(2.9rem, 16vw, 4rem)" color={shown < 0 ? 'var(--mui-palette-error-main)' : undefined} />
      {children}
      <Box sx={{ mt: 2.5 }}>
        <BalanceChart values={values} totalDays={series.length} startCents={budget} activeIndex={scrub} onScrub={setScrub} />
      </Box>
    </Box>
  );
};

export const HomeScreen = () => {
  const { data, today } = useRootData();
  const month = monthOf(today);
  const left = available(month, data.destinations, data.transactions, data.closings);
  const budget = allowance(month, data.destinations, data.transactions, data.closings);
  const todayIndex = Number(today.slice(8)) - 1;
  const series = availableByDay(month, budget, data.transactions);
  const pace = dailyPace(left, today);
  const daysLeft = daysLeftInMonth(today);
  const toClose = nextMonthToClose(firstMonthWithActivity(data), data.closings, today);
  const backupDue = isBackupDue(data.lastExportAt, firstTransactionDate(data.transactions), today);
  const savingsAccount = savingsDestination(data);
  const savings = savingsAccount ? destinationBalance(savingsAccount, data.transactions) : 0;
  const payrollPending = !payrollReceived(data.transactions, month);
  const savedThisMonth = monthlySavings(month, data.destinations, data.transactions);
  const byCategory = spendingByCategory(month, data.transactions).slice(0, 6);
  const totalSpent = byCategory.reduce((sum, item) => sum + item.cents, 0);
  const recent = latestTransactions(data.transactions, 5);

  return (
    <Stack spacing={3.5}>
      {toClose ? (
        <Alert severity="warning" action={<Button component={Link} to="/close" color="inherit">Cerrar</Button>}>
          {monthLabel(toClose)} ya terminó y sigue sin cerrar.
        </Alert>
      ) : null}
      {backupDue ? (
        <Alert severity="info" action={<Button component={Link} to="/settings" color="inherit">Exportar</Button>}>
          Si borras la app, pierdes tus datos. Exporta una copia.
        </Alert>
      ) : null}

      <Balance monthName={monthLabel(month).split(' ')[0].toLowerCase()} left={left} budget={budget} series={series} todayIndex={todayIndex}>
        <Stack direction="row" sx={{ gap: 1, mt: 1.5, flexWrap: 'wrap', minHeight: 32 }}>
          <Chip label={left > 0 ? `${formatEuros(pace)} al día, ${daysLeft} ${daysLeft === 1 ? 'día' : 'días'}` : 'Presupuesto agotado'} />
          <Chip
            label={`${savedThisMonth >= 0 ? '+' : ''}${formatEuros(savedThisMonth)} ahorrados`}
            sx={(theme) => ({
              color: 'secondary.main',
              bgcolor: 'color-mix(in srgb, var(--mui-palette-secondary-main) 16%, transparent)',
              ...theme.applyStyles('light', { color: theme.palette.secondary.dark }),
            })}
          />
        </Stack>
        {payrollPending ? (
          <Button component={Link} to="/payroll" viewTransition variant="outlined" color="inherit" startIcon={<PaymentsIcon />} sx={{ mt: 2, borderColor: 'divider' }}>
            Ha llegado la nómina
          </Button>
        ) : null}
      </Balance>

      {savings > 0 ? (
        <Box
          component={Link}
          to="/history"
          viewTransition
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            p: 2.5,
            borderRadius: '24px',
            color: '#14142B',
            textDecoration: 'none',
            background: 'linear-gradient(135deg, #FFD27A 0%, #F5B14A 55%, #E5922A 100%)',
          }}
        >
          <Box>
            <Typography sx={{ fontWeight: 700, opacity: 0.85 }}>Ahorrado</Typography>
            <Money cents={savings} size="1.9rem" />
          </Box>
          <ChevronRightIcon />
        </Box>
      ) : null}

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
          <Stack spacing={1}>
            <Typography sx={{ color: 'text.secondary' }}>Todavía no hay movimientos. Registra tu nómina o apunta un gasto con el botón +.</Typography>
            <Typography sx={{ color: 'text.secondary' }}>
              ¿Ya tienes ahorros? Indícalos en{' '}
              <Link to="/settings" style={{ color: 'inherit', fontWeight: 700 }}>
                Configuración
              </Link>
              .
            </Typography>
          </Stack>
        ) : (
          <Ledger data={data} transactions={recent} today={today} />
        )}
      </Box>
    </Stack>
  );
};
