import { useState } from 'react';
import {
  Filter,
  Download,
  Plus,
} from 'lucide-react';

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

import { type Column } from './types';

interface MRPItem {
  id: string;
  productCode: string;
  productName: string;
  category: string;
  mrp: number;
  effectiveDate: string;
  revisedBy: string;
  status: 'Active' | 'Scheduled' | 'Expired';
}

const mockData: MRPItem[] = [
  {
    id: '1',
    productCode: 'PRD-001',
    productName: 'Paracetamol 650mg',
    category: 'Tablet',
    mrp: 120,
    effectiveDate: '01-Jun-2026',
    revisedBy: 'Admin',
    status: 'Active',
  },
  {
    id: '2',
    productCode: 'PRD-002',
    productName: 'Amoxicillin 500mg',
    category: 'Capsule',
    mrp: 185,
    effectiveDate: '15-Jun-2026',
    revisedBy: 'Admin',
    status: 'Active',
  },
  {
    id: '3',
    productCode: 'PRD-003',
    productName: 'Vitamin C 1000mg',
    category: 'Tablet',
    mrp: 240,
    effectiveDate: '01-Jul-2026',
    revisedBy: 'Pricing Team',
    status: 'Scheduled',
  },
  {
    id: '4',
    productCode: 'PRD-004',
    productName: 'Cough Syrup 100ml',
    category: 'Syrup',
    mrp: 95,
    effectiveDate: '01-Jan-2025',
    revisedBy: 'Admin',
    status: 'Expired',
  },
];

export default function MRPManagement() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const columns: Column<MRPItem>[] = [
    {
      key: 'productCode',
      label: 'PRODUCT CODE',
    },
    {
      key: 'productName',
      label: 'PRODUCT NAME',
      render: (row) => (
        <span className="font-semibold text-slate-900">
          {row.productName}
        </span>
      ),
    },
    {
      key: 'category',
      label: 'CATEGORY',
    },
    {
      key: 'mrp',
      label: 'MRP',
      render: (row) => `₹${row.mrp}`,
    },
    {
      key: 'effectiveDate',
      label: 'EFFECTIVE DATE',
    },
    {
      key: 'revisedBy',
      label: 'REVISED BY',
    },
    {
      key: 'status',
      label: 'STATUS',
      render: (row) => (
        <Badge
          variant={
            row.status === 'Active'
              ? 'success'
              : row.status === 'Scheduled'
              ? 'warning'
              : 'danger'
          }
        >
          {row.status}
        </Badge>
      ),
    },
  ];

  const filteredData = mockData.filter((item) => {
    const matchesSearch =
      item.productName
        .toLowerCase()
        .includes(search.toLowerCase()) ||
      item.productCode
        .toLowerCase()
        .includes(search.toLowerCase());

    const matchesStatus = statusFilter
      ? item.status === statusFilter
      : true;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader
        title="MRP Management"
        subtitle="Manage Maximum Retail Price (MRP), revisions, and product-wise pricing controls."
        actions={
          <>
            <ActionButton
              variant="secondary"
              icon={<Download className="w-4 h-4" />}
            >
              Export
            </ActionButton>

            <ActionButton
              icon={<Plus className="w-4 h-4" />}
            >
              New MRP
            </ActionButton>
          </>
        }
      />

      <FilterBar>
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search product..."
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
              label: 'Active',
              value: 'Active',
            },
            {
              label: 'Scheduled',
              value: 'Scheduled',
            },
            {
              label: 'Expired',
              value: 'Expired',
            },
          ]}
        />
      </FilterBar>

      <TableCard>
        <DataTable
          columns={columns}
          data={filteredData}
          emptyMessage="No MRP records found."
        />
      </TableCard>
    </div>
  );
}