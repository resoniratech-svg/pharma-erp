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

interface CreditNote {
  id: string;
  cnNo: string;
  customerName: string;
  date: string;
  originalInvoice: string;
  amount: string;
  status: 'Approved' | 'Pending';
}

const mockData: CreditNote[] = [
  { id: '1', cnNo: 'CN/26/045', customerName: 'Apollo Pharmacy', date: '16-Oct-2026', originalInvoice: 'INV/26/001', amount: '₹ 1,500', status: 'Approved' },
  { id: '2', cnNo: 'CN/26/046', customerName: 'MedPlus Store', date: '17-Oct-2026', originalInvoice: 'INV/26/002', amount: '₹ 450', status: 'Pending' },
];

export default function CreditNotes() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const columns: Column<CreditNote>[] = [
    { key: 'cnNo', label: 'CN No', render: (row) => <span className="font-semibold text-slate-900">{row.cnNo}</span> },
    { key: 'customerName', label: 'Customer Name' },
    { key: 'originalInvoice', label: 'Against Invoice', render: (row) => <span className="font-medium text-slate-600">{row.originalInvoice}</span> },
    { key: 'date', label: 'Date' },
    { key: 'amount', label: 'Amount', render: (row) => <span className="font-bold text-violet-700">{row.amount}</span> },
    {
      key: 'status',
      label: 'Status',
      render: (row) => {
        const variant = row.status === 'Approved' ? 'success' : 'warning';
        return <Badge variant={variant}>{row.status}</Badge>;
      },
    },
  ];

  const filteredData = mockData.filter((item) => {
    const matchSearch = item.cnNo.toLowerCase().includes(search.toLowerCase()) || item.customerName.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter ? item.status === statusFilter : true;
    return matchSearch && matchStatus;
  });

  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader
        title="Credit Note"
        subtitle="Manage credit notes issued against sales returns or discounts."
        actions={
          <>
            <ActionButton variant="secondary" icon={<Download className="w-4 h-4" />}>Export Register</ActionButton>
            <ActionButton icon={<Plus className="w-4 h-4" />}>Create Credit Note</ActionButton>
          </>
        }
      />

      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search CN no or customer..." />
        <div className="w-px h-6 bg-slate-200 mx-2 hidden sm:block" />
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-medium text-slate-600">Filters:</span>
        </div>
        <SelectFilter
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { label: 'Approved', value: 'Approved' },
            { label: 'Pending', value: 'Pending' },
          ]}
          placeholder="All Status"
        />
      </FilterBar>

      <TableCard>
        <DataTable
          columns={columns}
          data={filteredData}
          emptyMessage="No credit notes found."
        />
      </TableCard>
    </div>
  );
}
