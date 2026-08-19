import { useState, useRef, useEffect } from 'react';
import { Download, ChevronDown, Eye, EyeOff, Shield, X, Check, Search, Trash2 } from 'lucide-react';
import * as XLSX from 'xlsx';

import { apiRequest } from '../../services/apiClient';

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
  'NSM (National Sales Manager)',
  'RSM (Regional Sales Manager)',
  'ASM (Area Sales Manager)',
  'GPS & Attendance',
  'Settings'
];

const mockAdmins: any[] = [];

const defaultCompanies = [
  'PharmaCorp Pvt Ltd',
  'HealthPlus Labs',
  'MediCare Pharma',
  'SunLife Pharmaceuticals',
  'Apollo Life Sciences'
];

export default function AdminManagement() {
  const [activeMainTab, setActiveMainTab] = useState<'company-admin'|'subscription'>('company-admin');
  const [search, setSearch] = useState('');
  const [companies, setCompanies] = useState<string[]>(() => {
    const stored = localStorage.getItem('companyNames');
    if (stored) return JSON.parse(stored);
    localStorage.setItem('companyNames', JSON.stringify(defaultCompanies));
    return defaultCompanies;
  });
  const [admins, setAdmins] = useState<CompanyAdmin[]>(() => {
    const stored = localStorage.getItem('companyAdmins');
    if (stored) {
      return JSON.parse(stored);
    }
    localStorage.setItem('companyAdmins', JSON.stringify(mockAdmins));
    return mockAdmins;
  });

  useEffect(() => {
    const loadCompanyAdmins = async () => {
      try {
        const response = await apiRequest<{ success: boolean; data: any[] }>('/companies');
        const localStored = localStorage.getItem('companyAdmins');
        const localAdmins: CompanyAdmin[] = localStored ? JSON.parse(localStored) : [];

        let apiAdmins: CompanyAdmin[] = [];
        if (response && response.success && Array.isArray(response.data)) {
          apiAdmins = response.data.map(c => {
            const adminId = `ADM-${String(c.id).padStart(3, '0')}`;
            const adminEmail = (c.email || `admin@${c.code ? c.code.toLowerCase() : 'company'}.com`).toLowerCase();
            
            // Check if local storage already has saved custom modules for this company admin
            const existingLocal = localAdmins.find(la => la.id === adminId || la.email.toLowerCase() === adminEmail || la.companyName.toLowerCase() === c.name.toLowerCase());
            
            const savedModules = existingLocal?.subscription?.purchasedModules || erpModules;
            const primaryUser = c.users && c.users.length > 0 ? c.users[0] : null;

            return {
              id: adminId,
              adminName: primaryUser?.name || c.contactPerson || c.name || 'Company Admin',
              companyName: c.name,
              email: primaryUser?.email || c.email || `admin@${c.code ? c.code.toLowerCase() : 'company'}.com`,
              passwordHash: existingLocal?.passwordHash && existingLocal.passwordHash !== '********' ? existingLocal.passwordHash : '********',
              companyCode: c.code,
              gstNumber: c.gstNumber,
              subscription: {
                plan: existingLocal?.subscription?.plan || 'Enterprise',
                status: existingLocal?.subscription?.status || (c.status === 'Active' ? 'Active' : 'Trial'),
                billingCycle: existingLocal?.subscription?.billingCycle || 'Yearly',
                subscriptionAmount: existingLocal?.subscription?.subscriptionAmount ?? 120000,
                currency: existingLocal?.subscription?.currency || 'INR',
                gstPercentage: existingLocal?.subscription?.gstPercentage ?? 18,
                discount: existingLocal?.subscription?.discount ?? 0,
                finalAmount: existingLocal?.subscription?.finalAmount ?? 141600,
                paymentStatus: existingLocal?.subscription?.paymentStatus || 'Paid',
                paymentDate: existingLocal?.subscription?.paymentDate || (c.createdAt ? c.createdAt.split('T')[0] : '2026-01-01'),
                startDate: existingLocal?.subscription?.startDate || (c.createdAt ? c.createdAt.split('T')[0] : '2026-01-01'),
                endDate: existingLocal?.subscription?.endDate || '2027-01-01',
                renewalDate: existingLocal?.subscription?.renewalDate || '2027-01-01',
                autoRenewal: existingLocal?.subscription?.autoRenewal ?? true,
                maxUsers: existingLocal?.subscription?.maxUsers ?? 50,
                activeUsers: existingLocal?.subscription?.activeUsers ?? 12,
                storageLimit: existingLocal?.subscription?.storageLimit || '100GB',
                deviceLimit: existingLocal?.subscription?.deviceLimit || 'Unlimited',
                apiAccessLimit: existingLocal?.subscription?.apiAccessLimit || '10000/day',
                purchasedModules: existingLocal?.subscription?.purchasedModules || savedModules,
                remarks: existingLocal?.subscription?.remarks || 'Backend Database Active Client',
                lastUpdated: c.updatedAt ? c.updatedAt.split('T')[0] : '2026-01-01',
                updatedBy: 'System'
              }
            };
          });
        }

        // Merge API companies with local stored admins so newly added admins persist across reloads
        const mergedAdmins = [...apiAdmins];
        localAdmins.forEach(la => {
          if (!mergedAdmins.some(ma => ma.email.toLowerCase() === la.email.toLowerCase() || ma.id === la.id)) {
            mergedAdmins.unshift(la);
          }
        });

        const finalAdmins = mergedAdmins.length > 0 ? mergedAdmins : (localAdmins.length > 0 ? localAdmins : mockAdmins);
        setAdmins(finalAdmins);
        localStorage.setItem('companyAdmins', JSON.stringify(finalAdmins));
        const companyNameList = Array.from(new Set(finalAdmins.map(a => a.companyName)));
        setCompanies(companyNameList);
        localStorage.setItem('companyNames', JSON.stringify(companyNameList));
      } catch (e) {
        console.error("Failed to load companies from backend:", e);
      }
    };
    loadCompanyAdmins();
  }, []);
  
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
              {isVisible ? row.passwordHash : '•'.repeat(row.passwordHash.length || 8)}
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
      label: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-2">
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
          <button
            onClick={async (e) => {
              e.stopPropagation();
              if (!window.confirm(`Are you sure you want to delete ${row.adminName}?`)) return;

              // Delete from backend API if it's a real company ID
              if (!row.id.startsWith('ADM-NEW')) {
                const companyId = parseInt(row.id.replace('ADM-', ''), 10);
                if (!isNaN(companyId)) {
                  try {
                    await apiRequest(`/companies/${companyId}`, { method: 'DELETE' });
                  } catch (err) {
                    console.warn("Failed to delete company from backend:", err);
                  }
                }
              }

              // Remove from frontend state
              const updatedAdmins = admins.filter(a => a.id !== row.id);
              setAdmins(updatedAdmins);
              localStorage.setItem('companyAdmins', JSON.stringify(updatedAdmins));
            }}
            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors flex items-center justify-center border border-transparent hover:border-red-100"
            title="Delete Admin"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
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

  const handleCreateAdmin = async () => {
    // Determine the actual company to save
    const finalCompany = formCompanySearch.trim() || formCompany;
    
    if (!finalCompany) return alert("Company Name is required.");
    if (!formName.trim()) return alert("Admin Name is required.");
    if (!formEmail.trim()) return alert("Admin Email is required.");
    if (!formPassword) return alert("Password is required.");
    if (formPassword.length < 4) return alert("Password must be at least 4 characters long.");
    if (formPassword !== formConfirmPassword) return alert("Passwords do not match.");
    
    const emailExists = admins.some(a => a.email.toLowerCase() === formEmail.toLowerCase());
    if (emailExists) return alert("Admin with this email already exists.");

    // Save company to backend database API endpoint
    try {
      await apiRequest('/companies', {
        method: 'POST',
        body: JSON.stringify({
          name: finalCompany,
          code: `COMP-${Date.now().toString().slice(-4)}`,
          email: formEmail.trim(),
          contactPerson: formName.trim(),
          adminPassword: formPassword,
          status: 'Active'
        })
      });
    } catch (e) {
      console.warn("Backend API POST /companies fallback to local database:", e);
    }

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
        purchasedModules: erpModules, remarks: 'Newly created client.', lastUpdated: new Date().toISOString().split('T')[0], updatedBy: 'System' 
      }
    };

    const updatedAdmins = [newAdmin, ...admins];
    setAdmins(updatedAdmins);
    localStorage.setItem('companyAdmins', JSON.stringify(updatedAdmins));

    const updatedCompanyNames = Array.from(new Set([finalCompany, ...companies]));
    setCompanies(updatedCompanyNames);
    localStorage.setItem('companyNames', JSON.stringify(updatedCompanyNames));

    setShowCreateModal(false);
    
    // Reset form
    setFormCompanySearch('');
    setFormCompany('');
    setFormName('');
    setFormEmail('');
    setFormPassword('');
    setFormConfirmPassword('');

    alert(`Successfully created Company Admin for ${finalCompany}!`);
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
            purchasedModules: Array.from(new Set([...tempPermissions, 'Settings'])),
            lastUpdated: new Date().toISOString().split('T')[0]
          } 
        };
      }
      return admin;
    });

    setAdmins(updatedList);
    localStorage.setItem('companyAdmins', JSON.stringify(updatedList));

    // Sync centralAuthSession if active user session belongs to this company admin
    try {
      const activeSessionStr = localStorage.getItem('centralAuthSession');
      if (activeSessionStr) {
        const session = JSON.parse(activeSessionStr);
        if (session.tenantId === selectedAdminForPermissions.id || session.user?.email?.toLowerCase() === selectedAdminForPermissions.email.toLowerCase()) {
          session.purchasedModules = tempPermissions;
          localStorage.setItem('centralAuthSession', JSON.stringify(session));
        }
      }
    } catch (e) {}

    setSelectedAdminForPermissions(null);
    alert("Purchased modules and permissions saved successfully.");
  };

  const toggleModulePermission = (mod: string) => {
    setTempPermissions(prev => {
      if (prev.includes(mod)) return prev.filter(p => p !== mod);
      return [...prev, mod];
    });
  };

  // Filter existing companies for the dropdown
  const filteredCompanySuggestions = companies.filter(c => c.toLowerCase().includes(formCompanySearch.toLowerCase()));
  const exactMatchExists = companies.some(c => c.toLowerCase().trim() === formCompanySearch.toLowerCase().trim());

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
                  const isSettings = mod === 'Settings';
                  const isChecked = isSettings || tempPermissions.includes(mod);
                  return (
                    <label 
                      key={mod} 
                      onClick={(e) => {
                        e.preventDefault();
                        if (isSettings) return;
                        toggleModulePermission(mod);
                      }}
                      className={`flex items-center p-3 rounded-xl border transition-all ${isSettings ? 'opacity-60 cursor-not-allowed border-violet-200 bg-[#163c78]/10/50' : `cursor-pointer ${isChecked ? 'border-violet-200 bg-[#163c78]/10/50' : 'border-slate-200 bg-white hover:border-slate-300'}`}`}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 backdrop-blur-[2px] bg-slate-900/40" onClick={() => setShowCreateModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl flex flex-col animate-in zoom-in-95 duration-200 w-full max-w-lg overflow-hidden" onClick={(e) => e.stopPropagation()}>
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
                      {filteredCompanySuggestions.map(c => (
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
                      ))}
                      
                      {formCompanySearch.trim() && !exactMatchExists && (
                        <button
                          className="w-full text-left px-4 py-2 text-sm text-[#163c78] font-medium hover:bg-[#163c78]/10 transition-colors border-t border-slate-100 flex items-center"
                          onClick={() => {
                            const newCompany = formCompanySearch.trim();
                            const newCompanies = [...companies, newCompany];
                            setCompanies(newCompanies);
                            localStorage.setItem('companyNames', JSON.stringify(newCompanies));
                            setFormCompanySearch(newCompany);
                            setShowCompanyDropdown(false);
                          }}
                        >
                          + Add "{formCompanySearch.trim()}"
                        </button>
                      )}
                      
                      {!formCompanySearch.trim() && filteredCompanySuggestions.length === 0 && (
                         <div className="px-4 py-3 text-sm text-slate-500 italic flex flex-col">
                           <span>No companies available.</span>
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
                      minLength={4}
                      value={formPassword} 
                      onChange={e => setFormPassword(e.target.value)} 
                      className="w-full border border-slate-200 bg-slate-50 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 transition-all" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Confirm Password *</label>
                    <input 
                      type="password" 
                      minLength={4}
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
  const [historySearch, setHistorySearch] = useState('');
  
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
       const discPercent = Number(subForm.discount) || 0;
       
       const discountAmount = (amt * discPercent) / 100;
       const discountedBase = amt - discountAmount;
       const gstAmount = (discountedBase * gst) / 100;
       const finalAmt = discountedBase + gstAmount;

       if (subForm.finalAmount !== finalAmt) {
          setSubForm(prev => prev ? { ...prev, finalAmount: finalAmt } : prev);
       }
    }
  }, [subForm?.subscriptionAmount, subForm?.gstPercentage, subForm?.discount]);

  const handleSave = async () => {
    if (!selectedAdminId || !subForm) return;
    const updated = admins.map(a => {
      if (a.id === selectedAdminId) {
        return { ...a, subscription: { ...subForm, purchasedModules: Array.from(new Set([...(subForm.purchasedModules || []), 'Settings'])), lastUpdated: new Date().toISOString().split('T')[0] } };
      }
      return a;
    });
    setAdmins(updated);
    localStorage.setItem('companyAdmins', JSON.stringify(updated));
    
    // Fire API call to save to real database (fails gracefully if DB not migrated yet)
    try {
      const realId = Number(selectedAdminId.replace('ADM-', ''));
      if (!isNaN(realId)) {
        await apiRequest(`/companies/${realId}/subscription`, 'PUT', subForm);
      }
    } catch (e) {
      console.warn("Backend save failed, likely pending database migration:", e);
    }
    
    alert("Subscription updated successfully.");
  };

  const filteredDropdownAdmins = admins.filter(a => 
    a.companyName.toLowerCase().includes(formCompanySearch.toLowerCase()) || 
    a.adminName.toLowerCase().includes(formCompanySearch.toLowerCase())
  );

  const filteredHistoryAdmins = admins.filter(a => 
    a.subscription && 
    (a.companyName.toLowerCase().includes(historySearch.toLowerCase()) || 
     a.adminName.toLowerCase().includes(historySearch.toLowerCase()) ||
     a.email.toLowerCase().includes(historySearch.toLowerCase()))
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
                  <label className="block text-sm font-medium text-slate-700 mb-1">Discount (%)</label>
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
                  const isSettings = mod === 'Settings';
                  const isChecked = isSettings || (subForm.purchasedModules || []).includes(mod);
                  return (
                    <label key={mod} className={`flex items-center space-x-2 ${isSettings ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}>
                      <input 
                        type="checkbox" 
                        checked={isChecked}
                        disabled={isSettings}
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

      {/* Subscription History Section */}
      <div className="mt-8 space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <h3 className="text-lg font-bold text-slate-900">Subscription History</h3>
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input 
              type="text" 
              value={historySearch}
              onChange={e => setHistorySearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 bg-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#163c78]/30"
              placeholder="Quick search by company, admin or email..."
            />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 font-semibold text-slate-700">Company Name</th>
                  <th className="px-6 py-4 font-semibold text-slate-700">Company Admin</th>
                  <th className="px-6 py-4 font-semibold text-slate-700">Subscription Plan</th>
                  <th className="px-6 py-4 font-semibold text-slate-700">Status</th>
                  <th className="px-6 py-4 font-semibold text-slate-700">Billing Cycle</th>
                  <th className="px-6 py-4 font-semibold text-slate-700">Start Date</th>
                  <th className="px-6 py-4 font-semibold text-slate-700">End Date</th>
                  <th className="px-6 py-4 font-semibold text-slate-700">Final Amount</th>
                  <th className="px-6 py-4 font-semibold text-slate-700">Maximum Users</th>
                  <th className="px-6 py-4 font-semibold text-slate-700 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredHistoryAdmins.length > 0 ? (
                  filteredHistoryAdmins.map(admin => (
                    <tr key={admin.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 font-medium text-slate-900">{admin.companyName}</td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-slate-900">{admin.adminName}</span>
                          <span className="text-xs text-slate-500">{admin.email}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-700">{admin.subscription?.plan || 'N/A'}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${
                          admin.subscription?.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                          admin.subscription?.status === 'Suspended' ? 'bg-red-50 text-red-700 border-red-200' :
                          'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                          {admin.subscription?.status || 'Unknown'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-700">{admin.subscription?.billingCycle || 'N/A'}</td>
                      <td className="px-6 py-4 text-slate-700">{admin.subscription?.startDate || 'N/A'}</td>
                      <td className="px-6 py-4 text-slate-700">{admin.subscription?.endDate || 'N/A'}</td>
                      <td className="px-6 py-4 text-slate-700">{admin.subscription?.currency} {admin.subscription?.finalAmount?.toLocaleString()}</td>
                      <td className="px-6 py-4 text-slate-700">{admin.subscription?.maxUsers || 'N/A'}</td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => {
                             setSelectedAdminId(admin.id);
                             setFormCompanySearch(`${admin.companyName} (${admin.adminName})`);
                             window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          className="text-[#163c78] font-medium hover:text-violet-700 transition-colors"
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={10} className="px-6 py-8 text-center text-slate-500">
                      No subscription records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
