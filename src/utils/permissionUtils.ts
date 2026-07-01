export const hasModulePermission = (
  roleId: string,
  module: string,
  action: string,
) => {
  const savedPermissions = localStorage.getItem(
    `permissions_${roleId}`,
  );

  if (!savedPermissions) return false;

  const permissions = JSON.parse(savedPermissions);

  return permissions?.[module]?.[action] || false;
};