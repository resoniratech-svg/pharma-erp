import { useState, useEffect } from 'react';
import { Plus, Download, Filter } from 'lucide-react';
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
import { distributorMasterService, type DistributorMasterRecord } from '../../services/distributorMasterService';

export default function DistributorList() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [distributors, setDistributors] = useState<DistributorMasterRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    distributorMasterService.load().then((data) => {
      setDistributors(data);
    }).catch((err) => {
      console.error('Failed to load distributors:', err);
    }).finally(() => setLoading(false));
  }, []);

  const columns: Column<DistributorMasterRecord>[] = [
    {
      key: 'code',
      label: 'Distributor Code',
      render: (row) => <span className="font-mono text-xs text-slate-500">{row.code}</span>,
    },
    { key: 'name', label: 'Distributor Name', render: (row) => <span className="font-semibold text-slate-900">{row.name}</span> },
    { key: 'contactPerson', label: 'Contact Person' },
    { key: 'mobileNumber', label: 'Mobile' },
    { key: 'state', label: 'State', render: (row) => <span className="text-slate-600">{row.state || '—'}</span> },
    {
      key: 'status',
      label: 'Status',
      render: (row) => {
        const variant = row.status === 'Active' ? 'success' : 'danger';
        return <Badge variant={variant}>{row.status}</Badge>;
      },
    },
  ];

  const filteredData = distributors.filter((item) => {
    const matchSearch =
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.code.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter ? item.status === statusFilter : true;
    return matchSearch && matchStatus;
  });

  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader
        title="Distributor Master List"
        subtitle="Manage your network of distributors, stockists, and wholesale partners."
        actions={
          <>
            <ActionButton variant="secondary" icon={<Download className="w-4 h-4" />}>Export</ActionButton>
            <ActionButton icon={<Plus className="w-4 h-4" />}>Add Distributor</ActionButton>
          </>
        }
      />

      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search distributor name or code..." />
        <div className="w-px h-6 bg-slate-200 mx-2 hidden sm:block" />
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-medium text-slate-600">Filters:</span>
        </div>
        <SelectFilter
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { label: 'Active', value: 'Active' },
            { label: 'Inactive', value: 'Inactive' },
          ]}
          placeholder="All Status"
        />
      </FilterBar>

      <TableCard>
        {loading ? (
          <div className="text-center py-12 text-slate-400">Loading distributors...</div>
        ) : (
          <DataTable
            columns={columns}
            data={filteredData}
            emptyMessage="No distributors found. Add a distributor to get started."
          />
        )}
      </TableCard>
    </div>
  );
}
