import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import CategoryIcon from '@mui/icons-material/Category';
import DirectionsBusIcon from '@mui/icons-material/DirectionsBus';
import FavoriteIcon from '@mui/icons-material/Favorite';
import HomeIcon from '@mui/icons-material/Home';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import MovieIcon from '@mui/icons-material/Movie';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import { Box, Stack, Typography } from '@mui/material';
import type { ReactElement, ReactNode } from 'react';
import type { AppData } from '../data/appData';
import { formatEuros } from '../domain/money';
import type { IsoDate, Month, Transaction } from '../domain/types';

export const categoryName = (data: AppData, id?: string): string =>
  data.categories.find((category) => category.id === id)?.name ?? 'Sin categoría';

export const destinationName = (data: AppData, id?: string): string =>
  data.destinations.find((destination) => destination.id === id)?.name ?? '—';

export const describeTransaction = (data: AppData, tx: Transaction): string => {
  if (tx.type === 'EXPENSE') {
    return categoryName(data, tx.categoryId);
  }
  if (tx.type === 'INCOME') {
    return tx.allocations && tx.allocations.length > 1 ? 'Nómina' : 'Ingreso';
  }
  return `De ${destinationName(data, tx.fromDestinationId)} a ${destinationName(data, tx.toDestinationId)}`;
};

export const signedAmount = (tx: Transaction): number => (tx.type === 'EXPENSE' ? -tx.amountCents : tx.amountCents);

export const byDateDesc = (a: Transaction, b: Transaction): number => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0);

const capitalize = (text: string): string => text.charAt(0).toUpperCase() + text.slice(1);
const toDate = (iso: IsoDate): Date => new Date(Number(iso.slice(0, 4)), Number(iso.slice(5, 7)) - 1, Number(iso.slice(8, 10)));

export const dayLabel = (date: IsoDate, today: IsoDate): string => {
  const diffDays = Math.round((toDate(today).getTime() - toDate(date).getTime()) / 86_400_000);
  if (diffDays === 0) {
    return 'Hoy';
  }
  if (diffDays === 1) {
    return 'Ayer';
  }
  return capitalize(new Intl.DateTimeFormat('es-ES', { weekday: 'long', day: 'numeric', month: 'long' }).format(toDate(date)));
};

export const monthLabel = (month: Month): string =>
  capitalize(new Intl.DateTimeFormat('es-ES', { month: 'long', year: 'numeric' }).format(toDate(`${month}-01`)));

export const shortMonth = (month: Month): string =>
  new Intl.DateTimeFormat('es-ES', { month: 'short' }).format(toDate(`${month}-01`)).replace('.', '');

/** Positive amounts are green (income) or gold (savings). */
export const AmountText = ({ cents, plus = false, positive = 'income' }: { cents: number; plus?: boolean; positive?: 'income' | 'savings' }) => (
  <Typography
    component="span"
    sx={(theme) => ({
      fontWeight: 800,
      color: cents < 0 ? 'text.primary' : plus && cents > 0 ? (positive === 'savings' ? 'secondary.main' : 'success.main') : 'text.primary',
      ...(positive === 'savings' && plus && cents > 0 ? theme.applyStyles('light', { color: theme.palette.secondary.dark }) : {}),
    })}
  >
    {plus && cents > 0 ? '+' : ''}
    {formatEuros(cents)}
  </Typography>
);

interface CategoryStyle {
  icon: ReactElement;
  color: string;
}

const KNOWN_CATEGORIES: Record<string, CategoryStyle> = {
  comida: { icon: <RestaurantIcon />, color: '#FF9F43' },
  transporte: { icon: <DirectionsBusIcon />, color: '#2DA8FF' },
  casa: { icon: <HomeIcon />, color: '#8F7CFF' },
  ocio: { icon: <MovieIcon />, color: '#FF6B9A' },
  salud: { icon: <FavoriteIcon />, color: '#FF6B6F' },
  otros: { icon: <MoreHorizIcon />, color: '#8E91A3' },
};

const FALLBACK_COLORS = ['#2FD399', '#F5B14A', '#4FD1C5', '#C084FC', '#60A5FA', '#F472B6'];

export const categoryStyle = (name: string): CategoryStyle => {
  const known = KNOWN_CATEGORIES[name.toLowerCase()];
  if (known) {
    return known;
  }
  const hash = [...name].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return { icon: <CategoryIcon />, color: FALLBACK_COLORS[hash % FALLBACK_COLORS.length] };
};

const Badge = ({ icon, color, size }: { icon: ReactElement; color: string; size: number }) => (
  <Box
    aria-hidden
    sx={{
      width: size,
      height: size,
      flexShrink: 0,
      borderRadius: '50%',
      display: 'grid',
      placeItems: 'center',
      color,
      backgroundColor: `color-mix(in srgb, ${color} 18%, transparent)`,
      '& svg': { fontSize: size * 0.5 },
    }}
  >
    {icon}
  </Box>
);

export const CategoryBadge = ({ name, size = 44 }: { name: string; size?: number }) => {
  const style = categoryStyle(name);
  return <Badge icon={style.icon} color={style.color} size={size} />;
};

const TransactionBadge = ({ data, tx }: { data: AppData; tx: Transaction }) => {
  if (tx.type === 'EXPENSE') {
    return <CategoryBadge name={categoryName(data, tx.categoryId)} />;
  }
  return tx.type === 'INCOME' ? (
    <Badge icon={<ArrowDownwardIcon />} color="#2FD399" size={44} />
  ) : (
    <Badge icon={<SwapHorizIcon />} color="#A692FF" size={44} />
  );
};

interface LedgerProps {
  data: AppData;
  transactions: Transaction[];
  today: IsoDate;
  action?: (tx: Transaction) => ReactNode;
}

/** Movements grouped by day, newest first. */
export const Ledger = ({ data, transactions, today, action }: LedgerProps) => {
  const groups = [...transactions]
    .sort(byDateDesc)
    .reduce((map, tx) => map.set(tx.date, [...(map.get(tx.date) ?? []), tx]), new Map<IsoDate, Transaction[]>());
  return (
    <Stack spacing={2.5}>
      {[...groups].map(([date, items]) => (
        <Box key={date}>
          <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 700, mb: 0.5 }}>
            {dayLabel(date, today)}
          </Typography>
          {items.map((tx) => (
            <Box key={tx.id} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1.25 }}>
              <TransactionBadge data={data} tx={tx} />
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography noWrap sx={{ fontWeight: 700 }}>
                  {describeTransaction(data, tx)}
                </Typography>
                {tx.note ? (
                  <Typography noWrap variant="body2" sx={{ color: 'text.secondary' }}>
                    {tx.note}
                  </Typography>
                ) : null}
              </Box>
              <AmountText cents={signedAmount(tx)} plus />
              {action ? action(tx) : null}
            </Box>
          ))}
        </Box>
      ))}
    </Stack>
  );
};
