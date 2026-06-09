import { useState } from 'react';
import { Plus, Download, Filter, ReceiptText } from 'lucide-react';
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

interface Invoice {
  id: string;
  invoiceNo: string;
  retailer: string;
  date: string;
  dueDate: string;
  amount: string;
  status: 'Paid' | 'Unpaid' | 'Overdue';
}

const mockData: Invoice[] = [
  { id: '1', invoiceNo: 'INV-RET-9912', retailer: 'Apollo Pharmacy', date: '01-Oct-2026', dueDate: '15-Oct-2026', amount: '₹ 45,000', status: 'Unpaid' },
  { id: '2', invoiceNo: 'INV-RET-9900', retailer: 'MedPlus Store', date: '15-Sep-2026', dueDate: '30-Sep-2026', amount: '₹ 12,000', status: 'Overdue' },
  { id: '3', invoiceNo: 'INV-RET-9890', retailer: 'Wellness Medicos', date: '10-Sep-2026', dueDate: '25-Sep-2026', amount: '₹ 5,500', status: 'Paid' },
];

export default function Invoices() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const columns: Column<Invoice>[] = [
    { key: 'invoiceNo', label: 'Invoice No', render: (row) => <span className="font-semibold text-slate-900">{row.invoiceNo}</span> },
    { key: 'retailer', label: 'Retailer' },
    { key: 'date', label: 'Invoice Date' },
    { key: 'dueDate', label: 'Due Date', render: (row) => <span className={row.status === 'Overdue' ? 'text-rose-600 font-medium' : ''}>{row.dueDate}</span> },
    { key: 'amount', label: 'Amount', render: (row) => <span className="font-bold text-slate-800">{row.amount}</span> },
    {
      key: 'status',
      label: 'Status',
      render: (row) => {
        const variant = row.status === 'Paid' ? 'success' : row.status === 'Unpaid' ? 'warning' : 'danger';
        return <Badge variant={variant}>{row.status}</Badge>;
      },
    },
    {
      key: 'action',
      label: '',
      render: () => <button className="text-violet-600 hover:text-violet-700 p-1"><ReceiptText className="w-4 h-4" /></button>
    }
  ];

  const filteredData = mockData.filter((item) => {
    const matchSearch = item.invoiceNo.toLowerCase().includes(search.toLowerCase()) || item.retailer.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter ? item.status === statusFilter : true;
    return matchSearch && matchStatus;
  });

  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader
        title="Invoice Access"
        subtitle="Manage billing, tax invoices, and payment statuses for retailers."
        actions={
          <>
            <ActionButton variant="secondary" icon={<Download className="w-4 h-4" />}>Export Register</ActionButton>
            <ActionButton icon={<Plus className="w-4 h-4" />}>Create Invoice</ActionButton>
          </>
        }
      />

      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search invoice or retailer..." />
        <div className="w-px h-6 bg-slate-200 mx-2 hidden sm:block" />
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-medium text-slate-600">Filters:</span>
        </div>
        <SelectFilter
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { label: 'Paid', value: 'Paid' },
            { label: 'Unpaid', value: 'Unpaid' },
            { label: 'Overdue', value: 'Overdue' },
          ]}
          placeholder="All Status"
        />
      </FilterBar>

      <TableCard>
        <DataTable
          columns={columns}
          data={filteredData}
          emptyMessage="No invoices found."
        />
      </TableCard>
    </div>
  );
}
