import { useState } from 'react';
import { Download, Filter, Truck } from 'lucide-react';
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

interface EWayBill {
  id: string;
  invoiceNo: string;
  customerName: string;
  ewbNumber: string;
  validity: string;
  transporter: string;
  status: 'Active' | 'Pending' | 'Expired' | 'Cancelled';
}

const mockData: EWayBill[] = [
  { id: '1', invoiceNo: 'INV/26/001', customerName: 'Apollo Pharmacy', ewbNumber: '123456789012', validity: '17-Oct-2026', transporter: 'VRL Logistics', status: 'Active' },
  { id: '2', invoiceNo: 'INV/26/002', customerName: 'MedPlus Store', ewbNumber: '-', validity: '-', transporter: '-', status: 'Pending' },
  { id: '3', invoiceNo: 'INV/26/000', customerName: 'Wellness Medicos', ewbNumber: '987654321098', validity: '10-Oct-2026', transporter: 'Gati Express', status: 'Expired' },
];

export default function EWayBill() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const columns: Column<EWayBill>[] = [
    { key: 'invoiceNo', label: 'Invoice No', render: (row) => <span className="font-semibold text-slate-900">{row.invoiceNo}</span> },
    { key: 'customerName', label: 'Customer Name' },
    { key: 'ewbNumber', label: 'E-Way Bill No', render: (row) => <span className="font-medium text-slate-700">{row.ewbNumber}</span> },
    { key: 'transporter', label: 'Transporter' },
    { key: 'validity', label: 'Valid Until' },
    {
      key: 'status',
      label: 'Status',
      render: (row) => {
        const variant = row.status === 'Active' ? 'success' : row.status === 'Pending' ? 'warning' : row.status === 'Expired' ? 'danger' : 'neutral';
        return <Badge variant={variant}>{row.status}</Badge>;
      },
    },
    {
      key: 'action',
      label: 'Action',
      render: (row) => (
        row.status === 'Active' ? (
          <button className="text-blue-600 hover:text-blue-700 p-1" title="Print E-Way Bill"><Truck className="w-4 h-4" /></button>
        ) : row.status === 'Pending' ? (
          <ActionButton variant="ghost" className="text-violet-600 text-xs px-2 py-1">Generate</ActionButton>
        ) : <span className="text-slate-300">-</span>
      )
    }
  ];

  const filteredData = mockData.filter((item) => {
    const matchSearch = item.invoiceNo.toLowerCase().includes(search.toLowerCase()) || item.customerName.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter ? item.status === statusFilter : true;
    return matchSearch && matchStatus;
  });

  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader
        title="E-Way Bill Support"
        subtitle="Generate and track electronic waybills for goods transportation."
        actions={
          <ActionButton variant="secondary" icon={<Download className="w-4 h-4" />}>Download Report</ActionButton>
        }
      />

      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search invoice no or customer..." />
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
            { label: 'Pending', value: 'Pending' },
            { label: 'Expired', value: 'Expired' },
            { label: 'Cancelled', value: 'Cancelled' },
          ]}
          placeholder="All Status"
        />
      </FilterBar>

      <TableCard>
        <DataTable
          columns={columns}
          data={filteredData}
          emptyMessage="No e-way bills found."
        />
      </TableCard>
    </div>
  );
}
