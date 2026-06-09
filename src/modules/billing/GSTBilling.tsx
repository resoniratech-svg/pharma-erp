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

interface GSTInvoice {
  id: string;
  invoiceNo: string;
  customerName: string;
  date: string;
  taxableAmount: string;
  gstAmount: string;
  totalAmount: string;
  status: 'Paid' | 'Unpaid' | 'Draft';
}

const mockData: GSTInvoice[] = [
  { id: '1', invoiceNo: 'INV/26/001', customerName: 'Apollo Pharmacy', date: '15-Oct-2026', taxableAmount: '₹ 45,000', gstAmount: '₹ 5,400', totalAmount: '₹ 50,400', status: 'Paid' },
  { id: '2', invoiceNo: 'INV/26/002', customerName: 'MedPlus Store', date: '16-Oct-2026', taxableAmount: '₹ 12,000', gstAmount: '₹ 1,440', totalAmount: '₹ 13,440', status: 'Unpaid' },
  { id: '3', invoiceNo: 'INV/26/003', customerName: 'Wellness Medicos', date: '17-Oct-2026', taxableAmount: '₹ 8,500', gstAmount: '₹ 1,020', totalAmount: '₹ 9,520', status: 'Draft' },
];

export default function GSTBilling() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const columns: Column<GSTInvoice>[] = [
    { key: 'invoiceNo', label: 'Invoice No', render: (row) => <span className="font-semibold text-slate-900">{row.invoiceNo}</span> },
    { key: 'customerName', label: 'Customer Name' },
    { key: 'date', label: 'Invoice Date' },
    { key: 'taxableAmount', label: 'Taxable Amount' },
    { key: 'gstAmount', label: 'GST Amount', render: (row) => <span className="text-slate-500">{row.gstAmount}</span> },
    { key: 'totalAmount', label: 'Total Value', render: (row) => <span className="font-bold text-violet-700">{row.totalAmount}</span> },
    {
      key: 'status',
      label: 'Status',
      render: (row) => {
        const variant = row.status === 'Paid' ? 'success' : row.status === 'Unpaid' ? 'warning' : 'neutral';
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
    const matchSearch = item.invoiceNo.toLowerCase().includes(search.toLowerCase()) || item.customerName.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter ? item.status === statusFilter : true;
    return matchSearch && matchStatus;
  });

  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader
        title="GST Billing & Invoicing"
        subtitle="Create, manage, and track GST-compliant sales invoices."
        actions={
          <>
            <ActionButton variant="secondary" icon={<Download className="w-4 h-4" />}>Export Register</ActionButton>
            <ActionButton icon={<Plus className="w-4 h-4" />}>New Invoice</ActionButton>
          </>
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
            { label: 'Paid', value: 'Paid' },
            { label: 'Unpaid', value: 'Unpaid' },
            { label: 'Draft', value: 'Draft' },
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
