export type ModuleAction = 'View' | 'Create' | 'Edit' | 'Delete';

export type ModulePermissions = Record<ModuleAction, boolean>;

export type PermissionsState = Record<string, ModulePermissions>;

// Centralized Module Constants to prevent spelling mistakes and allow easier maintenance
export const ERP_MODULES = {
  PRODUCTS_MASTER: 'Products & Master',
  INVENTORY: 'Inventory & Warehouse Management',
  CF_MANAGEMENT: 'C&F Management',
  DISTRIBUTOR: 'Distributor Portal',
  RETAILER: 'Retailer Ordering System',
  MEDICAL_REP: 'Medical Representative',
  GPS_TRACKING: 'GPS & Location Tracking',
  BILLING: 'Wholesale Billing System',
  FINANCE: 'Accounting & Finance',
  CRM: 'CRM',
  REPORTS: 'Reports & Analytics',
  SYS_ADMIN: 'System Administration'
} as const;

export type ERPModuleName = typeof ERP_MODULES[keyof typeof ERP_MODULES] | string;

const DEFAULT_MODULE_PERMISSIONS: ModulePermissions = {
  View: false,
  Create: false,
  Edit: false,
  Delete: false,
};

class PermissionService {
  // Session Support & Permission Cache
  private currentRoleId: string | null = null;
  private cachedPermissions: PermissionsState | null = null;

  /**
   * Initializes the permission service for the logged-in user.
   * Caches permissions in memory to optimize subsequent checks.
   * Can easily be refactored to fetch from a backend API in the future.
   */
  public async initialize(roleId: string): Promise<void> {
    if (!roleId) {
      this.clearSession();
      return;
    }
    this.currentRoleId = roleId;
    this.cachedPermissions = this.loadPermissionsByRoleId(roleId);
  }

  /**
   * Refreshes the cached permissions from the underlying data source.
   * Useful when permissions are updated or role privileges change.
   */
  public async refresh(): Promise<void> {
    if (this.currentRoleId) {
      this.cachedPermissions = this.loadPermissionsByRoleId(this.currentRoleId);
    }
  }

  /**
   * Clears the active session and cached permissions.
   * Should be called upon user logout.
   */
  public clearSession(): void {
    this.currentRoleId = null;
    this.cachedPermissions = null;
  }

  /**
   * Validates and sanitizes raw permission data to ensure all keys and booleans exist.
   * Prevents runtime errors from corrupted or incomplete LocalStorage/API data.
   */
  private validatePermissions(rawData: any): PermissionsState {
    const validated: PermissionsState = {};
    if (typeof rawData !== 'object' || rawData === null) {
      return validated;
    }

    for (const [moduleName, perms] of Object.entries(rawData)) {
      if (typeof perms === 'object' && perms !== null) {
        validated[moduleName] = {
          View: Boolean((perms as Record<string, unknown>).View),
          Create: Boolean((perms as Record<string, unknown>).Create),
          Edit: Boolean((perms as Record<string, unknown>).Edit),
          Delete: Boolean((perms as Record<string, unknown>).Delete),
        };
      }
    }
    return validated;
  }

  /**
   * Loads all permissions for a given Role ID from the data source (LocalStorage).
   * Gracefully handles missing role ID, missing data, and invalid JSON.
   */
  public loadPermissionsByRoleId(roleId: string): PermissionsState {
    if (!roleId) return {};

    try {
      const savedPermissions = localStorage.getItem(`permissions_${roleId}`);
      if (savedPermissions) {
        const parsed = JSON.parse(savedPermissions);
        return this.validatePermissions(parsed);
      }
    } catch (error) {
      console.error(`[PermissionService] Failed to load permissions for role: ${roleId}`, error);
    }

    return {};
  }

  /**
   * Save permissions to backend
   */
  public async savePermissionsToBackend(companyId: number, role: string, featureIds: number[]): Promise<void> {
    try {
      const { apiRequest } = await import('./apiClient');
      await apiRequest('/role-permission/assign', {
        method: 'POST',
        bodyData: { companyId, role, featureIds }
      });
    } catch (error) {
      console.error(`[PermissionService] Failed to save permissions to backend`, error);
    }
  }

  /**
   * Gets the permissions for a specific module.
   * Uses memory cache if active, otherwise reads directly from source for backwards compatibility.
   */
  public getPermissionsForModule(roleId: string | null, moduleName: string): ModulePermissions {
    if (!moduleName) return { ...DEFAULT_MODULE_PERMISSIONS };

    const activeRoleId = roleId || this.currentRoleId || localStorage.getItem('activeRole') || 'SUPER_ADMIN';

    let allPermissions: PermissionsState = {};

    if (this.cachedPermissions && this.currentRoleId === activeRoleId) {
      allPermissions = this.cachedPermissions;
    } else if (activeRoleId) {
      allPermissions = this.loadPermissionsByRoleId(activeRoleId);
    }

    if (allPermissions[moduleName]) {
      return allPermissions[moduleName];
    }

    // Default fallback if no custom policy is saved
    if (activeRoleId === 'SUPER_ADMIN' || activeRoleId === 'COMPANY_ADMIN') {
      return { View: true, Create: true, Edit: true, Delete: true };
    }

    return { ...DEFAULT_MODULE_PERMISSIONS };
  }

  /**
   * Core helper to check if a specific action is allowed.
   */
  private checkAction(roleId: string | null, moduleName: string, action: ModuleAction): boolean {
    const permissions = this.getPermissionsForModule(roleId, moduleName);
    return permissions[action] === true;
  }

  /**
   * Checks if the role has 'View' permission for a module.
   */
  public canView(roleId: string | null, moduleName: string): boolean {
    return this.checkAction(roleId, moduleName, 'View');
  }

  /**
   * Checks if the role has 'Create' permission for a module.
   */
  public canCreate(roleId: string | null, moduleName: string): boolean {
    return this.checkAction(roleId, moduleName, 'Create');
  }

  /**
   * Checks if the role has 'Edit' permission for a module.
   */
  public canEdit(roleId: string | null, moduleName: string): boolean {
    return this.checkAction(roleId, moduleName, 'Edit');
  }

  /**
   * Checks if the role has 'Delete' permission for a module.
   */
  public canDelete(roleId: string | null, moduleName: string): boolean {
    return this.checkAction(roleId, moduleName, 'Delete');
  }

  /**
   * Checks whether a module is broadly accessible (has at least one permission).
   * Useful for showing/hiding sidebar items.
   */
  public isModuleAccessible(roleId: string | null, moduleName: string): boolean {
    if (!moduleName) return false;
    
    const permissions = this.getPermissionsForModule(roleId, moduleName);
    return Object.values(permissions).some((hasAccess) => hasAccess === true);
  }
}

// Export a singleton instance to be used across the application
export const permissionService = new PermissionService();
