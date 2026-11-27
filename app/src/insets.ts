// Capacitor's SystemBars plugin injects --safe-area-inset-* because env() is 0px on older Android WebViews.
export const INSET_TOP = 'var(--safe-area-inset-top, env(safe-area-inset-top, 0px))';
export const INSET_BOTTOM = 'var(--safe-area-inset-bottom, env(safe-area-inset-bottom, 0px))';
