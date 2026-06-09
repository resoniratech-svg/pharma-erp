import { useState } from 'react';
import { Map, TrendingUp, Users } from 'lucide-react';
import {
  PageHeader,
  FilterBar,
  SearchInput,
  SelectFilter,
  TableCard,
  DataTable,
  Badge,
  ExportButton,
  SummaryCard
} from './components/shared';
import { type Column } from './components/shared';

interface Territory {
  id: string;
  district: string;
  salesRep: string;
  revenue: string;
  targetAchieved: number;
  status: 'On Track' | 'At Risk' | 'Behind';
}

const mockData: Territory[] = [
  { id: '1', district: 'Mumbai Metro', salesRep: 'Rajesh K.', revenue: '₹ 15,20,000', targetAchieved: 110, status: 'On Track' },
  { id: '2', district: 'Pune District', salesRep: 'Amit S.', revenue: '₹ 8,15,000', targetAchieved: 95, status: 'On Track' },
  { id: '3', district: 'Nagpur', salesRep: 'Vikram P.', revenue: '₹ 4,40,000', targetAchieved: 75, status: 'At Risk' },
  { id: '4', district: 'Nashik', salesRep: 'Sanjay M.', revenue: '₹ 2,20,000', targetAchieved: 45, status: 'Behind' },
];

export default function StatePerformance() {
  const [search, setSearch] = useState('');
  const [stateFilter, setStateFilter] = useState('Maharashtra');

  const columns: Column<Territory>[] = [
    { key: 'district', label: 'District / Territory', render: (row) => <span className="font-semibold text-slate-900">{row.district}</span> },
    { key: 'salesRep', label: 'Lead MR / Manager' },
    { key: 'revenue', label: 'Revenue Generated', render: (row) => <span className="font-bold text-slate-700">{row.revenue}</span> },
    { key: 'targetAchieved', label: 'Target Achieved', render: (row) => <span className="font-medium text-slate-600">{row.targetAchieved}%</span> },
    {
      key: 'status',
      label: 'Status',
      render: (row) => {
        const variant = row.status === 'On Track' ? 'success' : row.status === 'At Risk' ? 'warning' : 'danger';
        return <Badge variant={variant}>{row.status}</Badge>;
      },
    }
  ];

  const filteredData = mockData.filter((item) => item.district.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader
        title="State Performance Reports"
        subtitle="Deep dive into territory-wise metrics and MR targets for a selected state."
        breadcrumb={[{ label: 'Super Admin' }, { label: 'State Performance' }]}
        actions={<ExportButton />}
      />

      <FilterBar>
        <SelectFilter
          value={stateFilter}
          onChange={setStateFilter}
          options={[
            { label: 'Maharashtra', value: 'Maharashtra' },
            { label: 'Gujarat', value: 'Gujarat' },
            { label: 'Karnataka', value: 'Karnataka' },
          ]}
          placeholder="Select State"
        />
        <div className="w-px h-6 bg-slate-200 mx-2 hidden sm:block" />
        <SearchInput value={search} onChange={setSearch} placeholder="Search district..." />
      </FilterBar>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <SummaryCard title="State Revenue (Maharashtra)" value="₹ 45.2 Cr" icon={<Map className="w-6 h-6" />} colorClass="text-violet-600" bgClass="bg-violet-100" />
        <SummaryCard title="Active Territories" value="36" icon={<Users className="w-6 h-6" />} colorClass="text-blue-600" bgClass="bg-blue-100" />
        <SummaryCard title="Overall Target Achievement" value="92%" icon={<TrendingUp className="w-6 h-6" />} colorClass="text-emerald-600" bgClass="bg-emerald-100" />
      </div>

      <TableCard>
        <DataTable columns={columns} data={filteredData} />
      </TableCard>
    </div>
  );
}
