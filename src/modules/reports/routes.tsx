import { type RouteObject } from 'react-router';
import { MainLayout } from '../../app/layouts/MainLayout';
import ReportsPage from './ReportsPage';
import { ProtectedRoute } from '../../components/auth/ProtectedRoute';

export const reportsRoutes: RouteObject[] = [
  {
    path: '/reports',
    element: <MainLayout />,
    children: [
      {
        element: <ProtectedRoute moduleLabel="Reports" />,
        children: [
          {
            index: true,
            element: <ReportsPage />,
          },
        ]
      }
    ],
  },
];
