import { useState, useEffect } from 'react';
import { Save, CheckCircle2, AlertCircle, Loader2, Plus, X, Edit2, Trash2, Search } from 'lucide-react';
import { PageHeader, ActionButton } from './components/shared';
import { ROLES } from '../../constants/roles';
import { permissionService } from '../../services/permissionService';
import { apiRequest } from '../../services/apiClient';
import { motion, AnimatePresence } from 'framer-motion';

const MODULES = [
  'Products & Master',
  'Inventory & Warehouse Management',
  'C&F Management',
  'Distributor/Stockist Portal',
  'Retailer Ordering System',
  'MR (Medical Representative)',
  'GPS & Location Tracking',
  'Wholesale Billing System',
  'Pre-Sales CRM',
  'Accounting & Finance',
  
];

const ACTIONS = ['View', 'Create', 'Edit', 'Delete'];

type PermissionsState = Record<string, Record<string, boolean>>;
type Role = typeof ROLES[0];

export default function RolesPermissions() {
  const initialSystemRoles = ROLES.filter(r => r.title !== 'Transport Staff');

  const [allRoles, setAllRoles] = useState<Role[]>(initialSystemRoles);
  const [selectedRole, setSelectedRole] = useState(initialSystemRoles[0]);
  const [permissions, setPermissions] = useState<PermissionsState>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [roleSearchQuery, setRoleSearchQuery] = useState('');

  // Modal States
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  // Form States
  const [generatedRoleId, setGeneratedRoleId] = useState('');
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDesc, setNewRoleDesc] = useState('');
  const [newRoleStatus, setNewRoleStatus] = useState('Active');
  
  const [editRoleName, setEditRoleName] = useState('');
  const [editRoleDesc, setEditRoleDesc] = useState('');
  const [editRoleStatus, setEditRoleStatus] = useState('Active');
  
  const [nameError, setNameError] = useState('');
  const [assignedUserCount, setAssignedUserCount] = useState(0);

  const isSystemRole = initialSystemRoles.some(r => r.id === selectedRole.id);
  const filteredRoles = allRoles.filter(role => role.title.toLowerCase().includes(roleSearchQuery.toLowerCase()));

  // Load custom roles on initial render
  useEffect(() => {
    const savedCustomRoles = localStorage.getItem('custom_roles');
    if (savedCustomRoles) {
      const parsedCustomRoles = JSON.parse(savedCustomRoles).map((r: any) => ({
        ...r,
        Icon: initialSystemRoles[0].Icon
      }));
      setAllRoles([...initialSystemRoles, ...parsedCustomRoles]);
    }
  }, []);

  // Initial load of permissions for the selected role
  useEffect(() => {
    const savedPermissions = localStorage.getItem(
      `permissions_${selectedRole.id}`,
    );

    if (savedPermissions) {
      setPermissions(JSON.parse(savedPermissions));
    } else {
      const initialPerms: PermissionsState = {};

      MODULES.forEach((m) => {
        initialPerms[m] = {
          View: true,
          Create:
            selectedRole.title === "Super Admin" ||
            m === "Inventory & Warehouse Management",
          Edit: selectedRole.title === "Super Admin",
          Delete: selectedRole.title === "Super Admin",
        };
      });

      localStorage.setItem(
        `permissions_${selectedRole.id}`,
        JSON.stringify(initialPerms),
      );

      setPermissions(initialPerms);
    }

    setHasChanges(false);
  }, [selectedRole]);

  const handleToggle = (module: string, action: string) => {
    setPermissions(prev => ({
      ...prev,
      [module]: {
        ...prev[module],
        [action]: !prev[module]?.[action]
      }
    }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!hasChanges) return;

    setIsSaving(true);

    // Save to local storage for instant offline resilience
    localStorage.setItem(
      `permissions_${selectedRole.id}`,
      JSON.stringify(permissions),
    );

    // POST role permissions to backend database API endpoint
    try {
      await apiRequest('/permissions', {
        method: 'POST',
        bodyData: {
          roleId: selectedRole.id,
          permissions
        }
      });
    } catch (e) {
      console.warn("Backend API POST /permissions fallback to local storage:", e);
    }

    // Refresh active session permission service cache immediately
    await permissionService.refresh();

    await new Promise((resolve) => setTimeout(resolve, 600));

    setIsSaving(false);
    setHasChanges(false);
    setShowToast(true);

    setTimeout(() => setShowToast(false), 3000);
  };

  const generateRoleId = () => {
    const savedCustomRoles = localStorage.getItem('custom_roles');
    const customRoles = savedCustomRoles ? JSON.parse(savedCustomRoles) : [];
    
    if (customRoles.length === 0) return 'ROLE000001';
    
    const maxNumber = customRoles.reduce((max: number, role: any) => {
      const match = role.id.match(/^ROLE(\d+)$/);
      if (match) {
        const num = parseInt(match[1], 10);
        return num > max ? num : max;
      }
      return max;
    }, 0);
    
    return `ROLE${String(maxNumber + 1).padStart(6, '0')}`;
  };

  const handleCreateRole = () => {
    if (!newRoleName.trim()) {
      setNameError('Role Name is mandatory.');
      return;
    }
    
    if (allRoles.some(r => r.title.toLowerCase() === newRoleName.trim().toLowerCase())) {
      setNameError('Duplicate role names are not allowed.');
      return;
    }
    
    setNameError('');

    const newRole: Role = {
      id: generatedRoleId,
      title: newRoleName.trim(),
      description: newRoleDesc.trim(),
      Icon: initialSystemRoles[0].Icon,
      // @ts-ignore
      status: newRoleStatus,
      createdBy: 'System',
      createdDate: new Date().toISOString(),
      modifiedBy: 'System',
      modifiedDate: new Date().toISOString(),
    };

    const savedCustomRoles = localStorage.getItem('custom_roles');
    const customRoles = savedCustomRoles ? JSON.parse(savedCustomRoles) : [];
    customRoles.push(newRole);
    localStorage.setItem('custom_roles', JSON.stringify(customRoles));

    const initialPerms: PermissionsState = {};
    MODULES.forEach((m) => {
      initialPerms[m] = {
        View: false,
        Create: false,
        Edit: false,
        Delete: false,
      };
    });
    localStorage.setItem(`permissions_${newRole.id}`, JSON.stringify(initialPerms));

    setAllRoles([...allRoles, newRole]);
    setSelectedRole(newRole);
    setShowAddModal(false);
    setNewRoleName('');
    setNewRoleDesc('');
    setNewRoleStatus('Active');
  };

  const openEditModal = () => {
    setEditRoleName(selectedRole.title);
    setEditRoleDesc(selectedRole.description);
    // @ts-ignore
    setEditRoleStatus(selectedRole.status || 'Active');
    setNameError('');
    setShowEditModal(true);
  };

  const handleUpdateRole = () => {
    if (!editRoleName.trim()) {
      setNameError('Role Name is mandatory.');
      return;
    }
    
    if (allRoles.some(r => r.id !== selectedRole.id && r.title.toLowerCase() === editRoleName.trim().toLowerCase())) {
      setNameError('Duplicate role names are not allowed.');
      return;
    }
    
    setNameError('');

    const updatedRole: Role = {
      ...selectedRole,
      title: editRoleName.trim(),
      description: editRoleDesc.trim(),
      // @ts-ignore
      status: editRoleStatus,
      modifiedBy: 'System',
      modifiedDate: new Date().toISOString(),
    };

    const savedCustomRoles = localStorage.getItem('custom_roles');
    let customRoles = savedCustomRoles ? JSON.parse(savedCustomRoles) : [];
    customRoles = customRoles.map((r: Role) => r.id === updatedRole.id ? updatedRole : r);
    localStorage.setItem('custom_roles', JSON.stringify(customRoles));

    setAllRoles(allRoles.map(r => r.id === updatedRole.id ? updatedRole : r));
    setSelectedRole(updatedRole);
    setShowEditModal(false);
  };

  const openDeleteModal = () => {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const count = users.filter((u: any) => u.roleId === selectedRole.id || u.role === selectedRole.id).length;
    setAssignedUserCount(count);
    setShowDeleteModal(true);
  };

  const handleDeleteRole = () => {
    const savedCustomRoles = localStorage.getItem('custom_roles');
    let customRoles = savedCustomRoles ? JSON.parse(savedCustomRoles) : [];
    customRoles = customRoles.filter((r: Role) => r.id !== selectedRole.id);
    localStorage.setItem('custom_roles', JSON.stringify(customRoles));

    localStorage.removeItem(`permissions_${selectedRole.id}`);

    const remainingRoles = allRoles.filter(r => r.id !== selectedRole.id);
    setAllRoles(remainingRoles);
    
    // Select Super Admin (first system role) automatically
    setSelectedRole(remainingRoles[0] || initialSystemRoles[0]);
    setShowDeleteModal(false);
  };

  return (
    <div className="animate-in fade-in duration-500 max-w-6xl pb-20">
      <PageHeader
        title="Roles & Permissions"
        subtitle="Configure granular access control for different modules."
        actions={
          <div className="flex items-center gap-4">
            <ActionButton 
              variant="primary" 
              onClick={() => {
                setGeneratedRoleId(generateRoleId());
                setNewRoleName('');
                setNewRoleDesc('');
                setNewRoleStatus('Active');
                setNameError('');
                setShowAddModal(true);
              }}
              icon={<Plus className="w-4 h-4" />}
            >
              Add Role
            </ActionButton>

            <AnimatePresence>
              {hasChanges && (
                <motion.div 
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="flex items-center gap-2 text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200"
                >
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm font-medium">Unsaved Changes</span>
                </motion.div>
              )}
            </AnimatePresence>
            <ActionButton 
              variant="primary" 
              onClick={handleSave}
              className={`${!hasChanges && !isSaving ? 'opacity-50 cursor-not-allowed bg-slate-300 hover:bg-slate-300 text-slate-500 shadow-none' : ''}`}
              icon={isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            >
              {isSaving ? 'Saving...' : 'Save Policies'}
            </ActionButton>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Panel: Role List */}
        <div className="lg:col-span-1 space-y-1.5 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
          <div className="pb-3 border-b border-slate-100 mb-2">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={roleSearchQuery}
                onChange={(e) => setRoleSearchQuery(e.target.value)}
                placeholder="Search role..."
                className="w-full pl-9 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 transition-all"
              />
            </div>
          </div>

          {filteredRoles.length > 0 ? (
            filteredRoles.map((role) => {
              const isSelected = selectedRole.id === role.id;
            const RoleIcon = role.Icon;
            return (
              <button
                key={role.id}
                onClick={() => setSelectedRole(role)}
                className={`w-full text-left flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  isSelected 
                    ? 'bg-[#163c78]/10 text-violet-700 font-bold border border-violet-200 shadow-sm ring-1 ring-violet-500/10' 
                    : 'text-slate-600 font-medium border border-transparent hover:bg-slate-50 hover:text-slate-900 hover:border-slate-200'
                }`}
              >
                <div className={`p-1.5 rounded-lg ${isSelected ? 'bg-white text-[#163c78] shadow-sm' : 'text-slate-400'}`}>
                  <RoleIcon className="w-4 h-4" />
                </div>
                <span className="truncate">{role.title}</span>
              </button>
            );
          })
        ) : (
          <div className="py-8 text-center">
            <span className="text-sm text-slate-500 font-medium">No roles found</span>
          </div>
        )}
        </div>

        {/* Right Panel: Permission Matrix */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[calc(100vh-14rem)]">
          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80 sticky top-0 z-10">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white rounded-lg shadow-sm text-[#163c78] border border-slate-100">
                <selectedRole.Icon className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-bold text-slate-800">{selectedRole.title} Permissions</h2>
                  {!isSystemRole && (
                    <div className="flex items-center gap-1">
                      <button 
                        onClick={openEditModal} 
                        className="p-1.5 text-slate-400 hover:text-[#163c78] hover:bg-slate-100 rounded-md transition-colors"
                        title="Edit Role"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={openDeleteModal} 
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                        title="Delete Role"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">{selectedRole.description}</p>
              </div>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {MODULES.map((module) => (
              <div key={module} className="p-6 transition-colors hover:bg-slate-50/50 group">
                <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <div className="w-1.5 h-4 bg-violet-200 rounded-full group-hover:bg-violet-400 transition-colors" />
                  {module}
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-y-4 gap-x-6 pl-3">
                  {ACTIONS.map((action) => {
                    const isChecked = permissions[module]?.[action] || false;
                    return (
                      <label 
                        key={action} 
                        className={`flex items-center gap-3 cursor-pointer group/checkbox p-2 rounded-lg transition-colors ${isChecked ? 'bg-[#163c78]/10/50' : 'hover:bg-slate-50'}`}
                      >
                        <div className="relative flex items-center justify-center">
                          <input 
                            type="checkbox" 
                            checked={isChecked}
                            onChange={() => handleToggle(module, action)}
                            className="peer w-4.5 h-4.5 text-[#163c78] border-slate-300 rounded focus:ring-violet-500 focus:ring-offset-0 transition-all cursor-pointer" 
                          />
                        </div>
                        <span className={`text-sm select-none transition-colors ${isChecked ? 'font-semibold text-[#081529]' : 'font-medium text-slate-600 group-hover/checkbox:text-slate-900'}`}>
                          {action}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Add Role Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-100"
            >
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-800">Add New Role</h2>
                <button 
                  onClick={() => setShowAddModal(false)}
                  className="text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    Role ID
                  </label>
                  <input 
                    type="text"
                    value={generatedRoleId}
                    readOnly
                    className="w-full px-3 py-2 border border-slate-200 bg-slate-50 rounded-lg text-slate-500 cursor-not-allowed focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    Role Name <span className="text-rose-500">*</span>
                  </label>
                  <input 
                    type="text"
                    value={newRoleName}
                    onChange={(e) => { setNewRoleName(e.target.value); setNameError(''); }}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#163c78]/20 focus:border-[#163c78] ${nameError ? 'border-rose-500' : 'border-slate-200'}`}
                    placeholder="Enter role name"
                  />
                  {nameError && <p className="text-xs text-rose-500 mt-1.5 font-medium">{nameError}</p>}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    Role Description <span className="text-rose-500">*</span>
                  </label>
                  <textarea 
                    value={newRoleDesc}
                    onChange={(e) => setNewRoleDesc(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#163c78]/20 focus:border-[#163c78]"
                    placeholder="Enter role description"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Status</label>
                  <div className="flex items-center gap-5">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="radio" 
                        name="addRoleStatus" 
                        value="Active" 
                        checked={newRoleStatus === 'Active'}
                        onChange={(e) => setNewRoleStatus(e.target.value)}
                        className="text-[#163c78] focus:ring-[#163c78]"
                      />
                      <span className="text-sm font-medium text-slate-700">Active</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="radio" 
                        name="addRoleStatus" 
                        value="Inactive" 
                        checked={newRoleStatus === 'Inactive'}
                        onChange={(e) => setNewRoleStatus(e.target.value)}
                        className="text-[#163c78] focus:ring-[#163c78]"
                      />
                      <span className="text-sm font-medium text-slate-700">Inactive</span>
                    </label>
                  </div>
                </div>
              </div>
              <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3">
                <button 
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-200/50 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <ActionButton variant="primary" onClick={handleCreateRole}>
                  Create Role
                </ActionButton>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Role Modal */}
      <AnimatePresence>
        {showEditModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-100"
            >
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-800">Edit Role</h2>
                <button 
                  onClick={() => setShowEditModal(false)}
                  className="text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    Role ID
                  </label>
                  <input 
                    type="text"
                    value={selectedRole.id}
                    readOnly
                    className="w-full px-3 py-2 border border-slate-200 bg-slate-50 rounded-lg text-slate-500 cursor-not-allowed focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    Role Name <span className="text-rose-500">*</span>
                  </label>
                  <input 
                    type="text"
                    value={editRoleName}
                    onChange={(e) => { setEditRoleName(e.target.value); setNameError(''); }}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#163c78]/20 focus:border-[#163c78] ${nameError ? 'border-rose-500' : 'border-slate-200'}`}
                    placeholder="Enter role name"
                  />
                  {nameError && <p className="text-xs text-rose-500 mt-1.5 font-medium">{nameError}</p>}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    Role Description <span className="text-rose-500">*</span>
                  </label>
                  <textarea 
                    value={editRoleDesc}
                    onChange={(e) => setEditRoleDesc(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#163c78]/20 focus:border-[#163c78]"
                    placeholder="Enter role description"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Status</label>
                  <div className="flex items-center gap-5">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="radio" 
                        name="editRoleStatus" 
                        value="Active" 
                        checked={editRoleStatus === 'Active'}
                        onChange={(e) => setEditRoleStatus(e.target.value)}
                        className="text-[#163c78] focus:ring-[#163c78]"
                      />
                      <span className="text-sm font-medium text-slate-700">Active</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="radio" 
                        name="editRoleStatus" 
                        value="Inactive" 
                        checked={editRoleStatus === 'Inactive'}
                        onChange={(e) => setEditRoleStatus(e.target.value)}
                        className="text-[#163c78] focus:ring-[#163c78]"
                      />
                      <span className="text-sm font-medium text-slate-700">Inactive</span>
                    </label>
                  </div>
                </div>
              </div>
              <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3">
                <button 
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-200/50 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <ActionButton variant="primary" onClick={handleUpdateRole}>
                  Update Role
                </ActionButton>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Role Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-100"
            >
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-800">Delete Role</h2>
                <button 
                  onClick={() => setShowDeleteModal(false)}
                  className="text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-6">
                <div className="mb-4">
                  <span className="block text-sm font-semibold text-slate-500 mb-1">Role:</span>
                  <span className="block text-base font-bold text-slate-800">{selectedRole.title}</span>
                </div>

                {assignedUserCount > 0 ? (
                  <>
                    <p className="text-rose-600 text-sm font-medium mb-1">
                      This role is currently assigned to <span className="text-lg font-bold mx-1">{assignedUserCount}</span> users.
                    </p>
                    <p className="text-slate-600 text-sm">
                      Please reassign those users before deleting this role.
                    </p>
                  </>
                ) : (
                  <p className="text-slate-600 text-sm">
                    This action cannot be undone.
                  </p>
                )}
              </div>

              <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3">
                <button 
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-200/50 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                {assignedUserCount === 0 && (
                  <button 
                    onClick={handleDeleteRole}
                    className="px-4 py-2 text-sm font-bold text-white bg-rose-500 hover:bg-rose-600 rounded-lg transition-colors shadow-sm"
                  >
                    Delete
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Success Toast Snackbar */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-6 right-6 bg-slate-900 text-white px-5 py-3.5 rounded-xl shadow-2xl flex items-center gap-3 z-50 border border-slate-800"
          >
            <div className="bg-emerald-500/20 text-emerald-400 rounded-full p-1">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <p className="text-sm font-medium pr-2">Permissions updated successfully</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}