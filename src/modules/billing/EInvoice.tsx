import { useState } from 'react';
import { Download, Filter, FileCheck2 } from 'lucide-react';
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

interface EInvoice {
  id: string;
  invoiceNo: string;
  customerName: string;
  irnStatus: 'Generated' | 'Pending' | 'Failed' | 'Cancelled';
  irnNumber: string;
  date: string;
  amount: string;
}

const mockData: EInvoice[] = [
  { id: '1', invoiceNo: 'INV/26/001', customerName: 'Apollo Pharmacy', irnStatus: 'Generated', irnNumber: 'e3b0c44298fc1c149afbf4c8996fb924', date: '15-Oct-2026', amount: '₹ 50,400' },
  { id: '2', invoiceNo: 'INV/26/002', customerName: 'MedPlus Store', irnStatus: 'Pending', irnNumber: '-', date: '16-Oct-2026', amount: '₹ 13,440' },
  { id: '3', invoiceNo: 'INV/26/003', customerName: 'Wellness Medicos', irnStatus: 'Failed', irnNumber: 'Invalid GSTIN', date: '17-Oct-2026', amount: '₹ 9,520' },
];

export default function EInvoice() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const columns: Column<EInvoice>[] = [
    { key: 'invoiceNo', label: 'Invoice No', render: (row) => <span className="font-semibold text-slate-900">{row.invoiceNo}</span> },
    { key: 'customerName', label: 'Customer Name' },
    { key: 'date', label: 'Invoice Date' },
    { key: 'amount', label: 'Total Value', render: (row) => <span className="font-medium text-slate-800">{row.amount}</span> },
    { key: 'irnNumber', label: 'IRN Number', render: (row) => <span className="font-mono text-xs text-slate-500 truncate max-w-[150px] inline-block">{row.irnNumber}</span> },
    {
      key: 'irnStatus',
      label: 'e-Invoice Status',
      render: (row) => {
        const variant = row.irnStatus === 'Generated' ? 'success' : row.irnStatus === 'Pending' ? 'warning' : row.irnStatus === 'Failed' ? 'danger' : 'neutral';
        return <Badge variant={variant}>{row.irnStatus}</Badge>;
      },
    },
    {
      key: 'action',
      label: 'Action',
      render: (row) => (
        row.irnStatus === 'Generated' ? (
          <button className="text-emerald-600 hover:text-emerald-700 p-1" title="Print E-Invoice"><FileCheck2 className="w-4 h-4" /></button>
        ) : row.irnStatus === 'Pending' || row.irnStatus === 'Failed' ? (
          <ActionButton variant="ghost" className="text-violet-600 text-xs px-2 py-1">Generate</ActionButton>
        ) : <span className="text-slate-300">-</span>
      )
    }
  ];

  const filteredData = mockData.filter((item) => {
    const matchSearch = item.invoiceNo.toLowerCase().includes(search.toLowerCase()) || item.customerName.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter ? item.irnStatus === statusFilter : true;
    return matchSearch && matchStatus;
  });

  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader
        title="E-Invoice Support"
        subtitle="Generate and manage Invoice Reference Numbers (IRN) with NIC."
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
            { label: 'Generated', value: 'Generated' },
            { label: 'Pending', value: 'Pending' },
            { label: 'Failed', value: 'Failed' },
            { label: 'Cancelled', value: 'Cancelled' },
          ]}
          placeholder="All Status"
        />
      </FilterBar>

      <TableCard>
        <DataTable
          columns={columns}
          data={filteredData}
          emptyMessage="No e-invoices found."
        />
      </TableCard>
    </div>
  );
}
