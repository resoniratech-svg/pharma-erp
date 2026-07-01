// import { useState } from 'react';
// import { Plus, Store, Download } from 'lucide-react';
// import {
//   PageHeader,
//   FilterBar,
//   SearchInput,
//   SelectFilter,
//   ActionButton,
//   TableCard,
//   DataTable,
//   Badge,
// } from './components/shared';
// import { type Column } from './components/shared';

// interface DistributorProfile {
//   id: string;
//   name: string;
//   region: string;
//   tier: 'Tier 1' | 'Tier 2' | 'Tier 3';
//   ytdSales: string;
//   status: 'Active' | 'Inactive';
// }

// const mockData: DistributorProfile[] = [
//   { id: '1', name: 'Metro Distributors', region: 'North', tier: 'Tier 1', ytdSales: '₹ 2.5 Cr', status: 'Active' },
//   { id: '2', name: 'Global Health Agencies', region: 'South', tier: 'Tier 2', ytdSales: '₹ 85 L', status: 'Active' },
//   { id: '3', name: 'Carewell Pharma', region: 'East', tier: 'Tier 3', ytdSales: '₹ 15 L', status: 'Inactive' },
// ];

// export default function DistributorCRM() {
//   const [search, setSearch] = useState('');
//   const [tierFilter, setTierFilter] = useState('');

//   const columns: Column<DistributorProfile>[] = [
//     { key: 'name', label: 'Distributor Name', render: (row) => <span className="font-semibold text-slate-900">{row.name}</span> },
//     { key: 'region', label: 'Assigned Region' },
//     {
//       key: 'tier',
//       label: 'Partner Tier',
//       render: (row) => {
//         const variant = row.tier === 'Tier 1' ? 'purple' : row.tier === 'Tier 2' ? 'info' : 'neutral';
//         return <Badge variant={variant}>{row.tier}</Badge>;
//       },
//     },
//     { key: 'ytdSales', label: 'YTD Sales (Approx)' },
//     {
//       key: 'status',
//       label: 'Status',
//       render: (row) => {
//         const variant = row.status === 'Active' ? 'success' : 'danger';
//         return <Badge variant={variant}>{row.status}</Badge>;
//       },
//     },
//     {
//       key: 'action',
//       label: '',
//       render: () => <ActionButton variant="ghost" className="text-violet-600 text-xs px-2 py-1"><Store className="w-4 h-4 mr-1" /> Profile</ActionButton>
//     }
//   ];

//   const filteredData = mockData.filter((item) => {
//     const matchSearch = item.name.toLowerCase().includes(search.toLowerCase());
//     const matchTier = tierFilter ? item.tier === tierFilter : true;
//     return matchSearch && matchTier;
//   });

//   return (
//     <div className="animate-in fade-in duration-500">
//       <PageHeader
//         title="Distributor Onboarding CRM"
//         subtitle="Manage B2B channel partner relationships, performance, and tiering."
//         actions={
//           <>
//             <ActionButton variant="secondary" icon={<Download className="w-4 h-4" />}>Export Partners</ActionButton>
//             <ActionButton icon={<Plus className="w-4 h-4" />}>Add Distributor</ActionButton>
//           </>
//         }
//       />

//       <FilterBar>
//         <SearchInput value={search} onChange={setSearch} placeholder="Search distributors..." />
//         <div className="w-px h-6 bg-slate-200 mx-2 hidden sm:block" />
//         <SelectFilter
//           value={tierFilter}
//           onChange={setTierFilter}
//           options={[
//             { label: 'Tier 1', value: 'Tier 1' },
//             { label: 'Tier 2', value: 'Tier 2' },
//             { label: 'Tier 3', value: 'Tier 3' },
//           ]}
//           placeholder="All Tiers"
//         />
//       </FilterBar>

//       <TableCard>
//         <DataTable
//           columns={columns}
//           data={filteredData}
//           emptyMessage="No distributor profiles found."
//         />
//       </TableCard>
//     </div>
//   );
// }


/////////////////////////////////////////////////////////////////////

import { useState, useEffect } from 'react';
import { Plus, Store, Download, MapPin, Mail, Phone, Building } from 'lucide-react';
import {
  PageHeader,
  FilterBar,
  SearchInput,
  SelectFilter,
  ActionButton,
  TableCard,
  DataTable,
  Badge,
  Drawer,
} from './components/shared';
import { type Column } from './components/shared';

// ✅ Proper TypeScript Interfaces
interface DistributorProfile {
  id: string;
  name: string;
  region: string;
  tier: 'Tier 1' | 'Tier 2' | 'Tier 3';
  ytdSales: string;
  status: 'Active' | 'Inactive';
  phone?: string;
  email?: string;
  createdAt?: string;
}

interface CRMActivity {
  id: string;
  type: string;
  description: string;
  date: string;
  user: string;
}

export default function DistributorCRM() {
  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState('');
  const [distributors, setDistributors] = useState<DistributorProfile[]>([]);
  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    region: '',
    tier: 'Tier 2' as 'Tier 1' | 'Tier 2' | 'Tier 3',
    status: 'Active' as 'Active' | 'Inactive',
    phone: '',
    email: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    try {
      const storedDistributors: DistributorProfile[] = JSON.parse(localStorage.getItem('crm_distributors') || '[]');
      
      // Sort by newest added first (createdAt descending)
      storedDistributors.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });
      
      setDistributors(storedDistributors);
    } catch (e) {
      console.error('Failed to load distributors', e);
    }
  };

  const generateDistributorId = (existingData: DistributorProfile[]) => {
    if (existingData.length === 0) return 'DST-0001';
    
    const ids = existingData.map(d => {
      const parts = d.id.split('-');
      return parts.length > 1 ? parseInt(parts[1], 10) : 0;
    }).filter(n => !isNaN(n));
    
    const maxId = ids.length > 0 ? Math.max(...ids) : 0;
    return `DST-${(maxId + 1).toString().padStart(4, '0')}`;
  };

  const getManagerName = () => {
    const authUserStr = localStorage.getItem('authUser');
    const authUser = authUserStr ? JSON.parse(authUserStr) : null;
    return authUser?.fullName || authUser?.name || authUser?.username || 'Admin';
  };

  const handleAddDistributor = (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const existingDistributors: DistributorProfile[] = JSON.parse(localStorage.getItem('crm_distributors') || '[]');
      
      // ✅ Auto-Trim inputs
      const trimmedName = formData.name.trim();
      const trimmedPhone = formData.phone.trim();
      const trimmedEmail = formData.email.trim();
      const trimmedRegion = formData.region.trim();
      
      // ✅ Duplicate Name Check
      const nameExists = existingDistributors.some(
        (doc) => doc.name.toLowerCase() === trimmedName.toLowerCase()
      );
      if (nameExists) {
        alert(`A distributor named "${trimmedName}" already exists in the CRM.`);
        return;
      }

      // ✅ Duplicate Email Check
      if (trimmedEmail) {
        const emailExists = existingDistributors.some(
          (doc) => doc.email?.toLowerCase() === trimmedEmail.toLowerCase()
        );
        if (emailExists) {
          alert(`The email ${trimmedEmail} is already registered to another partner.`);
          return;
        }
      }

      // ✅ Strict Phone Validation (Exactly 10 digits)
      if (trimmedPhone) {
        const digitCount = trimmedPhone.replace(/\D/g, '').length;
        if (digitCount !== 10) {
          alert("Please enter exactly 10 digits for the phone number.");
          return;
        }
      }

      const newDistributor: DistributorProfile = {
        id: generateDistributorId(existingDistributors),
        name: trimmedName,
        region: trimmedRegion,
        tier: formData.tier,
        status: formData.status,
        ytdSales: '₹ 0', // Default for new partners
        phone: trimmedPhone,
        email: trimmedEmail,
        createdAt: new Date().toISOString()
      };

      const updatedDistributors = [newDistributor, ...existingDistributors];
      localStorage.setItem('crm_distributors', JSON.stringify(updatedDistributors));

      // ✅ Log to Master CRM Activities
      const managerName = getManagerName();
      const existingActivities: CRMActivity[] = JSON.parse(localStorage.getItem('crm_activities') || '[]');
      const newActivity: CRMActivity = {
        id: `ACT-${Date.now()}`,
        type: 'Partner Onboarded',
        description: `Onboarded new distributor: ${newDistributor.name} (${newDistributor.region})`,
        date: new Date().toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
        user: managerName
      };
      localStorage.setItem('crm_activities', JSON.stringify([newActivity, ...existingActivities]));

      // Reset & Reload
      setFormData({ name: '', region: '', tier: 'Tier 2', status: 'Active', phone: '', email: '' });
      setIsAddDrawerOpen(false);
      loadData();
    } catch (error) {
      console.error("Failed to add distributor", error);
      alert("Failed to add distributor profile.");
    }
  };

  // ✅ Export Logic
  const handleExport = () => {
    if (filteredData.length === 0) return alert("No data to export!");
    const headers = ['Partner ID', 'Distributor Name', 'Region', 'Partner Tier', 'YTD Sales', 'Status', 'Phone', 'Email'];
    const rows = filteredData.map(d => [
      d.id, `"${d.name}"`, `"${d.region}"`, d.tier, `"${d.ytdSales}"`, d.status, d.phone || '', d.email || ''
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Distributors_Export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const columns: Column<DistributorProfile>[] = [
    { key: 'name', label: 'Distributor Name', render: (row) => <span className="font-semibold text-slate-900">{row.name}</span> },
    { key: 'region', label: 'Assigned Region' },
    {
      key: 'tier',
      label: 'Partner Tier',
      render: (row) => {
        const variant = row.tier === 'Tier 1' ? 'purple' : row.tier === 'Tier 2' ? 'info' : 'neutral';
        return <Badge variant={variant}>{row.tier}</Badge>;
      },
    },
    { key: 'ytdSales', label: 'YTD Sales (Approx)' },
    {
      key: 'status',
      label: 'Status',
      render: (row) => {
        const variant = row.status === 'Active' ? 'success' : 'danger';
        return <Badge variant={variant}>{row.status}</Badge>;
      },
    },
    {
      key: 'action',
      label: '',
      render: () => <ActionButton variant="ghost" className="text-violet-600 text-xs px-2 py-1"><Store className="w-4 h-4 mr-1" /> Profile</ActionButton>
    }
  ];

  // ✅ Comprehensive Search
  const filteredData = distributors.filter((item) => {
    const term = search.toLowerCase();
    const matchSearch = 
      item.name.toLowerCase().includes(term) || 
      item.region.toLowerCase().includes(term) ||
      (item.phone && item.phone.toLowerCase().includes(term)) ||
      (item.email && item.email.toLowerCase().includes(term));
      
    const matchTier = tierFilter ? item.tier === tierFilter : true;
    return matchSearch && matchTier;
  });

  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader
        title="Distributor Onboarding CRM"
        subtitle="Manage B2B channel partner relationships, performance, and tiering."
        actions={
          <>
            <ActionButton onClick={handleExport} variant="secondary" icon={<Download className="w-4 h-4" />}>Export Partners</ActionButton>
            <ActionButton onClick={() => setIsAddDrawerOpen(true)} icon={<Plus className="w-4 h-4" />}>Add Distributor</ActionButton>
          </>
        }
      />

      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search names, regions, phone or email..." />
        <div className="w-px h-6 bg-slate-200 mx-2 hidden sm:block" />
        <SelectFilter
          value={tierFilter}
          onChange={setTierFilter}
          options={[
            { label: 'Tier 1', value: 'Tier 1' },
            { label: 'Tier 2', value: 'Tier 2' },
            { label: 'Tier 3', value: 'Tier 3' },
          ]}
          placeholder="All Tiers"
        />
      </FilterBar>

      <TableCard>
        <DataTable
          columns={columns}
          data={filteredData}
          emptyMessage="No distributor profiles available. Click 'Add Distributor' to onboard one."
        />
      </TableCard>

      {/* ✅ Add Distributor Drawer Form */}
      <Drawer
        open={isAddDrawerOpen}
        onClose={() => setIsAddDrawerOpen(false)}
        title="Onboard New Distributor"
      >
        <form onSubmit={handleAddDistributor} className="space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Distributor Name *</label>
              <div className="relative">
                <Building className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Metro Distributors"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-violet-600 focus:border-violet-600 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Assigned Region *</label>
              <div className="relative">
                <MapPin className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="e.g. North Zone, Mumbai South"
                  value={formData.region}
                  onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-violet-600 focus:border-violet-600 outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Partner Tier *</label>
                <select
                  required
                  value={formData.tier}
                  onChange={(e) => setFormData({ ...formData, tier: e.target.value as 'Tier 1' | 'Tier 2' | 'Tier 3' })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-violet-600 focus:border-violet-600 outline-none"
                >
                  <option value="Tier 1">Tier 1 (Premium)</option>
                  <option value="Tier 2">Tier 2 (Standard)</option>
                  <option value="Tier 3">Tier 3 (Basic)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Initial Status *</label>
                <select
                  required
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as 'Active' | 'Inactive' })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-violet-600 focus:border-violet-600 outline-none"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    placeholder="10-digit number"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-violet-600 focus:border-violet-600 outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    placeholder="Contact email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-violet-600 focus:border-violet-600 outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAddDrawerOpen(false)}
              className="flex-1 bg-white border border-slate-200 text-slate-700 font-semibold py-2.5 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 bg-violet-600 text-white font-semibold py-2.5 rounded-lg hover:bg-violet-700 transition-colors"
            >
              Save Profile
            </button>
          </div>
        </form>
      </Drawer>
    </div>
  );
}