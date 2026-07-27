import { useState, useRef, useEffect, useMemo } from 'react';
import { Download, AlertCircle, ShoppingCart, AlertTriangle, PackageMinus, Filter, ChevronDown, X } from 'lucide-react';
import * as XLSX from 'xlsx';
import {
  PageHeader,
  FilterBar,
  SearchInput,
  SelectFilter,
  ActionButton,
  TableCard,
  DataTable,
  Badge,
  SummaryCard,
  Drawer,
  DrawerField
} from './components/shared';
import { type Column } from './components/shared';
import { inventoryService } from "../../services/inventoryService";
import { productService } from "../../services/productService";
import { warehouseService } from "../../services/warehouseService";

interface CalculatedLowStock {
  id: string;
  productName: string;
  sku: string;
  category: string;
  warehouse: string;
  location: string;
  currentStock: number;
  reorderLevel: number;
  criticalLevel: number;
  suggestedQty: number;
  unit: string;
  supplier: string;
  lastUpdatedDate: string;
  status:
    | "Low Stock"
    | "Critical"
    | "Out Of Stock";
}

const formatDate = (dateString: string | undefined) => {
  if (!dateString) return "-";
  if (dateString.match(/^\d{2}-\d{2}-\d{4}$/)) {
    return dateString;
  }
  if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
    const [year, month, day] = dateString.split('-');
    return `${day}-${month}-${year}`;
  }
  const date = new Date(dateString);
  if (!isNaN(date.getTime())) {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  }
  return dateString;
};

export default function LowStockAlerts() {
  const inventory = inventoryService.getAll();
  const products = productService.getProducts();
  const warehouses = warehouseService.getAll();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  const [selectedRecord, setSelectedRecord] = useState<CalculatedLowStock | null>(null);
  
  const [showPOModal, setShowPOModal] = useState(false);
  const [poRecord, setPoRecord] = useState<CalculatedLowStock | null>(null);
  const [poForm, setPoForm] = useState({ purchaseQty: '', expectedDate: '', remarks: '' });
  
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setShowExportMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const calculatedData: CalculatedLowStock[] = useMemo(() => {
    return inventory
      .map((stock) => {
        const product = products.find((p) => p.code === stock.productCode);
        const warehouse = warehouses.find((w) => w.id === stock.warehouseId);

        const reorderLevel = Number(product?.reorderLevel ?? 0);
        const currentStock = stock.availableQty;
        const criticalLevel = Math.floor(reorderLevel * 0.5);
        const suggestedQty = Math.max(reorderLevel - currentStock, 0);

        let status: CalculatedLowStock["status"];
        if (currentStock === 0) {
          status = "Out Of Stock";
        } else if (currentStock <= criticalLevel) {
          status = "Critical";
        } else {
          status = "Low Stock";
        }

        return {
          id: stock.id,
          productName: product?.name ?? "",
          sku: stock.productCode,
          category: product?.category ?? "",
          warehouse: warehouse?.name ?? "",
          location: warehouse?.code ?? "",
          currentStock,
          reorderLevel,
          criticalLevel,
          suggestedQty,
          unit: product?.type ?? "",
          supplier: product?.manufacturer ?? "",
          lastUpdatedDate: stock.lastUpdated,
          status,
        };
      })
      .filter((item) => item.currentStock < item.reorderLevel);
  }, [inventory, products, warehouses]);

  const dashboardMetrics = useMemo(() => {
    let lowStockCount = 0;
    let outOfStockCount = 0;
    let criticalCount = 0;
    let pendingReplenishmentQty = 0;

    calculatedData.forEach(c => {
      pendingReplenishmentQty += c.suggestedQty;
      
      if (c.status === 'Out Of Stock') {
        outOfStockCount += 1;
      } else if (c.status === 'Critical') {
        criticalCount += 1;
        lowStockCount += 1; 
      } else if (c.status === 'Low Stock') {
        lowStockCount += 1;
      }
    });

    const totalLowStockProducts = calculatedData.filter(c => c.currentStock < c.reorderLevel).length;

    return {
      lowStockProducts: totalLowStockProducts,
      outOfStockProducts: outOfStockCount,
      pendingReplenishmentQty,
      criticalStockProducts: criticalCount
    };
  }, [calculatedData]);

  const filteredData = calculatedData.filter((item) => {
    const term = search.toLowerCase();
    const matchSearch = item.productName.toLowerCase().includes(term) || 
                        item.sku.toLowerCase().includes(term) ||
                        item.warehouse.toLowerCase().includes(term) ||
                        item.category.toLowerCase().includes(term);
    const matchStatus = statusFilter ? item.status === statusFilter : true;
    return matchSearch && matchStatus;
  });

  const statusOrder: Record<string, number> = {
    "Out Of Stock": 1,
    "Critical": 2,
    "Low Stock": 3,
  };

  const sortedData = [...filteredData].sort((a, b) => {
    const statusDiff = statusOrder[a.status] - statusOrder[b.status];
    if (statusDiff !== 0) return statusDiff;
    return a.currentStock - b.currentStock;
  });

  const columns: Column<CalculatedLowStock>[] = [
    { key: 'productName', label: 'Product Name', render: (row) => <span className="font-semibold text-slate-900">{row.productName}</span> },
    { key: 'sku', label: 'SKU', render: (row) => <span className="font-mono text-slate-500">{row.sku}</span> },
    { key: 'warehouse', label: 'Warehouse' },
    { key: 'currentStock', label: 'Current Stock', render: (row) => <span className="font-bold text-rose-600">{row.currentStock.toLocaleString()}</span> },
    { key: 'reorderLevel', label: 'Reorder Level', render: (row) => <span className="text-slate-500 font-medium">{row.reorderLevel.toLocaleString()}</span> },
    { key: 'suggestedQty', label: 'Suggested PO Qty', render: (row) => <span className="font-bold text-violet-700">{row.suggestedQty.toLocaleString()}</span> },
    { key: 'supplier', label: 'Primary Supplier' },
    {
      key: 'status',
      label: 'Stock Status',
      render: (row) => {
        let variant: 'success' | 'warning' | 'danger' | 'neutral' | 'info' = 'neutral';
        if (row.status === 'Out Of Stock') variant = 'danger';
        if (row.status === 'Critical') variant = 'danger';
        if (row.status === 'Low Stock') variant = 'warning';
        return <Badge variant={variant}>{row.status}</Badge>;
      },
    },
    {
      key: 'id',
      label: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-3">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setSelectedRecord(row);
            }}
            className="text-slate-600 font-medium hover:text-slate-900"
          >
            View
          </button>
        </div>
      )
    }
  ];

  const getFormattedDate = () => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}${mm}${dd}`;
  };

  const handleExportExcel = () => {
    const exportData = sortedData.map(row => ({
      'Product Name': row.productName,
      'SKU': row.sku,
      'Warehouse': row.warehouse,
      'Current Stock': row.currentStock,
      'Reorder Level': row.reorderLevel,
      'Suggested PO Qty': row.suggestedQty,
      'Primary Supplier': row.supplier,
      'Stock Status': row.status
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Low Stock Alerts');
    
    const fileName = `low_stock_alerts_${getFormattedDate()}.xlsx`;
    XLSX.writeFile(workbook, fileName);
    setShowExportMenu(false);
  };

  const handleExportCSV = () => {
    const headers = [
      'Product Name', 'SKU', 'Warehouse', 'Current Stock', 'Reorder Level', 
      'Suggested PO Qty', 'Primary Supplier', 'Stock Status'
    ];
    const csvContent = [
      headers.join(','),
      ...sortedData.map(row => 
        [
          `"${row.productName}"`,
          `"${row.sku}"`,
          `"${row.warehouse}"`,
          row.currentStock, 
          row.reorderLevel,
          row.suggestedQty,
          `"${row.supplier}"`,
          row.status
        ].join(',')
      )
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    const fileName = `low_stock_alerts_${getFormattedDate()}.csv`;
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowExportMenu(false);
  };

  const openPOModal = (row: CalculatedLowStock) => {
    setPoRecord(row);
    setPoForm({
      purchaseQty: row.suggestedQty.toString(),
      expectedDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], 
      remarks: ''
    });
    setShowPOModal(true);
  };

  const closePOModal = () => {
    setShowPOModal(false);
    setPoRecord(null);
  };

  const handleCreatePO = () => {
    if (!poForm.purchaseQty || Number(poForm.purchaseQty) <= 0) {
      alert("Please enter a valid purchase quantity.");
      return;
    }
    
    alert(`Purchase Order created successfully for ${poRecord?.productName} to supplier ${poRecord?.supplier}.`);
    closePOModal();
    if (selectedRecord && selectedRecord.id === poRecord?.id) {
        setSelectedRecord(null);
    }
  };

  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader
        title="Low Stock Alerts"
        subtitle="Items that have fallen below their minimum reorder levels."
        actions={
          <div className="relative inline-block text-left" ref={exportMenuRef}>
            <ActionButton 
              variant="secondary" 
              icon={<Download className="w-4 h-4" />}
              onClick={() => setShowExportMenu(!showExportMenu)}
            >
              Export Replenishment Report
              <ChevronDown className="w-3 h-3 ml-1" />
            </ActionButton>
            
            {showExportMenu && (
              <div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
                <div className="py-1" role="menu" aria-orientation="vertical">
                  <button
                    onClick={handleExportExcel}
                    className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                    role="menuitem"
                  >
                    Export as Excel (.xlsx)
                  </button>
                  <button
                    onClick={handleExportCSV}
                    className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                    role="menuitem"
                  >
                    Export as CSV (.csv)
                  </button>
                </div>
              </div>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <SummaryCard
          title="Low Stock Products"
          value={dashboardMetrics.lowStockProducts.toString()}
          subtitle="Below reorder level"
          icon={<AlertTriangle className="w-6 h-6" />}
          colorClass="text-amber-600"
          bgClass="bg-amber-50"
        />
        <SummaryCard
          title="Out Of Stock Products"
          value={dashboardMetrics.outOfStockProducts.toString()}
          subtitle="Zero available quantity"
          icon={<PackageMinus className="w-6 h-6" />}
          colorClass="text-rose-600"
          bgClass="bg-rose-50"
        />
        <SummaryCard
          title="Pending Replenishment Qty"
          value={`${(dashboardMetrics.pendingReplenishmentQty / 1000).toFixed(1)}k`}
          subtitle="Suggested units to order"
          icon={<ShoppingCart className="w-6 h-6" />}
          colorClass="text-[#163c78]"
          bgClass="bg-[#163c78]/10"
        />
        <SummaryCard
          title="Critical Stock Products"
          value={dashboardMetrics.criticalStockProducts.toString()}
          subtitle="Below critical threshold"
          icon={<AlertCircle className="w-6 h-6" />}
          colorClass="text-rose-600"
          bgClass="bg-rose-50"
        />
      </div>

      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search product, SKU, warehouse or category..." />
        <div className="w-px h-6 bg-slate-200 mx-2 hidden sm:block" />
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-medium text-slate-600">Filters:</span>
        </div>
        <SelectFilter
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { label: 'Out Of Stock', value: 'Out Of Stock' },
            { label: 'Critical', value: 'Critical' },
            { label: 'Low Stock', value: 'Low Stock' },
          ]}
          placeholder="All Status"
        />
      </FilterBar>

      <TableCard>
        <div className="overflow-x-auto">
          <DataTable
            columns={columns}
            data={sortedData}
            emptyMessage="No low stock alerts. Inventory is healthy."
          />
        </div>
      </TableCard>

      <Drawer
        open={!!selectedRecord}
        onClose={() => setSelectedRecord(null)}
        title="Low Stock Details"
      >
        {selectedRecord && (
          <div className="space-y-6">
            
            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">Product Information</h3>
              <div className="space-y-2">
                <DrawerField label="Product Name" value={selectedRecord.productName} />
                <DrawerField label="SKU" value={<span className="font-mono text-slate-600">{selectedRecord.sku}</span>} />
                <DrawerField label="Category" value={selectedRecord.category} />
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">Inventory Information</h3>
              <div className="space-y-2">
                <DrawerField label="Warehouse" value={selectedRecord.warehouse} />
                <DrawerField label="Reorder Level" value={<span className="font-semibold text-slate-700">{selectedRecord.reorderLevel.toLocaleString()}</span>} />
                <div className="pt-2">
                  <DrawerField label="Current Stock" value={<span className="text-xl font-bold text-rose-600">{selectedRecord.currentStock.toLocaleString()}</span>} />
                </div>
                <div className="pt-2">
                  <DrawerField label="Suggested PO Quantity" value={<span className="text-xl font-bold text-violet-700">{selectedRecord.suggestedQty.toLocaleString()}</span>} />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">Supplier Information</h3>
              <div className="space-y-2">
                <DrawerField label="Primary Supplier" value={selectedRecord.supplier} />
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">Status Information</h3>
              <div className="space-y-2">
                <DrawerField label="Stock Status" value={
                  <Badge variant={selectedRecord.status === 'Out Of Stock' || selectedRecord.status === 'Critical' ? 'danger' : 'warning'}>
                    {selectedRecord.status}
                  </Badge>
                } />
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">Audit Information</h3>
              <div className="space-y-2">
                <DrawerField label="Last Updated Date" value={formatDate(selectedRecord.lastUpdatedDate)} />
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100 flex justify-end gap-3">
              <ActionButton variant="secondary" onClick={() => setSelectedRecord(null)}>Close</ActionButton>
            </div>
          </div>
        )}
      </Drawer>

      {showPOModal && poRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 backdrop-blur-[2px] bg-slate-900/40">
          <div className="bg-white rounded-2xl shadow-2xl flex flex-col animate-in zoom-in-95 duration-200 w-full max-w-lg overflow-hidden">
            
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white">
              <h2 className="text-lg font-bold text-slate-900">Create Purchase Order</h2>
              <button 
                onClick={closePOModal} 
                className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3 mb-6">
                <div className="flex justify-between">
                  <span className="text-sm text-slate-500">Product:</span>
                  <span className="text-sm font-semibold text-slate-900">{poRecord.productName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-500">SKU:</span>
                  <span className="text-sm font-mono text-slate-700">{poRecord.sku}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-500">Supplier:</span>
                  <span className="text-sm font-medium text-slate-700">{poRecord.supplier}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-500">Warehouse:</span>
                  <span className="text-sm font-medium text-slate-700">{poRecord.warehouse}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-200">
                  <span className="text-sm text-slate-500 font-medium">Suggested PO Qty:</span>
                  <span className="text-sm font-bold text-violet-700">{poRecord.suggestedQty.toLocaleString()}</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Purchase Quantity *</label>
                <input 
                  type="number" 
                  value={poForm.purchaseQty} 
                  onChange={e => setPoForm({...poForm, purchaseQty: e.target.value})} 
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent" 
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Expected Delivery Date *</label>
                <input 
                  type="date" 
                  value={poForm.expectedDate} 
                  onChange={e => setPoForm({...poForm, expectedDate: e.target.value})} 
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent" 
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Remarks (Optional)</label>
                <textarea 
                  value={poForm.remarks} 
                  onChange={e => setPoForm({...poForm, remarks: e.target.value})} 
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent" 
                  rows={2}
                  placeholder="e.g. Urgent fulfillment required"
                />
              </div>

            </div>

            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <ActionButton variant="secondary" onClick={closePOModal}>Cancel</ActionButton>
              <ActionButton icon={<ShoppingCart className="w-4 h-4" />} onClick={handleCreatePO}>Create PO</ActionButton>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}