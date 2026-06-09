import { useState } from 'react';
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
} from './components/shared';
import { type Column } from './components/shared';

interface LeadAssign {
  id: string;
  leadId: string;
  leadName: string;
  leadSource: string;
  territory: string;
  assignedTo: string;
  assignedDate: string;
  status: 'New' | 'Assigned' | 'Contacted' | 'Qualified';
  priority: 'High' | 'Medium' | 'Low';
}

const mockData: LeadAssign[] = [
  { id: '1', leadId: 'LD-1001', leadName: 'City Hospital', leadSource: 'Website', territory: 'South Mumbai', assignedTo: 'Rahul Sharma', assignedDate: '24-Oct-2024', status: 'Assigned', priority: 'High' },
  { id: '2', leadId: 'LD-1002', leadName: 'Dr. A.K. Singh', leadSource: 'Referral', territory: 'Andheri West', assignedTo: 'Unassigned', assignedDate: '-', status: 'New', priority: 'Medium' },
  { id: '3', leadId: 'LD-1003', leadName: 'Apollo Pharmacy', leadSource: 'Campaign', territory: 'South Mumbai', assignedTo: 'Amit Kumar', assignedDate: '22-Oct-2024', status: 'Contacted', priority: 'High' },
  { id: '4', leadId: 'LD-1004', leadName: 'Wellness Medicals', leadSource: 'Direct', territory: 'Thane', assignedTo: 'Sanjay Patel', assignedDate: '20-Oct-2024', status: 'Qualified', priority: 'Low' },
];

export default function LeadAssignment() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const columns: Column<LeadAssign>[] = [
    { key: 'leadId', label: 'Lead ID', render: (row) => <span className="font-semibold text-slate-900">{row.leadId}</span> },
    { key: 'leadName', label: 'Lead Name', render: (row) => <span className="font-medium text-slate-800">{row.leadName}</span> },
    { key: 'leadSource', label: 'Lead Source' },
    { key: 'territory', label: 'Territory' },
    { 
      key: 'assignedTo', 
      label: 'Assigned To',
      render: (row) => (
        <span className={`font-medium ${row.assignedTo === 'Unassigned' ? 'text-slate-400 italic' : 'text-primary'}`}>
          {row.assignedTo === 'Unassigned' ? 'Unassigned' : (
            <span className="flex items-center gap-1">
              <UserCircle className="w-4 h-4" />
              {row.assignedTo}
            </span>
          )}
        </span>
      )
    },
    { key: 'assignedDate', label: 'Assigned Date' },
    {
      key: 'status',
      label: 'Status',
      render: (row) => {
        let variant: any = 'default';
        if (row.status === 'Assigned') variant = 'info';
        else if (row.status === 'Contacted') variant = 'warning';
        else if (row.status === 'Qualified') variant = 'success';
        return <Badge variant={variant}>{row.status}</Badge>;
      },
    },
    {
      key: 'priority',
      label: 'Priority',
      render: (row) => (
        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
          row.priority === 'High' ? 'bg-rose-100 text-rose-700' :
          row.priority === 'Medium' ? 'bg-amber-100 text-amber-700' :
          'bg-slate-100 text-slate-700'
        }`}>
          {row.priority}
        </span>
      )
    },
    {
      key: 'id',
      label: 'Actions',
      render: (row) => (
        <div className="flex gap-2">
          {row.assignedTo === 'Unassigned' ? (
            <button className="text-xs bg-indigo-50 text-indigo-600 hover:bg-indigo-100 px-2 py-1 rounded font-medium transition-colors">Assign</button>
          ) : (
            <button className="text-xs bg-slate-50 text-slate-600 hover:bg-slate-100 px-2 py-1 rounded font-medium transition-colors">Reassign</button>
          )}
          <button className="text-xs bg-slate-50 text-slate-600 hover:bg-slate-100 px-2 py-1 rounded font-medium transition-colors">View</button>
        </div>
      )
    }
  ];

  const filteredData = mockData.filter((item) => {
    const matchSearch = item.leadName.toLowerCase().includes(search.toLowerCase()) || 
                        item.assignedTo.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter ? item.status === statusFilter : true;
    return matchSearch && matchStatus;
  });

  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader
        title="Lead Assignment Management"
        subtitle="Manage lead ownership, assignment workflow, territory allocation, and workload distribution."
        actions={
          <ActionButton variant="secondary" icon={<Download className="w-4 h-4" />}>Export Report</ActionButton>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <SummaryCard
          title="Total Leads"
          value="450"
          subtitle="All active leads"
          icon={<Users className="w-6 h-6" />}
          colorClass="text-violet-600"
          bgClass="bg-violet-50"
        />
        <SummaryCard
          title="Assigned Leads"
          value="412"
          subtitle="Currently allocated"
          icon={<UserPlus className="w-6 h-6" />}
          colorClass="text-emerald-600"
          bgClass="bg-emerald-50"
        />
        <SummaryCard
          title="Unassigned Leads"
          value="38"
          subtitle="Needs attention"
          icon={<UserMinus className="w-6 h-6" />}
          colorClass="text-amber-600"
          bgClass="bg-amber-50"
        />
        <SummaryCard
          title="Assignment Success Rate"
          value="92%"
          subtitle="Within 24 hours"
          icon={<Percent className="w-6 h-6" />}
          colorClass="text-blue-600"
          bgClass="bg-blue-50"
        />
      </div>

      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search lead or employee..." />
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
        <DataTable
          columns={columns}
          data={filteredData}
          emptyMessage="No leads found."
        />
      </TableCard>
    </div>
  );
}
