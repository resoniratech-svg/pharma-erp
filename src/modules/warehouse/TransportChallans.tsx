import { useState } from 'react';
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

interface Challan {
  id: string;
  challanNo: string;
  transporter: string;
  vehicleNo: string;
  date: string;
  status: 'In Transit' | 'Delivered' | 'Pending';
}

const mockData: Challan[] = [
  { id: '1', challanNo: 'CHL-9921', transporter: 'VRL Logistics', vehicleNo: 'KA-01-AB-1234', date: '14-Oct-2026', status: 'In Transit' },
  { id: '2', challanNo: 'CHL-9922', transporter: 'Gati Express', vehicleNo: 'MH-12-CD-5678', date: '15-Oct-2026', status: 'Pending' },
  { id: '3', challanNo: 'CHL-9920', transporter: 'Delhivery', vehicleNo: 'DL-04-EF-9012', date: '12-Oct-2026', status: 'Delivered' },
];

export default function TransportChallans() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const columns: Column<Challan>[] = [
    { key: 'challanNo', label: 'Challan Number', render: (row) => <span className="font-semibold text-slate-900">{row.challanNo}</span> },
    { key: 'transporter', label: 'Transporter' },
    { key: 'vehicleNo', label: 'Vehicle Number', render: (row) => <span className="font-medium text-slate-800">{row.vehicleNo}</span> },
    { key: 'date', label: 'Date' },
    {
      key: 'status',
      label: 'Status',
      render: (row) => {
        const variant = row.status === 'Delivered' ? 'success' : row.status === 'In Transit' ? 'info' : 'warning';
        return <Badge variant={variant}>{row.status}</Badge>;
      },
    },
  ];

  const filteredData = mockData.filter((item) => {
    const matchSearch = item.challanNo.toLowerCase().includes(search.toLowerCase()) || item.transporter.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter ? item.status === statusFilter : true;
    return matchSearch && matchStatus;
  });

  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader
        title="Transport Challan Management"
        subtitle="Generate and track vehicle challans for outbound shipments."
        actions={
          <>
            <ActionButton variant="secondary" icon={<Download className="w-4 h-4" />}>Export</ActionButton>
            <ActionButton icon={<Plus className="w-4 h-4" />}>Generate Challan</ActionButton>
          </>
        }
      />

      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search challan or transporter..." />
        <div className="w-px h-6 bg-slate-200 mx-2 hidden sm:block" />
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-medium text-slate-600">Filters:</span>
        </div>
        <SelectFilter
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { label: 'Pending', value: 'Pending' },
            { label: 'In Transit', value: 'In Transit' },
            { label: 'Delivered', value: 'Delivered' },
          ]}
          placeholder="All Status"
        />
      </FilterBar>

      <TableCard>
        <DataTable
          columns={columns}
          data={filteredData}
          emptyMessage="No transport challans found."
        />
      </TableCard>
    </div>
  );
}
