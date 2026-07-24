import { useState, useRef, useEffect, useMemo } from 'react';
import { IndianRupee, AlertTriangle, PackageSearch, ArchiveX, Eye, Download, ChevronDown, FileSpreadsheet, FileText } from 'lucide-react';
import * as XLSX from 'xlsx';
import {
  PageHeader,
  SearchInput,
  SelectFilter,
  TableCard,
  DataTable,
  Badge,
  SummaryCard,
  ActionButton
} from './components/shared';
import { type Column } from './components/shared';

import { inventoryService } from '../../services/inventoryService';
import type { InventoryRecord } from '../../services/inventoryService';
import { batchService } from '../../services/batchService';
import { productService } from '../../services/productService';

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
  stockValueNumber: number;
}

export default function LiveStockMonitoring() {
  const [search, setSearch] = useState('');
  
  // Filters
  const [warehouse, setWarehouse] = useState('');
  const [stockStatus, setStockStatus] = useState('');
  const [category, setCategory] = useState('');

  const [isExportOpen, setIsExportOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [inventory, setInventory] = useState<InventoryRecord[]>([]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsExportOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const loadData = async () => {
      // Make sure we load the dependencies
      await productService.loadProducts();
      await batchService.loadBatches();
      const invs = await inventoryService.loadInventory();
      setInventory(invs);
    };
    loadData();
  }, []);

  const realData = useMemo(() => {
    const products = productService.getProducts();
    const batches = batchService.getAll();
    const today = new Date();

    return inventory.map((inv) => {
      const prod = products.find(p => p.code === inv.productCode);
      const bch = batches.find(b => b.batchNo === inv.batchNo && b.productCode === inv.productCode);

      const reorderLevel = prod ? Number(prod.reorderLevel || 0) : 0;
      const category = prod ? prod.category : 'Unknown';
      
      let expDateStr = bch ? bch.expDate : new Date().toISOString();
      const expDate = new Date(expDateStr);

      const stockValueNum = inv.availableQty * (bch ? bch.ptr : inv.ptr || 0);

      let status: StockItem['status'] = 'In Stock';
      if (inv.availableQty === 0) {
        status = 'Out Of Stock';
      } else if (inv.availableQty <= reorderLevel) {
        status = 'Low Stock';
      }

      // Check Expiry
      const daysToExpiry = (expDate.getTime() - today.getTime()) / (1000 * 3600 * 24);
      if (daysToExpiry <= 0) {
        status = 'Dead Stock';
      } else if (daysToExpiry <= 90) { // arbitrary 90 days for near expiry
        status = 'Near Expiry';
      }

      return {
        id: inv.id,
        productCode: inv.productCode,
        productName: inv.productName,
        batchNo: inv.batchNo,
        warehouse: inv.warehouseName || inv.warehouseCode || 'Main',
        category,
        availableQty: inv.availableQty,
        reorderLevel,
        expiryDate: expDateStr,
        stockValueNumber: stockValueNum,
        stockValue: `₹ ${stockValueNum.toLocaleString('en-IN')}`,
        status
      } as StockItem;
    });
  }, [inventory]);


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
    }
  ];

  const filteredData = realData.filter((item) => {
    let match = true;
    if (search) match = match && item.productName.toLowerCase().includes(search.toLowerCase());
    if (warehouse) match = match && item.warehouse === warehouse;
    if (stockStatus) match = match && item.status === stockStatus;
    if (category) match = match && item.category === category;
    return match;
  });

  // Calculate KPIs
  const totalInventoryValue = filteredData.reduce((sum, item) => sum + item.stockValueNumber, 0);
  const lowStockCount = filteredData.filter(item => item.status === 'Low Stock').length;
  const nearExpiryCount = filteredData.filter(item => item.status === 'Near Expiry').length;
  const deadStockValue = filteredData.filter(item => item.status === 'Dead Stock').reduce((sum, item) => sum + item.stockValueNumber, 0);

  const formatCurrency = (val: number) => {
    if (val >= 10000000) return `₹ ${(val / 10000000).toFixed(2)} Cr`;
    if (val >= 100000) return `₹ ${(val / 100000).toFixed(2)} L`;
    return `₹ ${val.toLocaleString('en-IN')}`;
  };

  // Generate Dropdown Options
  const warehouseOptions = useMemo(() => {
    const whs = new Set(realData.map(r => r.warehouse).filter(Boolean));
    return Array.from(whs).map(w => ({ label: w, value: w }));
  }, [realData]);

  const categoryOptions = useMemo(() => {
    const cats = new Set(realData.map(r => r.category).filter(Boolean));
    return Array.from(cats).map(c => ({ label: c, value: c }));
  }, [realData]);


  const getExportData = () => {
    const timestamp = new Date().toLocaleString();
    const activeFilters = [
      search && `Search: ${search}`,
      warehouse && `Warehouse: ${warehouse}`,
      stockStatus && `Status: ${stockStatus}`,
      category && `Category: ${category}`
    ].filter(Boolean).join(' | ');

    return [
      ['Live Stock Monitoring Report'],
      ['Generated On:', timestamp],
      ['Filters Applied:', activeFilters || 'None'],
      [''],
      ['Product Code', 'Product Name', 'Batch No', 'Warehouse', 'Available Qty', 'Reorder Level', 'Expiry Date', 'Stock Value', 'Status'],
      ...filteredData.map(item => [
        item.productCode,
        item.productName,
        item.batchNo,
        item.warehouse,
        item.availableQty,
        item.reorderLevel,
        new Date(item.expiryDate).toLocaleDateString(),
        item.stockValueNumber,
        item.status
      ])
    ];
  };

  const handleExportCSV = () => {
    const data = getExportData();
    const csvContent = data.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Live_Stock_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    setIsExportOpen(false);
  };

  const handleExportExcel = () => {
    const data = getExportData();
    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Live Stock');
    XLSX.writeFile(wb, `Live_Stock_${new Date().toISOString().split('T')[0]}.xlsx`);
    setIsExportOpen(false);
  };

  return (
    <div className="p-6">
      <PageHeader 
        title="Live Stock Monitoring" 
        subtitle="Track inventory levels, locations, and status across all warehouses"
        action={
          <div className="relative" ref={dropdownRef}>
            <button 
              onClick={() => setIsExportOpen(!isExportOpen)}
              className="flex items-center gap-2 bg-[#163c78] text-white px-4 py-2 rounded-xl hover:bg-[#0c1f3d] transition-all shadow-sm hover:shadow active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span className="font-medium">Export</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${isExportOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {isExportOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 shadow-lg rounded-xl overflow-hidden z-50 animate-in slide-in-from-top-2 duration-200">
                <div className="p-1">
                  <button
                    onClick={handleExportCSV}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-[#163c78] rounded-lg transition-colors text-left"
                  >
                    <FileText className="w-4 h-4" />
                    Export CSV
                  </button>
                  <button
                    onClick={handleExportExcel}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-[#163c78] rounded-lg transition-colors text-left mt-1"
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

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <SummaryCard 
          title="Total Inventory Value" 
          value={formatCurrency(totalInventoryValue)} 
          icon={<IndianRupee className="w-6 h-6 text-blue-600" />} 
          colorClass="text-blue-600" 
          bgClass="bg-blue-100/50 border border-blue-200" 
        />
        <SummaryCard 
          title="Low Stock Products" 
          value={lowStockCount.toString()} 
          icon={<PackageSearch className="w-6 h-6 text-amber-600" />} 
          colorClass="text-amber-600" 
          bgClass="bg-amber-100/50 border border-amber-200" 
        />
        <SummaryCard 
          title="Near Expiry Products" 
          value={nearExpiryCount.toString()} 
          icon={<AlertTriangle className="w-6 h-6 text-rose-600" />} 
          colorClass="text-rose-600" 
          bgClass="bg-rose-100/50 border border-rose-200 shadow-[0_0_15px_rgba(225,29,72,0.15)]" 
        />
        <SummaryCard 
          title="Dead Stock Value" 
          value={formatCurrency(deadStockValue)} 
          icon={<ArchiveX className="w-6 h-6 text-slate-600" />} 
          colorClass="text-slate-700" 
          bgClass="bg-slate-100/50 border border-slate-200" 
        />
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6 flex flex-wrap items-center gap-4">
        <SearchInput value={search} onChange={setSearch} placeholder="Search product..." />
        <SelectFilter
          value={warehouse} onChange={setWarehouse}
          options={warehouseOptions.length > 0 ? warehouseOptions : [{ label: 'Main Warehouse', value: 'Main' }]}
          placeholder="All Warehouses"
        />
        <SelectFilter
          value={category} onChange={setCategory}
          options={categoryOptions.length > 0 ? categoryOptions : [{ label: 'Analgesics', value: 'Analgesics' }]}
          placeholder="All Categories"
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
          placeholder="All Status"
        />
      </div>

      {/* Main Table with hidden scrollbar */}
      <div className="mb-6">
        <h3 className="font-bold text-slate-800 mb-4 px-1">Inventory Details</h3>
        <TableCard>
          <div className="live-stock-table-container">
            <DataTable columns={columns} data={filteredData} />
          </div>
        </TableCard>
      </div>
      
      <style>{`
        .live-stock-table-container .overflow-x-auto {
          scrollbar-width: none; /* Firefox */
          -ms-overflow-style: none; /* IE and Edge */
        }
        .live-stock-table-container .overflow-x-auto::-webkit-scrollbar {
          display: none; /* Chrome, Safari, Opera */
        }
      `}</style>
    </div>
  );
}
