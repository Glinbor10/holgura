import { Box } from '@mui/material';
import { useId, useMemo, type PointerEvent } from 'react';
import type { Cents } from '../domain/types';

const WIDTH = 360;
const HEIGHT = 170;
const PAD = 14;

interface BalanceChartProps {
  /** Money available at the end of each day, from day 1 up to today. */
  values: Cents[];
  totalDays: number;
  /** Money at the start of the month; sets the top of the chart. */
  startCents: Cents;
  activeIndex: number | null;
  onScrub: (index: number | null) => void;
}

const smoothPath = (points: [number, number][]): string =>
  points.reduce((path, [x, y], index) => {
    if (index === 0) {
      return `M ${x} ${y}`;
    }
    const [previousX, previousY] = points[index - 1];
    const middle = (previousX + x) / 2;
    return `${path} C ${middle} ${previousY} ${middle} ${y} ${x} ${y}`;
  }, '');

const CHART_SX = {
  display: 'block',
  width: '100%',
  height: 'auto',
  overflow: 'visible',
  touchAction: 'pan-y',
  cursor: 'ew-resize',
  '@keyframes draw': { from: { strokeDashoffset: 1 }, to: { strokeDashoffset: 0 } },
  '@keyframes reveal': { from: { opacity: 0 }, to: { opacity: 1 } },
  '& .line': { strokeDasharray: 1, animation: 'draw 1100ms cubic-bezier(0.2, 0.8, 0.2, 1) both' },
  '& .area': { animation: 'reveal 900ms 300ms ease-out both' },
};

/** Smooth line of the money available through the month. Drag a finger over it to read each day. */
export const BalanceChart = ({ values, totalDays, startCents, activeIndex, onScrub }: BalanceChartProps) => {
  const gradientId = useId();

  // Everything that does not depend on the finger is built once, so scrubbing only moves the marker.
  const shape = useMemo(() => {
    const max = Math.max(startCents, ...values, 1);
    const min = Math.min(0, ...values);
    const x = (index: number) => (totalDays <= 1 ? 0 : (index / (totalDays - 1)) * WIDTH);
    const y = (value: number) => PAD + (1 - (value - min) / (max - min || 1)) * (HEIGHT - PAD * 2);
    const points = values.map((value, index): [number, number] => [x(index), y(value)]);
    return { points, line: smoothPath(points), min, zeroY: y(0), lastValue: values[values.length - 1] };
  }, [values, totalDays, startCents]);
  const { points, line, min, zeroY, lastValue } = shape;
  const last = points[points.length - 1];

  const staticParts = useMemo(
    () => (
      <>
        <defs>
          <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" style={{ stopColor: 'var(--mui-palette-primary-main)', stopOpacity: 0.38 }} />
            <stop offset="100%" style={{ stopColor: 'var(--mui-palette-primary-main)', stopOpacity: 0 }} />
          </linearGradient>
        </defs>
        {min < 0 ? <line x1={0} x2={WIDTH} y1={zeroY} y2={zeroY} stroke="var(--mui-palette-divider)" strokeDasharray="2 4" /> : null}
        <path className="area" d={`${line} L ${last[0]} ${HEIGHT} L 0 ${HEIGHT} Z`} fill={`url(#${gradientId})`} />
        {lastValue > 0 && points.length < totalDays ? (
          <line x1={last[0]} y1={last[1]} x2={WIDTH} y2={zeroY} stroke="var(--mui-palette-text-secondary)" strokeWidth={1.5} strokeDasharray="3 5" opacity={0.6} />
        ) : null}
        <path className="line" d={line} pathLength={1} fill="none" stroke="var(--mui-palette-primary-main)" strokeWidth={3} strokeLinecap="round" />
      </>
    ),
    [gradientId, line, min, zeroY, last, lastValue, points.length, totalDays],
  );

  const markerIndex = activeIndex ?? values.length - 1;
  const [markerX, markerY] = points[markerIndex];

  const scrubTo = (event: PointerEvent<SVGSVGElement>) => {
    const box = event.currentTarget.getBoundingClientRect();
    const index = Math.round(((event.clientX - box.left) / box.width) * (totalDays - 1));
    onScrub(Math.min(Math.max(index, 0), values.length - 1));
  };

  return (
    <Box
      component="svg"
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      role="img"
      aria-label="Evolución del dinero disponible durante el mes. Arrastra para ver cada día."
      onPointerDown={(event: PointerEvent<SVGSVGElement>) => {
        event.currentTarget.setPointerCapture(event.pointerId);
        scrubTo(event);
      }}
      onPointerMove={(event: PointerEvent<SVGSVGElement>) => (event.buttons > 0 ? scrubTo(event) : undefined)}
      onPointerUp={() => onScrub(null)}
      onPointerCancel={() => onScrub(null)}
      sx={CHART_SX}
    >
      {staticParts}
      {activeIndex === null ? null : (
        <line x1={markerX} x2={markerX} y1={0} y2={HEIGHT} stroke="var(--mui-palette-text-secondary)" strokeWidth={1} opacity={0.5} />
      )}
      <circle cx={markerX} cy={markerY} r={9} fill="var(--mui-palette-primary-main)" opacity={0.22} />
      <circle cx={markerX} cy={markerY} r={4.5} fill="var(--mui-palette-primary-main)" stroke="var(--mui-palette-background-default)" strokeWidth={2} />
    </Box>
  );
};
