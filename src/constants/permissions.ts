import {
  ROLE_SUPER_ADMIN,
  ROLE_COMPANY_ADMIN,
  ROLE_WAREHOUSE_MANAGER,
  ROLE_ACCOUNTANT,
  ROLE_DISTRIBUTOR,
  ROLE_RETAILER,
  ROLE_NATIONAL_SALES_HEAD,

  ROLE_REGIONAL_SALES_MANAGER,
  ROLE_AREA_SALES_MANAGER,
  ROLE_MEDICAL_REPRESENTATIVE,
} from './roles';

export const ROLE_PERMISSIONS: Record<string, string[]> = {
  [ROLE_SUPER_ADMIN]: [
    'Dashboard',
    'Super Admin',
    'Product Management',
    'Inventory & Warehouse Management',
    'C&F Management',
    'Export & Global Operations',
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
  [ROLE_COMPANY_ADMIN]: [
    'Dashboard',
    'Settings',
  ],
  [ROLE_NATIONAL_SALES_HEAD]: [
    'Dashboard',
    'Super Admin',
    'Product Management',
    'MR (Medical Representative)',
    'GPS & Location Tracking',
    'Pre-Sales CRM',
    'Alerts & Notifications',
    'Settings',
  ],

  [ROLE_REGIONAL_SALES_MANAGER]: [
    'Dashboard',
    'MR (Medical Representative)',
    'GPS & Location Tracking',
    'Pre-Sales CRM',
    'Alerts & Notifications',
    'Settings',
  ],
  [ROLE_AREA_SALES_MANAGER]: [
    'Dashboard',
    'MR (Medical Representative)',
    'GPS & Location Tracking',
    'Pre-Sales CRM',
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
};

export const hasPermission = (roleId: string, moduleLabel: string): boolean => {
  const allowedModules = ROLE_PERMISSIONS[roleId] || [];
  return allowedModules.includes(moduleLabel);
};
