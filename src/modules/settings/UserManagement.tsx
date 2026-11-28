import { useEffect, useState, useRef } from 'react';
import { Users, Shield, Lock, Search, ChevronDown, Plus, Ban, Eye, EyeOff, CheckCircle, Upload } from 'lucide-react';
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

const getCategoryFromRole = (role: string): UserType => {
  if (!role) return 'Standalone User';
  const norm = role.toUpperCase().replace(/[\s-]/g, '_');
  if (norm.includes('RETAIL')) return 'Retailer';
  if (norm.includes('DISTRIBUT') || norm.includes('STOCKIST')) return 'Distributor';
  if (
    norm.includes('SUPER_ADMIN') || 
    norm === 'ADMIN' || 
    norm.includes('STANDALONE') ||
    norm.includes('DIRECT') ||
    norm.includes('AUDITOR')
  ) {
    return 'Standalone User';
  }
  return 'Employee';
};

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
  const [employeesData, setEmployeesData] = useState<any[]>([]);
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
    roleId: 'NATIONAL_SALES_HEAD',
    password: '',
    confirmPassword: '',
    status: 'Active',
    gstNumber: '',
    address: '',
    licenseNumber: '',
    upiId: '',
    upiQrScanner: ''
  });

  const fetchUsers = async () => {
    try {
      const backendUsers = await userService.getUsers();
      
      // Load extended metadata (GST, Address, License, UPI, Scanner QR)
      const userMetaMap: Record<string, any> = {};
      try {
        const storedMeta = localStorage.getItem('pharma_users_extended_meta');
        if (storedMeta) Object.assign(userMetaMap, JSON.parse(storedMeta));
      } catch (_) {}

      // Map to UserRole expected format
      let parsedUsers: any[] = backendUsers.map(bu => {
        const meta = userMetaMap[String(bu.id)] || userMetaMap[bu.email.toLowerCase()] || {};
        return {
          id: meta.empId || String(bu.id),
          empId: meta.empId || String(bu.id),
          userType: 'Employee',
          name: bu.name,
          email: bu.email,
          mobile: bu.mobile || '-',
          username: bu.email,
          role: bu.role,
          status: (bu.isActive ? 'Active' : 'Inactive') as any,
          lastLogin: '-',
          tenantId: null,
          gstNumber: meta.gstNumber || '',
          address: meta.address || '',
          licenseNumber: meta.licenseNumber || '',
          upiId: meta.upiId || '',
          upiQrScanner: meta.upiQrScanner || ''
        };
      });
      
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
        'SUPER_ADMIN', 'ADMIN', 'NATIONAL_SALES_HEAD',
        'REGIONAL_SALES_MANAGER', 'AREA_SALES_MANAGER', 'WAREHOUSE_MANAGER',
        'ACCOUNTANT', 'DISTRIBUTOR', 'RETAILER', 'MEDICAL_REPRESENTATIVE'
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
    salesOrganizationService.getEmployees().then(setEmployeesData).catch(console.error);
  }, []);

  // --- Master Data Loaders & Filtering ---
  const getAvailableEmployees = () => {
    // get employees from state
    return employeesData.filter(emp => {
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

  const generateUserCode = (role: string) => {
    let prefix = 'EMP';
    const norm = (role || '').toUpperCase();
    if (norm.includes('RETAIL')) prefix = 'RET';
    else if (norm.includes('DISTRIBUT') || norm.includes('STOCKIST')) prefix = 'DST';
    else if (norm.includes('MEDICAL') || norm.includes('MR')) prefix = 'MR';
    else if (norm.includes('AREA') || norm.includes('ASM')) prefix = 'ASM';
    else if (norm.includes('REGION') || norm.includes('RSM')) prefix = 'RSM';
    else if (norm.includes('NATIONAL') || norm.includes('HEAD') || norm.includes('NSH') || norm.includes('NSM')) prefix = 'NSH';
    else if (norm.includes('ADMIN')) prefix = 'ADM';
    else if (norm.includes('WAREHOUSE')) prefix = 'WH';
    else if (norm.includes('ACCOUNT')) prefix = 'ACC';

    let maxNum = 0;
    users.forEach(u => {
      const idStr = String(u.id || (u as any).empId || '');
      if (idStr.toUpperCase().includes(prefix)) {
        const num = parseInt(idStr.replace(/\D/g, ''), 10);
        if (!isNaN(num) && num > maxNum) maxNum = num;
      }
    });
    return `${prefix}-${(maxNum + 1).toString().padStart(3, '0')}`;
  };

  const handleRoleSelection = (roleName: string) => {
    const nextCode = generateUserCode(roleName);
    setFormErrors({});
    setFormData(prev => ({
      ...prev,
      empId: nextCode,
      roleId: roleName,
    }));
  };

  const handleScannerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert("File size should not exceed 5MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setFormData(prev => ({ ...prev, upiQrScanner: result }));
    };
    reader.readAsDataURL(file);
  };

  const handleCreateUser = async () => {
    const errors: { [key: string]: string } = {};

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

    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;

    try {
      let createdUserId = '';
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
        createdUserId = formData.empId;
      } else {
        // Create new user
        const res = await userService.createUser({
          name: formData.fullName.trim(),
          email: formData.email.trim(),
          password: formData.password.trim(),
          role: formData.roleId,
          mobile: formData.phone.trim(),
        });
        createdUserId = String(res.id);
      }

      // Persist extended metadata (GST, Address, License, UPI, Scanner QR, User Code)
      const extendedMeta = {
        empId: formData.empId.trim(),
        gstNumber: formData.gstNumber.trim(),
        address: formData.address.trim(),
        licenseNumber: formData.licenseNumber.trim(),
        upiId: formData.upiId.trim(),
        upiQrScanner: formData.upiQrScanner
      };

      try {
        const storedMeta = JSON.parse(localStorage.getItem('pharma_users_extended_meta') || '{}');
        const userEmailKey = formData.email.trim().toLowerCase();
        storedMeta[userEmailKey] = extendedMeta;
        if (createdUserId) storedMeta[createdUserId] = extendedMeta;
        if (formData.empId) storedMeta[formData.empId.trim()] = extendedMeta;
        localStorage.setItem('pharma_users_extended_meta', JSON.stringify(storedMeta));
      } catch (_) {}

      // Re-fetch users from backend after create/update
      await fetchUsers();

      const defaultRole = 'NATIONAL_SALES_HEAD';
      setFormData({
        empId: generateUserCode(defaultRole),
        fullName: '',
        email: '',
        phone: '',
        username: '',
        roleId: defaultRole,
        password: '',
        confirmPassword: '',
        status: 'Active',
        gstNumber: '',
        address: '',
        licenseNumber: '',
        upiId: '',
        upiQrScanner: ''
      });
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
                const defaultRole = 'NATIONAL_SALES_HEAD';
                setFormData({
                  empId: generateUserCode(defaultRole),
                  fullName: '',
                  email: '',
                  phone: '',
                  username: '',
                  roleId: defaultRole,
                  password: '',
                  confirmPassword: '',
                  status: 'Active',
                  gstNumber: '',
                  address: '',
                  licenseNumber: '',
                  upiId: '',
                  upiQrScanner: ''
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
              {/* ASSIGNED ROLE SELECTION (PRIMARY) */}
              {!editMode && (
                <div className="md:col-span-2 bg-slate-50/80 p-4 rounded-xl border border-slate-200/80">
                  <label className="block text-sm font-bold text-slate-800 mb-1.5">
                    Assigned Role <span className="text-rose-500">*</span>
                  </label>
                  <SearchableDropdown 
                    options={activeRolesOptions}
                    value={formData.roleId}
                    onChange={handleRoleSelection}
                    placeholder="Select Role (e.g. Retailer, Distributor, MR, Admin)..."
                  />
                  {formErrors.roleId && (
                    <p className="text-rose-500 text-xs mt-1.5 font-medium">{formErrors.roleId}</p>
                  )}
                </div>
              )}

              {/* ACCOUNT DETAILS */}
              <div className="md:col-span-2 mt-2">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Account Details</h3>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-semibold text-slate-700">
                    Employee / User Code <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[11px] font-semibold text-violet-600 bg-violet-50 px-2 py-0.5 rounded">Auto-Generated</span>
                </div>
                <input
                  type="text"
                  value={formData.empId}
                  readOnly={true}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-mono font-semibold focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-colors text-slate-700 cursor-not-allowed"
                  placeholder="Auto-generated Code"
                />
                {formErrors.empId && <p className="text-rose-500 text-xs mt-1">{formErrors.empId}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => {
                    const newName = e.target.value;
                    const suggestedUsername = newName.toLowerCase().replace(/[^a-z0-9]/g, '');
                    setFormData(prev => ({
                      ...prev,
                      fullName: newName,
                      username: !prev.username || prev.username === prev.fullName.toLowerCase().replace(/[^a-z0-9]/g, '') ? suggestedUsername : prev.username
                    }));
                  }}
                  className={`w-full px-3 py-2.5 bg-white border ${formErrors.fullName ? 'border-rose-500' : 'border-slate-200'} rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-colors`}
                  placeholder="Enter Full Name"
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
                  onChange={(e) => setFormData({...formData, phone: e.target.value.replace(/\D/g, '').slice(0, 10)})}
                  maxLength={10}
                  className={`w-full px-3 py-2.5 bg-white border ${formErrors.phone ? 'border-rose-500' : 'border-slate-200'} rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-colors`}
                  placeholder="10-digit mobile number"
                />
                {formErrors.phone && <p className="text-rose-500 text-xs mt-1">{formErrors.phone}</p>}
              </div>

              {/* REGULATORY, ADDRESS & PAYMENT DETAILS */}
              <div className="md:col-span-2 mt-2">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Business, Address & Payment Details</h3>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  GST Number (GSTIN)
                </label>
                <input
                  type="text"
                  maxLength={15}
                  value={formData.gstNumber}
                  onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm uppercase font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-colors"
                  placeholder="e.g. 36ABCDE1234F1Z5"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  License Number (Drug / Trade)
                </label>
                <input
                  type="text"
                  value={formData.licenseNumber}
                  onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                  className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-colors"
                  placeholder="e.g. DL-20B/21B-XXXXX"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Full Address
                </label>
                <textarea
                  rows={2}
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-colors resize-none"
                  placeholder="Enter street address, locality, city, state, pin code..."
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  UPI Details (VPA ID)
                </label>
                <input
                  type="text"
                  value={formData.upiId}
                  onChange={(e) => setFormData({ ...formData, upiId: e.target.value })}
                  className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-colors"
                  placeholder="e.g. username@okhdfcbank"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Upload Scanner (UPI QR Code)
                </label>
                {formData.upiQrScanner ? (
                  <div className="relative border border-slate-200 rounded-lg p-2 bg-slate-50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img
                        src={formData.upiQrScanner}
                        alt="QR Scanner"
                        className="w-11 h-11 object-contain rounded border border-slate-200 bg-white"
                      />
                      <div>
                        <span className="text-xs font-semibold text-slate-800 block">QR Scanner Attached</span>
                        <span className="text-[11px] text-emerald-600 font-medium">Ready</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, upiQrScanner: '' })}
                      className="text-xs text-rose-500 hover:text-rose-700 font-semibold px-2.5 py-1 bg-white hover:bg-rose-50 border border-rose-200 rounded transition-colors"
                    >
                      Remove ✕
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <input
                      type="file"
                      id="qr-scanner-upload"
                      accept="image/png, image/jpeg, image/jpg, image/webp"
                      onChange={handleScannerUpload}
                      className="hidden"
                    />
                    <label
                      htmlFor="qr-scanner-upload"
                      className="w-full border-2 border-dashed border-slate-300 hover:border-violet-500 rounded-lg p-2.5 flex items-center justify-center gap-2 cursor-pointer bg-slate-50 hover:bg-violet-50/50 transition-colors text-xs font-semibold text-slate-600 hover:text-violet-700"
                    >
                      <Upload className="w-4 h-4 text-violet-600" />
                      Click to Upload Scanner / QR Image
                    </label>
                  </div>
                )}
              </div>

              {/* SYSTEM ACCESS */}
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

              {editMode && (
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
              )}

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
            <div className="space-y-4 flex-1 overflow-y-auto pr-1 [&::-webkit-scrollbar]:hidden">
              <DrawerField label="Employee / User ID" value={<span className="font-mono font-semibold text-slate-900">{selectedUser.id}</span>} />
              <DrawerField label="Full Name" value={<span className="font-semibold text-slate-900">{selectedUser.name}</span>} />
              <DrawerField label="Email Address" value={selectedUser.email} />
              <DrawerField label="Mobile Number" value={selectedUser.mobile || '-'} />
              <DrawerField label="Assigned Role" value={<Badge variant="purple">{formatRoleName(selectedUser.role)}</Badge>} />
              <DrawerField label="Account Status" value={<Badge variant={selectedUser.status === 'Active' ? 'success' : 'danger'}>{selectedUser.status}</Badge>} />
              
              {selectedUser.gstNumber && (
                <DrawerField label="GST Number (GSTIN)" value={<span className="font-mono font-bold text-slate-800">{selectedUser.gstNumber}</span>} />
              )}
              {selectedUser.licenseNumber && (
                <DrawerField label="License Number" value={<span className="font-mono font-semibold text-slate-800">{selectedUser.licenseNumber}</span>} />
              )}
              {selectedUser.address && (
                <DrawerField label="Full Address" value={<span className="text-slate-700 leading-relaxed">{selectedUser.address}</span>} />
              )}
              {selectedUser.upiId && (
                <DrawerField label="UPI ID" value={<span className="font-mono font-bold text-violet-700">{selectedUser.upiId}</span>} />
              )}
              {selectedUser.upiQrScanner && (
                <div className="pt-2">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">UPI QR Scanner</span>
                  <div className="p-2 border border-slate-200 rounded-xl bg-slate-50 inline-block shadow-sm">
                    <img 
                      src={selectedUser.upiQrScanner} 
                      alt="UPI QR Scanner" 
                      className="max-w-[160px] max-h-[160px] object-contain rounded-lg bg-white" 
                    />
                  </div>
                </div>
              )}

              <DrawerField label="Last Login" value={selectedUser.lastLogin} />
              <DrawerField label="Created By" value={selectedUser.createdBy || 'System'} />
              <DrawerField label="Created Date" value={selectedUser.createdDate || '-'} />
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
                  phone: selectedUser.mobile && selectedUser.mobile !== '-' ? selectedUser.mobile : '',
                  username: selectedUser.username || '',
                  roleId: selectedUser.role,
                  password: '',
                  confirmPassword: '',
                  status: selectedUser.status,
                  gstNumber: selectedUser.gstNumber || '',
                  address: selectedUser.address || '',
                  licenseNumber: selectedUser.licenseNumber || '',
                  upiId: selectedUser.upiId || '',
                  upiQrScanner: selectedUser.upiQrScanner || ''
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