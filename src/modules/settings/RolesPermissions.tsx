import { useState, useEffect } from 'react';
import { Save, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { PageHeader, ActionButton } from './components/shared';
import { ROLES } from '../../constants/roles';
import { motion, AnimatePresence } from 'framer-motion';

const MODULES = [
  'Products & Master', 
  'Inventory Management', 
  'Billing & Invoicing', 
  'Finance & Ledgers',
  'User Access Control'
];
const ACTIONS = ['View', 'Create', 'Edit', 'Delete'];

type PermissionsState = Record<string, Record<string, boolean>>;

export default function RolesPermissions() {
  const [selectedRole, setSelectedRole] = useState(ROLES[0]);
  const [permissions, setPermissions] = useState<PermissionsState>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);

  // Mock initial load of permissions for the selected role
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
            m === "Inventory Management",
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

   localStorage.setItem(
     `permissions_${selectedRole.id}`,
     JSON.stringify(permissions),
   );

   await new Promise((resolve) => setTimeout(resolve, 800));

   setIsSaving(false);
   setHasChanges(false);
   setShowToast(true);

   setTimeout(() => setShowToast(false), 3000);
 };

  return (
    <div className="animate-in fade-in duration-500 max-w-6xl pb-20">
      <PageHeader
        title="Roles & Permissions"
        subtitle="Configure granular access control for different modules."
        actions={
          <div className="flex items-center gap-4">
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
          {ROLES.map((role) => {
            const isSelected = selectedRole.id === role.id;
            const RoleIcon = role.Icon;
            return (
              <button
                key={role.id}
                onClick={() => setSelectedRole(role)}
                className={`w-full text-left flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  isSelected 
                    ? 'bg-violet-50 text-violet-700 font-bold border border-violet-200 shadow-sm ring-1 ring-violet-500/10' 
                    : 'text-slate-600 font-medium border border-transparent hover:bg-slate-50 hover:text-slate-900 hover:border-slate-200'
                }`}
              >
                <div className={`p-1.5 rounded-lg ${isSelected ? 'bg-white text-violet-600 shadow-sm' : 'text-slate-400'}`}>
                  <RoleIcon className="w-4 h-4" />
                </div>
                <span className="truncate">{role.title}</span>
              </button>
            );
          })}
        </div>

        {/* Right Panel: Permission Matrix */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[calc(100vh-14rem)]">
          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80 sticky top-0 z-10">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white rounded-lg shadow-sm text-violet-600 border border-slate-100">
                <selectedRole.Icon className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-800">{selectedRole.title} Permissions</h2>
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
                        className={`flex items-center gap-3 cursor-pointer group/checkbox p-2 rounded-lg transition-colors ${isChecked ? 'bg-violet-50/50' : 'hover:bg-slate-50'}`}
                      >
                        <div className="relative flex items-center justify-center">
                          <input 
                            type="checkbox" 
                            checked={isChecked}
                            onChange={() => handleToggle(module, action)}
                            className="peer w-4.5 h-4.5 text-violet-600 border-slate-300 rounded focus:ring-violet-500 focus:ring-offset-0 transition-all cursor-pointer" 
                          />
                        </div>
                        <span className={`text-sm select-none transition-colors ${isChecked ? 'font-semibold text-violet-900' : 'font-medium text-slate-600 group-hover/checkbox:text-slate-900'}`}>
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
