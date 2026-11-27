import { Box } from '@mui/material';
import type { ReactNode } from 'react';

/** Rounded surface that stacks rows separated by hairlines, like the lists in banking apps. */
export const Group = ({ children }: { children: ReactNode }) => (
  <Box sx={{ bgcolor: 'background.paper', borderRadius: '24px', overflow: 'hidden', '& > * + *': { borderTop: 1, borderColor: 'divider' } }}>
    {children}
  </Box>
);

export const GroupRow = ({ children }: { children: ReactNode }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 2.5, py: 1.75, minHeight: 64 }}>{children}</Box>
);
