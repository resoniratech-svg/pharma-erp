const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/modules/super-admin/AdminManagement.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Update the interface and modules list
const interfaceRegex = /interface CompanyAdmin \{[\s\S]*?\}\n\nconst erpModules = \[[\s\S]*?\];\n\nconst mockAdmins: CompanyAdmin\[\] = \[[\s\S]*?\];/;

const newInterface = `interface SubscriptionDetails {
  plan: 'Starter' | 'Professional' | 'Enterprise' | 'Custom' | string;
  status: 'Trial' | 'Active' | 'Suspended' | 'Expired' | string;
  billingCycle: 'Monthly' | 'Quarterly' | 'Half-Yearly' | 'Yearly' | string;
  startDate: string;
  endDate: string;
  autoRenewal: boolean;
  maxUsers: number;
  activeUsers: number;
  storageLimit: string;
  deviceLimit: string;
  apiAccessLimit: string;
  remarks: string;
  lastUpdated: string;
  updatedBy: string;
}

interface CompanyAdmin {
  id: string;
  adminName: string;
  companyName: string;
  email: string;
  passwordHash: string;
  permissions: string[];
  
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
  'Orders',
  'Billing',
  'Accounting & Finance',
  'CRM',
  'Reports & Analytics',
  'Medical Representative',
  'GPS & Attendance',
  'Notification Center',
  'Document Management',
  'Settings'
];

const mockAdmins: CompanyAdmin[] = [
  {
    id: 'ADM-001',
    adminName: 'Rahul Sharma',
    companyName: 'PharmaCorp Pvt Ltd',
    email: 'rahul.s@pharmacorp.in',
    passwordHash: 'Pharma@2024!',
    permissions: ['Product Management', 'Inventory & Warehouse Management', 'Settings'],
    subscription: {
      plan: 'Professional',
      status: 'Active',
      billingCycle: 'Yearly',
      startDate: '2026-01-01',
      endDate: '2026-12-31',
      autoRenewal: true,
      maxUsers: 50,
      activeUsers: 12,
      storageLimit: '100GB',
      deviceLimit: 'Unlimited',
      apiAccessLimit: '10000/day',
      remarks: 'Key enterprise client.',
      lastUpdated: '2026-01-01',
      updatedBy: 'System'
    }
  },
  {
    id: 'ADM-002',
    adminName: 'Priya Desai',
    companyName: 'HealthPlus Labs',
    email: 'priya.d@healthplus.com',
    passwordHash: 'Health#123',
    permissions: ['CRM', 'Orders', 'Billing', 'Accounting & Finance', 'Reports & Analytics'],
    subscription: {
      plan: 'Starter',
      status: 'Trial',
      billingCycle: 'Monthly',
      startDate: '2026-07-01',
      endDate: '2026-07-31',
      autoRenewal: false,
      maxUsers: 10,
      activeUsers: 3,
      storageLimit: '10GB',
      deviceLimit: '5',
      apiAccessLimit: '1000/day',
      remarks: 'Trial ends soon.',
      lastUpdated: '2026-07-01',
      updatedBy: 'System'
    }
  },
  {
    id: 'ADM-003',
    adminName: 'Amit Patel',
    companyName: 'MediCare Pharma',
    email: 'amit.p@medicare.in',
    passwordHash: 'Admin@MediCare1',
    permissions: ['Product Management', 'Inventory & Warehouse Management', 'C&F Management', 'Distributor Portal', 'Retailer Ordering System']
  }
];`;
content = content.replace(interfaceRegex, newInterface);

// 2. Add Active Tab state
const stateRegex = /export default function AdminManagement\(\) \{\n  const \[search, setSearch\] = useState\(''\);/;
const newState = `export default function AdminManagement() {
  const [activeMainTab, setActiveMainTab] = useState<'company-admin'|'subscription'>('company-admin');
  const [search, setSearch] = useState('');`;
content = content.replace(stateRegex, newState);

// 3. Update Drawer Title Module Permissions -> Purchased Modules
content = content.replace(/<h2 className="text-xl font-bold text-slate-900">Module Permissions<\/h2>/g, '<h2 className="text-xl font-bold text-slate-900">Purchased Modules</h2>');

// 4. Update the layout to include tabs and conditionally render
const layoutRegex = /<FilterBar>[\s\S]*?<\/TableCard>/;
const newLayout = `<div className="flex border-b border-slate-200 mb-6">
        <button 
          onClick={() => setActiveMainTab('company-admin')}
          className={\`px-6 py-3 text-sm font-medium transition-colors border-b-2 \${activeMainTab === 'company-admin' ? 'border-[#163c78] text-[#163c78]' : 'border-transparent text-slate-500 hover:text-slate-700'}\`}
        >
          Company Admin
        </button>
        <button 
          onClick={() => setActiveMainTab('subscription')}
          className={\`px-6 py-3 text-sm font-medium transition-colors border-b-2 \${activeMainTab === 'subscription' ? 'border-[#163c78] text-[#163c78]' : 'border-transparent text-slate-500 hover:text-slate-700'}\`}
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
        <SubscriptionTab admins={admins} setAdmins={setAdmins} />
      )}`;
content = content.replace(layoutRegex, newLayout);

// 5. Add SubscriptionTab component at the end of the file
const subscriptionTabCode = `
function SubscriptionTab({ admins, setAdmins }: { admins: CompanyAdmin[], setAdmins: any }) {
  const [selectedAdminId, setSelectedAdminId] = useState<string>('');
  
  const selectedAdmin = admins.find(a => a.id === selectedAdminId);
  const [subForm, setSubForm] = useState<SubscriptionDetails | null>(null);

  useEffect(() => {
    if (selectedAdmin) {
      setSubForm(selectedAdmin.subscription || {
        plan: 'Starter',
        status: 'Trial',
        billingCycle: 'Monthly',
        startDate: '',
        endDate: '',
        autoRenewal: false,
        maxUsers: 10,
        activeUsers: 0,
        storageLimit: '10GB',
        deviceLimit: '',
        apiAccessLimit: '',
        remarks: '',
        lastUpdated: new Date().toISOString().split('T')[0],
        updatedBy: 'Super Admin'
      });
    } else {
      setSubForm(null);
    }
  }, [selectedAdmin]);

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

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <label className="block text-sm font-medium text-slate-700 mb-2">Select Tenant Company</label>
        <select 
          value={selectedAdminId} 
          onChange={(e) => setSelectedAdminId(e.target.value)}
          className="w-full max-w-md border border-slate-200 bg-slate-50 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500/30"
        >
          <option value="">-- Select Company --</option>
          {admins.map(a => (
            <option key={a.id} value={a.id}>{a.companyName} ({a.adminName})</option>
          ))}
        </select>
      </div>

      {subForm && selectedAdmin && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Subscription Details */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <h3 className="text-base font-bold text-slate-900 mb-4 border-b border-slate-100 pb-2">Subscription Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  <label className="block text-sm font-medium text-slate-700 mb-1">Current Active Users</label>
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
               <button onClick={handleSave} className="bg-[#163c78] text-white px-6 py-2 rounded-lg font-medium hover:bg-[#102b5c] transition-colors">
                 Save Subscription
               </button>
            </div>
          </div>

          <div className="space-y-6">
            {/* Purchased Modules Sync */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <h3 className="text-base font-bold text-slate-900 mb-4 border-b border-slate-100 pb-2">Purchased Modules</h3>
              <p className="text-xs text-slate-500 mb-3">Allocated modules (Syncs with Company Admin tab)</p>
              <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                {erpModules.map(mod => (
                  <label key={mod} className="flex items-center space-x-2">
                    <input 
                      type="checkbox" 
                      checked={selectedAdmin.permissions.includes(mod)}
                      onChange={(e) => {
                        // Allow upgrading/removing modules directly from Subscription tab as requested
                        const updatedPerms = e.target.checked 
                          ? [...selectedAdmin.permissions, mod] 
                          : selectedAdmin.permissions.filter(p => p !== mod);
                        const updated = admins.map(a => a.id === selectedAdminId ? { ...a, permissions: updatedPerms } : a);
                        setAdmins(updated);
                      }}
                      className="rounded border-slate-300 text-[#163c78] focus:ring-[#163c78]"
                    />
                    <span className="text-sm text-slate-700">{mod}</span>
                  </label>
                ))}
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
`;
content += '\n' + subscriptionTabCode;

// 6. Update action buttons in PageHeader to only show Create Admin if on Company Admin tab
const pageHeaderRegex = /<ActionButton onClick=\{\(\) => setShowCreateModal\(true\)\}>\s*Create Admin\s*<\/ActionButton>/;
content = content.replace(pageHeaderRegex, `{activeMainTab === 'company-admin' && (
              <ActionButton onClick={() => setShowCreateModal(true)}>
                Create Admin
              </ActionButton>
            )}`);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully updated AdminManagement.tsx');
