// src/config/tenantConfig.ts

// 1. Future-proof module definitions.
// If the backend or local storage ever shifts from simple strings to objects, we can map them using moduleId.
export interface ErpModule {
  moduleId: string;
  moduleName: string;
  moduleCode: string;
  description: string;
  enabled: boolean;
}

export const AVAILABLE_MODULES: ErpModule[] = [
  { moduleId: 'MOD_DASH', moduleCode: 'DASHBOARD', moduleName: 'Dashboard', description: 'Core analytics', enabled: true },
  { moduleId: 'MOD_PROD', moduleCode: 'PRODUCT_MGMT', moduleName: 'Product Management', description: 'Manage products and pricing', enabled: true },
  { moduleId: 'MOD_INV', moduleCode: 'INVENTORY_MGMT', moduleName: 'Inventory & Warehouse Management', description: 'Stock, inward, outward', enabled: true },
  { moduleId: 'MOD_CNF', moduleCode: 'CNF_MGMT', moduleName: 'C&F Management', description: 'Carry and Forwarding', enabled: true },
  { moduleId: 'MOD_DIST', moduleCode: 'DISTRIBUTOR_PORTAL', moduleName: 'Distributor Portal', description: 'B2B orders and stock', enabled: true },
  { moduleId: 'MOD_RET', moduleCode: 'RETAILER_ORDERING', moduleName: 'Retailer Ordering System', description: 'Retail B2B', enabled: true },
  { moduleId: 'MOD_BILL', moduleCode: 'BILLING', moduleName: 'Billing', description: 'Invoicing and billing', enabled: true },
  { moduleId: 'MOD_ACC', moduleCode: 'ACCOUNTING', moduleName: 'Accounting & Finance', description: 'Ledgers and payments', enabled: true },
  { moduleId: 'MOD_CRM', moduleCode: 'CRM', moduleName: 'CRM', description: 'Customer relationship', enabled: true },
  { moduleId: 'MOD_MR', moduleCode: 'MR', moduleName: 'Medical Representative', description: 'MR tracking and visits', enabled: true },
  { moduleId: 'MOD_GPS', moduleCode: 'GPS', moduleName: 'GPS & Attendance', description: 'Location tracking', enabled: true },
  { moduleId: 'MOD_SET', moduleCode: 'SETTINGS', moduleName: 'Settings', description: 'System configuration', enabled: true }
];

// 2. Explicit mapping from purchased modules (using their string names for now, but easily adaptable to IDs) 
// to Workspace Card access.
export const WORKSPACE_MODULE_MAPPING: Record<string, string[]> = {
  // Mapping Format: 'Workspace Role ID' : ['Required Module Name 1', 'Required Module Name 2']
  // If the tenant has ANY of the mapped modules, the workspace card is enabled.
  'WAREHOUSE_MANAGER': ['Inventory & Warehouse Management', 'C&F Management'],
  'ACCOUNTANT': ['Accounting & Finance', 'Billing'],
  'DISTRIBUTOR': ['Distributor Portal'],
  'RETAILER': ['Retailer Ordering System'],
  'MEDICAL_REPRESENTATIVE': ['Medical Representative', 'CRM', 'GPS & Attendance']
};

/**
 * Normalizes purchased modules (whether they are strings or objects) into an array of module names.
 */
export const normalizePurchasedModules = (purchasedModules: any[]): string[] => {
  if (!purchasedModules || !Array.isArray(purchasedModules)) return [];
  
  return purchasedModules.map(mod => {
    if (typeof mod === 'string') return mod;
    if (mod && typeof mod === 'object' && mod.moduleName) return mod.moduleName;
    return '';
  }).filter(Boolean);
};

/**
 * Checks if a specific workspace card should be accessible based on the normalized purchased modules.
 */
export const isWorkspaceEnabled = (roleId: string, purchasedModules: string[]): boolean => {
  // Super Admin and Company Admin workspaces are inherently available if you have the role.
  if (roleId === 'SUPER_ADMIN' || roleId === 'COMPANY_ADMIN') return true;

  const requiredModules = WORKSPACE_MODULE_MAPPING[roleId];
  
  // If no mapping exists, default to false (safe) or true (permissive)? Safe is false.
  if (!requiredModules) return false;

  // Enable if the tenant has purchased AT LEAST ONE of the required modules for this workspace.
  return requiredModules.some(mod => purchasedModules.includes(mod));
};
