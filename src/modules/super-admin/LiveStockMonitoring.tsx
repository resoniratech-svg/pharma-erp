import { useState, useRef, useEffect } from 'react';
import { IndianRupee, AlertTriangle, PackageSearch, ArchiveX, Eye, Download, ChevronDown, FileSpreadsheet, FileText } from 'lucide-react';
import * as XLSX from 'xlsx';
import {
  PageHeader,
  FilterBar,
  SearchInput,
  SelectFilter,
  TableCard,
  DataTable,
  Badge,
  SummaryCard,
  ActionButton
} from './components/shared';
import { type Column } from './components/shared';

interface StockItem {
  id: string;
  productCode: string;
  productName: string;
  batchNo: string;
  warehouse: string;
  category: string;
  availableQty: number;
  reorderLevel: number;
  expiryDate: string;
  stockValue: string;
  status: 'In Stock' | 'Low Stock' | 'Near Expiry' | 'Out Of Stock' | 'Dead Stock';
}

const mockData: StockItem[] = [
  { id: '1', productCode: 'PRD-1001', productName: 'Paracetamol 500mg', category: 'Analgesics', batchNo: 'BTH-2025-01', warehouse: 'Mumbai Central', availableQty: 15400, reorderLevel: 5000, expiryDate: '2027-10-15', stockValue: '₹ 1,54,000', status: 'In Stock' },
  { id: '2', productCode: 'PRD-2022', productName: 'Amoxicillin 250mg', category: 'Antibiotics', batchNo: 'BTH-2024-08', warehouse: 'Pune Depot', availableQty: 120, reorderLevel: 1000, expiryDate: '2026-05-20', stockValue: '₹ 2,640', status: 'Low Stock' },
  { id: '3', productCode: 'PRD-3003', productName: 'Vitamin C Syrup', category: 'Supplements', batchNo: 'BTH-2023-11', warehouse: 'Delhi North', availableQty: 450, reorderLevel: 300, expiryDate: '2024-07-30', stockValue: '₹ 20,250', status: 'Near Expiry' },
  { id: '4', productCode: 'PRD-4004', productName: 'Cough Syrup 100ml', category: 'Syrups', batchNo: 'BTH-2022-02', warehouse: 'Mumbai Central', availableQty: 50, reorderLevel: 200, expiryDate: '2023-12-01', stockValue: '₹ 2,250', status: 'Dead Stock' },
  { id: '5', productCode: 'PRD-5005', productName: 'Surgical Masks (Box)', category: 'Consumables', batchNo: 'BTH-2026-03', warehouse: 'Chennai South', availableQty: 0, reorderLevel: 500, expiryDate: '2028-01-01', stockValue: '₹ 0', status: 'Out Of Stock' },
  { id: '6', productCode: 'PRD-6006', productName: 'Ibuprofen 400mg', category: 'Analgesics', batchNo: 'BTH-2025-05', warehouse: 'Pune Depot', availableQty: 8500, reorderLevel: 2000, expiryDate: '2027-08-10', stockValue: '₹ 68,000', status: 'In Stock' },
];

export default function LiveStockMonitoring() {
  const [search, setSearch] = useState('');
  
  // Filters
  const [warehouse, setWarehouse] = useState('');
  const [stockStatus, setStockStatus] = useState('');
  const [category, setCategory] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const [isExportOpen, setIsExportOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsExportOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const columns: Column<StockItem>[] = [
    { key: 'productCode', label: 'Product Code', render: (row) => <span className="font-mono text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">{row.productCode}</span> },
    { key: 'productName', label: 'Product Name', render: (row) => <span className="font-semibold text-slate-900">{row.productName}</span> },
    { key: 'batchNo', label: 'Batch No', render: (row) => <span className="text-slate-600">{row.batchNo}</span> },
    { key: 'warehouse', label: 'Warehouse / Location' },
    { key: 'availableQty', label: 'Available Qty', render: (row) => <span className="font-bold text-slate-700">{row.availableQty.toLocaleString()}</span> },
    { key: 'reorderLevel', label: 'Reorder Level', render: (row) => <span className="text-slate-500">{row.reorderLevel.toLocaleString()}</span> },
    { key: 'expiryDate', label: 'Expiry Date', render: (row) => <span className="text-slate-600">{new Date(row.expiryDate).toLocaleDateString()}</span> },
    { key: 'stockValue', label: 'Stock Value', render: (row) => <span className="font-semibold text-slate-700">{row.stockValue}</span> },
    {
      key: 'status',
      label: 'Status',
      render: (row) => {
        let variant: 'success' | 'warning' | 'danger' | 'neutral' | 'brand' = 'neutral';
        if (row.status === 'In Stock') variant = 'success';
        if (row.status === 'Low Stock') variant = 'warning';
        if (row.status === 'Near Expiry') variant = 'danger';
        if (row.status === 'Out Of Stock') variant = 'danger';
        if (row.status === 'Dead Stock') variant = 'neutral';
        return <Badge variant={variant}>{row.status}</Badge>;
      },
    },
    {
      key: 'action',
      label: 'Action',
      render: () => (
        <ActionButton variant="ghost">
          <Eye className="w-4 h-4 text-slate-500" />
          <span className="text-slate-600">View</span>
        </ActionButton>
      )
    }
  ];

  const filteredData = mockData.filter((item) => {
    let match = true;
    if (search) match = match && item.productName.toLowerCase().includes(search.toLowerCase());
    if (warehouse) match = match && item.warehouse === warehouse;
    if (stockStatus) match = match && item.status === stockStatus;
    if (category) match = match && item.category === category;
    
    // date filtering based on expiryDate for context, or generally just mock it out
    if (fromDate) match = match && new Date(item.expiryDate) >= new Date(fromDate);
    if (toDate) match = match && new Date(item.expiryDate) <= new Date(toDate);

    return match;
  });

  const getExportData = () => {
    const timestamp = new Date().toLocaleString();
    const activeFilters = [
      search && `Search: ${search}`,
      warehouse && `Warehouse: ${warehouse}`,
      stockStatus && `Status: ${stockStatus}`,
      category && `Category: ${category}`,
      fromDate && `From: ${fromDate}`,
      toDate && `To: ${toDate}`
    ].filter(Boolean).join(' | ') || 'None';

    const headerRows = [
      ['Live Stock Monitoring Report'],
      [`Generated On: ${timestamp}`],
      [`Active Filters: ${activeFilters}`],
      []
    ];

    const tableHeaders = ['Product Code', 'Product Name', 'Batch No', 'Warehouse / Location', 'Available Qty', 'Reorder Level', 'Expiry Date', 'Stock Value', 'Status'];
    const tableRows = filteredData.map(row => [
      row.productCode,
      row.productName,
      row.batchNo,
      row.warehouse,
      row.availableQty.toString(),
      row.reorderLevel.toString(),
      row.expiryDate,
      row.stockValue,
      row.status
    ]);

    return { headerRows, tableHeaders, tableRows };
  };

  const handleExportCSV = () => {
    if (filteredData.length === 0) {
      alert("No data available for export.");
      return;
    }
    
    const { headerRows, tableHeaders, tableRows } = getExportData();
    const csvContent = [
      ...headerRows.map(row => `"${row.join('","')}"`),
      `"${tableHeaders.join('","')}"`,
      ...tableRows.map(row => `"${row.join('","')}"`)
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    link.href = URL.createObjectURL(blob);
    link.download = `Live_Stock_Report_${dateStr}.csv`;
    link.click();
    setIsExportOpen(false);
  };

  const handleExportExcel = () => {
    if (filteredData.length === 0) {
      alert("No data available for export.");
      return;
    }

    const { headerRows, tableHeaders, tableRows } = getExportData();
    const wsData = [
      ...headerRows,
      tableHeaders,
      ...tableRows
    ];

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Live Stock");
    
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    XLSX.writeFile(wb, `Live_Stock_Report_${dateStr}.xlsx`);
    setIsExportOpen(false);
  };

  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader
        title="Live Stock Monitoring"
        subtitle="Real-time inventory visibility across all warehouses and depots."
        breadcrumb={[{ label: 'Super Admin' }, { label: 'Live Stock' }]}
        actions={
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsExportOpen(!isExportOpen)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-sm font-semibold transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
            >
              <Download className="w-4 h-4" />
              Export
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </button>
            
            {isExportOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 shadow-lg rounded-xl overflow-hidden z-50 animate-in slide-in-from-top-2 duration-200">
                <div className="p-1">
                  <button
                    onClick={handleExportCSV}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-violet-600 rounded-lg transition-colors text-left"
                  >
                    <FileText className="w-4 h-4" />
                    Export CSV
                  </button>
                  <button
                    onClick={handleExportExcel}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-violet-600 rounded-lg transition-colors text-left mt-1"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    Export Excel (.xlsx)
                  </button>
                </div>
              </div>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <SummaryCard title="Total Inventory Value" value="₹ 45.2 Cr" icon={<IndianRupee className="w-6 h-6" />} colorClass="text-blue-600" bgClass="bg-blue-100" />
        <SummaryCard title="Low Stock Products" value="124" icon={<PackageSearch className="w-6 h-6" />} colorClass="text-amber-600" bgClass="bg-amber-100" />
        <SummaryCard title="Near Expiry Products" value="45" icon={<AlertTriangle className="w-6 h-6" />} colorClass="text-rose-600" bgClass="bg-rose-100" />
        <SummaryCard title="Dead Stock Value" value="₹ 1.2 Cr" icon={<ArchiveX className="w-6 h-6" />} colorClass="text-slate-600" bgClass="bg-slate-100" />
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6 flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-4">
          <SearchInput value={search} onChange={setSearch} placeholder="Search product name..." />
          <SelectFilter
            value={warehouse} onChange={setWarehouse}
            options={[
              { label: 'Mumbai Central', value: 'Mumbai Central' },
              { label: 'Delhi North', value: 'Delhi North' },
              { label: 'Pune Depot', value: 'Pune Depot' },
              { label: 'Chennai South', value: 'Chennai South' },
            ]}
            placeholder="Warehouse"
          />
          <SelectFilter
            value={stockStatus} onChange={setStockStatus}
            options={[
              { label: 'In Stock', value: 'In Stock' },
              { label: 'Low Stock', value: 'Low Stock' },
              { label: 'Near Expiry', value: 'Near Expiry' },
              { label: 'Out Of Stock', value: 'Out Of Stock' },
              { label: 'Dead Stock', value: 'Dead Stock' },
            ]}
            placeholder="Stock Status"
          />
          <SelectFilter
            value={category} onChange={setCategory}
            options={[
              { label: 'Analgesics', value: 'Analgesics' },
              { label: 'Antibiotics', value: 'Antibiotics' },
              { label: 'Syrups', value: 'Syrups' },
              { label: 'Supplements', value: 'Supplements' },
              { label: 'Consumables', value: 'Consumables' },
            ]}
            placeholder="Product Category"
          />
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-600">From</span>
            <input 
              type="date" 
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-500/30 transition-all"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-600">To</span>
            <input 
              type="date" 
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-500/30 transition-all"
            />
          </div>
        </div>
      </div>

      <div className="mb-6">
        <TableCard>
          <div className="live-stock-table-container">
            <DataTable columns={columns} data={filteredData} />
          </div>
        </TableCard>
      </div>
      <style>{`
        .live-stock-table-container .overflow-x-auto {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        .live-stock-table-container .overflow-x-auto::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}
