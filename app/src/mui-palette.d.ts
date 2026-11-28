import '@mui/material/styles';

declare module '@mui/material/styles' {
  interface Palette {
    /** Savings: gold. `main` is legible as text in each scheme; `light`/`dark` are the ends of gold gradients. */
    savings: Palette['primary'];
  }
  interface PaletteOptions {
    savings?: PaletteOptions['primary'];
  }
}
