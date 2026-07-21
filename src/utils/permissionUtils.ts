import { ROLE_PERMISSIONS } from '../constants/permissions';

type PermissionActions = {
  View: boolean;
  Create: boolean;
  Edit: boolean;
  Delete: boolean;
};

type PermissionsState = Record<string, PermissionActions>;

const createDefaultPermissions = (roleId: string): PermissionsState => {
  const allowedModules = ROLE_PERMISSIONS[roleId] || [];

  const permissions: PermissionsState = {};
  const isFullAccessRole = roleId === 'SUPER_ADMIN' || roleId === 'ACCOUNTANT' || roleId === 'ROLE_ACCOUNTANT';

  allowedModules.forEach((module) => {
    permissions[module] = {
      View: true,
      Create: isFullAccessRole,
      Edit: isFullAccessRole,
      Delete: isFullAccessRole,
    };
  });

  return permissions;
};

export const hasModulePermission = (
  roleId: string,
  module: string,
  action: keyof PermissionActions,
): boolean => {
  try {
    let savedPermissions = localStorage.getItem(`permissions_${roleId}`);

    if (!savedPermissions) {
      const defaults = createDefaultPermissions(roleId);
      localStorage.setItem(
        `permissions_${roleId}`,
        JSON.stringify(defaults),
      );
      savedPermissions = JSON.stringify(defaults);
    }

    const parsed: PermissionsState = JSON.parse(savedPermissions);

    // Dynamic fallback for Accountant and Super Admin
    if (roleId === 'SUPER_ADMIN' || roleId === 'ACCOUNTANT' || roleId === 'ROLE_ACCOUNTANT') {
      return true;
    }

    return parsed[module]?.[action] ?? false;
  } catch {
    return true;
  }
};