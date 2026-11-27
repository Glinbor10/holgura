import { Box } from '@mui/material';
import { keyframes } from '@mui/material/styles';

const draw = keyframes`
  from { stroke-dashoffset: 1; opacity: 0; }
  15% { opacity: 1; }
  to { stroke-dashoffset: 0; opacity: 1; }
`;

type Point = [number, number];

// Up, down, up (income) or down, up, down (expense), like a chart line with its arrow tip.
const LINES: Record<'income' | 'expense', Point[]> = {
  income: [[10, 120], [62, 84], [110, 102], [172, 50], [220, 68], [286, 14]],
  expense: [[10, 14], [62, 50], [110, 32], [172, 84], [220, 66], [286, 120]],
};

/** Arrow head as two arms drawn back from the tip, symmetric around the direction of the last segment. */
const arrowHead = (from: Point, to: Point, length = 22, spread = 34): string => {
  const angle = Math.atan2(to[1] - from[1], to[0] - from[0]);
  const arm = (side: number): string => {
    const a = angle + Math.PI + (side * spread * Math.PI) / 180;
    return `${(to[0] + length * Math.cos(a)).toFixed(1)} ${(to[1] + length * Math.sin(a)).toFixed(1)}`;
  };
  return `M${arm(-1)} L${to[0]} ${to[1]} L${arm(1)}`;
};

/** Faint, animated chart line behind the amount: green rising for income, red falling for expense. */
export const TrendBackdrop = ({ kind }: { kind: 'income' | 'expense' }) => {
  const points = LINES[kind];
  return (
    <Box
      aria-hidden
      sx={{
        position: 'absolute',
        top: 40,
        left: 0,
        right: 0,
        height: 150,
        pointerEvents: 'none',
        color: kind === 'income' ? 'success.main' : 'error.main',
        opacity: 0.22,
      }}
    >
      <svg viewBox="-10 -10 316 150" width="100%" height="100%" preserveAspectRatio="xMidYMid meet" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" style={{ overflow: 'visible' }}>
        <g style={{ filter: 'drop-shadow(0 0 6px currentColor)' }}>
          <polyline points={points.map((point) => point.join(',')).join(' ')} pathLength={1} strokeDasharray={1} style={{ animation: `${draw} 1100ms cubic-bezier(0.2, 0.8, 0.2, 1) both` }} />
          <path d={arrowHead(points[points.length - 2], points[points.length - 1])} pathLength={1} strokeDasharray={1} style={{ animation: `${draw} 300ms ease-out 900ms both` }} />
        </g>
      </svg>
    </Box>
  );
};
