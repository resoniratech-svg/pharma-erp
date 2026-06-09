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
  distributor: string;
  date: string;
  dueDate: string;
  amount: string;
  status: 'Paid' | 'Unpaid' | 'Overdue';
}

const mockData: Invoice[] = [
  { id: '1', invoiceNo: 'INV-26-9912', distributor: 'Metro Pharma Distributors', date: '01-Oct-2026', dueDate: '31-Oct-2026', amount: '₹ 1,50,000', status: 'Unpaid' },
  { id: '2', invoiceNo: 'INV-26-9900', distributor: 'Carewell Agencies', date: '15-Aug-2026', dueDate: '15-Sep-2026', amount: '₹ 4,20,000', status: 'Overdue' },
  { id: '3', invoiceNo: 'INV-26-9890', distributor: 'Global Health Supply', date: '10-Sep-2026', dueDate: '10-Oct-2026', amount: '₹ 85,000', status: 'Paid' },
];

export default function Invoices() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const columns: Column<Invoice>[] = [
    { key: 'invoiceNo', label: 'Invoice No', render: (row) => <span className="font-semibold text-slate-900">{row.invoiceNo}</span> },
    { key: 'distributor', label: 'Distributor' },
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
    const matchSearch = item.invoiceNo.toLowerCase().includes(search.toLowerCase()) || item.distributor.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter ? item.status === statusFilter : true;
    return matchSearch && matchStatus;
  });

  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader
        title="Invoice Download"
        subtitle="Manage billing, tax invoices, and payment statuses."
        actions={
          <>
            <ActionButton variant="secondary" icon={<Download className="w-4 h-4" />}>Export Register</ActionButton>
            <ActionButton icon={<Plus className="w-4 h-4" />}>Create Invoice</ActionButton>
          </>
        }
      />

      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search invoice or distributor..." />
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
