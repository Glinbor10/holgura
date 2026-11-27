import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.holgura',
  appName: 'Holgura',
  webDir: 'dist',
  plugins: {
    // Edge-to-edge: the web layout handles the notch/gesture bar with env(safe-area-inset-*).
    SystemBars: { insetsHandling: 'css', initialViewportFitValueHint: 'cover' },
  },
};

export default config;
