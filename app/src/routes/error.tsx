import { Box, Button, Stack, Typography } from '@mui/material';
import { useRouteError } from 'react-router-dom';

/** Shown instead of a blank screen when the app cannot load or open its data. */
export const ErrorScreen = () => {
  const error = useRouteError();
  const detail = error instanceof Error ? error.message : 'Error desconocido';
  return (
    <Stack spacing={2.5} sx={{ minHeight: '100dvh', justifyContent: 'center', p: 3, maxWidth: 480, mx: 'auto' }}>
      <Typography variant="h5">No se han podido abrir tus datos</Typography>
      <Typography sx={{ color: 'text.secondary' }}>
        Cierra la app del todo y vuelve a abrirla. Esta pantalla no borra nada. Si el problema sigue, anota el mensaje de
        abajo y no desinstales la app: ahí están tus datos.
      </Typography>
      <Box sx={{ bgcolor: 'action.hover', borderRadius: '16px', p: 2, fontFamily: 'monospace', fontSize: 13, wordBreak: 'break-word' }}>
        {detail}
      </Box>
      <Button variant="contained" size="large" onClick={() => window.location.reload()}>
        Reintentar
      </Button>
    </Stack>
  );
};
