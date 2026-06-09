import { useState } from 'react';
import { Plus, MapPin } from 'lucide-react';
import {
  PageHeader,
  FilterBar,
  SearchInput,
  ActionButton,
  TableCard,
  DataTable,
  Badge,
} from './components/shared';
import { type Column } from './components/shared';

interface Branch {
  id: string;
  code: string;
  name: string;
  city: string;
  manager: string;
  status: 'Active' | 'Inactive';
}

const mockData: Branch[] = [
  { id: '1', code: 'HQ-MUM', name: 'Head Office', city: 'Mumbai', manager: 'Rajesh Kumar', status: 'Active' },
  { id: '2', code: 'BR-PUN', name: 'Pune Warehouse', city: 'Pune', manager: 'Amit Shah', status: 'Active' },
  { id: '3', code: 'BR-DEL', name: 'Delhi NCR Depot', city: 'Delhi', manager: 'Vikram Singh', status: 'Inactive' },
];

export default function BranchSettings() {
  const [search, setSearch] = useState('');

  const columns: Column<Branch>[] = [
    { key: 'code', label: 'Branch Code', render: (row) => <span className="font-mono text-sm text-slate-500">{row.code}</span> },
    { key: 'name', label: 'Branch Name', render: (row) => <span className="font-semibold text-slate-900">{row.name}</span> },
    { key: 'city', label: 'City' },
    { key: 'manager', label: 'Manager' },
    {
      key: 'status',
      label: 'Status',
      render: (row) => {
        const variant = row.status === 'Active' ? 'success' : 'neutral';
        return <Badge variant={variant}>{row.status}</Badge>;
      },
    },
    {
      key: 'action',
      label: '',
      render: () => <ActionButton variant="ghost" className="text-violet-600 text-xs px-2 py-1"><MapPin className="w-4 h-4 mr-1" /> Edit Address</ActionButton>
    }
  ];

  const filteredData = mockData.filter((item) => {
    return item.name.toLowerCase().includes(search.toLowerCase()) || item.city.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader
        title="Branch Management"
        subtitle="Configure multi-location branches and warehouses."
        actions={
          <ActionButton variant="primary" icon={<Plus className="w-4 h-4" />}>Add Branch</ActionButton>
        }
      />

      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search branch or city..." />
      </FilterBar>

      <TableCard>
        <DataTable
          columns={columns}
          data={filteredData}
          emptyMessage="No branches found."
        />
      </TableCard>
    </div>
  );
}
