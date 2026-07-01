// import { useState } from 'react';
// import { Plus, Download, Filter, User } from 'lucide-react';
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

// interface Lead {
//   id: string;
//   name: string;
//   type: string;
//   source: string;
//   contact: string;
//   status: 'New' | 'Contacted' | 'Qualified' | 'Lost';
// }

// const mockData: Lead[] = [
//   { id: '1', name: 'Dr. Ramesh Sharma', type: 'Doctor', source: 'Medical Camp', contact: '+91 9876543210', status: 'New' },
//   { id: '2', name: 'Metro Distributors', type: 'Distributor', source: 'Referral', contact: 'metro@example.com', status: 'Qualified' },
//   { id: '3', name: 'Wellness Pharmacy', type: 'Retailer', source: 'Website', contact: '+91 9988776655', status: 'Contacted' },
// ];

// export default function Leads() {
//   const [search, setSearch] = useState('');
//   const [statusFilter, setStatusFilter] = useState('');

//   const columns: Column<Lead>[] = [
//     { key: 'name', label: 'Lead Name', render: (row) => <span className="font-semibold text-slate-900">{row.name}</span> },
//     { key: 'type', label: 'Type' },
//     { key: 'contact', label: 'Contact Info' },
//     { key: 'source', label: 'Source' },
//     {
//       key: 'status',
//       label: 'Status',
//       render: (row) => {
//         const variant = row.status === 'Qualified' ? 'success' : row.status === 'New' ? 'info' : row.status === 'Contacted' ? 'warning' : 'neutral';
//         return <Badge variant={variant}>{row.status}</Badge>;
//       },
//     },
//     {
//       key: 'action',
//       label: '',
//       render: () => <ActionButton variant="ghost" className="text-violet-600 text-xs px-2 py-1"><User className="w-4 h-4" /></ActionButton>
//     }
//   ];

//   const filteredData = mockData.filter((item) => {
//     const matchSearch = item.name.toLowerCase().includes(search.toLowerCase());
//     const matchStatus = statusFilter ? item.status === statusFilter : true;
//     return matchSearch && matchStatus;
//   });

//   return (
//     <div className="animate-in fade-in duration-500">
//       <PageHeader
//         title="Lead Creation"
//         subtitle="Track and manage potential doctors, distributors, and retail partners."
//         actions={
//           <>
//             <ActionButton variant="secondary" icon={<Download className="w-4 h-4" />}>Export Leads</ActionButton>
//             <ActionButton icon={<Plus className="w-4 h-4" />}>Add Lead</ActionButton>
//           </>
//         }
//       />

//       <FilterBar>
//         <SearchInput value={search} onChange={setSearch} placeholder="Search leads..." />
//         <div className="w-px h-6 bg-slate-200 mx-2 hidden sm:block" />
//         <div className="flex items-center gap-2">
//           <Filter className="w-4 h-4 text-slate-400" />
//           <span className="text-sm font-medium text-slate-600">Filters:</span>
//         </div>
//         <SelectFilter
//           value={statusFilter}
//           onChange={setStatusFilter}
//           options={[
//             { label: 'New', value: 'New' },
//             { label: 'Contacted', value: 'Contacted' },
//             { label: 'Qualified', value: 'Qualified' },
//             { label: 'Lost', value: 'Lost' },
//           ]}
//           placeholder="All Status"
//         />
//       </FilterBar>

//       <TableCard>
//         <DataTable
//           columns={columns}
//           data={filteredData}
//           emptyMessage="No leads found."
//         />
//       </TableCard>
//     </div>
//   );
// }


// // /////////////////////////////////////////////////////////////////////////////////


import { useState, useEffect } from 'react';
import { Plus, Download, Filter, User, Users, Target, PhoneCall, CheckCircle2 } from 'lucide-react';
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
} from './components/shared';
import { type Column } from './components/shared';

const generateLeadId = (currentLeads: Lead[]) => {
  if (currentLeads.length === 0) return 'LD-0001';
  
  let maxId = 0;
  currentLeads.forEach(lead => {
    const numPart = parseInt(lead.id.split('-')[1] || '0', 10);
    if (numPart > maxId) maxId = numPart;
  });
  
  const nextNum = maxId + 1;
  return `LD-${nextNum.toString().padStart(4, '0')}`;
};

interface Lead {
  id: string;
  name: string;
  type: string;
  source: string;
  contact: string;
  territory?: string;
  createdBy?: string;
  createdAt?: string;
  status: 'New' | 'Assigned' | 'Contacted' | 'Qualified' | 'Lost';
}

export default function Leads() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [leads, setLeads] = useState<Lead[]>([]);
  
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  
  const [formData, setFormData] = useState<Partial<Lead>>({
    name: '',
    type: 'Doctor',
    source: 'Direct',
    contact: '',
    territory: '',
    status: 'New',
  });

  useEffect(() => {
    try {
      const stored = localStorage.getItem('crm_leads');
      if (stored) {
        setLeads(JSON.parse(stored));
      } else {
        setLeads([]);
      }
    } catch (error) {
      console.error("Failed to load leads:", error);
      setLeads([]);
    }
  }, []);

  const handleSaveLead = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.contact || !formData.territory) {
      alert("Name, Contact, and Territory are required!");
      return;
    }
    
    // ✅ ChatGPT Polish 2: Duplicate Check with Trim & Lowercase
    const checkContact = formData.contact.trim().toLowerCase();
    const isDuplicate = leads.some(l => l.contact.trim().toLowerCase() === checkContact);
    
    if (isDuplicate) {
      alert("A lead with this contact already exists!");
      return;
    }

    const todayStr = new Date().toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    const authUserStr = localStorage.getItem('authUser');
    const authUser = authUserStr ? JSON.parse(authUserStr) : null;
    const creatorName = authUser ? authUser.fullName : 'Admin';

    const newLead: Lead = {
      id: generateLeadId(leads),
      // ✅ ChatGPT Polish 1: Trim all inputs before saving
      name: formData.name.trim(),
      type: formData.type || 'Doctor',
      source: formData.source || 'Direct',
      contact: formData.contact.trim(),
      territory: formData.territory.trim(),
      createdBy: creatorName,
      createdAt: todayStr,
      status: formData.status as Lead['status'] || 'New',
    };

    const updatedLeads = [newLead, ...leads];
    setLeads(updatedLeads);
    localStorage.setItem('crm_leads', JSON.stringify(updatedLeads));
    
    setFormData({ name: '', type: 'Doctor', source: 'Direct', contact: '', territory: '', status: 'New' });
    setIsDrawerOpen(false);
  };

  const handleExportLeads = () => {
    if (leads.length === 0) {
      alert("No leads available to export!");
      return;
    }

    const headers = ['Lead ID', 'Lead Name', 'Type', 'Contact Info', 'Territory', 'Source', 'Status', 'Created Date', 'Created By'];
    
    const csvRows = leads.map(lead => [
      lead.id,
      `"${lead.name}"`, 
      lead.type,
      `"${lead.contact}"`,
      `"${lead.territory || 'Unassigned'}"`,
      lead.source,
      lead.status,
      `"${lead.createdAt || 'N/A'}"`,
      `"${lead.createdBy || 'Unknown'}"`
    ]);

    const csvContent = [
      headers.join(','),
      ...csvRows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `CRM_Leads_Export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link); 
    
    // ✅ ChatGPT Polish 3: Free up browser memory after download
    URL.revokeObjectURL(url);
  };

  const columns: Column<Lead>[] = [
    { key: 'id', label: 'Lead ID', render: (row) => <span className="text-xs font-mono text-slate-500">{row.id}</span> },
    { key: 'name', label: 'Lead Name', render: (row) => (
        <div>
           <span className="font-semibold text-slate-900 block">{row.name}</span>
           <span className="text-[10px] text-slate-400">
             Created: {row.createdAt ? row.createdAt.split(',')[0] : 'N/A'}
           </span>
        </div>
      ) 
    },
    { key: 'type', label: 'Type' },
    { key: 'contact', label: 'Contact Info' },
    { key: 'territory', label: 'Territory', render: (row) => <span>{row.territory || 'Unassigned'}</span> }, 
    {
      key: 'status',
      label: 'Status',
      render: (row) => {
        let variant: 'neutral' | 'info' | 'warning' | 'success' | 'danger' | 'purple' = 'neutral';
        if (row.status === 'New') variant = 'info';
        else if (row.status === 'Assigned') variant = 'purple';
        else if (row.status === 'Contacted') variant = 'warning';
        else if (row.status === 'Qualified') variant = 'success';
        else if (row.status === 'Lost') variant = 'danger';
        
        return <Badge variant={variant}>{row.status}</Badge>;
      },
    },
    {
      key: 'action',
      label: '',
      render: () => <ActionButton variant="ghost" className="text-violet-600 text-xs px-2 py-1"><User className="w-4 h-4" /></ActionButton>
    }
  ];

  const filteredData = leads.filter((item) => {
    const safeTerritory = item.territory || ''; 
    const matchSearch = item.name.toLowerCase().includes(search.toLowerCase()) || 
                        item.contact.toLowerCase().includes(search.toLowerCase()) ||
                        item.type.toLowerCase().includes(search.toLowerCase()) ||
                        item.id.toLowerCase().includes(search.toLowerCase()) ||
                        safeTerritory.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter ? item.status === statusFilter : true;
    return matchSearch && matchStatus;
  });

  const totalLeads = leads.length;
  const newLeads = leads.filter(l => l.status === 'New').length;
  const qualifiedLeads = leads.filter(l => l.status === 'Qualified').length;
  const contactedLeads = leads.filter(l => l.status === 'Contacted').length;

  return (
    <div className="animate-in fade-in duration-500 min-h-[calc(100vh-140px)] flex flex-col">
      <PageHeader
        title="Lead Creation & Tracking"
        subtitle="Track and manage potential doctors, distributors, and retail partners in your CRM pipeline."
        actions={
          <>
            <ActionButton onClick={handleExportLeads} variant="secondary" icon={<Download className="w-4 h-4" />}>Export Leads</ActionButton>
            <ActionButton icon={<Plus className="w-4 h-4" />} onClick={() => setIsDrawerOpen(true)}>Add Lead</ActionButton>
          </>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <SummaryCard title="Total Leads" value={totalLeads.toString()} subtitle="All recorded leads" icon={<Users className="w-6 h-6" />} colorClass="text-violet-600" bgClass="bg-violet-50" />
        <SummaryCard title="New Leads" value={newLeads.toString()} subtitle="Awaiting first contact" icon={<Target className="w-6 h-6" />} colorClass="text-sky-600" bgClass="bg-sky-50" />
        <SummaryCard title="Contacted" value={contactedLeads.toString()} subtitle="Currently in pipeline" icon={<PhoneCall className="w-6 h-6" />} colorClass="text-amber-600" bgClass="bg-amber-50" />
        <SummaryCard title="Qualified" value={qualifiedLeads.toString()} subtitle="Ready for conversion" icon={<CheckCircle2 className="w-6 h-6" />} colorClass="text-emerald-600" bgClass="bg-emerald-50" />
      </div>

      <div className="flex-1 flex flex-col">
        <FilterBar>
          <SearchInput value={search} onChange={setSearch} placeholder="Search by name, ID, territory..." />
          <div className="w-px h-6 bg-slate-200 mx-2 hidden sm:block" />
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="text-sm font-medium text-slate-600">Filters:</span>
          </div>
          <SelectFilter
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { label: 'New', value: 'New' },
              { label: 'Assigned', value: 'Assigned' },
              { label: 'Contacted', value: 'Contacted' },
              { label: 'Qualified', value: 'Qualified' },
              { label: 'Lost', value: 'Lost' },
            ]}
            placeholder="All Status"
          />
        </FilterBar>

        <TableCard>
          <DataTable columns={columns} data={filteredData} emptyMessage="No leads found. Click 'Add Lead' to create a new record." />
        </TableCard>
      </div>

      <Drawer open={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} title="Add New Lead">
        <form onSubmit={handleSaveLead} className="flex flex-col h-full">
          <div className="space-y-4 flex-1">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Lead Name *</label>
              <input 
                type="text" 
                required 
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="e.g. Dr. Ramesh Sharma"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Contact Info (Phone/Email) *</label>
              <input 
                type="text" 
                required 
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                value={formData.contact}
                onChange={(e) => setFormData({...formData, contact: e.target.value})}
                placeholder="+91 9876543210"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Territory / Area *</label>
              <input 
                type="text" 
                required 
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                value={formData.territory}
                onChange={(e) => setFormData({...formData, territory: e.target.value})}
                placeholder="e.g. Hyderabad South"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
              <select 
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                value={formData.type}
                onChange={(e) => setFormData({...formData, type: e.target.value})}
              >
                <option value="Doctor">Doctor</option>
                <option value="Distributor">Distributor</option>
                <option value="Retailer">Retailer / Pharmacy</option>
                <option value="Hospital">Hospital</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Source</label>
              <select 
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                value={formData.source}
                onChange={(e) => setFormData({...formData, source: e.target.value})}
              >
                <option value="Direct">Direct Contact</option>
                <option value="Referral">Referral</option>
                <option value="Medical Camp">Medical Camp</option>
                <option value="Website">Website</option>
              </select>
            </div>
          </div>
          
          <div className="pt-4 border-t border-slate-100 mt-6">
            <button type="submit" className="w-full bg-violet-600 text-white font-semibold py-2.5 rounded-lg hover:bg-violet-700 transition-colors">
              Save Lead
            </button>
          </div>
        </form>
      </Drawer>
    </div>
  );
}