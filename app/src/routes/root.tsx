import AddIcon from '@mui/icons-material/Add';
import HomeIcon from '@mui/icons-material/Home';
import ListAltIcon from '@mui/icons-material/ListAlt';
import { Box, Container, Typography } from '@mui/material';
import type { ReactElement } from 'react';
import { Link, Outlet, useLocation, useRouteLoaderData } from 'react-router-dom';
import { SettingsBrushIcon } from '../components/SettingsBrushIcon';
import type { AppData } from '../data/appData';
import { generateRecurring } from '../data/mutations';
import { loadData, mutate } from '../data/store';
import { todayIso } from '../domain/dates';
import { INSET_BOTTOM, INSET_TOP } from '../insets';
import type { IsoDate } from '../domain/types';

export interface RootData {
  data: AppData;
  today: IsoDate;
}

/** Runs on every navigation/revalidation: creates due recurring expenses, then returns the state. */
export const rootLoader = async (): Promise<RootData> => {
  const today = todayIso();
  await mutate((data) => generateRecurring(data, today));
  return { data: await loadData(), today };
};

export const useRootData = (): RootData => useRouteLoaderData('root') as RootData;

interface Tab {
  path: string;
  /** Other screens that belong to this tab and keep it highlighted. */
  also?: string[];
  label: string;
  icon: ReactElement;
}

const TABS: Tab[] = [
  { path: '/', also: ['/history'], label: 'Inicio', icon: <HomeIcon /> },
  { path: '/movements', label: 'Movimientos', icon: <ListAltIcon /> },
  { path: '/settings', also: ['/recurring', '/close'], label: 'Configuración', icon: <SettingsBrushIcon /> },
];

const DockTab = ({ tab, active }: { tab: Tab; active: boolean }) => (
  <Box
    component={Link}
    to={tab.path}
    viewTransition
    aria-current={active ? 'page' : undefined}
    sx={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 0.25,
      color: active ? 'primary.main' : 'text.secondary',
      textDecoration: 'none',
      '& svg': { fontSize: 26, transition: 'transform 220ms cubic-bezier(0.2, 0.8, 0.2, 1)', transform: active ? 'translateY(-1px) scale(1.08)' : 'none' },
    }}
  >
    {tab.icon}
    <Typography component="span" sx={{ fontSize: 11, fontWeight: 700 }}>
      {tab.label}
    </Typography>
  </Box>
);

export const Layout = () => {
  const { pathname } = useLocation();
  const hideDock = pathname === '/add' || pathname === '/payroll' || pathname.startsWith('/edit/');
  return (
    <Box sx={{ minHeight: '100dvh', pb: hideDock ? 0 : `calc(120px + ${INSET_BOTTOM})`, pt: INSET_TOP }}>
      <Container maxWidth="sm" sx={{ py: 2 }}>
        <Outlet />
      </Container>
      {hideDock ? null : (
        <Box
          component="nav"
          sx={{
            position: 'fixed',
            left: 0,
            right: 0,
            bottom: `calc(12px + ${INSET_BOTTOM})`,
            mx: 'auto',
            width: 'calc(100% - 24px)',
            maxWidth: 520,
            display: 'flex',
            alignItems: 'center',
            gap: 1.25,
          }}
        >
          <Box
            sx={{
              flex: 1,
              height: 68,
              display: 'grid',
              gridTemplateColumns: `repeat(${TABS.length}, 1fr)`,
              alignItems: 'stretch',
              borderRadius: '28px',
              border: 1,
              borderColor: 'divider',
              bgcolor: 'color-mix(in srgb, var(--mui-palette-background-paper) 84%, transparent)',
              backdropFilter: 'blur(18px)',
              WebkitBackdropFilter: 'blur(18px)',
              boxShadow: '0 12px 32px rgba(0, 0, 0, 0.28)',
            }}
          >
            {TABS.map((tab) => (
              <DockTab key={tab.path} tab={tab} active={pathname === tab.path || (tab.also ?? []).includes(pathname)} />
            ))}
          </Box>
          <Box
            component={Link}
            to="/add"
            viewTransition
            aria-label="Apuntar un movimiento"
            sx={{
              width: 68,
              height: 68,
              flexShrink: 0,
              borderRadius: '50%',
              display: 'grid',
              placeItems: 'center',
              color: '#fff',
              background: 'linear-gradient(135deg, #3B55F0 0%, #7A5CFA 100%)',
              boxShadow: '0 10px 24px rgba(91, 92, 250, 0.5)',
              transition: 'transform 160ms cubic-bezier(0.2, 0.8, 0.2, 1)',
              '&:active': { transform: 'scale(0.92)' },
            }}
          >
            <AddIcon sx={{ fontSize: 32 }} />
          </Box>
        </Box>
      )}
    </Box>
  );
};
