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

// --- Deep Mock Data Layer ---
// interface RawInventoryItem {
//   id: string;
//   productName: string;
//   sku: string;
//   category: string;
//   warehouse: string;
//   currentStock: number;
//   reorderLevel: number;
//   criticalLevel: number;
//   safetyStock: number;
//   supplier: string;
//   supplierContact: string;
//   lastPurchaseDate: string;
//   lastSaleDate: string;
//   lastUpdatedDate: string;
// }

// Full inventory state (includes healthy stock which will be filtered out)
// const rawDatabase: RawInventoryItem[] = [
//   {
//     id: 'INV-001',
//     productName: 'Paracetamol 650mg',
//     sku: 'PRD-002',
//     category: 'Tablets',
//     warehouse: 'Hyderabad Warehouse',
//     currentStock: 850,
//     reorderLevel: 2000,
//     criticalLevel: 1000,
//     safetyStock: 500,
//     supplier: 'HealthPlus Inc.',
//     supplierContact: 'contact@healthplus.com',
//     lastPurchaseDate: '15-Aug-2026',
//     lastSaleDate: '18-Oct-2026',
//     lastUpdatedDate: '18-Oct-2026',
//   },
//   {
//     id: 'INV-002',
//     productName: 'Cough Syrup 100ml',
//     sku: 'PRD-003',
//     category: 'Syrups',
//     warehouse: 'Mumbai Warehouse',
//     currentStock: 0,
//     reorderLevel: 500,
//     criticalLevel: 200,
//     safetyStock: 100,
//     supplier: 'MediCare Supply',
//     supplierContact: 'sales@medicare.com',
//     lastPurchaseDate: '01-May-2026',
//     lastSaleDate: '10-Oct-2026',
//     lastUpdatedDate: '10-Oct-2026',
//   },
//   {
//     id: 'INV-003',
//     productName: 'Bandages 10cm',
//     sku: 'PRD-045',
//     category: 'Consumables',
//     warehouse: 'Delhi Warehouse',
//     currentStock: 120,
//     reorderLevel: 300,
//     criticalLevel: 150,
//     safetyStock: 50,
//     supplier: 'Surgicals Ltd.',
//     supplierContact: 'orders@surgicals.com',
//     lastPurchaseDate: '12-Sep-2026',
//     lastSaleDate: '15-Oct-2026',
//     lastUpdatedDate: '15-Oct-2026',
//   },
//   {
//     id: 'INV-004',
//     productName: 'Healthy Vitamin C',
//     sku: 'PRD-099',
//     category: 'Vitamins',
//     warehouse: 'Bangalore Warehouse',
//     currentStock: 5000,
//     reorderLevel: 1000,
//     criticalLevel: 500,
//     safetyStock: 500,
//     supplier: 'VitaLife',
//     supplierContact: 'supply@vitalife.com',
//     lastPurchaseDate: '10-Oct-2026',
//     lastSaleDate: '18-Oct-2026',
//     lastUpdatedDate: '18-Oct-2026',
//   }
// ];

// --- Calculated Interfaces ---
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

export default function LowStockAlerts() {

  const inventory = inventoryService.getAll();

  const products = productService.getProducts();

  const warehouses = warehouseService.getAll();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  const [selectedRecord, setSelectedRecord] = useState<CalculatedLowStock | null>(null);
  
  // Create PO Modal State
  const [showPOModal, setShowPOModal] = useState(false);
  const [poRecord, setPoRecord] = useState<CalculatedLowStock | null>(null);
  const [poForm, setPoForm] = useState({ purchaseQty: '', expectedDate: '', remarks: '' });
  
  // Local list to persist removals after PO is created (simulating state flow)
  

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setShowExportMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // --- Dynamic Calculation Engine ---
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

  // --- Dashboard Card Metrics ---
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
        lowStockCount += 1; // Critical is a subset of Low Stock conceptually, but let's count separately or inclusively based on requirement.
                            // Requirement says "Count of products where Available Qty < Reorder Level". That includes Critical and Out of Stock.
      } else if (c.status === 'Low Stock') {
        lowStockCount += 1;
      }
    });

    // Recalculate low stock count properly according to rule:
    const totalLowStockProducts = calculatedData.filter(c => c.currentStock < c.reorderLevel).length;

    return {
      lowStockProducts: totalLowStockProducts,
      outOfStockProducts: outOfStockCount,
      pendingReplenishmentQty,
      criticalStockProducts: criticalCount
    };
  }, [calculatedData]);

  // --- Filtering ---
  const filteredData = calculatedData.filter((item) => {
    const term = search.toLowerCase();
    const matchSearch = item.productName.toLowerCase().includes(term) || 
                        item.sku.toLowerCase().includes(term);
    const matchStatus = statusFilter ? item.status === statusFilter : true;
    return matchSearch && matchStatus;
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
          <ActionButton 
            variant="secondary" 
            icon={<ShoppingCart className="w-4 h-4" />}
            onClick={() => openPOModal(row)}
          >
            Create PO
          </ActionButton>
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
    const exportData = filteredData.map(row => ({
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
      ...filteredData.map(row => 
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

  // --- Create PO Logic ---
  const openPOModal = (row: CalculatedLowStock) => {
    setPoRecord(row);
    setPoForm({
      purchaseQty: row.suggestedQty.toString(),
      expectedDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // +7 days
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
    
    // Simulate procurement workflow: We assume PO is sent, and upon arrival GRN increases stock.
    // For local mock demonstration, we can simulate an immediate stock arrival to resolve the alert.
    // const updatedList = activeAlertsList.map(item => {
    //   if (item.id === poRecord?.id) {
    //     return {
    //       ...item,
    //       currentStock: item.currentStock + Number(poForm.purchaseQty)
    //     };
    //   }
    //   return item;
    // });

    // setActiveAlertsList(updatedList);
    
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
          colorClass="text-violet-600"
          bgClass="bg-violet-50"
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
        <SearchInput value={search} onChange={setSearch} placeholder="Search product or SKU..." />
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
            data={filteredData}
            emptyMessage="No low stock alerts. Inventory is healthy."
          />
        </div>
      </TableCard>

      {/* Low Stock Details Drawer */}
      <Drawer
        open={!!selectedRecord}
        onClose={() => setSelectedRecord(null)}
        title="Low Stock Details"
      >
        {selectedRecord && (
          <div className="space-y-6">
            
            {/* Product Information */}
            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">Product Information</h3>
              <div className="space-y-2">
                <DrawerField label="Product Name" value={selectedRecord.productName} />
                <DrawerField label="SKU" value={<span className="font-mono text-slate-600">{selectedRecord.sku}</span>} />
                <DrawerField label="Category" value={selectedRecord.category} />
              </div>
            </div>

            {/* Inventory Information */}
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

            {/* Supplier Information */}
            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">Supplier Information</h3>
              <div className="space-y-2">
                <DrawerField label="Primary Supplier" value={selectedRecord.supplier} />
                {/* <DrawerField label="Supplier Contact" value={<span className="text-violet-600">{selectedRecord.supplierContact}</span>} /> */}
              </div>
            </div>

            {/* Movement Information */}
            {/* <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">Movement Information</h3>
              <div className="space-y-2">
                <DrawerField label="Last Purchase Date" value={selectedRecord.lastPurchaseDate} />
                <DrawerField label="Last Sale Date" value={selectedRecord.lastSaleDate} />
              </div>
            </div> */}

            {/* Status Information */}
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

            {/* Audit Information */}
            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">Audit Information</h3>
              <div className="space-y-2">
                <DrawerField label="Last Updated Date" value={selectedRecord.lastUpdatedDate} />
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100 flex justify-end gap-3">
              <ActionButton variant="secondary" onClick={() => setSelectedRecord(null)}>Close</ActionButton>
              <ActionButton icon={<ShoppingCart className="w-4 h-4" />} onClick={() => openPOModal(selectedRecord)}>Create PO</ActionButton>
            </div>
          </div>
        )}
      </Drawer>

      {/* Create PO Modal */}
      {showPOModal && poRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 backdrop-blur-[2px] bg-slate-900/40">
          <div className="bg-white rounded-2xl shadow-2xl flex flex-col animate-in zoom-in-95 duration-200 w-full max-w-lg overflow-hidden">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white">
              <h2 className="text-lg font-bold text-slate-900">Create Purchase Order</h2>
              <button 
                onClick={closePOModal} 
                className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              
              {/* Prefilled Context */}
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

              {/* Editable Fields */}
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

            {/* Modal Footer */}
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
