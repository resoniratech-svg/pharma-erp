export const normalizePurchasedModules = (purchasedModules: any): string[] => {
  if (!purchasedModules) return [];
  if (Array.isArray(purchasedModules)) {
    return purchasedModules.map(m => String(m).toLowerCase().trim());
  }
  if (typeof purchasedModules === 'string') {
    return purchasedModules.split(',').map(m => m.toLowerCase().trim());
  }
  return [];
};

export const isWorkspaceEnabled = (roleId: string, purchasedModules: string[]): boolean => {
  if (!purchasedModules || purchasedModules.length === 0) return true;
  
  const roleIdLower = roleId.toLowerCase();
  
  // Super admin and Company admin workspaces are always enabled
  if (roleIdLower === 'super_admin' || roleIdLower === 'company_admin') {
    return true;
  }
  
  // Mapping workspace role IDs to possible module name keywords
  const moduleMap: Record<string, string[]> = {
    'WAREHOUSE_STAFF': ['warehouse', 'inventory', 'warehouse management', 'c&f', 'c&f management'],
    'SALES_REPRESENTATIVE': ['sales', 'field sales', 'mr', 'crm', 'medical representative'],
    'ACCOUNTANT': ['finance', 'billing', 'accounts', 'wholesale billing', 'billing & invoicing'],
    'DISTRIBUTOR': ['distributor', 'distributor portal', 'stockist'],
    'RETAILER': ['retailer', 'retailer portal', 'chemist'],
  };

  const allowedKeywords = moduleMap[roleId] || [roleIdLower];
  return purchasedModules.some(mod => allowedKeywords.some(kw => mod.includes(kw) || kw.includes(mod)));
};

export const isModulePurchased = (navLabel: string, purchasedModules: string[]): boolean => {
  if (!purchasedModules || purchasedModules.length === 0) return true;

  const labelLower = navLabel.toLowerCase().trim();

  // Keyword mapping for sidebar NAV_ITEMS labels
  const navKeywordMap: Record<string, string[]> = {
    'product management': ['product', 'products', 'product management'],
    'inventory & warehouse management': ['inventory', 'warehouse', 'stock'],
    'c&f management': ['c&f', 'c&f management', 'warehouse', 'dispatch'],
    'distributor/stockist portal': ['distributor', 'stockist', 'distributor portal', 'distributor/stockist portal'],
    'retailer ordering system': ['retailer', 'chemist', 'retailer ordering system', 'orders'],
    'mr (medical representative)': ['mr', 'medical representative', 'field sales'],
    'gps & location tracking': ['gps', 'location', 'attendance', 'gps & attendance'],
    'pre-sales crm': ['crm', 'leads', 'pre-sales crm'],
    'accounting & finance': ['accounting', 'finance', 'accounts', 'ledger'],
    'wholesale billing system': ['billing', 'wholesale billing', 'gst billing', 'e-invoice'],
    'alerts & notifications': ['alert', 'notification', 'reminders'],
    'settings': ['settings', 'profile', 'configuration']
  };

  const keywords = navKeywordMap[labelLower] || [labelLower];

  return purchasedModules.some(mod => {
    const modLower = mod.toLowerCase().trim();
    return (
      modLower === labelLower ||
      keywords.some(kw => modLower.includes(kw) || kw.includes(modLower))
    );
  });
};
