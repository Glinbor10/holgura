import '@fontsource-variable/manrope/index.css';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { CssBaseline, ThemeProvider } from '@mui/material';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { router } from './router';
import { theme } from './theme';

// Android hardware/gesture "back": go back inside the app, and leave it only from the home screen.
if (Capacitor.isNativePlatform()) {
  void App.addListener('backButton', ({ canGoBack }) => {
    if (router.state.location.pathname === '/') {
      void App.exitApp();
    } else if (canGoBack) {
      void router.navigate(-1);
    } else {
      void router.navigate('/');
    }
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <RouterProvider router={router} />
    </ThemeProvider>
  </StrictMode>,
);
