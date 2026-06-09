import type { ReactNode } from 'react';

interface AppProviderProps {
  children: ReactNode;
}

export function AppProvider({ children }: AppProviderProps) {
  // Global context providers (Theme, Auth, Query Client) would wrap children here.
  return (
    <>
      {children}
    </>
  );
}
