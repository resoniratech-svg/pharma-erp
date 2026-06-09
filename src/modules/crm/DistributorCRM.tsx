import { useState } from 'react';
import { Plus, Store, Download } from 'lucide-react';
import {
  PageHeader,
  FilterBar,
  SearchInput,
  SelectFilter,
  ActionButton,
  TableCard,
  DataTable,
  Badge,
} from './components/shared';
import { type Column } from './components/shared';

interface DistributorProfile {
  id: string;
  name: string;
  region: string;
  tier: 'Tier 1' | 'Tier 2' | 'Tier 3';
  ytdSales: string;
  status: 'Active' | 'Inactive';
}

const mockData: DistributorProfile[] = [
  { id: '1', name: 'Metro Distributors', region: 'North', tier: 'Tier 1', ytdSales: '₹ 2.5 Cr', status: 'Active' },
  { id: '2', name: 'Global Health Agencies', region: 'South', tier: 'Tier 2', ytdSales: '₹ 85 L', status: 'Active' },
  { id: '3', name: 'Carewell Pharma', region: 'East', tier: 'Tier 3', ytdSales: '₹ 15 L', status: 'Inactive' },
];

export default function DistributorCRM() {
  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState('');

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

  const filteredData = mockData.filter((item) => {
    const matchSearch = item.name.toLowerCase().includes(search.toLowerCase());
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
            <ActionButton variant="secondary" icon={<Download className="w-4 h-4" />}>Export Partners</ActionButton>
            <ActionButton icon={<Plus className="w-4 h-4" />}>Add Distributor</ActionButton>
          </>
        }
      />

      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search distributors..." />
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
          emptyMessage="No distributor profiles found."
        />
      </TableCard>
    </div>
  );
}
