import { useState, useRef, useEffect } from 'react';
import { UserPlus, X, MoreVertical, Edit2, ShieldAlert } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  PageHeader,
  FilterBar,
  SearchInput,
  SelectFilter,
  ActionButton,
  TableCard,
  DataTable,
  Badge,
} from './components/shared';
import { type Column } from './components/shared';
import { ROLES } from '../../constants/roles';

interface AppUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  status: 'Active' | 'Locked' | 'Inactive';
  empId?: string;
  username?: string;
}

const initialMockData: AppUser[] = [
  { id: '1', name: 'Admin User', email: 'admin@pharmatech.com', phone: '+91 9876543210', role: 'Super Admin', status: 'Active', empId: 'EMP-001', username: 'admin' },
  { id: '2', name: 'Jane Smith', email: 'jane@pharmatech.com', phone: '+91 9876543211', role: 'Warehouse Manager', status: 'Active', empId: 'EMP-002', username: 'jsmith' },
  { id: '3', name: 'John Doe', email: 'john@pharmatech.com', phone: '+91 9876543212', role: 'Accountant', status: 'Locked', empId: 'EMP-003', username: 'jdoe' },
];

function ActionMenu({ row, onEdit, onToggleStatus }: { row: AppUser, onEdit: (row: AppUser) => void, onToggleStatus: (row: AppUser) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const isActive = row.status === 'Active';

  return (
    <div className="relative" ref={menuRef}>
      <button 
        onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
        className="p-2 text-slate-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors"
      >
        <MoreVertical className="w-5 h-5" />
      </button>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-1 w-48 bg-white border border-slate-200 shadow-xl rounded-xl z-50 py-1"
          >
            <button onClick={(e) => { e.stopPropagation(); setIsOpen(false); onEdit(row); }} className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors">
              <Edit2 className="w-4 h-4 text-slate-400" /> Edit User
            </button>
            <button onClick={(e) => { e.stopPropagation(); setIsOpen(false); onToggleStatus(row); }} className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors border-t border-slate-100 mt-1">
              <ShieldAlert className="w-4 h-4 text-slate-400" /> {isActive ? 'Deactivate User' : 'Activate User'}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function UserManagement() {
  const [users, setUsers] = useState<AppUser[]>(initialMockData);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Modal Form State
  const [empId, setEmpId] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [username, setUsername] = useState('');
  const [role, setRole] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState<'Active' | 'Inactive'>('Active');

  const handleEdit = (row: AppUser) => {
    setEditingId(row.id);
    setEmpId(row.empId || '');
    setFullName(row.name);
    setEmail(row.email);
    setMobile(row.phone || '');
    setUsername(row.username || '');
    setRole(row.role);
    setStatus((row.status === 'Locked' ? 'Inactive' : row.status) as 'Active' | 'Inactive');
    setPassword('');
    setConfirmPassword('');
    setIsModalOpen(true);
  };

  const handleToggleStatus = (row: AppUser) => {
    const newStatus = row.status === 'Active' ? 'Inactive' : 'Active';
    setUsers(users.map(u => u.id === row.id ? { ...u, status: newStatus } : u));
  };

  const columns: Column<AppUser>[] = [
    { key: 'name', label: 'User Name', render: (row) => <span className="font-bold text-slate-800">{row.name}</span> },
    { key: 'email', label: 'Email', render: (row) => <span className="text-sm font-medium text-slate-500">{row.email}</span> },
    { key: 'phone', label: 'Phone Number', render: (row) => <span className="text-sm font-medium text-slate-600">{row.phone}</span> },
    { key: 'role', label: 'Assigned Role', render: (row) => <Badge variant="purple">{row.role}</Badge> },
    {
      key: 'status',
      label: 'Status',
      render: (row) => {
        const variant = row.status === 'Active' ? 'success' : row.status === 'Locked' ? 'danger' : 'neutral';
        return <Badge variant={variant}>{row.status}</Badge>;
      },
    },
    {
      key: 'action',
      label: 'Actions',
      render: (row) => <ActionMenu row={row} onEdit={handleEdit} onToggleStatus={handleToggleStatus} />
    }
  ];

  const filteredData = users.filter((item) => {
    const matchSearch = item.name.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter ? item.role === roleFilter : true;
    return matchSearch && matchRole;
  });

  const handleSaveUser = () => {
    if (!fullName || !email || !role || !username || (!editingId && !password)) {
      alert("Please fill in all required fields.");
      return;
    }
    if (password !== confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    if (editingId) {
      setUsers(users.map(u => u.id === editingId ? {
        ...u,
        name: fullName,
        email: email,
        phone: mobile || 'N/A',
        role: role,
        status: status,
        empId: empId,
        username: username,
      } : u));
    } else {
      const newUser: AppUser = {
        id: Math.random().toString(36).substr(2, 9),
        name: fullName,
        email: email,
        phone: mobile || 'N/A',
        role: role,
        status: status,
        empId: empId,
        username: username,
      };
      setUsers([...users, newUser]);
    }
    
    // Reset form
    setEditingId(null);
    setEmpId('');
    setFullName('');
    setEmail('');
    setMobile('');
    setUsername('');
    setRole('');
    setPassword('');
    setConfirmPassword('');
    setStatus('Active');
    
    setIsModalOpen(false);
  };

  const openAddModal = () => {
    setEditingId(null);
    setEmpId('');
    setFullName('');
    setEmail('');
    setMobile('');
    setUsername('');
    setRole('');
    setPassword('');
    setConfirmPassword('');
    setStatus('Active');
    setIsModalOpen(true);
  };

  const roleOptions = ROLES.map(r => ({ label: r.title, value: r.title }));

  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader
        title="User Management"
        subtitle="Manage employee access, accounts, and application logins."
        actions={
          <ActionButton onClick={openAddModal} variant="primary" icon={<UserPlus className="w-4 h-4" />}>
            Add User
          </ActionButton>
        }
      />

      <FilterBar>
        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto items-center">
          <SearchInput value={search} onChange={setSearch} placeholder="Search user..." />
          <div className="w-px h-8 bg-slate-200 hidden sm:block" />
          <SelectFilter
            value={roleFilter}
            onChange={setRoleFilter}
            options={roleOptions}
            placeholder="All Roles"
          />
        </div>
      </FilterBar>

      <TableCard>
        <DataTable
          columns={columns}
          data={filteredData}
          emptyMessage="No users found matching your search criteria."
        />
      </TableCard>

      <AnimatePresence>
        {isModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50"
              onClick={() => setIsModalOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 flex flex-col max-h-[90vh] overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center text-violet-600">
                    <UserPlus className="w-5 h-5" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-800">{editingId ? 'Edit User' : 'Add New User'}</h2>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto flex-1">
                <div className="space-y-8">
                  {/* Account Details Section */}
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 mb-4 uppercase tracking-wider">Account Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Employee ID <span className="text-rose-500">*</span></label>
                        <input value={empId} onChange={e => setEmpId(e.target.value)} type="text" placeholder="e.g. EMP-1042" className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-colors" />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Full Name <span className="text-rose-500">*</span></label>
                        <input value={fullName} onChange={e => setFullName(e.target.value)} type="text" placeholder="John Doe" className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-colors" />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email Address <span className="text-rose-500">*</span></label>
                        <input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="john.doe@example.com" className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-colors" />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Mobile Number</label>
                        <input value={mobile} onChange={e => setMobile(e.target.value)} type="tel" placeholder="+91 98765 43210" className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-colors" />
                      </div>
                    </div>
                  </div>

                  <div className="w-full h-px bg-slate-100" />

                  {/* System Access Section */}
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 mb-4 uppercase tracking-wider">System Access</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Username <span className="text-rose-500">*</span></label>
                        <input value={username} onChange={e => setUsername(e.target.value)} type="text" placeholder="johndoe" className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-colors" />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Assigned Role <span className="text-rose-500">*</span></label>
                        <select value={role} onChange={e => setRole(e.target.value)} className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-colors appearance-none cursor-pointer">
                          <option value="">Select a role...</option>
                          {ROLES.map(r => (
                            <option key={r.id} value={r.title}>{r.title}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Password {editingId ? '' : <span className="text-rose-500">*</span>}</label>
                        <input value={password} onChange={e => setPassword(e.target.value)} type="password" placeholder={editingId ? 'Leave blank to keep current' : '••••••••'} className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-colors" />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Confirm Password {editingId ? '' : <span className="text-rose-500">*</span>}</label>
                        <input value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} type="password" placeholder={editingId ? 'Leave blank to keep current' : '••••••••'} className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-colors" />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Account Status</label>
                        <div className="flex items-center gap-6">
                          <label className="flex items-center gap-2 cursor-pointer group">
                            <div className="relative flex items-center justify-center w-5 h-5">
                              <input checked={status === 'Active'} onChange={() => setStatus('Active')} type="radio" name="status" className="peer w-4 h-4 text-violet-600 border-slate-300 focus:ring-violet-500 transition-all opacity-0 absolute" />
                              <div className="w-4 h-4 rounded-full border border-slate-300 peer-checked:border-violet-600 peer-checked:bg-violet-600 transition-all group-hover:border-violet-400"></div>
                              <div className="absolute w-1.5 h-1.5 bg-white rounded-full opacity-0 peer-checked:opacity-100 transition-opacity"></div>
                            </div>
                            <span className="text-sm text-slate-700 font-medium">Active</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer group">
                            <div className="relative flex items-center justify-center w-5 h-5">
                              <input checked={status === 'Inactive'} onChange={() => setStatus('Inactive')} type="radio" name="status" className="peer w-4 h-4 text-violet-600 border-slate-300 focus:ring-violet-500 transition-all opacity-0 absolute" />
                              <div className="w-4 h-4 rounded-full border border-slate-300 peer-checked:border-violet-600 peer-checked:bg-violet-600 transition-all group-hover:border-violet-400"></div>
                              <div className="absolute w-1.5 h-1.5 bg-white rounded-full opacity-0 peer-checked:opacity-100 transition-opacity"></div>
                            </div>
                            <span className="text-sm text-slate-700 font-medium">Inactive</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="sticky bottom-0 bg-slate-50/90 backdrop-blur-md border-t border-slate-100 p-4 sm:px-6 flex items-center justify-end gap-3 rounded-b-2xl">
                <ActionButton variant="secondary" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </ActionButton>
                <ActionButton variant="primary" onClick={handleSaveUser}>
                  {editingId ? 'Update User' : 'Create User'}
                </ActionButton>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
