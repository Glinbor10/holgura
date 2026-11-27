import BackspaceOutlinedIcon from '@mui/icons-material/BackspaceOutlined';
import { Box, ButtonBase, Typography } from '@mui/material';
import { pressKey } from '../domain/amountInput';

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', ',', '0', 'back'];

export const AmountDisplay = ({ text }: { text: string }) => (
  <Box sx={{ textAlign: 'center', py: 1 }} aria-live="polite">
    <Typography
      component="span"
      sx={{ fontSize: 'clamp(3.2rem, 18vw, 4.6rem)', fontWeight: 800, letterSpacing: '-0.04em', color: text ? 'text.primary' : 'text.secondary' }}
    >
      {text || '0'}
    </Typography>
    <Typography component="span" sx={{ fontSize: '2.4rem', fontWeight: 700, color: 'text.secondary', ml: 0.75 }}>
      €
    </Typography>
  </Box>
);

/** The app's own numeric keypad, so the phone's keyboard never opens for amounts. */
export const Keypad = ({ text, onChange }: { text: string; onChange: (text: string) => void }) => (
  <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 0.5 }}>
    {KEYS.map((key) => (
      <ButtonBase
        key={key}
        onClick={() => onChange(pressKey(text, key))}
        aria-label={key === 'back' ? 'Borrar último dígito' : key === ',' ? 'Coma decimal' : key}
        sx={{ height: 56, borderRadius: '16px', fontSize: '1.65rem', fontWeight: 700, '&:active': { bgcolor: 'action.hover' } }}
      >
        {key === 'back' ? <BackspaceOutlinedIcon /> : key}
      </ButtonBase>
    ))}
  </Box>
);
