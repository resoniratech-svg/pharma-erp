import { useState } from 'react';
import { Download, Filter, Target, TrendingUp, IndianRupee, Trophy, BarChart3, PieChart, Activity } from 'lucide-react';
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

interface LeadConversion {
  id: string;
  leadId: string;
  leadName: string;
  conversionDate: string;
  assignedEmployee: string;
  territory: string;
  revenueValue: string;
  conversionStatus: 'Converted' | 'Pending' | 'Lost';
}

const mockData: LeadConversion[] = [
  { id: '1', leadId: 'LD-1001', leadName: 'City Hospital', conversionDate: '24-Oct-2024', assignedEmployee: 'Rahul Sharma', territory: 'South Mumbai', revenueValue: '₹ 1,50,000', conversionStatus: 'Converted' },
  { id: '2', leadId: 'LD-1002', leadName: 'Dr. A.K. Singh', conversionDate: '-', assignedEmployee: 'Unassigned', territory: 'Andheri West', revenueValue: '-', conversionStatus: 'Pending' },
  { id: '3', leadId: 'LD-1003', leadName: 'Apollo Pharmacy', conversionDate: '22-Oct-2024', assignedEmployee: 'Amit Kumar', territory: 'South Mumbai', revenueValue: '₹ 45,000', conversionStatus: 'Converted' },
  { id: '4', leadId: 'LD-1004', leadName: 'Wellness Medicals', conversionDate: '-', assignedEmployee: 'Sanjay Patel', territory: 'Thane', revenueValue: '₹ 0', conversionStatus: 'Lost' },
];

export default function LeadConversionTracking() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const columns: Column<LeadConversion>[] = [
    { key: 'leadId', label: 'Lead ID', render: (row) => <span className="font-semibold text-slate-900">{row.leadId}</span> },
    { key: 'leadName', label: 'Lead Name', render: (row) => <span className="font-medium text-slate-800">{row.leadName}</span> },
    { key: 'conversionDate', label: 'Conversion Date' },
    { key: 'assignedEmployee', label: 'Assigned Employee' },
    { key: 'territory', label: 'Territory' },
    { key: 'revenueValue', label: 'Revenue Value', render: (row) => <span className="font-bold text-emerald-600">{row.revenueValue}</span> },
    {
      key: 'conversionStatus',
      label: 'Conversion Status',
      render: (row) => {
        let variant: any = 'default';
        if (row.conversionStatus === 'Converted') variant = 'success';
        else if (row.conversionStatus === 'Pending') variant = 'warning';
        else if (row.conversionStatus === 'Lost') variant = 'danger';
        return <Badge variant={variant}>{row.conversionStatus}</Badge>;
      },
    },
  ];

  const filteredData = mockData.filter((item) => {
    const matchSearch = item.leadName.toLowerCase().includes(search.toLowerCase()) || 
                        item.assignedEmployee.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter ? item.conversionStatus === statusFilter : true;
    return matchSearch && matchStatus;
  });

  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader
        title="Lead Conversion Tracking"
        subtitle="Track lead-to-customer conversion metrics and sales effectiveness."
        actions={
          <ActionButton variant="secondary" icon={<Download className="w-4 h-4" />}>Export Analytics</ActionButton>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <SummaryCard
          title="Total Leads"
          value="450"
          subtitle="Cumulative total"
          icon={<Target className="w-6 h-6" />}
          colorClass="text-violet-600"
          bgClass="bg-violet-50"
        />
        <SummaryCard
          title="Converted Leads"
          value="112"
          subtitle="Successfully closed"
          icon={<Trophy className="w-6 h-6" />}
          colorClass="text-emerald-600"
          bgClass="bg-emerald-50"
        />
        <SummaryCard
          title="Conversion Rate"
          value="24.8%"
          subtitle="+2.4% from last month"
          icon={<TrendingUp className="w-6 h-6" />}
          colorClass="text-blue-600"
          bgClass="bg-blue-50"
        />
        <SummaryCard
          title="Revenue Generated"
          value="₹ 12.5 L"
          subtitle="From converted leads"
          icon={<IndianRupee className="w-6 h-6" />}
          colorClass="text-indigo-600"
          bgClass="bg-indigo-50"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center justify-center min-h-[160px]">
          <BarChart3 className="w-8 h-8 text-primary mb-3 opacity-80" />
          <h3 className="text-sm font-semibold text-slate-800 mb-1">Monthly Conversion Trend</h3>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center justify-center min-h-[160px]">
          <PieChart className="w-8 h-8 text-emerald-500 mb-3 opacity-80" />
          <h3 className="text-sm font-semibold text-slate-800 mb-1">Lead Source Conversion %</h3>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center justify-center min-h-[160px]">
          <Activity className="w-8 h-8 text-indigo-500 mb-3 opacity-80" />
          <h3 className="text-sm font-semibold text-slate-800 mb-1">Territory Conversion %</h3>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center justify-center min-h-[160px]">
          <Trophy className="w-8 h-8 text-amber-500 mb-3 opacity-80" />
          <h3 className="text-sm font-semibold text-slate-800 mb-1">Employee Conversion Perf.</h3>
        </div>
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
            { label: 'Converted', value: 'Converted' },
            { label: 'Pending', value: 'Pending' },
            { label: 'Lost', value: 'Lost' },
          ]}
          placeholder="Status"
        />
      </FilterBar>

      <TableCard>
        <DataTable
          columns={columns}
          data={filteredData}
          emptyMessage="No conversion records found."
        />
      </TableCard>
    </div>
  );
}
