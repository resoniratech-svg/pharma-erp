import {
  ROLE_SUPER_ADMIN,
  ROLE_WAREHOUSE_MANAGER,
  ROLE_ACCOUNTANT,
  ROLE_DISTRIBUTOR,
  ROLE_RETAILER,
  ROLE_MEDICAL_REPRESENTATIVE,
  ROLE_TRANSPORT_STAFF,
} from './roles';

export const ROLE_PERMISSIONS: Record<string, string[]> = {
  [ROLE_SUPER_ADMIN]: [
    'Dashboard',
    'Super Admin',
    'Product Management',
    'Inventory & Warehouse Management',
    'C&F Management',
    'Distributor/Stockist Portal',
    'Retailer Ordering System',
    'MR (Medical Representative)',
    'Orders',
    'Wholesale Billing System',
    'Pre-Sales CRM',
    'Accounting & Finance',
    'GPS & Location Tracking',
    'Alerts & Notifications',
    'Settings',
  ],
  [ROLE_WAREHOUSE_MANAGER]: [
    'Dashboard',
    'Inventory & Warehouse Management',
    'C&F Management',
    'Alerts & Notifications',
    'Settings',
  ],
  [ROLE_ACCOUNTANT]: [
    'Dashboard',
    'Wholesale Billing System',
    'Accounting & Finance',
    'Reports',
    'Alerts & Notifications',
    'Settings',
  ],
  [ROLE_DISTRIBUTOR]: [
    'Dashboard',
    'Distributors',
    'Distributor/Stockist Portal',
    'Alerts & Notifications',
    'Settings',
  ],
  [ROLE_RETAILER]: [
    'Dashboard',
    'Retailer Ordering System',
    'Orders',
    'Alerts & Notifications',
    'Settings',
  ],
  [ROLE_MEDICAL_REPRESENTATIVE]: [
    'Dashboard',
    'MR (Medical Representative)',
    'GPS & Location Tracking',
    'Pre-Sales CRM',
    'Alerts & Notifications',
    'Settings',
  ],
  [ROLE_TRANSPORT_STAFF]: [
    'Dashboard',
    'C&F Management', // Includes Dispatch
    'GPS & Location Tracking',
    'Alerts & Notifications',
    'Settings',
  ],
};

export const hasPermission = (roleId: string, moduleLabel: string): boolean => {
  const allowedModules = ROLE_PERMISSIONS[roleId] || [];
  return allowedModules.includes(moduleLabel);
};
