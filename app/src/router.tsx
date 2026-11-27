import { createHashRouter } from 'react-router-dom';
import { AddScreen, addAction } from './routes/add';
import { CloseScreen, closeAction } from './routes/close';
import { EditScreen, editAction } from './routes/edit';
import { ErrorScreen } from './routes/error';
import { HistoryScreen } from './routes/history';
import { HomeScreen } from './routes/home';
import { MovementsScreen, movementsAction } from './routes/movements';
import { RecurringScreen, recurringAction } from './routes/recurring';
import { Layout, rootLoader } from './routes/root';
import { SettingsScreen, settingsAction } from './routes/settings';

// Hash routing works the same in the browser and inside the Capacitor WebView.
export const router = createHashRouter([
  {
    id: 'root',
    path: '/',
    element: <Layout />,
    errorElement: <ErrorScreen />,
    loader: rootLoader,
    children: [
      { index: true, element: <HomeScreen /> },
      { path: 'add', element: <AddScreen />, action: addAction },
      { path: 'edit/:id', element: <EditScreen />, action: editAction },
      { path: 'movements', element: <MovementsScreen />, action: movementsAction },
      { path: 'recurring', element: <RecurringScreen />, action: recurringAction },
      { path: 'history', element: <HistoryScreen /> },
      { path: 'close', element: <CloseScreen />, action: closeAction },
      { path: 'settings', element: <SettingsScreen />, action: settingsAction },
    ],
  },
]);
