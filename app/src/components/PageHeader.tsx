import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { Box, IconButton, Stack, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
}

/** Title with a back button, for screens that are not in the bottom bar. */
export const PageHeader = ({ title, subtitle }: PageHeaderProps) => {
  const navigate = useNavigate();
  return (
    <Stack direction="row" sx={{ alignItems: 'center', gap: 1, ml: -1 }}>
      <IconButton aria-label="Volver" onClick={() => navigate(-1)}>
        <ArrowBackIcon />
      </IconButton>
      <Box>
        <Typography variant="h5">{title}</Typography>
        {subtitle ? <Typography sx={{ color: 'text.secondary' }}>{subtitle}</Typography> : null}
      </Box>
    </Stack>
  );
};
