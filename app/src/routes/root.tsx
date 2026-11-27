import AddIcon from '@mui/icons-material/Add';
import HomeIcon from '@mui/icons-material/Home';
import ListAltIcon from '@mui/icons-material/ListAlt';
import { Backdrop, Box, ButtonBase, Container, Typography, Zoom } from '@mui/material';
import { useState, type ReactElement } from 'react';
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

const MENU_ITEMS = [
  { to: '/add?kind=income', label: 'Ingreso', color: 'success.main', line: '2,20 12,12 19,17 31,5 36,9', tip: 'M26 4 33 4 36 11' },
  { to: '/add?kind=expense', label: 'Gasto', color: 'error.main', line: '2,4 12,12 19,7 31,19 36,15', tip: 'M26 20 33 20 36 13' },
];

const DockTab = ({ tab, active }: { tab: Tab; active: boolean }) => (
  <Box
    component={Link}
    to={tab.path}
    aria-current={active ? 'page' : undefined}
    sx={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 0.25,
      position: 'relative',
      zIndex: 1,
      color: active ? 'primary.main' : 'text.secondary',
      transition: 'color 260ms',
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
  const [menuOpen, setMenuOpen] = useState(false);
  const activeIndex = TABS.findIndex((tab) => pathname === tab.path || (tab.also ?? []).includes(pathname));
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
            zIndex: 1200,
            mx: 'auto',
            width: 'calc(100% - 24px)',
            maxWidth: 520,
            height: 68,
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            pr: 1,
            borderRadius: '34px',
            border: 1,
            borderColor: 'divider',
            bgcolor: 'color-mix(in srgb, var(--mui-palette-background-paper) 84%, transparent)',
            backdropFilter: 'blur(18px)',
            WebkitBackdropFilter: 'blur(18px)',
            boxShadow: '0 12px 32px rgba(0, 0, 0, 0.28)',
          }}
        >
          <Box sx={{ position: 'relative', flex: 1, height: '100%', display: 'grid', gridTemplateColumns: `repeat(${TABS.length}, 1fr)`, alignItems: 'stretch' }}>
            <Box
              aria-hidden
              sx={{
                position: 'absolute',
                top: 8,
                bottom: 8,
                left: 0,
                width: `${100 / TABS.length}%`,
                px: 0.5,
                opacity: activeIndex < 0 ? 0 : 1,
                transform: `translateX(${Math.max(activeIndex, 0) * 100}%)`,
                transition: 'transform 420ms cubic-bezier(0.34, 1.3, 0.5, 1), opacity 200ms',
              }}
            >
              <Box sx={{ height: '100%', borderRadius: '26px', bgcolor: 'color-mix(in srgb, var(--mui-palette-primary-main) 16%, transparent)' }} />
            </Box>
            {TABS.map((tab, index) => (
              <DockTab key={tab.path} tab={tab} active={index === activeIndex} />
            ))}
          </Box>
          <ButtonBase
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Apuntar un movimiento"
            aria-expanded={menuOpen}
            sx={{
              width: 52,
              height: 52,
              flexShrink: 0,
              borderRadius: '50%',
              color: '#fff',
              background: 'linear-gradient(135deg, #3B55F0 0%, #7A5CFA 100%)',
              boxShadow: '0 6px 16px rgba(91, 92, 250, 0.45)',
            }}
          >
            <AddIcon sx={{ fontSize: 30, transition: 'transform 260ms cubic-bezier(0.2, 0.8, 0.2, 1)', transform: menuOpen ? 'rotate(135deg)' : 'none' }} />
          </ButtonBase>
        </Box>
      )}
      <Backdrop open={menuOpen && !hideDock} onClick={() => setMenuOpen(false)} sx={{ zIndex: 1100, bgcolor: 'rgba(0, 0, 0, 0.3)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)' }} />
      <Box
        sx={{
          position: 'fixed',
          right: 'max(26px, calc((100% - 520px) / 2 + 26px))',
          bottom: `calc(12px + ${INSET_BOTTOM} + 76px)`,
          zIndex: 1150,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          gap: 1.5,
          pointerEvents: menuOpen && !hideDock ? 'auto' : 'none',
        }}
      >
        {MENU_ITEMS.map((item, index) => (
          <Zoom key={item.to} in={menuOpen && !hideDock} style={{ transformOrigin: 'right bottom', transitionDelay: menuOpen ? `${index * 70}ms` : '0ms' }}>
            <ButtonBase
              component={Link}
              to={item.to}
              viewTransition
              onClick={() => setMenuOpen(false)}
              sx={{
                px: 2.75,
                py: 1.5,
                borderRadius: '999px',
                border: 2,
                borderColor: item.color,
                bgcolor: 'background.paper',
                color: 'text.primary',
                fontSize: 17,
                fontWeight: 800,
                gap: 1.25,
                boxShadow: '0 10px 24px rgba(0, 0, 0, 0.3)',
              }}
            >
              <Box component="svg" aria-hidden viewBox="0 0 40 24" sx={{ width: 30, height: 18, color: item.color }} fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points={item.line} />
                <path d={item.tip} />
              </Box>
              {item.label}
            </ButtonBase>
          </Zoom>
        ))}
      </Box>
    </Box>
  );
};
