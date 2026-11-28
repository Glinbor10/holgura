import { Box } from '@mui/material';
import { keyframes } from '@mui/material/styles';
import { useId } from 'react';

const pulse = keyframes`
  0%, 100% { opacity: 0.55; transform: scale(0.95); }
  50% { opacity: 1; transform: scale(1); }
`;

/** Full-screen loading state: the logo mark, pulsing. Matches the static one in index.html. */
export const Loading = () => {
  const id = useId();
  return (
    <Box role="status" aria-label="Cargando Holgura" sx={{ minHeight: '100dvh', display: 'grid', placeItems: 'center' }}>
      <Box
        component="svg"
        viewBox="0 1 108 108"
        aria-hidden
        sx={{ width: 96, height: 96, animation: `${pulse} 1.4s ease-in-out infinite`, '@media (prefers-reduced-motion: reduce)': { animation: 'none' } }}
      >
        <defs>
          <linearGradient id={`${id}-b`} x1="22" y1="90" x2="54" y2="22" gradientUnits="userSpaceOnUse"><stop offset="0" stopColor="#3B55F0"/><stop offset="1" stopColor="#A08BFF"/></linearGradient>
          <linearGradient id={`${id}-a`} x1="54" y1="90" x2="86" y2="22" gradientUnits="userSpaceOnUse"><stop offset="0" stopColor="#E5922A"/><stop offset="1" stopColor="#FFD27A"/></linearGradient>
          <clipPath id={`${id}-c`}><path d="M54 20L86 32V54C86 72 72 84 54 90C36 84 22 72 22 54V32Z"/></clipPath>
        </defs>
        <g clipPath={`url(#${id}-c)`}>
          <rect width="108" height="108" fill={`url(#${id}-a)`}/>
          <path d="M0 0H54V31A12 12 0 0 0 54 55A12 12 0 0 1 54 79V120H0Z" fill={`url(#${id}-b)`}/>
          <path d="M54 20V31A12 12 0 0 0 54 55A12 12 0 0 1 54 79V90" fill="none" stroke="#14142B" strokeWidth="6" strokeLinecap="butt" strokeLinejoin="round"/>
          <path d="M54 14V96" fill="none" stroke="#14142B" strokeWidth="6" strokeLinecap="butt" strokeLinejoin="round"/>
        </g>
        <path d="M65.54 39.69A12 12 0 1 0 54 55A12 12 0 1 1 42.46 63.69" fill="none" stroke="#14142B" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"/>
      </Box>
    </Box>
  );
};
