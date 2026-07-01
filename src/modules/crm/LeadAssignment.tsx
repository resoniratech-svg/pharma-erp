// import { useState } from 'react';
// import { Download, Filter, Users, UserPlus, UserMinus, Percent, UserCircle } from 'lucide-react';
// import {
//   PageHeader,
//   FilterBar,
//   SearchInput,
//   SelectFilter,
//   ActionButton,
//   TableCard,
//   DataTable,
//   Badge,
//   SummaryCard,
// } from './components/shared';
// import { type Column } from './components/shared';

// interface LeadAssign {
//   id: string;
//   leadId: string;
//   leadName: string;
//   leadSource: string;
//   territory: string;
//   assignedTo: string;
//   assignedDate: string;
//   status: 'New' | 'Assigned' | 'Contacted' | 'Qualified';
//   priority: 'High' | 'Medium' | 'Low';
// }

// const mockData: LeadAssign[] = [
//   { id: '1', leadId: 'LD-1001', leadName: 'City Hospital', leadSource: 'Website', territory: 'South Mumbai', assignedTo: 'Rahul Sharma', assignedDate: '24-Oct-2024', status: 'Assigned', priority: 'High' },
//   { id: '2', leadId: 'LD-1002', leadName: 'Dr. A.K. Singh', leadSource: 'Referral', territory: 'Andheri West', assignedTo: 'Unassigned', assignedDate: '-', status: 'New', priority: 'Medium' },
//   { id: '3', leadId: 'LD-1003', leadName: 'Apollo Pharmacy', leadSource: 'Campaign', territory: 'South Mumbai', assignedTo: 'Amit Kumar', assignedDate: '22-Oct-2024', status: 'Contacted', priority: 'High' },
//   { id: '4', leadId: 'LD-1004', leadName: 'Wellness Medicals', leadSource: 'Direct', territory: 'Thane', assignedTo: 'Sanjay Patel', assignedDate: '20-Oct-2024', status: 'Qualified', priority: 'Low' },
// ];

// export default function LeadAssignment() {
//   const [search, setSearch] = useState('');
//   const [statusFilter, setStatusFilter] = useState('');

//   const columns: Column<LeadAssign>[] = [
//     { key: 'leadId', label: 'Lead ID', render: (row) => <span className="font-semibold text-slate-900">{row.leadId}</span> },
//     { key: 'leadName', label: 'Lead Name', render: (row) => <span className="font-medium text-slate-800">{row.leadName}</span> },
//     { key: 'leadSource', label: 'Lead Source' },
//     { key: 'territory', label: 'Territory' },
//     { 
//       key: 'assignedTo', 
//       label: 'Assigned To',
//       render: (row) => (
//         <span className={`font-medium ${row.assignedTo === 'Unassigned' ? 'text-slate-400 italic' : 'text-primary'}`}>
//           {row.assignedTo === 'Unassigned' ? 'Unassigned' : (
//             <span className="flex items-center gap-1">
//               <UserCircle className="w-4 h-4" />
//               {row.assignedTo}
//             </span>
//           )}
//         </span>
//       )
//     },
//     { key: 'assignedDate', label: 'Assigned Date' },
//     {
//       key: 'status',
//       label: 'Status',
//       render: (row) => {
//         let variant: any = 'default';
//         if (row.status === 'Assigned') variant = 'info';
//         else if (row.status === 'Contacted') variant = 'warning';
//         else if (row.status === 'Qualified') variant = 'success';
//         return <Badge variant={variant}>{row.status}</Badge>;
//       },
//     },
//     {
//       key: 'priority',
//       label: 'Priority',
//       render: (row) => (
//         <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
//           row.priority === 'High' ? 'bg-rose-100 text-rose-700' :
//           row.priority === 'Medium' ? 'bg-amber-100 text-amber-700' :
//           'bg-slate-100 text-slate-700'
//         }`}>
//           {row.priority}
//         </span>
//       )
//     },
//     {
//       key: 'id',
//       label: 'Actions',
//       render: (row) => (
//         <div className="flex gap-2">
//           {row.assignedTo === 'Unassigned' ? (
//             <button className="text-xs bg-indigo-50 text-indigo-600 hover:bg-indigo-100 px-2 py-1 rounded font-medium transition-colors">Assign</button>
//           ) : (
//             <button className="text-xs bg-slate-50 text-slate-600 hover:bg-slate-100 px-2 py-1 rounded font-medium transition-colors">Reassign</button>
//           )}
//           <button className="text-xs bg-slate-50 text-slate-600 hover:bg-slate-100 px-2 py-1 rounded font-medium transition-colors">View</button>
//         </div>
//       )
//     }
//   ];

//   const filteredData = mockData.filter((item) => {
//     const matchSearch = item.leadName.toLowerCase().includes(search.toLowerCase()) || 
//                         item.assignedTo.toLowerCase().includes(search.toLowerCase());
//     const matchStatus = statusFilter ? item.status === statusFilter : true;
//     return matchSearch && matchStatus;
//   });

//   return (
//     <div className="animate-in fade-in duration-500">
//       <PageHeader
//         title="Lead Assignment Management"
//         subtitle="Manage lead ownership, assignment workflow, territory allocation, and workload distribution."
//         actions={
//           <ActionButton variant="secondary" icon={<Download className="w-4 h-4" />}>Export Report</ActionButton>
//         }
//       />

//       {/* KPI Cards */}
//       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
//         <SummaryCard
//           title="Total Leads"
//           value="450"
//           subtitle="All active leads"
//           icon={<Users className="w-6 h-6" />}
//           colorClass="text-violet-600"
//           bgClass="bg-violet-50"
//         />
//         <SummaryCard
//           title="Assigned Leads"
//           value="412"
//           subtitle="Currently allocated"
//           icon={<UserPlus className="w-6 h-6" />}
//           colorClass="text-emerald-600"
//           bgClass="bg-emerald-50"
//         />
//         <SummaryCard
//           title="Unassigned Leads"
//           value="38"
//           subtitle="Needs attention"
//           icon={<UserMinus className="w-6 h-6" />}
//           colorClass="text-amber-600"
//           bgClass="bg-amber-50"
//         />
//         <SummaryCard
//           title="Assignment Success Rate"
//           value="92%"
//           subtitle="Within 24 hours"
//           icon={<Percent className="w-6 h-6" />}
//           colorClass="text-blue-600"
//           bgClass="bg-blue-50"
//         />
//       </div>

//       <FilterBar>
//         <SearchInput value={search} onChange={setSearch} placeholder="Search lead or employee..." />
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
//             { label: 'Assigned', value: 'Assigned' },
//             { label: 'Contacted', value: 'Contacted' },
//             { label: 'Qualified', value: 'Qualified' },
//           ]}
//           placeholder="Status"
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



/////////////////////////////////////////////////////////////////////////////


import { useState, useEffect } from 'react';
import { Download, Filter, Users, UserPlus, UserMinus, Percent, UserCircle } from 'lucide-react';
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

// ✅ ChatGPT Polish 1: Interface for History to remove 'any'
interface LeadAssignmentHistory {
  id: string;
  leadId: string;
  assignedTo: string;
  assignedBy: string;
  assignedDate: string;
  priority: 'High' | 'Medium' | 'Low';
}

const generateAssignmentId = (history: LeadAssignmentHistory[]) => {
  if (history.length === 0) return 'LA-0001';
  
  let maxId = 0;
  history.forEach(record => {
    const numPart = parseInt(record.id?.split('-')[1] || '0', 10);
    if (numPart > maxId) maxId = numPart;
  });
  
  const nextNum = maxId + 1;
  return `LA-${nextNum.toString().padStart(4, '0')}`;
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
  
  assignedTo?: string;
  assignedDate?: string;
  priority?: 'High' | 'Medium' | 'Low';
  assignedBy?: string; 
}

const MR_LIST = ['Priya Reddy', 'Rahul Verma', 'Amit Kumar', 'Sanjay Patel', 'Ramesh Sharma'];

export default function LeadAssignment() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [leads, setLeads] = useState<Lead[]>([]);
  
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [assignForm, setAssignForm] = useState({
    assignedTo: '',
    priority: 'Medium' as 'High' | 'Medium' | 'Low'
  });

  useEffect(() => {
    loadLeads();
  }, []);

  const loadLeads = () => {
    try {
      const stored = localStorage.getItem('crm_leads');
      if (stored) {
        setLeads(JSON.parse(stored));
      }
    } catch (error) {
      console.error("Failed to load leads:", error);
    }
  };

  const openAssignDrawer = (lead: Lead) => {
    setSelectedLead(lead);
    setAssignForm({
      assignedTo: lead.assignedTo || MR_LIST[0],
      priority: lead.priority || 'Medium'
    });
    setIsDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
    // ✅ ChatGPT Polish 4 & 5: Clear state when closing/cancelling
    setSelectedLead(null);
    setAssignForm({ assignedTo: '', priority: 'Medium' });
  };

  const handleAssignLead = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLead) return;

    if (selectedLead.assignedTo === assignForm.assignedTo && selectedLead.priority === assignForm.priority) {
      alert(`${selectedLead.name} is already assigned to ${assignForm.assignedTo} with ${assignForm.priority} priority!`);
      return;
    }

    const authUserStr = localStorage.getItem('authUser');
    const authUser = authUserStr ? JSON.parse(authUserStr) : null;
    const managerName = authUser?.fullName || authUser?.name || authUser?.username || 'Admin';

    const todayStr = new Date().toLocaleString('en-GB', { 
      day: '2-digit', month: 'short', year: 'numeric', 
      hour: '2-digit', minute: '2-digit' 
    });

    const updatedLeads = leads.map(lead => {
      if (lead.id === selectedLead.id) {
        return {
          ...lead,
          assignedTo: assignForm.assignedTo,
          priority: assignForm.priority,
          assignedDate: todayStr, 
          assignedBy: managerName,
          status: lead.status === 'New' ? 'Assigned' : lead.status
        };
      }
      return lead;
    });

    setLeads(updatedLeads);
    localStorage.setItem('crm_leads', JSON.stringify(updatedLeads));

    try {
      const existingHistory: LeadAssignmentHistory[] = JSON.parse(localStorage.getItem('crm_lead_assignments') || '[]');
      const historyRecord: LeadAssignmentHistory = {
        id: generateAssignmentId(existingHistory),
        leadId: selectedLead.id,
        assignedTo: assignForm.assignedTo,
        assignedBy: managerName,
        assignedDate: todayStr,
        priority: assignForm.priority
      };
      localStorage.setItem('crm_lead_assignments', JSON.stringify([historyRecord, ...existingHistory]));
    } catch (error) {
      console.error("Failed to save assignment history:", error);
    }

    handleCloseDrawer();
  };

  const handleExport = () => {
    if (leads.length === 0) {
      alert("No data to export!");
      return;
    }
    const headers = ['Lead ID', 'Lead Name', 'Territory', 'Assigned To', 'Assigned By', 'Priority', 'Assigned Date', 'Status'];
    const csvRows = leads.map(l => [
      l.id,
      `"${l.name}"`,
      `"${l.territory || 'Unassigned'}"`,
      `"${l.assignedTo || 'Unassigned'}"`,
      `"${l.assignedBy || 'Unknown'}"`,
      l.priority || 'Medium',
      `"${l.assignedDate || 'N/A'}"`,
      l.status
    ]);
    const csvContent = [headers.join(','), ...csvRows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Lead_Assignments_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const columns: Column<Lead>[] = [
    { key: 'id', label: 'Lead ID', render: (row) => <span className="font-mono text-xs text-slate-500">{row.id}</span> },
    { key: 'name', label: 'Lead Name', render: (row) => <span className="font-semibold text-slate-800">{row.name}</span> },
    { key: 'source', label: 'Lead Source' },
    { key: 'territory', label: 'Territory', render: (row) => <span>{row.territory || 'Unassigned'}</span> },
    { 
      key: 'assignedTo', 
      label: 'Assigned To',
      render: (row) => (
        <span className={`font-medium flex items-center gap-1 ${!row.assignedTo ? 'text-slate-400 italic' : 'text-violet-700'}`}>
          {!row.assignedTo ? 'Unassigned' : (
            <>
              <UserCircle className="w-4 h-4" />
              {row.assignedTo}
            </>
          )}
        </span>
      )
    },
    { key: 'assignedDate', label: 'Assigned Date', render: (row) => <span className="text-sm">{row.assignedDate ? row.assignedDate.split(',')[0] : '-'}</span> },
    {
      key: 'status',
      label: 'Status',
      render: (row) => {
        // ✅ ChatGPT Polish 2: Strict TypeScript Union type instead of 'any'
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
      key: 'priority',
      label: 'Priority',
      render: (row) => {
        const p = row.priority || 'Medium';
        return (
          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
            p === 'High' ? 'bg-rose-100 text-rose-700' :
            p === 'Medium' ? 'bg-amber-100 text-amber-700' :
            'bg-slate-100 text-slate-700'
          }`}>
            {p}
          </span>
        );
      }
    },
    {
      key: 'action',
      label: 'Actions',
      render: (row) => (
        <div className="flex gap-2">
          {!row.assignedTo ? (
            <button 
              onClick={() => openAssignDrawer(row)}
              className="text-xs bg-indigo-50 text-indigo-600 hover:bg-indigo-100 px-2 py-1 rounded font-medium transition-colors"
            >
              Assign
            </button>
          ) : (
            <button 
              onClick={() => openAssignDrawer(row)}
              className="text-xs bg-slate-50 text-slate-600 hover:bg-slate-100 px-2 py-1 rounded font-medium transition-colors"
            >
              Reassign
            </button>
          )}
        </div>
      )
    }
  ];

  const filteredData = leads.filter((item) => {
    const safeAssigned = item.assignedTo || 'Unassigned';
    const s = search.toLowerCase();
    
    // ✅ ChatGPT Polish 3: Better Search functionality (ID, Territory, Source)
    const matchSearch = item.name.toLowerCase().includes(s) || 
                        safeAssigned.toLowerCase().includes(s) ||
                        item.id.toLowerCase().includes(s) ||
                        (item.territory || '').toLowerCase().includes(s) ||
                        item.source.toLowerCase().includes(s);
                        
    const matchStatus = statusFilter ? item.status === statusFilter : true;
    return matchSearch && matchStatus;
  });

  const totalLeads = leads.length;
  const unassignedLeads = leads.filter(l => !l.assignedTo).length;
  const assignedLeads = totalLeads - unassignedLeads;
  const successRate = totalLeads > 0 ? Math.round((assignedLeads / totalLeads) * 100) : 0;

  return (
    <div className="animate-in fade-in duration-500 min-h-[calc(100vh-140px)] flex flex-col">
      <PageHeader
        title="Lead Assignment Management"
        subtitle="Manage lead ownership, assignment workflow, territory allocation, and workload distribution."
        actions={
          <ActionButton onClick={handleExport} variant="secondary" icon={<Download className="w-4 h-4" />}>Export Report</ActionButton>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <SummaryCard title="Total Leads" value={totalLeads.toString()} subtitle="All active leads" icon={<Users className="w-6 h-6" />} colorClass="text-violet-600" bgClass="bg-violet-50" />
        <SummaryCard title="Assigned Leads" value={assignedLeads.toString()} subtitle="Currently allocated" icon={<UserPlus className="w-6 h-6" />} colorClass="text-emerald-600" bgClass="bg-emerald-50" />
        <SummaryCard title="Unassigned Leads" value={unassignedLeads.toString()} subtitle="Needs attention" icon={<UserMinus className="w-6 h-6" />} colorClass="text-amber-600" bgClass="bg-amber-50" />
        <SummaryCard title="Assignment Rate" value={`${successRate}%`} subtitle="Overall completion" icon={<Percent className="w-6 h-6" />} colorClass="text-blue-600" bgClass="bg-blue-50" />
      </div>

      <div className="flex-1 flex flex-col">
        <FilterBar>
          <SearchInput value={search} onChange={setSearch} placeholder="Search by name, ID, employee, territory..." />
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
            ]}
            placeholder="Status"
          />
        </FilterBar>

        <TableCard>
          <DataTable columns={columns} data={filteredData} emptyMessage="No leads found." />
        </TableCard>
      </div>

      <Drawer open={isDrawerOpen} onClose={handleCloseDrawer} title="Assign Lead">
        {selectedLead && (
          <form onSubmit={handleAssignLead} className="flex flex-col h-full">
            <div className="space-y-6 flex-1">
              
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <p className="text-xs text-slate-500 font-medium mb-1">LEAD DETAILS</p>
                <p className="font-semibold text-slate-900">{selectedLead.name}</p>
                <p className="text-sm text-slate-600 mt-1">Territory: {selectedLead.territory || 'Unassigned'}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Assign To Medical Representative *</label>
                <select 
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                  value={assignForm.assignedTo}
                  onChange={(e) => setAssignForm({...assignForm, assignedTo: e.target.value})}
                  required
                >
                  <option value="" disabled>Select a Representative</option>
                  {MR_LIST.map(mr => (
                    <option key={mr} value={mr}>{mr}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Lead Priority</label>
                <div className="flex gap-3">
                  {['High', 'Medium', 'Low'].map((p) => (
                    <label key={p} className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="radio" 
                        name="priority" 
                        value={p}
                        checked={assignForm.priority === p}
                        onChange={(e) => setAssignForm({...assignForm, priority: e.target.value as any})}
                        className="text-violet-600 focus:ring-violet-500"
                      />
                      <span className="text-sm text-slate-700 font-medium">{p}</span>
                    </label>
                  ))}
                </div>
              </div>
              
            </div>
            
            <div className="pt-4 border-t border-slate-100 mt-6 flex gap-3">
              <button 
                type="button" 
                onClick={handleCloseDrawer}
                className="flex-1 bg-white border border-slate-200 text-slate-700 font-semibold py-2.5 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="flex-1 bg-violet-600 text-white font-semibold py-2.5 rounded-lg hover:bg-violet-700 transition-colors"
              >
                Confirm Assignment
              </button>
            </div>
          </form>
        )}
      </Drawer>

    </div>
  );
}