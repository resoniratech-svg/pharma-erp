import { useEffect, useState, useRef } from 'react';
import { Users, Shield, Lock, Search, ChevronDown, Plus, Ban, Eye, CheckCircle } from 'lucide-react';
import {
  PageHeader,
  FilterBar,
  SearchInput,
  SelectFilter,
  ActionButton,
  TableCard,
  DataTable,
  Badge,
  SummaryCard,
  Drawer,
  DrawerField
} from './components/shared';
import { type Column } from './components/shared';
import { motion, AnimatePresence } from 'framer-motion';

import { seedUsers, type UserRole } from '../../data/seedUsers';

function useOnClickOutside(ref: React.RefObject<HTMLElement | null>, handler: (event: MouseEvent | TouchEvent) => void) {
  useEffect(() => {
    const listener = (event: MouseEvent | TouchEvent) => {
      if (!ref.current || ref.current.contains(event.target as Node)) {
        return;
      }
      handler(event);
    };
    document.addEventListener("mousedown", listener);
    document.addEventListener("touchstart", listener);
    return () => {
      document.removeEventListener("mousedown", listener);
      document.removeEventListener("touchstart", listener);
    };
  }, [ref, handler]);
}

interface DropdownProps {
  options: { label: string; value: string }[];
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
}

const SearchableDropdown = ({ options, value, onChange, placeholder }: DropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  
  useOnClickOutside(ref, () => setIsOpen(false));

  const filteredOptions = options.filter((o) => o.label.toLowerCase().includes(search.toLowerCase()));
  const selectedOption = options.find((o) => o.value === value);

  return (
    <div className="relative" ref={ref}>
      <div 
        className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-colors flex items-center justify-between cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={selectedOption ? 'text-slate-900' : 'text-slate-400'}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown className="w-4 h-4 text-slate-400" />
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl overflow-hidden"
          >
            <div className="p-2 border-b border-slate-100">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-slate-400" />
                <input 
                  type="text"
                  autoFocus
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border-none rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-violet-500/20"
                  placeholder="Search roles..."
                />
              </div>
            </div>
            <div className="max-h-48 overflow-y-auto p-1">
              {filteredOptions.length > 0 ? filteredOptions.map((opt) => (
                <div 
                  key={opt.value}
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                    setSearch('');
                  }}
                  className={`px-3 py-2 text-sm rounded-md cursor-pointer transition-colors ${value === opt.value ? 'bg-[#163c78]/10 text-[#163c78] font-semibold' : 'text-slate-700 hover:bg-slate-50'}`}
                >
                  {opt.label}
                </div>
              )) : (
                <div className="px-3 py-4 text-sm text-center text-slate-500">No roles found</div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function UserManagement() {
  const [roles, setRoles] = useState<{name: string, users: number, status: string}[]>([]);
  const [users, setUsers] = useState<UserRole[]>([]);
  
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [selectedRole, setSelectedRole] = useState('Super Admin');

  const [showRoleModal, setShowRoleModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  const [showViewDrawer, setShowViewDrawer] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserRole | null>(null);

  const [showResetDialog, setShowResetDialog] = useState(false);
  const [showLockDialog, setShowLockDialog] = useState(false);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [targetUser, setTargetUser] = useState<UserRole | null>(null);

  const [formData, setFormData] = useState({
    empId: '',
    fullName: '',
    email: '',
    phone: '',
    username: '',
    roleId: '',
    password: '',
    confirmPassword: '',
    status: 'Active'
  });

  useEffect(() => {
    const savedUsers = localStorage.getItem('users');
    let parsedUsers: UserRole[] = savedUsers ? JSON.parse(savedUsers) : seedUsers;
    
    // Schema migration / regeneration check
    if (parsedUsers.length > 0 && (!parsedUsers[0].password || parsedUsers[0].password === '123')) {
      parsedUsers = seedUsers;
      localStorage.setItem('users', JSON.stringify(seedUsers));
    }
    
    // Tenant Scoping
    const sessionStr = localStorage.getItem('centralAuthSession');
    const session = sessionStr ? JSON.parse(sessionStr) : null;
    if (session?.role === 'COMPANY_ADMIN' && session.tenantId) {
      parsedUsers = parsedUsers.filter((u: any) => u.tenantId === session.tenantId);
    }
    
    setUsers(parsedUsers);

    const customRolesRaw = localStorage.getItem("custom_roles");
    const customRoles = customRolesRaw ? JSON.parse(customRolesRaw) : [];
    
    const systemRoleNames = [
      'Super Admin', 'Warehouse Manager', 'Accountant', 
      'Distributor', 'Retailer', 'Medical Representative'
    ];
    
    const allRolesData = [
      ...systemRoleNames.map(name => ({ title: name, status: 'Active' })),
      ...customRoles
    ];

    const mappedRoles = allRolesData.map(r => {
      const count = parsedUsers.filter((u: UserRole) => u.role === r.title).length;
      return {
        name: r.title,
        users: count,
        status: r.status || 'Active'
      };
    });

    setRoles(mappedRoles);
  }, []);

  const handleCreateUser = () => {
    const errors: { [key: string]: string } = {};

    if (!formData.fullName.trim()) errors.fullName = "Full Name is required";
    if (!formData.email.trim()) errors.email = "Email Address is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) errors.email = "Invalid email format";
    
    if (!formData.username.trim()) errors.username = "Username is required";
    if (!formData.roleId) errors.roleId = "Role is required";

    if (!editMode && !formData.password) errors.password = "Password is required";
    else if (formData.password && formData.password.length < 6) errors.password = "Password must be at least 6 characters";

    if (formData.password && formData.password !== formData.confirmPassword) errors.confirmPassword = "Passwords do not match";

    if (formData.phone && !/^\d{10}$/.test(formData.phone)) errors.phone = "Phone must be 10 digits";

    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;

    if (editMode) {
      // Fetch all users to update the correct one
      const allUsersStr = localStorage.getItem('users');
      const allUsers = allUsersStr ? JSON.parse(allUsersStr) : [];
      const updatedAllUsers = allUsers.map((u: any) => u.id === formData.empId ? {
        ...u,
        name: formData.fullName,
        email: formData.email,
        mobile: formData.phone,
        username: formData.username,
        role: formData.roleId,
        ...(formData.password ? { password: formData.password } : {}),
        status: formData.status as 'Active' | 'Inactive',
        modifiedDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
      } : u);
      
      const updatedUsers = users.map(u => u.id === formData.empId ? updatedAllUsers.find((au: any) => au.id === formData.empId) : u);
      
      setUsers(updatedUsers);
      localStorage.setItem('users', JSON.stringify(updatedAllUsers));
    } else {
      const sessionStr = localStorage.getItem('centralAuthSession');
      const session = sessionStr ? JSON.parse(sessionStr) : null;

      const newUser: any = {
        id: formData.empId,
        name: formData.fullName,
        email: formData.email,
        mobile: formData.phone,
        username: formData.username,
        password: formData.password,
        role: formData.roleId,
        status: formData.status as 'Active' | 'Inactive',
        lastLogin: '-',
        createdBy: 'Current User',
        createdDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        modifiedBy: 'Current User',
        modifiedDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        tenantId: session?.tenantId || null,
        purchasedModules: session?.purchasedModules || []
      };

      const allUsersStr = localStorage.getItem('users');
      const allUsers = allUsersStr ? JSON.parse(allUsersStr) : [];
      
      const updatedAllUsers = [...allUsers, newUser];
      setUsers([...users, newUser]);
      localStorage.setItem('users', JSON.stringify(updatedAllUsers));
      setRoles(roles.map(r => r.name === newUser.role ? { ...r, users: r.users + 1 } : r));
    }

    setFormData({
      empId: '', fullName: '', email: '', phone: '', username: '', roleId: '', password: '', confirmPassword: '', status: 'Active'
    });
    setShowRoleModal(false);
  };

  const columns: Column<UserRole>[] = [
    { key: "id", label: "Employee ID" },
    {
      key: "name",
      label: "Full Name",
      render: (row) => (
        <span className="font-semibold text-slate-900">{row.name}</span>
      ),
    },
    { key: "username", label: "Username" },
    { key: "email", label: "Email" },
    {
      key: "role",
      label: "Assigned Role",
      render: (row) => <Badge variant="purple">{row.role}</Badge>,
    },
    {
      key: "status",
      label: "Status",
      render: (row) => {
        const badgeVariant = row.status === "Active" ? "success" : row.status === "Locked" ? "danger" : "neutral";
        return <Badge variant={badgeVariant}>{row.status}</Badge>;
      },
    },
    {
      key: "lastLogin",
      label: "Last Login",
      render: (row) => (
        <span className="text-slate-500 text-sm">{row.lastLogin}</span>
      ),
    },
    {
      key: "action",
      label: "Actions",
      render: (row) => (
        <div className="flex items-center gap-3">
          <button 
            className="text-slate-400 hover:text-[#163c78] transition-colors" 
            title="View"
            onClick={() => {
              setSelectedUser(row);
              setShowViewDrawer(true);
            }}
          >
            <Eye className="w-4 h-4" />
          </button>
          <button 
            className="text-slate-400 hover:text-rose-600 transition-colors" 
            title="Lock / Unlock"
            onClick={() => {
              setTargetUser(row);
              setShowLockDialog(true);
            }}
          >
            {row.status === 'Locked' ? <CheckCircle className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
          </button>
          <button 
            className="text-slate-400 hover:text-rose-600 transition-colors" 
            title="Activate / Deactivate"
            onClick={() => {
              setTargetUser(row);
              setShowStatusDialog(true);
            }}
          >
            <Ban className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  const filteredData = users.filter((item) => {
    const matchSearch = 
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.id.toLowerCase().includes(search.toLowerCase()) ||
      item.email.toLowerCase().includes(search.toLowerCase());

    const activeRole = selectedRole || roleFilter;
    const matchRole = activeRole ? item.role === activeRole : true;
    
    return matchSearch && matchRole;
  });

  const activeRolesOptions = roles
    .filter(r => r.status === 'Active')
    .map(r => ({ label: r.name, value: r.name }));

  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader
        title="User Management"
        subtitle="Manage system users, assign roles, and monitor user accounts."
        actions={
          <>
            <ActionButton
              variant="secondary"
              onClick={() => {
                const csvContent = [
                  ["Employee ID", "Name", "Email", "Role", "Status", "Last Login"],
                  ...filteredData.map((user) => [
                    user.id,
                    user.name,
                    user.email,
                    user.role,
                    user.status,
                    user.lastLogin,
                  ]),
                ]
                  .map((row) => row.join(","))
                  .join("\n");

                const blob = new Blob([csvContent], {
                  type: "text/csv;charset=utf-8;",
                });

                const url = URL.createObjectURL(blob);

                const link = document.createElement("a");
                link.href = url;
                link.download = "Users.csv";

                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);

                URL.revokeObjectURL(url);
              }}
            >
              Export CSV
            </ActionButton>
            <ActionButton
              variant="primary"
              icon={<Plus className="w-4 h-4" />}
              onClick={() => {
                setEditMode(false);
                setFormErrors({});
                let maxId = 0;
                users.forEach(u => {
                  if (u.id.startsWith('EMP')) {
                    const num = parseInt(u.id.replace('EMP', ''), 10);
                    if (!isNaN(num) && num > maxId) maxId = num;
                  }
                });
                const nextId = `EMP${(maxId + 1).toString().padStart(3, '0')}`;
                setFormData({
                  empId: nextId, fullName: '', email: '', phone: '', username: '', roleId: '', password: '', confirmPassword: '', status: 'Active'
                });
                setShowRoleModal(true);
              }}
            >
              Create User
            </ActionButton>
          </>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <SummaryCard
          title="Total Users"
          value={users.length.toString()}
          icon={<Users className="w-6 h-6" />}
          colorClass="text-[#163c78]"
          bgClass="bg-violet-100"
        />

        <SummaryCard
          title="Active Users"
          value={users.filter(u => u.status === 'Active').length.toString()}
          icon={<Users className="w-6 h-6" />}
          colorClass="text-green-600"
          bgClass="bg-green-100"
        />

        <SummaryCard
          title="Active Roles"
          value={roles.filter(r => r.status === 'Active').length.toString()}
          icon={<Shield className="w-6 h-6" />}
          colorClass="text-blue-600"
          bgClass="bg-blue-100"
        />

        <SummaryCard
          title="Locked Accounts"
          value={users.filter(u => u.status === 'Locked').length.toString()}
          icon={<Lock className="w-6 h-6" />}
          colorClass="text-red-600"
          bgClass="bg-red-100"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 space-y-2 bg-white p-4 rounded-2xl border border-slate-200">
          <h3 className="font-semibold text-slate-800 mb-3 px-2">
            Role Management
          </h3>
          {roles.map((role) => (
            <div
              key={role.name}
              onClick={() => setSelectedRole(role.name)}
              className={`px-4 py-3 rounded-lg border cursor-pointer transition-colors ${
                selectedRole === role.name
                  ? "bg-[#163c78]/10 text-violet-700 border-violet-200 font-semibold"
                  : "text-slate-700 border-transparent hover:border-slate-200 hover:bg-slate-50"
              }`}
            >
              <div className="flex justify-between items-center">
                <span>{role.name}</span>

                <span className="text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-600">
                  {role.users}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="lg:col-span-3">
          <FilterBar>
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search user..."
            />
            <div className="w-px h-6 bg-slate-200 mx-2 hidden sm:block" />
            <SelectFilter
              value={roleFilter}
              onChange={setRoleFilter}
              options={roles.map((role) => ({
                label: role.name,
                value: role.name,
              }))}
              placeholder="All Roles"
            />
          </FilterBar>

          <TableCard>
            <DataTable columns={columns} data={filteredData} />
          </TableCard>
        </div>
      </div>

      {/* CREATE USER MODAL */}
      {showRoleModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={() => setShowRoleModal(false)}
        >
          <div 
            className="bg-white rounded-2xl shadow-xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center text-[#163c78]">
                  <Users className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold text-slate-800">{editMode ? 'Edit User' : 'Create User'}</h2>
              </div>
              <button
                onClick={() => setShowRoleModal(false)}
                className="text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg p-2 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="md:col-span-2">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Account Details</h3>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Employee ID <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.empId}
                  readOnly={true}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-colors text-slate-500 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                  className={`w-full px-3 py-2.5 bg-white border ${formErrors.fullName ? 'border-rose-500' : 'border-slate-200'} rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-colors`}
                />
                {formErrors.fullName && <p className="text-rose-500 text-xs mt-1">{formErrors.fullName}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Email Address <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className={`w-full px-3 py-2.5 bg-white border ${formErrors.email ? 'border-rose-500' : 'border-slate-200'} rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-colors`}
                />
                {formErrors.email && <p className="text-rose-500 text-xs mt-1">{formErrors.email}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Mobile Number
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className={`w-full px-3 py-2.5 bg-white border ${formErrors.phone ? 'border-rose-500' : 'border-slate-200'} rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-colors`}
                />
                {formErrors.phone && <p className="text-rose-500 text-xs mt-1">{formErrors.phone}</p>}
              </div>

              <div className="md:col-span-2 mt-2">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">System Access</h3>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Username <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({...formData, username: e.target.value})}
                  className={`w-full px-3 py-2.5 bg-white border ${formErrors.username ? 'border-rose-500' : 'border-slate-200'} rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-colors`}
                />
                {formErrors.username && <p className="text-rose-500 text-xs mt-1">{formErrors.username}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Assigned Role <span className="text-rose-500">*</span>
                </label>
                <SearchableDropdown 
                  options={activeRolesOptions}
                  value={formData.roleId}
                  onChange={(val: string) => setFormData({...formData, roleId: val})}
                  placeholder="Select Role..."
                />
                {formErrors.roleId && <p className="text-rose-500 text-xs mt-1">{formErrors.roleId}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Password {!editMode && <span className="text-rose-500">*</span>}
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className={`w-full px-3 py-2.5 bg-white border ${formErrors.password ? 'border-rose-500' : 'border-slate-200'} rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-colors`}
                />
                {formErrors.password && <p className="text-rose-500 text-xs mt-1">{formErrors.password}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Confirm Password {!editMode && <span className="text-rose-500">*</span>}
                </label>
                <input
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                  className={`w-full px-3 py-2.5 bg-white border ${formErrors.confirmPassword ? 'border-rose-500' : 'border-slate-200'} rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-colors`}
                />
                {formErrors.confirmPassword && <p className="text-rose-500 text-xs mt-1">{formErrors.confirmPassword}</p>}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Status <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                  className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-colors appearance-none cursor-pointer"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-slate-100">
              <ActionButton
                variant="secondary"
                onClick={() => setShowRoleModal(false)}
              >
                Cancel
              </ActionButton>

              <ActionButton variant="primary" onClick={handleCreateUser}>
                {editMode ? 'Save Changes' : 'Create User'}
              </ActionButton>
            </div>
          </div>
        </div>
      )}

      {/* VIEW / EDIT DRAWER */}
      <Drawer 
        open={showViewDrawer} 
        onClose={() => setShowViewDrawer(false)} 
        title="User Details"
      >
        {selectedUser && (
          <div className="flex flex-col h-full">
            <div className="space-y-4 flex-1">
              <DrawerField label="Employee ID" value={selectedUser.id} />
              <DrawerField label="Full Name" value={selectedUser.name} />
              <DrawerField label="Email Address" value={selectedUser.email} />
              <DrawerField label="Mobile Number" value={selectedUser.mobile} />
              <DrawerField label="Username" value={selectedUser.username} />
              <DrawerField label="Assigned Role" value={selectedUser.role} />
              <DrawerField label="Account Status" value={selectedUser.status} />
              <DrawerField label="Last Login" value={selectedUser.lastLogin} />
              <DrawerField label="Created By" value={selectedUser.createdBy} />
              <DrawerField label="Created Date" value={selectedUser.createdDate} />
              <DrawerField label="Modified By" value={selectedUser.modifiedBy} />
              <DrawerField label="Modified Date" value={selectedUser.modifiedDate} />
            </div>

            <div className="pt-6 mt-6 border-t border-slate-100 flex justify-end gap-3 pb-4">
              <ActionButton variant="secondary" onClick={() => setShowViewDrawer(false)}>
                Cancel
              </ActionButton>
              <ActionButton variant="primary" onClick={() => {
                setFormErrors({});
                setFormData({
                  empId: selectedUser.id,
                  fullName: selectedUser.name,
                  email: selectedUser.email,
                  phone: selectedUser.mobile || '',
                  username: selectedUser.username || '',
                  roleId: selectedUser.role,
                  password: '',
                  confirmPassword: '',
                  status: selectedUser.status
                });
                setEditMode(true);
                setShowViewDrawer(false);
                setShowRoleModal(true);
              }}>
                Edit User
              </ActionButton>
            </div>
          </div>
        )}
      </Drawer>

      {/* RESET PASSWORD DIALOG */}
      {showResetDialog && targetUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <h2 className="text-xl font-bold text-slate-800 mb-4">Reset Password</h2>
            <div className="mb-6 text-sm text-slate-600">
              <p className="mb-2"><span className="font-semibold text-slate-700">User:</span><br/>{targetUser.name}</p>
              <p className="mb-4"><span className="font-semibold text-slate-700">Employee ID:</span><br/>{targetUser.id}</p>
              <p>Generate a temporary password for this user?</p>
            </div>
            <div className="flex justify-end gap-3">
              <ActionButton variant="secondary" onClick={() => setShowResetDialog(false)}>Cancel</ActionButton>
              <ActionButton variant="primary" onClick={() => {
                alert('Password reset successfully');
                setShowResetDialog(false);
              }}>Reset Password</ActionButton>
            </div>
          </div>
        </div>
      )}

      {/* LOCK / UNLOCK DIALOG */}
      {showLockDialog && targetUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <h2 className="text-xl font-bold text-slate-800 mb-4">
              {targetUser.status === 'Locked' ? 'Unlock User' : 'Lock User'}
            </h2>
            <div className="mb-6 text-sm text-slate-600">
              <p className="mb-4"><span className="font-semibold text-slate-700">User:</span><br/>{targetUser.name}</p>
              {targetUser.status !== 'Locked' && (
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Reason (optional)</label>
                  <textarea 
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-violet-500 transition-colors" 
                    rows={2} 
                  />
                </div>
              )}
            </div>
            <div className="flex justify-end gap-3">
              <ActionButton variant="secondary" onClick={() => setShowLockDialog(false)}>Cancel</ActionButton>
              <ActionButton variant="primary" onClick={() => {
                const newStatus = targetUser.status === 'Locked' ? 'Active' : 'Locked';
                const updated = users.map(u => u.id === targetUser.id ? { ...u, status: newStatus as UserRole['status'] } : u);
                setUsers(updated);
                localStorage.setItem('users', JSON.stringify(updated));
                setShowLockDialog(false);
              }}>
                {targetUser.status === 'Locked' ? 'Unlock User' : 'Lock User'}
              </ActionButton>
            </div>
          </div>
        </div>
      )}

      {/* ACTIVATE / DEACTIVATE DIALOG */}
      {showStatusDialog && targetUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <h2 className="text-xl font-bold text-slate-800 mb-4">
              {targetUser.status === 'Active' ? 'Deactivate User' : 'Activate User'}
            </h2>
            <div className="mb-6 text-sm text-slate-600">
              <p className="mb-4"><span className="font-semibold text-slate-700">User:</span><br/>{targetUser.name}</p>
              {targetUser.status === 'Active' ? (
                <p>This user will no longer be able to log in.</p>
              ) : (
                <p>This user will be reactivated and able to log in.</p>
              )}
            </div>
            <div className="flex justify-end gap-3">
              <ActionButton variant="secondary" onClick={() => setShowStatusDialog(false)}>Cancel</ActionButton>
              <ActionButton variant="primary" onClick={() => {
                const newStatus = targetUser.status === 'Active' ? 'Inactive' : 'Active';
                const updated = users.map(u => u.id === targetUser.id ? { ...u, status: newStatus as UserRole['status'] } : u);
                setUsers(updated);
                localStorage.setItem('users', JSON.stringify(updated));
                setShowStatusDialog(false);
              }}>
                {targetUser.status === 'Active' ? 'Deactivate' : 'Activate'}
              </ActionButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}