import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router';
import { router } from './app/router';
import { AppProvider } from './app/providers/AppProvider';
import './styles/index.css';

import { seedInvoices } from './utils/seedInvoices';

// Initialize development sample data if needed
seedInvoices();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppProvider>
      <RouterProvider router={router} />
    </AppProvider>
  </StrictMode>
);

