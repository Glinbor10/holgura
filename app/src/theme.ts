import { createTheme } from '@mui/material';

const FONT = "'Manrope Variable', system-ui, sans-serif";
const EASE = 'cubic-bezier(0.2, 0.8, 0.2, 1)';

export const theme = createTheme({
  cssVariables: { colorSchemeSelector: 'media' },
  colorSchemes: {
    light: {
      palette: {
        primary: { main: '#3B55F0', contrastText: '#FFFFFF' },
        secondary: { main: '#F5A524' },
        success: { main: '#0E9F6E' },
        info: { main: '#7A5CFA' },
        error: { main: '#E5484D' },
        background: { default: '#F3F4F8', paper: '#FFFFFF' },
        text: { primary: '#0E1020', secondary: '#6B6F85' },
        divider: 'rgba(14, 16, 32, 0.08)',
        action: { hover: 'rgba(14, 16, 32, 0.05)' },
      },
    },
    dark: {
      palette: {
        primary: { main: '#6F86FF', contrastText: '#05060F' },
        secondary: { main: '#F5B14A' },
        success: { main: '#2FD399' },
        info: { main: '#A692FF' },
        error: { main: '#FF6B6F' },
        background: { default: '#07070A', paper: '#15151B' },
        text: { primary: '#F5F6FA', secondary: '#8E91A3' },
        divider: 'rgba(245, 246, 250, 0.08)',
        action: { hover: 'rgba(245, 246, 250, 0.07)' },
      },
    },
  },
  shape: { borderRadius: 16 },
  typography: {
    fontFamily: FONT,
    h5: { fontWeight: 800, letterSpacing: '-0.02em' },
    h6: { fontWeight: 800, letterSpacing: '-0.01em' },
    body1: { fontSize: '1rem' },
    body2: { fontSize: '0.88rem' },
    button: { textTransform: 'none', fontWeight: 700, letterSpacing: 0 },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        html: { scrollbarWidth: 'thin', scrollbarColor: 'var(--mui-palette-divider) transparent' },
        body: { fontVariantNumeric: 'tabular-nums', WebkitTapHighlightColor: 'transparent', overscrollBehaviorY: 'none' },
        '.MuiButtonBase-root': { transition: `transform 140ms ${EASE}, background-color 180ms` },
        '.MuiButtonBase-root:active': { transform: 'scale(0.96)' },
        '@keyframes page-in': { from: { opacity: 0, transform: 'translateY(14px)' }, to: { opacity: 1, transform: 'none' } },
        '@keyframes page-out': { from: { opacity: 1 }, to: { opacity: 0 } },
        '::view-transition-old(root)': { animation: '160ms ease-out both page-out' },
        '::view-transition-new(root)': { animation: `300ms ${EASE} both page-in` },
        '@media (prefers-reduced-motion: reduce)': {
          '*, ::view-transition-old(root), ::view-transition-new(root)': { animation: 'none !important', transition: 'none !important' },
        },
      },
    },
    MuiButtonBase: { styleOverrides: { root: { fontFamily: 'inherit' } } },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: { borderRadius: 999, minHeight: 44, paddingInline: 22 },
        sizeLarge: { minHeight: 56, fontSize: '1.05rem' },
      },
    },
    MuiTextField: { defaultProps: { variant: 'filled' } },
    MuiFilledInput: {
      defaultProps: { disableUnderline: true },
      styleOverrides: {
        root: {
          borderRadius: 16,
          backgroundColor: 'var(--mui-palette-action-hover)',
          '&:hover': { backgroundColor: 'var(--mui-palette-action-hover)' },
          '&.Mui-focused': { backgroundColor: 'var(--mui-palette-action-hover)', boxShadow: '0 0 0 2px var(--mui-palette-primary-main)' },
        },
      },
    },
    MuiChip: { styleOverrides: { root: { fontWeight: 700 } } },
    MuiAlert: { styleOverrides: { root: { borderRadius: 18 } } },
    MuiCard: { styleOverrides: { root: { boxShadow: 'none', border: 0, borderRadius: 24 } } },
    MuiPaper: { styleOverrides: { root: { backgroundImage: 'none' } } },
    MuiToggleButtonGroup: {
      styleOverrides: { root: { gap: 4, padding: 4, borderRadius: 999, backgroundColor: 'var(--mui-palette-action-hover)' } },
    },
    MuiToggleButton: {
      styleOverrides: {
        root: {
          borderRadius: 999,
          border: 0,
          fontWeight: 700,
          color: 'var(--mui-palette-text-secondary)',
          '&.Mui-selected': { backgroundColor: 'var(--mui-palette-text-primary)', color: 'var(--mui-palette-background-default)' },
          '&.Mui-selected:hover': { backgroundColor: 'var(--mui-palette-text-primary)' },
        },
      },
    },
  },
});
