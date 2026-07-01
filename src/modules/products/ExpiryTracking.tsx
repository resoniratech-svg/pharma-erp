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
  mfgDate?: string;
  expDate: string;
  qty: number;
  daysLeft: number;
  storageLocation?: string;
  status?: string;
}

const getExpiryStatus = (daysLeft: number) => {
  if (daysLeft < 0) return 'Expired';
  if (daysLeft <= 30) return 'Critical';
  if (daysLeft <= 180) return 'Nearing Expiry';
  return 'Safe';
};

const getStatusVariant = (status: string) => {
  if (status === 'Safe') return 'success';
  if (status === 'Expired' || status === 'Critical') return 'danger';
  return 'warning';
};

const mockData: ExpiryItem[] = [
  {
    id: '1',
    batchNo: 'B-2024-331',
    productName: 'Ibuprofen 400mg',
    category: 'Tablet',
    mfgDate: '10-Jul-2024',
    expDate: '09-Jul-2026',
    qty: 800,
    daysLeft: 31,
    storageLocation: 'Warehouse A',
  },
  {
    id: '2',
    batchNo: 'B-2024-450',
    productName: 'Azithromycin 500mg',
    category: 'Tablet',
    mfgDate: '26-Jun-2024',
    expDate: '25-Jun-2026',
    qty: 1200,
    daysLeft: 17,
    storageLocation: 'Rack A-12',
  },
  {
    id: '3',
    batchNo: 'B-2023-112',
    productName: 'Cough Syrup 100ml',
    category: 'Syrup',
    mfgDate: '01-Jun-2023',
    expDate: '31-May-2026',
    qty: 0,
    daysLeft: -8,
    storageLocation: 'Shelf B-4',
  },
  {
    id: '4',
    batchNo: 'B-2025-890',
    productName: 'Paracetamol 650mg',
    category: 'Tablet',
    mfgDate: '15-Dec-2025',
    expDate: '14-Dec-2027',
    qty: 12000,
    daysLeft: 554,
    storageLocation: 'Cold Storage',
  },
];

export default function ExpiryTracking() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedItem, setSelectedItem] = useState<ExpiryItem | null>(null);

  const handleExport = () => {
    const headers = ['Batch No', 'Product Name', 'Category', 'Expiry Date', 'Quantity', 'Days Left', 'Status'];
    const csvContent = [
      headers.join(','),
      ...filteredData.map(row => {
        const status = getExpiryStatus(row.daysLeft);
        return [row.batchNo, `"${row.productName}"`, row.category, row.expDate, row.qty, row.daysLeft, status].join(',');
      })
    ].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'expiry_export.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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
        const computedStatus = getExpiryStatus(row.daysLeft);
        const variant = getStatusVariant(computedStatus);
        return (
          <Badge variant={variant}>
            {computedStatus}
          </Badge>
        );
      },
    },
    {
      key: 'id',
      label: 'Actions',
      render: (row) => (
        <div className="flex gap-3">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setSelectedItem(row);
            }}
            className="text-violet-600 font-medium hover:text-violet-800"
          >
            View
          </button>
        </div>
      )
    }
  ];

  const filteredData = mockData.filter((item) => {
    const matchesSearch =
      item.batchNo
        .toLowerCase()
        .includes(search.toLowerCase()) ||
      item.productName
        .toLowerCase()
        .includes(search.toLowerCase());

    const computedStatus = getExpiryStatus(item.daysLeft);
    const matchesStatus = statusFilter
      ? computedStatus === statusFilter
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
              onClick={handleExport}
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
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">Batch Information</h3>
              <div className="space-y-2">
                <DrawerField label="Batch Number" value={selectedItem.batchNo || 'N/A'} />
                <DrawerField label="Product Name" value={selectedItem.productName || 'N/A'} />
                <DrawerField label="Category" value={selectedItem.category || 'N/A'} />
                <DrawerField label="Storage Location" value={selectedItem.storageLocation || 'N/A'} />
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">Expiry Information</h3>
              <div className="space-y-2">
                <DrawerField label="Manufacturing Date" value={selectedItem.mfgDate || 'N/A'} />
                <DrawerField label="Expiry Date" value={selectedItem.expDate || 'N/A'} />
                <DrawerField label="Days Left" value={selectedItem.daysLeft < 0 ? 'Expired' : `${selectedItem.daysLeft} Days`} />
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">Stock Information</h3>
              <div className="space-y-2">
                <DrawerField label="Available Quantity" value={selectedItem.qty?.toString() || '0'} />
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">Status Information</h3>
              <div className="space-y-2">
                <DrawerField 
                  label="Current Status" 
                  value={
                    <Badge variant={getStatusVariant(getExpiryStatus(selectedItem.daysLeft))}>
                      {getExpiryStatus(selectedItem.daysLeft)}
                    </Badge>
                  } 
                />
              </div>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}