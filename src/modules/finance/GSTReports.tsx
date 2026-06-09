import { useState } from 'react';
import {
  Download,
  Filter,
  Eye,
} from 'lucide-react';

import {
  PageHeader,
  ActionButton,
  SummaryCard,
  FilterBar,
  SearchInput,
  SelectFilter,
  TableCard,
  DataTable,
  Badge,
} from './components/shared';

import { type Column } from './components/shared';

interface GSTReportItem {
  id: string;
  returnType: string;
  taxPeriod: string;
  taxableValue: string;
  gstAmount: string;
  filingDate: string;
  status: 'Filed' | 'Pending' | 'Overdue';
}

const gstData: GSTReportItem[] = [
  {
    id: '1',
    returnType: 'GSTR-1',
    taxPeriod: 'Jul 2026',
    taxableValue: '₹ 35,40,000',
    gstAmount: '₹ 4,25,000',
    filingDate: '05-Aug-2026',
    status: 'Filed',
  },
  {
    id: '2',
    returnType: 'GSTR-2',
    taxPeriod: 'Jul 2026',
    taxableValue: '₹ 25,80,000',
    gstAmount: '₹ 3,10,000',
    filingDate: '06-Aug-2026',
    status: 'Filed',
  },
  {
    id: '3',
    returnType: 'GSTR-3B',
    taxPeriod: 'Jul 2026',
    taxableValue: '₹ 35,40,000',
    gstAmount: '₹ 1,15,000',
    filingDate: '-',
    status: 'Pending',
  },
  {
    id: '4',
    returnType: 'GSTR-1',
    taxPeriod: 'Jun 2026',
    taxableValue: '₹ 31,20,000',
    gstAmount: '₹ 3,82,000',
    filingDate: '-',
    status: 'Overdue',
  },
];

export default function GSTReports() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const columns: Column<GSTReportItem>[] = [
    {
      key: 'returnType',
      label: 'RETURN TYPE',
      render: (row) => (
        <span className="font-semibold text-slate-900">
          {row.returnType}
        </span>
      ),
    },
    {
      key: 'taxPeriod',
      label: 'TAX PERIOD',
    },
    {
      key: 'taxableValue',
      label: 'TAXABLE VALUE',
    },
    {
      key: 'gstAmount',
      label: 'GST AMOUNT',
      render: (row) => (
        <span className="font-semibold text-slate-900">
          {row.gstAmount}
        </span>
      ),
    },
    {
      key: 'filingDate',
      label: 'FILING DATE',
    },
    {
      key: 'status',
      label: 'STATUS',
      render: (row) => {
        const variant =
          row.status === 'Filed'
            ? 'success'
            : row.status === 'Pending'
            ? 'warning'
            : 'danger';

        return (
          <Badge variant={variant}>
            {row.status}
          </Badge>
        );
      },
    },
    {
      key: 'actions',
      label: 'ACTIONS',
      render: () => (
        <button className="text-violet-600 font-medium hover:text-violet-700 flex items-center gap-1">
          <Eye className="w-4 h-4" />
          View
        </button>
      ),
    },
  ];

  const filteredData = gstData.filter((item) => {
    const matchesSearch =
      item.returnType
        .toLowerCase()
        .includes(search.toLowerCase()) ||
      item.taxPeriod
        .toLowerCase()
        .includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === ''
        ? true
        : item.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader
        title="GST Reports"
        subtitle="Consolidated GST filing reports (GSTR-1, GSTR-2, GSTR-3B)."
        actions={
          <ActionButton
            variant="secondary"
            icon={<Download className="w-4 h-4" />}
          >
            Export JSON for Portal
          </ActionButton>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <SummaryCard
          title="Total Output Tax (GSTR-1)"
          value="₹ 4,25,000"
          subtitle="Tax on outward supplies"
          icon={<span className="font-bold">G1</span>}
          colorClass="text-indigo-600"
          bgClass="bg-indigo-50"
        />

        <SummaryCard
          title="Total Input Tax Credit (GSTR-2)"
          value="₹ 3,10,000"
          subtitle="ITC on inward supplies"
          icon={<span className="font-bold">G2</span>}
          colorClass="text-emerald-600"
          bgClass="bg-emerald-50"
        />

        <SummaryCard
          title="Net Tax Payable (GSTR-3B)"
          value="₹ 1,15,000"
          subtitle="To be paid via Cash Ledger"
          icon={<span className="font-bold">3B</span>}
          colorClass="text-rose-600"
          bgClass="bg-rose-50"
        />
      </div>

      {/* Filters */}
      <FilterBar>
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search return type or tax period..."
        />

        <div className="w-px h-6 bg-slate-200 mx-2 hidden sm:block" />

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-medium text-slate-600">
            Filters:
          </span>
        </div>

        <SelectFilter
          value={statusFilter}
          onChange={setStatusFilter}
          placeholder="All Status"
          options={[
            {
              label: 'Filed',
              value: 'Filed',
            },
            {
              label: 'Pending',
              value: 'Pending',
            },
            {
              label: 'Overdue',
              value: 'Overdue',
            },
          ]}
        />
      </FilterBar>

      {/* GST Filing Summary */}
      <TableCard>
        <DataTable
          columns={columns}
          data={filteredData}
          emptyMessage="No GST filing records found."
        />
      </TableCard>
    </div>
  );
}