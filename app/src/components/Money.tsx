import { Box } from '@mui/material';
import { formatEuros } from '../domain/money';

interface MoneyProps {
  cents: number;
  /** CSS font-size of the integer part; the decimals are rendered smaller. */
  size: string;
  color?: string;
}

/** Amount with a large integer part and smaller decimals, as bank apps show balances. */
export const Money = ({ cents, size, color }: MoneyProps) => {
  const text = formatEuros(cents);
  const split = text.lastIndexOf(',');
  return (
    <Box component="span" sx={{ fontSize: size, fontWeight: 800, letterSpacing: '-0.035em', lineHeight: 1.05, color }}>
      {text.slice(0, split)}
      <Box component="span" sx={{ fontSize: '0.5em', opacity: 0.55, letterSpacing: '-0.01em' }}>
        {text.slice(split)}
      </Box>
    </Box>
  );
};
