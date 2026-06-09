import { useState } from 'react';
import { Download } from 'lucide-react';
import {
  PageHeader,
  FilterBar,
  SearchInput,
  ActionButton,
  TableCard,
  DataTable,
} from './components/shared';
import { type Column } from './components/shared';

interface DeadStock {
  id: string;
  productName: string;
  sku: string;
  batchNo: string;
  qty: number;
  lastMoved: string;
  value: string;
}

const mockData: DeadStock[] = [
  { id: '1', productName: 'Old Formula Syrup', sku: 'PRD-099', batchNo: 'B-2023-01', qty: 450, lastMoved: '14-Feb-2024', value: '₹ 22,500' },
  { id: '2', productName: 'Discontinued Tablets', sku: 'PRD-102', batchNo: 'B-2024-11', qty: 1200, lastMoved: '01-Jan-2025', value: '₹ 14,400' },
];

export default function DeadStock() {
  const [search, setSearch] = useState('');

  const columns: Column<DeadStock>[] = [
    { key: 'productName', label: 'Product Name', render: (row) => <span className="font-semibold text-slate-900">{row.productName}</span> },
    { key: 'sku', label: 'SKU' },
    { key: 'batchNo', label: 'Batch No' },
    { key: 'qty', label: 'Quantity', render: (row) => <span className="text-rose-600 font-bold">{row.qty}</span> },
    { key: 'lastMoved', label: 'Last Moved' },
    { key: 'value', label: 'Blocked Capital', render: (row) => <span className="font-bold text-slate-800">{row.value}</span> },
  ];

  const filteredData = mockData.filter((item) => {
    return item.productName.toLowerCase().includes(search.toLowerCase()) || item.sku.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader
        title="Dead Stock Tracking"
        subtitle="Identify non-moving inventory and blocked capital."
        actions={
          <ActionButton variant="secondary" icon={<Download className="w-4 h-4" />}>Export Report</ActionButton>
        }
      />

      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search product or SKU..." />
      </FilterBar>

      <TableCard>
        <DataTable
          columns={columns}
          data={filteredData}
          emptyMessage="No dead stock found. Great job!"
        />
      </TableCard>
    </div>
  );
}
