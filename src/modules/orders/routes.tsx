import { type RouteObject } from 'react-router';
import { MainLayout } from '../../app/layouts/MainLayout';
import OrdersPage from './OrdersPage';
import { ProtectedRoute } from '../../components/auth/ProtectedRoute';

export const ordersRoutes: RouteObject[] = [
  {
    path: '/orders',
    element: <MainLayout />,
    children: [
      {
        element: <ProtectedRoute moduleLabel="Orders" />,
        children: [
          {
            index: true,
            element: <OrdersPage />,
          },
        ],
      },
    ],
  },
];
