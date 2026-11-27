import { Box } from '@mui/material';
import { keyframes } from '@mui/material/styles';

const draw = keyframes`
  from { stroke-dashoffset: 1; opacity: 0; }
  15% { opacity: 1; }
  to { stroke-dashoffset: 0; opacity: 1; }
`;

// Up, down, up (income) or down, up, down (expense), like a chart line with its arrow tip.
const SHAPES = {
  income: { line: '8,150 52,104 92,128 146,66 186,88 244,26', tip: 'M222 27 244 26 242 48' },
  expense: { line: '8,26 52,72 92,50 146,112 186,92 244,150', tip: 'M222 149 244 150 242 128' },
};

/** Faint, animated chart line behind the amount: green rising for income, red falling for expense. */
export const TrendBackdrop = ({ kind }: { kind: 'income' | 'expense' }) => (
  <Box
    aria-hidden
    sx={{
      position: 'absolute',
      top: 40,
      left: 0,
      right: 0,
      height: 190,
      pointerEvents: 'none',
      color: kind === 'income' ? 'success.main' : 'error.main',
      opacity: 0.22,
    }}
  >
    <svg viewBox="0 0 252 176" width="100%" height="100%" preserveAspectRatio="xMidYMid meet" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round">
      <g style={{ filter: 'drop-shadow(0 0 6px currentColor)' }}>
        <polyline points={SHAPES[kind].line} pathLength={1} strokeDasharray={1} style={{ animation: `${draw} 1100ms cubic-bezier(0.2, 0.8, 0.2, 1) both` }} />
        <path d={SHAPES[kind].tip} style={{ animation: `${draw} 300ms ease-out 900ms both` }} pathLength={1} strokeDasharray={1} />
      </g>
    </svg>
  </Box>
);
