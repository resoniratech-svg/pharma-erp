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
interface SubscriptionDetails {
  plan: 'Starter' | 'Professional' | 'Enterprise' | 'Custom' | string;
  status: 'Trial' | 'Active' | 'Suspended' | 'Expired' | string;
  billingCycle: 'Monthly' | 'Quarterly' | 'Half-Yearly' | 'Yearly' | string;
  subscriptionAmount: number;
  currency: string;
  gstPercentage: number;
  discount: number;
  finalAmount: number;
  paymentStatus: 'Pending' | 'Paid' | 'Failed' | string;
  paymentDate: string;
  startDate: string;
  endDate: string;
  renewalDate: string;
  autoRenewal: boolean;
  maxUsers: number;
  activeUsers: number;
  storageLimit: string;
  deviceLimit: string;
  apiAccessLimit: string;
  purchasedModules: string[];
  remarks: string;
  lastUpdated: string;
  updatedBy: string;
}

interface CompanyAdmin {
  id: string;
  adminName: string;
  companyName: string;
  email: string;
  passwordHash: string; // Plaintext for demo as requested
  
  companyCode?: string;
  gstNumber?: string;
  pan?: string;
  address?: string;
  contactDetails?: string;
  companyStatus?: string;
  mobileNumber?: string;

  subscription?: SubscriptionDetails;
}

const erpModules = [
  'Dashboard',
  'Product Management',
  'Inventory & Warehouse Management',
  'C&F Management',
  'Distributor Portal',
  'Retailer Ordering System',
  'Billing',
  'Accounting & Finance',
  'CRM',
  'Medical Representative',
  'GPS & Attendance',
  'Settings'
];

const mockAdmins: CompanyAdmin[] = [
  {
    id: 'ADM-001',
    adminName: 'Rahul Sharma',
    companyName: 'PharmaCorp Pvt Ltd',
    email: 'rahul.s@pharmacorp.in',
    passwordHash: 'Pharma@2024!',
    subscription: { plan: 'Professional', status: 'Active', billingCycle: 'Yearly', subscriptionAmount: 120000, currency: 'INR', gstPercentage: 18, discount: 5000, finalAmount: 136600, paymentStatus: 'Paid', paymentDate: '2026-01-05', startDate: '2026-01-01', endDate: '2026-12-31', renewalDate: '2027-01-01', autoRenewal: true, maxUsers: 50, activeUsers: 12, storageLimit: '100GB', deviceLimit: 'Unlimited', apiAccessLimit: '10000/day', purchasedModules: ['Product Management', 'Inventory & Warehouse Management', 'Settings'], remarks: 'Key enterprise client.', lastUpdated: '2026-01-01', updatedBy: 'System' }
  },
  {
    id: 'ADM-002',
    adminName: 'Priya Desai',
    companyName: 'HealthPlus Labs',
    email: 'priya.d@healthplus.com',
    passwordHash: 'Health#123',
    subscription: { plan: 'Starter', status: 'Trial', billingCycle: 'Monthly', subscriptionAmount: 5000, currency: 'INR', gstPercentage: 18, discount: 0, finalAmount: 5900, paymentStatus: 'Pending', paymentDate: '', startDate: '2026-07-01', endDate: '2026-07-31', renewalDate: '2026-08-01', autoRenewal: false, maxUsers: 10, activeUsers: 3, storageLimit: '10GB', deviceLimit: '5', apiAccessLimit: '1000/day', purchasedModules: ['CRM', 'Orders', 'Billing', 'Accounting & Finance', 'Reports & Analytics'], remarks: 'Trial ends soon.', lastUpdated: '2026-07-01', updatedBy: 'System' }
  },
  {
    id: 'ADM-003',
    adminName: 'Amit Patel',
    companyName: 'MediCare Pharma',
    email: 'amit.p@medicare.in',
    passwordHash: 'Admin@MediCare1',
    subscription: { plan: 'Enterprise', status: 'Active', billingCycle: 'Yearly', subscriptionAmount: 250000, currency: 'INR', gstPercentage: 18, discount: 10000, finalAmount: 283200, paymentStatus: 'Paid', paymentDate: '2026-03-10', startDate: '2026-03-15', endDate: '2027-03-14', renewalDate: '2027-03-15', autoRenewal: true, maxUsers: 100, activeUsers: 45, storageLimit: '500GB', deviceLimit: 'Unlimited', apiAccessLimit: '50000/day', purchasedModules: ['Product Management', 'Inventory & Warehouse Management', 'C&F Management', 'Distributor Portal', 'Retailer Ordering System'], remarks: 'Growing fast.', lastUpdated: '2026-03-10', updatedBy: 'System' }
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
  const [activeMainTab, setActiveMainTab] = useState<'company-admin'|'subscription'>('company-admin');
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
      label: 'Modules',
      render: (row) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setSelectedAdminForPermissions(row);
            setTempPermissions([...(row.subscription?.purchasedModules || [])]);
          }}
          className="p-2 text-[#163c78] hover:bg-[#163c78]/10 rounded-lg transition-colors flex items-center justify-center border border-transparent hover:border-violet-100"
          title="Manage Modules"
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
      'Purchased Modules': (row.subscription?.purchasedModules || []).join(', ')
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
          `"${(row.subscription?.purchasedModules || []).join(', ')}"`
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
      subscription: { 
        plan: 'Starter', status: 'Trial', billingCycle: 'Monthly', 
        subscriptionAmount: 0, currency: 'INR', gstPercentage: 18, discount: 0, finalAmount: 0,
        paymentStatus: 'Pending', paymentDate: '',
        startDate: new Date().toISOString().split('T')[0], endDate: '', renewalDate: '', autoRenewal: false, 
        maxUsers: 10, activeUsers: 0, storageLimit: '10GB', deviceLimit: '', apiAccessLimit: '', 
        purchasedModules: [], remarks: 'Newly created.', lastUpdated: new Date().toISOString().split('T')[0], updatedBy: 'System' 
      }
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
        return { 
          ...admin, 
          subscription: { 
            ...(admin.subscription || { 
               plan: 'Starter', status: 'Trial', billingCycle: 'Monthly', subscriptionAmount: 0, currency: 'INR', gstPercentage: 18, discount: 0, finalAmount: 0, paymentStatus: 'Pending', paymentDate: '', startDate: '', endDate: '', renewalDate: '', autoRenewal: false, maxUsers: 10, activeUsers: 0, storageLimit: '10GB', deviceLimit: '', apiAccessLimit: '', remarks: '', lastUpdated: new Date().toISOString().split('T')[0], updatedBy: 'System'
            }), 
            purchasedModules: tempPermissions,
            lastUpdated: new Date().toISOString().split('T')[0]
          } 
        };
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
            {activeMainTab === 'company-admin' && (
              <ActionButton onClick={() => setShowCreateModal(true)}>
                Create Admin
              </ActionButton>
            )}
          </>
        }
      />

      <div className="flex border-b border-slate-200 mb-6">
        <button 
          onClick={() => setActiveMainTab('company-admin')}
          className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 ${activeMainTab === 'company-admin' ? 'border-[#163c78] text-[#163c78]' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          Company Admin
        </button>
        <button 
          onClick={() => setActiveMainTab('subscription')}
          className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 ${activeMainTab === 'subscription' ? 'border-[#163c78] text-[#163c78]' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          Subscription
        </button>
      </div>

      {activeMainTab === 'company-admin' && (
        <>
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
        </>
      )}

      {activeMainTab === 'subscription' && (
        <SubscriptionTab admins={admins} setAdmins={setAdmins} erpModules={erpModules} />
      )}

      {/* Permission Right Drawer (Inline custom implementation) */}
      {selectedAdminForPermissions && (
        <>
          <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-[60]" onClick={() => setSelectedAdminForPermissions(null)} />
          <div className="fixed inset-y-0 right-0 z-[70] w-full max-w-md bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-900">Purchased Modules</h2>
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
                      className={`flex items-center p-3 rounded-xl border transition-all cursor-pointer ${isChecked ? 'border-violet-200 bg-[#163c78]/10/50' : 'border-slate-200 bg-white hover:border-slate-300'}`}
                    >
                      <div className={`w-5 h-5 rounded flex items-center justify-center mr-3 border ${isChecked ? 'bg-[#163c78] border-[#163c78] text-white' : 'border-slate-300 bg-white'}`}>
                        {isChecked && <Check className="w-3.5 h-3.5" />}
                      </div>
                      <span className={`text-sm font-medium ${isChecked ? 'text-[#081529]' : 'text-slate-700'}`}>{mod}</span>
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
                            className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-[#163c78]/10 hover:text-violet-700 transition-colors"
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
                          <span className="text-[#163c78] font-medium mt-1">Press enter or save to use "{formCompanySearch}" as a new company.</span>
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

function SubscriptionTab({ admins, setAdmins, erpModules }: { admins: CompanyAdmin[], setAdmins: any, erpModules: string[] }) {
  const [selectedAdminId, setSelectedAdminId] = useState<string>('');
  const selectedAdmin = admins.find(a => a.id === selectedAdminId);
  const [subForm, setSubForm] = useState<SubscriptionDetails | null>(null);

  // Searchable Dropdown State
  const [formCompanySearch, setFormCompanySearch] = useState('');
  const [showCompanyDropdown, setShowCompanyDropdown] = useState(false);
  const companySearchRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (companySearchRef.current && !companySearchRef.current.contains(event.target as Node)) {
        setShowCompanyDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (selectedAdmin) {
      setSubForm(selectedAdmin.subscription || {
        plan: 'Starter', status: 'Trial', billingCycle: 'Monthly', 
        subscriptionAmount: 0, currency: 'INR', gstPercentage: 18, discount: 0, finalAmount: 0,
        paymentStatus: 'Pending', paymentDate: '',
        startDate: '', endDate: '', renewalDate: '', autoRenewal: false, 
        maxUsers: 10, activeUsers: 0, storageLimit: '10GB', deviceLimit: '', apiAccessLimit: '', 
        purchasedModules: [], remarks: '', lastUpdated: new Date().toISOString().split('T')[0], updatedBy: 'Super Admin'
      });
      setFormCompanySearch(`${selectedAdmin.companyName} (${selectedAdmin.adminName})`);
    } else {
      setSubForm(null);
      setFormCompanySearch('');
    }
  }, [selectedAdmin]);

  // Auto calculate final amount
  useEffect(() => {
    if (subForm) {
       const amt = Number(subForm.subscriptionAmount) || 0;
       const gst = Number(subForm.gstPercentage) || 0;
       const disc = Number(subForm.discount) || 0;
       const finalAmt = amt + (amt * gst / 100) - disc;
       if (subForm.finalAmount !== finalAmt) {
          setSubForm(prev => prev ? { ...prev, finalAmount: finalAmt } : prev);
       }
    }
  }, [subForm?.subscriptionAmount, subForm?.gstPercentage, subForm?.discount]);

  const handleSave = () => {
    if (!selectedAdminId || !subForm) return;
    const updated = admins.map(a => {
      if (a.id === selectedAdminId) {
        return { ...a, subscription: { ...subForm, lastUpdated: new Date().toISOString().split('T')[0] } };
      }
      return a;
    });
    setAdmins(updated);
    alert("Subscription updated successfully.");
  };

  const filteredDropdownAdmins = admins.filter(a => 
    a.companyName.toLowerCase().includes(formCompanySearch.toLowerCase()) || 
    a.adminName.toLowerCase().includes(formCompanySearch.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm relative z-20" ref={companySearchRef}>
        <label className="block text-sm font-medium text-slate-700 mb-2">Search & Select Tenant Company</label>
        <div className="relative">
           <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
           <input 
             type="text" 
             value={formCompanySearch}
             onChange={e => { setFormCompanySearch(e.target.value); setShowCompanyDropdown(true); if(e.target.value==='') setSelectedAdminId(''); }}
             onFocus={() => setShowCompanyDropdown(true)}
             className="w-full max-w-md pl-9 pr-4 py-2 border border-slate-200 bg-slate-50 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#163c78]/30"
             placeholder="Type company or admin name..."
           />
        </div>
        {showCompanyDropdown && (
           <div className="absolute left-6 mt-1 w-full max-w-md bg-white border border-slate-200 shadow-xl rounded-lg max-h-48 overflow-y-auto py-1">
             {filteredDropdownAdmins.map(a => (
               <button 
                 key={a.id} 
                 className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-[#163c78]/10 hover:text-[#163c78]" 
                 onClick={() => { setSelectedAdminId(a.id); setShowCompanyDropdown(false); }}
               >
                 <span className="font-medium text-slate-900">{a.companyName}</span> <span className="text-xs text-slate-500">({a.adminName})</span>
               </button>
             ))}
             {filteredDropdownAdmins.length === 0 && (
               <div className="px-4 py-2 text-sm text-slate-500 italic">No companies found</div>
             )}
           </div>
        )}
      </div>

      {subForm && selectedAdmin && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative z-10">
          <div className="lg:col-span-2 space-y-6">
            
            {/* Commercial Subscription Details */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <h3 className="text-base font-bold text-slate-900 mb-4 border-b border-slate-100 pb-2">Commercial Subscription</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Subscription Plan</label>
                  <select value={subForm.plan} onChange={e => setSubForm({...subForm, plan: e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2">
                    <option>Starter</option>
                    <option>Professional</option>
                    <option>Enterprise</option>
                    <option>Custom</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                  <select value={subForm.status} onChange={e => setSubForm({...subForm, status: e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2">
                    <option>Trial</option>
                    <option>Active</option>
                    <option>Suspended</option>
                    <option>Expired</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Billing Cycle</label>
                  <select value={subForm.billingCycle} onChange={e => setSubForm({...subForm, billingCycle: e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2">
                    <option>Monthly</option>
                    <option>Quarterly</option>
                    <option>Half-Yearly</option>
                    <option>Yearly</option>
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 p-4 bg-slate-50 rounded-lg border border-slate-100">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Currency</label>
                  <input type="text" value={subForm.currency} onChange={e => setSubForm({...subForm, currency: e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Base Amount</label>
                  <input type="number" value={subForm.subscriptionAmount} onChange={e => setSubForm({...subForm, subscriptionAmount: Number(e.target.value)})} className="w-full border border-slate-200 rounded-lg px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">GST (%)</label>
                  <input type="number" value={subForm.gstPercentage} onChange={e => setSubForm({...subForm, gstPercentage: Number(e.target.value)})} className="w-full border border-slate-200 rounded-lg px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Discount</label>
                  <input type="number" value={subForm.discount} onChange={e => setSubForm({...subForm, discount: Number(e.target.value)})} className="w-full border border-slate-200 rounded-lg px-3 py-2" />
                </div>
                <div className="md:col-span-4 flex items-center justify-end mt-2 border-t border-slate-200 pt-3">
                  <span className="text-sm text-slate-500 mr-3">Final Amount:</span>
                  <span className="text-lg font-bold text-slate-900">{subForm.currency} {subForm.finalAmount.toLocaleString()}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Payment Status</label>
                  <select value={subForm.paymentStatus} onChange={e => setSubForm({...subForm, paymentStatus: e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2">
                    <option>Paid</option>
                    <option>Pending</option>
                    <option>Failed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Payment Date</label>
                  <input type="date" value={subForm.paymentDate} onChange={e => setSubForm({...subForm, paymentDate: e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Auto Renewal</label>
                  <select value={subForm.autoRenewal ? 'Yes' : 'No'} onChange={e => setSubForm({...subForm, autoRenewal: e.target.value === 'Yes'})} className="w-full border border-slate-200 rounded-lg px-3 py-2">
                    <option>Yes</option>
                    <option>No</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Start Date</label>
                  <input type="date" value={subForm.startDate} onChange={e => setSubForm({...subForm, startDate: e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">End Date</label>
                  <input type="date" value={subForm.endDate} onChange={e => setSubForm({...subForm, endDate: e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Renewal Date</label>
                  <input type="date" value={subForm.renewalDate} onChange={e => setSubForm({...subForm, renewalDate: e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2" />
                </div>
              </div>
            </div>

            {/* License Management */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <h3 className="text-base font-bold text-slate-900 mb-4 border-b border-slate-100 pb-2">License Management</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Maximum Users</label>
                  <input type="number" value={subForm.maxUsers} onChange={e => setSubForm({...subForm, maxUsers: parseInt(e.target.value) || 0})} className="w-full border border-slate-200 rounded-lg px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Current Active Users (Read Only)</label>
                  <input type="number" readOnly value={subForm.activeUsers} className="w-full border border-slate-200 bg-slate-100 text-slate-500 rounded-lg px-3 py-2 cursor-not-allowed" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Storage Limit</label>
                  <input type="text" value={subForm.storageLimit} onChange={e => setSubForm({...subForm, storageLimit: e.target.value})} placeholder="e.g. 100GB" className="w-full border border-slate-200 rounded-lg px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Device Limit (Optional)</label>
                  <input type="text" value={subForm.deviceLimit} onChange={e => setSubForm({...subForm, deviceLimit: e.target.value})} placeholder="e.g. 5" className="w-full border border-slate-200 rounded-lg px-3 py-2" />
                </div>
              </div>
            </div>
            
            <div className="flex justify-end mt-4">
               <button onClick={handleSave} className="bg-[#163c78] text-white px-6 py-2 rounded-lg font-medium hover:bg-[#102b5c] transition-colors shadow-sm">
                 Save Subscription
               </button>
            </div>
          </div>

          <div className="space-y-6">
            {/* Purchased Modules UI */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <h3 className="text-base font-bold text-slate-900 mb-4 border-b border-slate-100 pb-2">Purchased Modules</h3>
              <p className="text-xs text-slate-500 mb-3">Check modules to allocate to this tenant</p>
              
              <div className="space-y-2 max-h-64 overflow-y-auto pr-2 mb-4">
                {erpModules.map(mod => {
                  const isChecked = (subForm.purchasedModules || []).includes(mod);
                  return (
                    <label key={mod} className="flex items-center space-x-2">
                      <input 
                        type="checkbox" 
                        checked={isChecked}
                        onChange={(e) => {
                          const updatedPerms = e.target.checked 
                            ? [...(subForm.purchasedModules || []), mod] 
                            : (subForm.purchasedModules || []).filter(p => p !== mod);
                          setSubForm({...subForm, purchasedModules: updatedPerms});
                        }}
                        className="rounded border-slate-300 text-[#163c78] focus:ring-[#163c78]"
                      />
                      <span className="text-sm text-slate-700">{mod}</span>
                    </label>
                  );
                })}
              </div>

              {/* Modules Summary Table */}
              <div className="mt-4 pt-4 border-t border-slate-100">
                <h4 className="text-sm font-semibold text-slate-900 mb-2">Allocated Summary</h4>
                <div className="bg-slate-50 rounded-lg border border-slate-200 overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100/50 border-b border-slate-200">
                      <tr>
                        <th className="px-3 py-2 font-medium text-slate-700">Module</th>
                        <th className="px-3 py-2 font-medium text-slate-700">Status</th>
                        <th className="px-3 py-2 font-medium text-slate-700">Activated</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(subForm.purchasedModules || []).map(m => (
                        <tr key={m}>
                          <td className="px-3 py-2 text-slate-900 truncate max-w-[120px]" title={m}>{m}</td>
                          <td className="px-3 py-2 text-emerald-600 font-medium">Active</td>
                          <td className="px-3 py-2 text-slate-500">{subForm.startDate || 'N/A'}</td>
                        </tr>
                      ))}
                      {(!subForm.purchasedModules || subForm.purchasedModules.length === 0) && (
                        <tr><td colSpan={3} className="px-3 py-4 text-center text-slate-500 italic">No modules allocated</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Internal Notes */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <h3 className="text-base font-bold text-slate-900 mb-4 border-b border-slate-100 pb-2">Internal Notes</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Remarks</label>
                  <textarea value={subForm.remarks} onChange={e => setSubForm({...subForm, remarks: e.target.value})} rows={3} className="w-full border border-slate-200 rounded-lg px-3 py-2 resize-none"></textarea>
                </div>
                <div className="text-xs text-slate-500 space-y-1">
                  <p>Last Updated: {subForm.lastUpdated}</p>
                  <p>Updated By: {subForm.updatedBy}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
