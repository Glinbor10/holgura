// Capacitor's SystemBars plugin injects --safe-area-inset-* because env() is 0px on older Android WebViews.
export const INSET_TOP = 'var(--safe-area-inset-top, env(safe-area-inset-top, 0px))';
export const INSET_BOTTOM = 'var(--safe-area-inset-bottom, env(safe-area-inset-bottom, 0px))';

/** Full-height screens (add, payroll, edit) fill the viewport minus the root padding and the top inset. */
export const SCREEN_MIN_HEIGHT = `calc(100dvh - 32px - ${INSET_TOP})`;
/** Space under the submit button of a full-height screen, above the gesture bar. */
export const SCREEN_BOTTOM_PADDING = `calc(8px + ${INSET_BOTTOM})`;
