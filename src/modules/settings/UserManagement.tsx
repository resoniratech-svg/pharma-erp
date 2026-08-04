import { useEffect, useState, useRef } from 'react';
import { Users, Shield, Lock, Search, ChevronDown, Plus, Ban, Eye, EyeOff, CheckCircle } from 'lucide-react';
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
import { salesOrganizationService } from '../../services/salesOrganizationService';
import { distributorMasterService } from '../../services/distributorMasterService';
import { retailerMasterService } from '../../services/retailerMasterService';
import { userService, type BackendUserRecord } from '../../services/userService';

type UserType = 'Employee' | 'Distributor' | 'Retailer' | 'Standalone User';

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
  options: { label: string; value: string; subtitle?: string }[];
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
}

const SearchableDropdown = ({ options, value, onChange, placeholder }: DropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  
  useOnClickOutside(ref, () => setIsOpen(false));

  const filteredOptions = options.filter((o) => 
    o.label.toLowerCase().includes(search.toLowerCase()) || 
    (o.subtitle && o.subtitle.toLowerCase().includes(search.toLowerCase())) ||
    o.value.toLowerCase().includes(search.toLowerCase())
  );
  const selectedOption = options.find((o) => o.value === value);

  return (
    <div className="relative" ref={ref}>
      <div 
        className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-colors flex items-center justify-between cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={selectedOption ? 'text-slate-900 font-medium' : 'text-slate-400'}>
          {selectedOption ? selectedOption.label : (placeholder || 'Select option...')}
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
                  placeholder="Search..."
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
                  className={`px-3 py-2 text-sm rounded-md cursor-pointer transition-colors flex flex-col ${value === opt.value ? 'bg-[#163c78]/10 text-[#163c78] font-semibold' : 'text-slate-700 hover:bg-slate-50'}`}
                >
                  <span>{opt.label}</span>
                  {opt.subtitle && (
                    <span className="text-[11px] text-slate-400 font-normal">{opt.subtitle}</span>
                  )}
                </div>
              )) : (
                <div className="px-3 py-4 text-sm text-center text-slate-500">No records found</div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const formatRoleName = (role: string) => {
  if (!role) return '';
  return role.split('_').map(word => word.charAt(0) + word.slice(1).toLowerCase()).join(' ');
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
  const [showPassword, setShowPassword] = useState(false);

  // Integration State
  const [userType, setUserType] = useState<UserType>('Employee');
  const [selectedMasterId, setSelectedMasterId] = useState<string>('');
  const [masterMetaData, setMasterMetaData] = useState<{
    code: string;
    name: string;
    designationOrContact: string;
    status: string;
  }>({ code: '', name: '', designationOrContact: '', status: '' });

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

  const fetchUsers = async () => {
    try {
      const backendUsers = await userService.getUsers();
      
      // Map to UserRole expected format
      let parsedUsers: any[] = backendUsers.map(bu => ({
        id: String(bu.id),
        empId: String(bu.id), // Fallback, could map to employeeCode if returned
        userType: 'Employee',
        name: bu.name,
        email: bu.email,
        mobile: bu.mobile || '-',
        username: bu.email,
        role: bu.role,
        status: bu.isActive ? 'Active' : 'Inactive',
        lastLogin: '-',
        tenantId: null // or parse from bu if available
      }));
      
      // Tenant Scoping
      const sessionStr = localStorage.getItem('centralAuthSession');
      const session = sessionStr ? JSON.parse(sessionStr) : null;
      if (session?.role === 'COMPANY_ADMIN' && session.tenantId) {
        parsedUsers = parsedUsers.filter((u: any) => u.tenantId === session.tenantId);
      }
      
      setUsers(parsedUsers);
      
      // Calculate roles summary
      const customRolesRaw = localStorage.getItem("custom_roles");
      const customRoles = customRolesRaw ? JSON.parse(customRolesRaw) : [];
      
      const systemRoleNames = [
        'SUPER_ADMIN', 'ADMIN', 'COMPANY_ADMIN', 'WAREHOUSE_MANAGER', 'ACCOUNTANT', 
        'DISTRIBUTOR', 'RETAILER', 'MEDICAL_REPRESENTATIVE'
      ];
      
      const allRolesData = [
        ...systemRoleNames.map(name => ({ title: name, status: 'Active' })),
        ...customRoles
      ];

      const mappedRoles = allRolesData.map(r => {
        const count = parsedUsers.filter((u: any) => u.role === r.title).length;
        return {
          name: r.title,
          users: count,
          status: r.status || 'Active'
        };
      });

      setRoles(mappedRoles);
    } catch (e) {
      console.error("Failed to load users:", e);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // --- Master Data Loaders & Filtering ---
  const getAvailableEmployees = () => {
    const employees = salesOrganizationService.getEmployees();
    return employees.filter(emp => {
      if (emp.status !== 'Active') return false;
      const linkedUser = users.find(
        u => (u.id === emp.employeeCode || (u as any).empId === emp.employeeCode) && u.status === 'Active'
      );
      return !linkedUser;
    });
  };

  const getAvailableDistributors = () => {
    const distributors = distributorMasterService.getAll();
    return distributors.filter(dist => {
      if (dist.status !== 'Active') return false;
      const linkedUser = users.find(
        u => (u.id === dist.code || (u as any).empId === dist.code) && u.status === 'Active'
      );
      return !linkedUser;
    });
  };

  const getAvailableRetailers = () => {
    const retailers = retailerMasterService.getAll();
    return retailers.filter(ret => {
      if (ret.status !== 'Active') return false;
      const linkedUser = users.find(
        u => (u.id === ret.code || (u as any).empId === ret.code) && u.status === 'Active'
      );
      return !linkedUser;
    });
  };

  const handleUserTypeChange = (type: UserType) => {
    setUserType(type);
    setSelectedMasterId('');
    setMasterMetaData({ code: '', name: '', designationOrContact: '', status: '' });
    setFormErrors({});

    if (type === 'Standalone User') {
      let maxId = 0;
      users.forEach(u => {
        if (u.id.startsWith('EMP')) {
          const num = parseInt(u.id.replace('EMP', ''), 10);
          if (!isNaN(num) && num > maxId) maxId = num;
        }
      });
      const nextId = `EMP${(maxId + 1).toString().padStart(3, '0')}`;
      setFormData({
        empId: nextId,
        fullName: '',
        email: '',
        phone: '',
        username: '',
        roleId: '',
        password: '',
        confirmPassword: '',
        status: 'Active'
      });
    } else {
      setFormData({
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
    }
  };

  const handleMasterSelection = (masterId: string) => {
    setSelectedMasterId(masterId);
    setFormErrors({});

    if (userType === 'Employee') {
      const emp = salesOrganizationService.getEmployees().find(e => e.id === masterId);
      if (emp) {
        setMasterMetaData({
          code: emp.employeeCode,
          name: emp.employeeName,
          designationOrContact: emp.designation,
          status: emp.status
        });
        setFormData(prev => ({
          ...prev,
          empId: emp.employeeCode,
          fullName: emp.employeeName,
          username: emp.employeeCode.toLowerCase().replace(/[^a-z0-9]/g, ''),
          roleId: emp.designation,
        }));
      }
    } else if (userType === 'Distributor') {
      const dist = distributorMasterService.getAll().find(d => d.id === masterId);
      if (dist) {
        setMasterMetaData({
          code: dist.code,
          name: dist.name,
          designationOrContact: dist.contactPerson || dist.name,
          status: dist.status
        });
        setFormData(prev => ({
          ...prev,
          empId: dist.code,
          fullName: dist.name,
          email: dist.emailAddress || '',
          phone: dist.mobileNumber && dist.mobileNumber !== '-' ? dist.mobileNumber : '',
          username: dist.code.toLowerCase().replace(/[^a-z0-9]/g, ''),
          roleId: 'Distributor',
        }));
      }
    } else if (userType === 'Retailer') {
      const ret = retailerMasterService.getAll().find(r => r.id === masterId);
      if (ret) {
        setMasterMetaData({
          code: ret.code,
          name: ret.name,
          designationOrContact: ret.contactPerson || ret.name,
          status: ret.status
        });
        setFormData(prev => ({
          ...prev,
          empId: ret.code,
          fullName: ret.name,
          email: ret.emailAddress || '',
          phone: ret.mobileNumber || '',
          username: ret.code.toLowerCase().replace(/[^a-z0-9]/g, ''),
          roleId: 'Retailer',
        }));
      }
    }
  };

  const handleCreateUser = async () => {
    const errors: { [key: string]: string } = {};

    if (!editMode && userType !== 'Standalone User' && !selectedMasterId) {
      errors.selectedMasterId = `Please select an ${userType}`;
    }

    if (!formData.empId.trim()) errors.empId = "Employee/User Code is required";
    if (!formData.fullName.trim()) errors.fullName = "Full Name is required";
    
    if (!formData.email.trim()) errors.email = "Email Address is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) errors.email = "Invalid email format";
    else {
      const dupEmail = users.some(
        u => u.email.toLowerCase() === formData.email.trim().toLowerCase() && u.id !== formData.empId
      );
      if (dupEmail) errors.email = "Email Address is already in use by another user";
    }

    if (!formData.username.trim()) errors.username = "Username is required";
    else {
      const dupUsername = users.some(
        u => u.username?.toLowerCase() === formData.username.trim().toLowerCase() && u.id !== formData.empId
      );
      if (dupUsername) errors.username = "Username is already in use by another user";
    }
    if (!formData.roleId) errors.roleId = "Role is required";

    if (!editMode && !formData.password) errors.password = "Password is required";
    else if (formData.password && formData.password.length < 6) errors.password = "Password must be at least 6 characters";

    if (formData.password && formData.password !== formData.confirmPassword) errors.confirmPassword = "Passwords do not match";

    if (formData.phone && !/^\d{10}$/.test(formData.phone)) errors.phone = "Phone must be 10 digits";

    // Duplicate active login prevention for linked master records
    if (!editMode && userType !== 'Standalone User' && selectedMasterId) {
      const activeAccountExists = users.some(
        u => (u.id === formData.empId || (u as any).empId === formData.empId) && u.status === 'Active'
      );
      if (activeAccountExists) {
        errors.selectedMasterId = `An active user account already exists for this ${userType}`;
      }
    }

    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;

    try {
      if (editMode) {
        // Update existing user
        await userService.updateUser(Number(formData.empId), {
          name: formData.fullName.trim(),
          email: formData.email.trim(),
          mobile: formData.phone.trim(),
          username: formData.username.trim(),
          role: formData.roleId,
          ...(formData.password ? { password: formData.password.trim() } : {}),
          isActive: formData.status === 'Active',
        });
      } else {
        // Create new user
        await userService.createUser({
          name: formData.fullName.trim(),
          email: formData.email.trim(),
          password: formData.password.trim(),
          role: formData.roleId,
          mobile: formData.phone.trim(),
        });
      }

      // Re-fetch users from backend after create/update
      await fetchUsers();

      setFormData({
        empId: '', fullName: '', email: '', phone: '', username: '', roleId: '', password: '', confirmPassword: '', status: 'Active'
      });
      setSelectedMasterId('');
      setMasterMetaData({ code: '', name: '', designationOrContact: '', status: '' });
      setShowRoleModal(false);
    } catch (err: any) {
      alert(`Failed to save user: ${err.message}`);
    }
  };

  const columns: Column<UserRole>[] = [
    { key: "id", label: "Employee / User ID" },
    {
      key: "name",
      label: "Full Name",
      render: (row) => (
        <span className="font-semibold text-slate-900">{row.name}</span>
      ),
    },
    { key: "email", label: "Email" },
    {
      key: "role",
      label: "Assigned Role",
      render: (row) => <Badge variant="purple">{formatRoleName(row.role)}</Badge>,
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
    .map(r => ({ label: formatRoleName(r.name), value: r.name }));

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
                setUserType('Employee');
                setSelectedMasterId('');
                setMasterMetaData({ code: '', name: '', designationOrContact: '', status: '' });
                setFormData({
                  empId: '', fullName: '', email: '', phone: '', username: '', roleId: '', password: '', confirmPassword: '', status: 'Active'
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
                <span>{formatRoleName(role.name)}</span>

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
                label: formatRoleName(role.name),
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

      {/* CREATE / EDIT USER MODAL */}
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
              {/* USER TYPE SELECTION */}
              {!editMode && (
                <div className="md:col-span-2 bg-slate-50/80 p-4 rounded-xl border border-slate-200/80">
                  <label className="block text-sm font-bold text-slate-800 mb-1.5">
                    User Type <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={userType}
                    onChange={(e) => handleUserTypeChange(e.target.value as UserType)}
                    className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-[#163c78] focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-colors cursor-pointer"
                  >
                    <option value="Employee">Employee (Sales Organization)</option>
                    <option value="Distributor">Distributor (Distributor Master)</option>
                    <option value="Retailer">Retailer (Retailer Master)</option>
                    <option value="Standalone User">Standalone User (Manual Entry)</option>
                  </select>
                  {formErrors.userType && (
                    <p className="text-rose-500 text-xs mt-1.5 font-medium">{formErrors.userType}</p>
                  )}
                </div>
              )}

              {/* SEARCHABLE MASTER SELECTION DROPDOWNS */}
              {!editMode && userType === 'Employee' && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    Employee <span className="text-rose-500">*</span>
                  </label>
                  <SearchableDropdown
                    options={getAvailableEmployees().map(e => ({
                      label: `${e.employeeName} (${e.employeeCode})`,
                      value: e.id,
                      subtitle: `${e.designation} | ${e.area || e.zone}`
                    }))}
                    value={selectedMasterId}
                    onChange={handleMasterSelection}
                    placeholder="Search and select Active Employee..."
                  />
                  {formErrors.selectedMasterId && (
                    <p className="text-rose-500 text-xs mt-1">{formErrors.selectedMasterId}</p>
                  )}
                </div>
              )}

              {!editMode && userType === 'Distributor' && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    Distributor <span className="text-rose-500">*</span>
                  </label>
                  <SearchableDropdown
                    options={getAvailableDistributors().map(d => ({
                      label: `${d.name} (${d.code})`,
                      value: d.id,
                      subtitle: `Contact: ${d.contactPerson || 'N/A'} | ${d.mobileNumber || ''}`
                    }))}
                    value={selectedMasterId}
                    onChange={handleMasterSelection}
                    placeholder="Search and select Active Distributor..."
                  />
                  {formErrors.selectedMasterId && (
                    <p className="text-rose-500 text-xs mt-1">{formErrors.selectedMasterId}</p>
                  )}
                </div>
              )}

              {!editMode && userType === 'Retailer' && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    Retailer <span className="text-rose-500">*</span>
                  </label>
                  <SearchableDropdown
                    options={getAvailableRetailers().map(r => ({
                      label: `${r.name} (${r.code})`,
                      value: r.id,
                      subtitle: `Contact: ${r.contactPerson || 'N/A'} | ${r.mobileNumber || ''}`
                    }))}
                    value={selectedMasterId}
                    onChange={handleMasterSelection}
                    placeholder="Search and select Active Retailer..."
                  />
                  {formErrors.selectedMasterId && (
                    <p className="text-rose-500 text-xs mt-1">{formErrors.selectedMasterId}</p>
                  )}
                </div>
              )}

              <div className="md:col-span-2 mt-2">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Account Details</h3>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  {userType === 'Employee' ? 'Employee Code' : userType === 'Distributor' ? 'Distributor Code' : userType === 'Retailer' ? 'Retailer Code' : 'Employee/User Code'} <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.empId}
                  readOnly={true}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-mono font-semibold focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-colors text-slate-600 cursor-not-allowed"
                  placeholder="Auto-populated Code"
                />
                {formErrors.empId && <p className="text-rose-500 text-xs mt-1">{formErrors.empId}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  readOnly={!editMode && userType !== 'Standalone User'}
                  value={formData.fullName}
                  onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                  className={`w-full px-3 py-2.5 border ${formErrors.fullName ? 'border-rose-500' : 'border-slate-200'} rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-colors ${
                    !editMode && userType !== 'Standalone User' ? 'bg-slate-50 text-slate-600 cursor-not-allowed font-medium' : 'bg-white text-slate-900'
                  }`}
                  placeholder="Full Name"
                />
                {formErrors.fullName && <p className="text-rose-500 text-xs mt-1">{formErrors.fullName}</p>}
              </div>

              {masterMetaData.designationOrContact && (
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    {userType === 'Employee' ? 'Designation' : 'Contact Person'}
                  </label>
                  <input
                    type="text"
                    readOnly={true}
                    value={masterMetaData.designationOrContact}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-600 font-medium cursor-not-allowed focus:outline-none"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Email Address <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className={`w-full px-3 py-2.5 bg-white border ${formErrors.email ? 'border-rose-500' : 'border-slate-200'} rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-colors`}
                  placeholder="e.g. user@company.com"
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
                  placeholder="10-digit mobile number"
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
                  placeholder="Username for login"
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
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    className={`w-full px-3 py-2.5 bg-white border ${formErrors.password ? 'border-rose-500' : 'border-slate-200'} rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-colors pr-10`}
                    placeholder="Password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-violet-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {formErrors.password && <p className="text-rose-500 text-xs mt-1">{formErrors.password}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Confirm Password {!editMode && <span className="text-rose-500">*</span>}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                    className={`w-full px-3 py-2.5 bg-white border ${formErrors.confirmPassword ? 'border-rose-500' : 'border-slate-200'} rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-colors pr-10`}
                    placeholder="Confirm password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-violet-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {formErrors.confirmPassword && <p className="text-rose-500 text-xs mt-1">{formErrors.confirmPassword}</p>}
              </div>

              {editMode && (
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
              )}
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
              <DrawerField label="Employee / User ID" value={selectedUser.id} />
              <DrawerField label="Full Name" value={selectedUser.name} />
              <DrawerField label="Email Address" value={selectedUser.email} />
              <DrawerField label="Mobile Number" value={selectedUser.mobile} />
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
              <ActionButton variant="primary" onClick={async () => {
                const newStatus = targetUser.status === 'Locked' ? 'Active' : 'Locked';
                try {
                  await userService.updateUser(Number(targetUser.id), { isActive: newStatus === 'Active' });
                  const updated = users.map(u => u.id === targetUser.id ? { ...u, status: newStatus as UserRole['status'] } : u);
                  setUsers(updated);
                  setShowLockDialog(false);
                } catch (e) {
                  alert('Failed to update status');
                }
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
              <ActionButton variant="primary" onClick={async () => {
                const newStatus = targetUser.status === 'Active' ? 'Inactive' : 'Active';
                try {
                  await userService.updateUser(Number(targetUser.id), { isActive: newStatus === 'Active' });
                  const updated = users.map(u => u.id === targetUser.id ? { ...u, status: newStatus as UserRole['status'] } : u);
                  setUsers(updated);
                  setShowStatusDialog(false);
                } catch(e) {
                  alert('Failed to update status');
                }
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