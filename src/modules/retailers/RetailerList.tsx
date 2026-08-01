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
import { retailerMasterService, type RetailerMasterRecord } from '../../services/retailerMasterService';

export default function RetailerList() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [retailers, setRetailers] = useState<RetailerMasterRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    retailerMasterService.fetchFromApi().then((data) => {
      setRetailers(data);
    }).catch((err) => {
      console.error('Failed to load retailers:', err);
    }).finally(() => setLoading(false));
  }, []);

  const columns: Column<RetailerMasterRecord>[] = [
    {
      key: 'code',
      label: 'Retailer Code',
      render: (row) => <span className="font-mono text-xs text-slate-500">{row.code}</span>,
    },
    { key: 'name', label: 'Retailer Name', render: (row) => <span className="font-semibold text-slate-900">{row.name}</span> },
    { key: 'contactPerson', label: 'Contact Person' },
    { key: 'mobileNumber', label: 'Mobile' },
    {
      key: 'assignedDistributors',
      label: 'Distributor',
      render: (row) => (
        <span className="text-sm text-slate-600">
          {row.assignedDistributors?.length > 0
            ? row.assignedDistributors.map((d) => d.name).join(', ')
            : '—'}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => {
        const variant = row.status === 'Active' ? 'success' : 'danger';
        return <Badge variant={variant}>{row.status}</Badge>;
      },
    },
  ];

  const filteredData = retailers.filter((item) => {
    const matchSearch =
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.code.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter ? item.status === statusFilter : true;
    return matchSearch && matchStatus;
  });

  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader
        title="Retailer Master List"
        subtitle="Manage your network of retail pharmacies and medical stores."
        actions={
          <>
            <ActionButton variant="secondary" icon={<Download className="w-4 h-4" />}>Export</ActionButton>
            <ActionButton icon={<Plus className="w-4 h-4" />}>Add Retailer</ActionButton>
          </>
        }
      />

      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search retailer name or code..." />
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
          <div className="text-center py-12 text-slate-400">Loading retailers...</div>
        ) : (
          <DataTable
            columns={columns}
            data={filteredData}
            emptyMessage="No retailers found. Add a retailer to get started."
          />
        )}
      </TableCard>
    </div>
  );
}


