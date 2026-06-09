import { useState } from 'react';
import { Filter, Download } from 'lucide-react';

import {
  PageHeader,
  FilterBar,
  SearchInput,
  SelectFilter,
  ActionButton,
  TableCard,
  DataTable,
  Drawer,
  DrawerField,
  Badge,
} from './components/shared';

import { type Column } from './types';

interface ExpiryItem {
  id: string;
  batchNo: string;
  productName: string;
  category: string;
  expDate: string;
  qty: number;
  daysLeft: number;
  status: 'Safe' | 'Nearing Expiry' | 'Critical' | 'Expired';
}

const mockData: ExpiryItem[] = [
  {
    id: '1',
    batchNo: 'B-2024-331',
    productName: 'Ibuprofen 400mg',
    category: 'Tablet',
    expDate: '09-Jul-2026',
    qty: 800,
    daysLeft: 31,
    status: 'Nearing Expiry',
  },
  {
    id: '2',
    batchNo: 'B-2024-450',
    productName: 'Azithromycin 500mg',
    category: 'Tablet',
    expDate: '25-Jun-2026',
    qty: 1200,
    daysLeft: 17,
    status: 'Critical',
  },
  {
    id: '3',
    batchNo: 'B-2023-112',
    productName: 'Cough Syrup 100ml',
    category: 'Syrup',
    expDate: '31-May-2026',
    qty: 0,
    daysLeft: -8,
    status: 'Expired',
  },
  {
    id: '4',
    batchNo: 'B-2025-890',
    productName: 'Paracetamol 650mg',
    category: 'Tablet',
    expDate: '14-Dec-2027',
    qty: 12000,
    daysLeft: 554,
    status: 'Safe',
  },
];

export default function ExpiryTracking() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedItem, setSelectedItem] = useState<ExpiryItem | null>(null);

  const columns: Column<ExpiryItem>[] = [
    {
      key: 'batchNo',
      label: 'Batch No',
    },
    {
      key: 'productName',
      label: 'Product Name',
      render: (row) => (
        <span className="font-semibold text-slate-900">
          {row.productName}
        </span>
      ),
    },
    {
      key: 'category',
      label: 'Category',
    },
    {
      key: 'expDate',
      label: 'Expiry Date',
    },
    {
      key: 'qty',
      label: 'Quantity',
    },
    {
      key: 'daysLeft',
      label: 'Days Left',
      render: (row) =>
        row.daysLeft < 0
          ? 'Expired'
          : `${row.daysLeft} Days`,
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => {
        const variant =
          row.status === 'Safe'
            ? 'success'
            : row.status === 'Expired'
            ? 'danger'
            : row.status === 'Critical'
            ? 'danger'
            : 'warning';

        return (
          <Badge variant={variant}>
            {row.status}
          </Badge>
        );
      },
    },
  ];

  const filteredData = mockData.filter((item) => {
    const matchesSearch =
      item.batchNo
        .toLowerCase()
        .includes(search.toLowerCase()) ||
      item.productName
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
        title="Expiry Tracking"
        subtitle="Monitor product expiry dates, near-expiry inventory, and expired stock."
        actions={
          <>
            <ActionButton
              variant="secondary"
              icon={<Download className="w-4 h-4" />}
            >
              Export
            </ActionButton>
          </>
        }
      />

      <FilterBar>
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search by batch or product..."
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
            { label: 'Safe', value: 'Safe' },
            { label: 'Nearing Expiry', value: 'Nearing Expiry' },
            { label: 'Critical', value: 'Critical' },
            { label: 'Expired', value: 'Expired' },
          ]}
        />
      </FilterBar>

      <TableCard>
        <DataTable
          columns={columns}
          data={filteredData}
          onRowClick={(row) => setSelectedItem(row)}
          emptyMessage="No expiry records found."
        />
      </TableCard>

      <Drawer
        open={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        title="Expiry Details"
      >
        {selectedItem && (
          <div className="space-y-2">
            <DrawerField
              label="Batch Number"
              value={selectedItem.batchNo}
            />

            <DrawerField
              label="Product Name"
              value={selectedItem.productName}
            />

            <DrawerField
              label="Category"
              value={selectedItem.category}
            />

            <DrawerField
              label="Expiry Date"
              value={selectedItem.expDate}
            />

            <DrawerField
              label="Quantity"
              value={selectedItem.qty}
            />

            <DrawerField
              label="Days Left"
              value={
                selectedItem.daysLeft < 0
                  ? 'Expired'
                  : `${selectedItem.daysLeft} Days`
              }
            />

            <DrawerField
              label="Status"
              value={
                <Badge
                  variant={
                    selectedItem.status === 'Safe'
                      ? 'success'
                      : selectedItem.status === 'Expired'
                      ? 'danger'
                      : selectedItem.status === 'Critical'
                      ? 'danger'
                      : 'warning'
                  }
                >
                  {selectedItem.status}
                </Badge>
              }
            />
          </div>
        )}
      </Drawer>
    </div>
  );
}