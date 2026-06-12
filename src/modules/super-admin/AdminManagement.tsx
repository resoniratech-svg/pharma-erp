import { useState, useRef, useEffect } from 'react';
import { Download, ChevronDown, Eye, EyeOff, Shield, X, Check, Search } from 'lucide-react';
import * as XLSX from 'xlsx';

// Using components from super-admin shared where available
import {
  PageHeader,
  FilterBar,
  SearchInput,
  ActionButton,
  TableCard,
  DataTable,
} from './components/shared';
import { type Column } from './components/shared';

// Mock DB for Company Admins
interface CompanyAdmin {
  id: string;
  adminName: string;
  companyName: string;
  email: string;
  passwordHash: string; // Plaintext for demo as requested
  permissions: string[];
}

const erpModules = [
  'Product Management',
  'Inventory & Warehouse Management',
  'C&F Management',
  'Distributor/Stockist Portal',
  'Retailer Ordering System',
  'CRM',
  'Orders',
  'Billing',
  'Finance',
  'Reports',
  'Notifications',
  'Settings'
];

const mockAdmins: CompanyAdmin[] = [
  {
    id: 'ADM-001',
    adminName: 'Rahul Sharma',
    companyName: 'PharmaCorp Pvt Ltd',
    email: 'rahul.s@pharmacorp.in',
    passwordHash: 'Pharma@2024!',
    permissions: ['Product Management', 'Inventory & Warehouse Management', 'Settings']
  },
  {
    id: 'ADM-002',
    adminName: 'Priya Desai',
    companyName: 'HealthPlus Labs',
    email: 'priya.d@healthplus.com',
    passwordHash: 'Health#123',
    permissions: ['CRM', 'Orders', 'Billing', 'Finance', 'Reports']
  },
  {
    id: 'ADM-003',
    adminName: 'Amit Patel',
    companyName: 'MediCare Pharma',
    email: 'amit.p@medicare.in',
    passwordHash: 'Admin@MediCare1',
    permissions: ['Product Management', 'Inventory & Warehouse Management', 'C&F Management', 'Distributor/Stockist Portal', 'Retailer Ordering System']
  }
];

const existingCompanies = [
  'PharmaCorp Pvt Ltd',
  'HealthPlus Labs',
  'MediCare Pharma',
  'SunLife Pharmaceuticals',
  'Apollo Life Sciences'
];

export default function AdminManagement() {
  const [search, setSearch] = useState('');
  const [admins, setAdmins] = useState<CompanyAdmin[]>(mockAdmins);
  
  // View states
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  // Password visibility map (key = admin id)
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});

  // Drawer & Modal state
  const [selectedAdminForPermissions, setSelectedAdminForPermissions] = useState<CompanyAdmin | null>(null);
  const [tempPermissions, setTempPermissions] = useState<string[]>([]);
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  // Create Admin Form
  const [formCompanySearch, setFormCompanySearch] = useState('');
  const [showCompanyDropdown, setShowCompanyDropdown] = useState(false);
  const companySearchRef = useRef<HTMLDivElement>(null);
  const [formCompany, setFormCompany] = useState('');
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formConfirmPassword, setFormConfirmPassword] = useState('');

  // Handle clicking outside dropdowns
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setShowExportMenu(false);
      }
      if (companySearchRef.current && !companySearchRef.current.contains(event.target as Node)) {
        setShowCompanyDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Compute filtered table data
  const filteredAdmins = admins.filter(admin => {
    const term = search.toLowerCase();
    return admin.adminName.toLowerCase().includes(term) ||
           admin.companyName.toLowerCase().includes(term) ||
           admin.email.toLowerCase().includes(term);
  });

  const togglePasswordVisibility = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setVisiblePasswords(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const columns: Column<CompanyAdmin>[] = [
    { key: 'adminName', label: 'Admin Name', render: (row) => <span className="font-semibold text-slate-900">{row.adminName}</span> },
    { key: 'companyName', label: 'Company Name', render: (row) => <span className="text-slate-700">{row.companyName}</span> },
    { key: 'email', label: 'Email', render: (row) => <span className="text-slate-600">{row.email}</span> },
    { 
      key: 'password', 
      label: 'Password', 
      render: (row) => {
        const isVisible = visiblePasswords[row.id];
        return (
          <div className="flex items-center gap-2">
            <span className="font-mono text-slate-700 tracking-wider w-24">
              {isVisible ? row.passwordHash : '••••••••'}
            </span>
            <button 
              onClick={(e) => togglePasswordVisibility(row.id, e)}
              className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
              title={isVisible ? "Hide password" : "Show password"}
            >
              {isVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        );
      } 
    },
    {
      key: 'id',
      label: 'Permissions',
      render: (row) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setSelectedAdminForPermissions(row);
            setTempPermissions([...row.permissions]);
          }}
          className="p-2 text-violet-600 hover:bg-violet-50 rounded-lg transition-colors flex items-center justify-center border border-transparent hover:border-violet-100"
          title="Manage Permissions"
        >
          <Shield className="w-5 h-5" />
        </button>
      )
    }
  ];

  const getFormattedDate = () => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}${mm}${dd}`;
  };

  const handleExportExcel = () => {
    const exportData = filteredAdmins.map(row => ({
      'Admin Name': row.adminName,
      'Company Name': row.companyName,
      'Email': row.email,
      'Permissions': row.permissions.join(', ')
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Company Admins');
    
    const fileName = `company_admins_${getFormattedDate()}.xlsx`;
    XLSX.writeFile(workbook, fileName);
    setShowExportMenu(false);
  };

  const handleExportCSV = () => {
    const headers = ['Admin Name', 'Company Name', 'Email', 'Permissions'];
    const csvContent = [
      headers.join(','),
      ...filteredAdmins.map(row => 
        [
          `"${row.adminName}"`,
          `"${row.companyName}"`,
          `"${row.email}"`,
          `"${row.permissions.join(', ')}"`
        ].join(',')
      )
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    const fileName = `company_admins_${getFormattedDate()}.csv`;
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowExportMenu(false);
  };

  const handleCreateAdmin = () => {
    // Determine the actual company to save
    const finalCompany = formCompanySearch.trim() || formCompany;
    
    if (!finalCompany) return alert("Company Name is required.");
    if (!formName.trim()) return alert("Admin Name is required.");
    if (!formEmail.trim()) return alert("Admin Email is required.");
    if (!formPassword) return alert("Password is required.");
    if (formPassword !== formConfirmPassword) return alert("Passwords do not match.");
    
    const emailExists = admins.some(a => a.email.toLowerCase() === formEmail.toLowerCase());
    if (emailExists) return alert("Admin with this email already exists.");

    const newAdmin: CompanyAdmin = {
      id: `ADM-NEW-${Date.now()}`,
      adminName: formName.trim(),
      companyName: finalCompany,
      email: formEmail.trim(),
      passwordHash: formPassword,
      permissions: [] // default no permissions
    };

    setAdmins([...admins, newAdmin]);
    setShowCreateModal(false);
    
    // Reset form
    setFormCompanySearch('');
    setFormCompany('');
    setFormName('');
    setFormEmail('');
    setFormPassword('');
    setFormConfirmPassword('');
  };

  const handleSavePermissions = () => {
    if (!selectedAdminForPermissions) return;
    const updatedList = admins.map(admin => {
      if (admin.id === selectedAdminForPermissions.id) {
        return { ...admin, permissions: tempPermissions };
      }
      return admin;
    });
    setAdmins(updatedList);
    setSelectedAdminForPermissions(null);
  };

  const toggleModulePermission = (mod: string) => {
    setTempPermissions(prev => {
      if (prev.includes(mod)) return prev.filter(p => p !== mod);
      return [...prev, mod];
    });
  };

  // Filter existing companies for the dropdown
  const filteredCompanySuggestions = existingCompanies.filter(c => c.toLowerCase().includes(formCompanySearch.toLowerCase()));

  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader
        title="Admin Management"
        subtitle="Manage company administrators and module permissions."
        actions={
          <>
            <div className="relative inline-block text-left" ref={exportMenuRef}>
              <ActionButton 
                variant="secondary" 
                icon={<Download className="w-4 h-4" />}
                onClick={() => setShowExportMenu(!showExportMenu)}
              >
                Export
                <ChevronDown className="w-3 h-3 ml-1" />
              </ActionButton>
              
              {showExportMenu && (
                <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
                  <div className="py-1" role="menu" aria-orientation="vertical">
                    <button onClick={handleExportExcel} className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 hover:text-slate-900" role="menuitem">
                      Export as Excel (.xlsx)
                    </button>
                    <button onClick={handleExportCSV} className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 hover:text-slate-900" role="menuitem">
                      Export as CSV (.csv)
                    </button>
                  </div>
                </div>
              )}
            </div>
            <ActionButton onClick={() => setShowCreateModal(true)}>
              Create Admin
            </ActionButton>
          </>
        }
      />

      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search admin, company, or email..." />
      </FilterBar>

      <TableCard>
        <div className="overflow-x-auto">
          <DataTable
            columns={columns}
            data={filteredAdmins}
            emptyMessage="No company admins found."
          />
        </div>
      </TableCard>

      {/* Permission Right Drawer (Inline custom implementation) */}
      {selectedAdminForPermissions && (
        <>
          <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-[60]" onClick={() => setSelectedAdminForPermissions(null)} />
          <div className="fixed inset-y-0 right-0 z-[70] w-full max-w-md bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-900">Module Permissions</h2>
              <button onClick={() => setSelectedAdminForPermissions(null)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="mb-6 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <p className="text-sm text-slate-500 mb-1">Editing permissions for</p>
                <p className="font-semibold text-slate-900">{selectedAdminForPermissions.adminName}</p>
                <p className="text-sm text-slate-600">{selectedAdminForPermissions.companyName}</p>
              </div>

              <div className="space-y-3">
                {erpModules.map(mod => {
                  const isChecked = tempPermissions.includes(mod);
                  return (
                    <label 
                      key={mod} 
                      onClick={(e) => {
                        e.preventDefault();
                        toggleModulePermission(mod);
                      }}
                      className={`flex items-center p-3 rounded-xl border transition-all cursor-pointer ${isChecked ? 'border-violet-200 bg-violet-50/50' : 'border-slate-200 bg-white hover:border-slate-300'}`}
                    >
                      <div className={`w-5 h-5 rounded flex items-center justify-center mr-3 border ${isChecked ? 'bg-violet-600 border-violet-600 text-white' : 'border-slate-300 bg-white'}`}>
                        {isChecked && <Check className="w-3.5 h-3.5" />}
                      </div>
                      <span className={`text-sm font-medium ${isChecked ? 'text-violet-900' : 'text-slate-700'}`}>{mod}</span>
                    </label>
                  );
                })}
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 shrink-0">
              <ActionButton variant="secondary" onClick={() => setSelectedAdminForPermissions(null)}>Cancel</ActionButton>
              <ActionButton onClick={handleSavePermissions}>Save Permissions</ActionButton>
            </div>
          </div>
        </>
      )}

      {/* Create Admin Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 backdrop-blur-[2px] bg-slate-900/40">
          <div className="bg-white rounded-2xl shadow-2xl flex flex-col animate-in zoom-in-95 duration-200 w-full max-w-lg overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white">
              <h2 className="text-lg font-bold text-slate-900">Create Company Admin</h2>
              <button onClick={() => setShowCreateModal(false)} className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6 overflow-y-auto max-h-[70vh] [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              
              {/* Company Information */}
              <div>
                <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">Company Information</h3>
                
                <div className="relative" ref={companySearchRef}>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Company Name *</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    <input 
                      type="text" 
                      value={formCompanySearch} 
                      onChange={e => {
                        setFormCompanySearch(e.target.value);
                        setShowCompanyDropdown(true);
                      }} 
                      onFocus={() => setShowCompanyDropdown(true)}
                      className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 transition-all" 
                      placeholder="Search or enter new company name..."
                    />
                  </div>
                  
                  {/* Dropdown for Companies */}
                  {showCompanyDropdown && (
                    <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 shadow-xl rounded-lg max-h-48 overflow-y-auto z-10 py-1">
                      {filteredCompanySuggestions.length > 0 ? (
                        filteredCompanySuggestions.map(c => (
                          <button
                            key={c}
                            className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-violet-50 hover:text-violet-700 transition-colors"
                            onClick={() => {
                              setFormCompanySearch(c);
                              setShowCompanyDropdown(false);
                            }}
                          >
                            {c}
                          </button>
                        ))
                      ) : (
                        <div className="px-4 py-3 text-sm text-slate-500 italic flex flex-col">
                          <span>No matches found.</span>
                          <span className="text-violet-600 font-medium mt-1">Press enter or save to use "{formCompanySearch}" as a new company.</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Admin Information */}
              <div>
                <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">Admin Information</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Admin Name *</label>
                    <input 
                      type="text" 
                      value={formName} 
                      onChange={e => setFormName(e.target.value)} 
                      className="w-full border border-slate-200 bg-slate-50 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 transition-all" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Admin Email *</label>
                    <input 
                      type="email" 
                      value={formEmail} 
                      onChange={e => setFormEmail(e.target.value)} 
                      className="w-full border border-slate-200 bg-slate-50 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 transition-all" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Password *</label>
                    <input 
                      type="password" 
                      value={formPassword} 
                      onChange={e => setFormPassword(e.target.value)} 
                      className="w-full border border-slate-200 bg-slate-50 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 transition-all" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Confirm Password *</label>
                    <input 
                      type="password" 
                      value={formConfirmPassword} 
                      onChange={e => setFormConfirmPassword(e.target.value)} 
                      className="w-full border border-slate-200 bg-slate-50 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 transition-all" 
                    />
                  </div>
                </div>
              </div>

            </div>

            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 shrink-0">
              <ActionButton variant="secondary" onClick={() => setShowCreateModal(false)}>Cancel</ActionButton>
              <ActionButton onClick={handleCreateAdmin}>Create Admin</ActionButton>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
