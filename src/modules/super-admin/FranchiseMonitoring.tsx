import { useState } from 'react';
import { Store, TrendingUp, Users } from 'lucide-react';
import {
  PageHeader,
  FilterBar,
  SearchInput,
  TableCard,
  DataTable,
  Badge,
  ExportButton,
  SummaryCard
} from './components/shared';
import { type Column } from './components/shared';

interface Franchise {
  id: string;
  name: string;
  location: string;
  revenue: string;
  growth: string;
  status: 'Active' | 'Warning' | 'Inactive';
}

const mockData: Franchise[] = [
  { id: '1', name: 'PharmaPlus (South)', location: 'Chennai', revenue: '₹ 12,50,000', growth: '+15%', status: 'Active' },
  { id: '2', name: 'HealthCare Hub', location: 'Hyderabad', revenue: '₹ 8,20,000', growth: '+5%', status: 'Active' },
  { id: '3', name: 'MedLife Franchise', location: 'Kolkata', revenue: '₹ 4,10,000', growth: '-2%', status: 'Warning' },
];

export default function FranchiseMonitoring() {
  const [search, setSearch] = useState('');

  const columns: Column<Franchise>[] = [
    { key: 'name', label: 'Franchise Name', render: (row) => <span className="font-semibold text-slate-900">{row.name}</span> },
    { key: 'location', label: 'Location' },
    { key: 'revenue', label: 'YTD Revenue', render: (row) => <span className="font-bold text-slate-700">{row.revenue}</span> },
    { key: 'growth', label: 'YoY Growth', render: (row) => <span className={row.growth.startsWith('+') ? 'text-emerald-600 font-medium' : 'text-rose-600 font-medium'}>{row.growth}</span> },
    {
      key: 'status',
      label: 'Status',
      render: (row) => {
        const variant = row.status === 'Active' ? 'success' : row.status === 'Warning' ? 'warning' : 'neutral';
        return <Badge variant={variant}>{row.status}</Badge>;
      },
    }
  ];

  const filteredData = mockData.filter((item) => item.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader
        title="Franchise Monitoring"
        subtitle="Evaluate franchise performance and partnership growth metrics."
        breadcrumb={[{ label: 'Super Admin' }, { label: 'Franchise Monitoring' }]}
        actions={<ExportButton />}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <SummaryCard title="Active Franchises" value="48" icon={<Store className="w-6 h-6" />} colorClass="text-violet-600" bgClass="bg-violet-100" />
        <SummaryCard title="Total Franchise Revenue" value="₹ 5.2 Cr" icon={<TrendingUp className="w-6 h-6" />} colorClass="text-emerald-600" bgClass="bg-emerald-100" />
        <SummaryCard title="New Franchises (YTD)" value="12" icon={<Users className="w-6 h-6" />} colorClass="text-blue-600" bgClass="bg-blue-100" />
      </div>

      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search franchise..." />
      </FilterBar>

      <TableCard>
        <DataTable columns={columns} data={filteredData} />
      </TableCard>
    </div>
  );
}
