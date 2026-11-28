import { Box, Button, Stack, Typography } from '@mui/material';
import { Link } from 'react-router-dom';
import { Money } from '../components/Money';
import { firstMonthWithActivity } from '../data/mutations';
import { nextMonthToClose } from '../domain/closing';
import { monthOf } from '../domain/dates';
import { accumulatedSavings, savingsHistory } from '../domain/savings';
import { useRootData } from './root';
import { AmountText, monthLabel, shortMonth } from './shared';

const CHART_HEIGHT = 150;

export const HistoryScreen = () => {
  const { data, today } = useRootData();
  const first = firstMonthWithActivity(data);
  const all = savingsHistory(first ?? monthOf(today), monthOf(today), data.destinations, data.transactions);
  const recent = all.slice(-8);
  const largest = Math.max(...recent.map((row) => Math.abs(row.savingsCents)), 1);
  const toClose = nextMonthToClose(first, data.closings, today);
  return (
    <Stack spacing={3}>
      <Box>
        <Typography sx={{ color: 'text.secondary', fontWeight: 700 }}>Ahorrado en total</Typography>
        <Money cents={accumulatedSavings(data.destinations, data.transactions)} size="clamp(2.9rem, 16vw, 4rem)" />
      </Box>

      <Box
        role="img"
        aria-label="Ahorro de cada uno de los últimos meses"
        sx={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: 1,
          height: CHART_HEIGHT + 28,
          '@keyframes rise': { from: { transform: 'scaleY(0)' }, to: { transform: 'scaleY(1)' } },
        }}
      >
        {recent.map((row, index) => (
          <Stack key={row.month} sx={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end', height: '100%', gap: 0.75 }}>
            <Box
              sx={{
                width: '100%',
                maxWidth: 36,
                height: Math.max(6, (Math.abs(row.savingsCents) / largest) * CHART_HEIGHT),
                borderRadius: '10px',
                background:
                  row.savingsCents < 0
                    ? 'var(--mui-palette-error-main)'
                    : 'linear-gradient(180deg, var(--mui-palette-savings-dark), color-mix(in srgb, var(--mui-palette-savings-dark) 45%, transparent))',
                opacity: row.savingsCents === 0 ? 0.25 : 1,
                transformOrigin: 'bottom',
                animation: `rise 700ms ${index * 60}ms cubic-bezier(0.2, 0.8, 0.2, 1) both`,
              }}
            />
            <Typography sx={{ fontSize: 12, fontWeight: 700, color: 'text.secondary' }}>{shortMonth(row.month)}</Typography>
          </Stack>
        ))}
      </Box>

      {toClose ? (
        <Button component={Link} to="/close" viewTransition variant="contained" size="large">
          Cerrar {monthLabel(toClose).toLowerCase()}
        </Button>
      ) : null}

      <Box>
        <Typography variant="h6" sx={{ mb: 1 }}>
          Mes a mes
        </Typography>
        {[...all].reverse().map((row) => (
          <Stack key={row.month} direction="row" sx={{ justifyContent: 'space-between', alignItems: 'baseline', py: 1.5 }}>
            <Typography sx={{ fontWeight: 700 }}>
              {monthLabel(row.month)}
              {data.closings.some((closing) => closing.month === row.month) ? ' (cerrado)' : ''}
            </Typography>
            <AmountText cents={row.savingsCents} plus positive="savings" />
          </Stack>
        ))}
      </Box>
    </Stack>
  );
};
