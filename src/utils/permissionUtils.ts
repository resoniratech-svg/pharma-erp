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

  allowedModules.forEach((module) => {
    permissions[module] = {
      View: true,

      // Super Admin gets all permissions
      Create: roleId === 'SUPER_ADMIN',
      Edit: roleId === 'SUPER_ADMIN',
      Delete: roleId === 'SUPER_ADMIN',
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

    // First login or cleared localStorage
    if (!savedPermissions) {
      const defaults = createDefaultPermissions(roleId);

      localStorage.setItem(
        `permissions_${roleId}`,
        JSON.stringify(defaults),
      );

      savedPermissions = JSON.stringify(defaults);
    }

    const permissions: PermissionsState = JSON.parse(savedPermissions);

    return permissions?.[module]?.[action] ?? false;
  } catch (error) {
    console.error('Permission check failed:', error);
    return false;
  }
};