import { useState, useRef, useEffect, useMemo } from 'react';
import { Download, AlertTriangle, IndianRupee, PackageMinus, Clock, ChevronDown } from 'lucide-react';
import * as XLSX from 'xlsx';
import {
  PageHeader,
  FilterBar,
  SearchInput,
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
import { batchService } from "../../services/batchService";
import { productService } from "../../services/productService";
import { warehouseService } from "../../services/warehouseService";

import {
  getExpiryStatus,
  getDaysToExpiry,
} from "../../utils/expiryUtils";

interface CalculatedDeadStock {
  id: string;
  productName: string;
  sku: string;
  barcode: string;
  category: string;
  batchNo: string;
  warehouse: string;
  location: string;
  availableQty: number;
  unitCost: number;
  expiryDate: string;
  daysToExpiry: number;
  daysSinceLastMovement: number;
  blockedCapital: number;
  status:
    | "Dead Stock"
    | "Near Expiry"
    | "Expired"
    | "Discontinued";
  lastMovedDate: string;  
  createdDate: string;
  lastUpdatedDate: string;
  createdBy?: string;
  lastUpdatedBy?: string;
  isDiscontinued: boolean;
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

const formatCurrency = (value: number) => {
  if (value >= 10000000) return `₹ ${(value / 10000000).toFixed(2)} Cr`;
  if (value >= 100000) return `₹ ${(value / 100000).toFixed(2)} L`;
  return `₹ ${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
};

export default function DeadStock() {
  const inventory = inventoryService.getAll();
  const batches = batchService.getAll();
  const products = productService.getProducts();
  const warehouses = warehouseService.getAll();
  const [search, setSearch] = useState('');

  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  const [selectedRecord, setSelectedRecord] = useState<CalculatedDeadStock | null>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setShowExportMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const calculatedData: CalculatedDeadStock[] = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return inventory.reduce<CalculatedDeadStock[]>((acc, stock) => {
      const batch = batches.find((b) => b.batchNo === stock.batchNo);
      const product = products.find((p) => p.code === stock.productCode);
      const warehouse = warehouses.find((w) => w.id === stock.warehouseId);

      const expiryDate = batch?.expDate ?? "";
      const lastMoved = new Date(stock.lastUpdated);
      lastMoved.setHours(0, 0, 0, 0);

      const diffTime = today.getTime() - lastMoved.getTime();
      const daysSinceLastMovement = Math.floor(
        diffTime / (1000 * 60 * 60 * 24),
      );

      const daysToExpiry = getDaysToExpiry(expiryDate);
      const expiryStatus = getExpiryStatus(expiryDate);
      const blockedCapital =
        stock.availableQty * Number(product?.sellingPrice ?? 0);

      let status: CalculatedDeadStock["status"] | "Healthy";
      if (product?.status === "Discontinued") {
        status = "Discontinued";
      } else if (expiryStatus === "Expired") {
        status = "Expired";
      } else if (expiryStatus === "Near Expiry") {
        status = "Near Expiry";
      } else if (daysSinceLastMovement >= 180 && stock.availableQty > 0) {
        status = "Dead Stock";
      } else {
        status = "Healthy";
      }

      if (status !== "Healthy") {
        acc.push({
          id: stock.id,
          productName: product?.name ?? "",
          sku: stock.productCode,
          barcode: batch?.barcode || product?.barcode || "",
          category: product?.category ?? "",
          batchNo: stock.batchNo,
          warehouse: warehouse?.name ?? "",
          location: warehouse?.code ?? "",
          availableQty: stock.availableQty,
          unitCost: Number(product?.sellingPrice ?? 0),
          expiryDate,
          daysToExpiry,
          daysSinceLastMovement,
          blockedCapital,
          lastMovedDate: stock.lastUpdated,
          status,
          createdDate: batch?.createdDate || stock.lastUpdated,
          lastUpdatedDate: batch?.lastUpdatedDate || stock.lastUpdated,
          createdBy: batch?.createdBy || "System",
          lastUpdatedBy: batch?.lastUpdatedBy || "System",
          isDiscontinued: product?.status === "Discontinued",
        });
      }

      return acc;
    }, []);
  }, [inventory, batches, products, warehouses]);

  const dashboardMetrics = useMemo(() => {
    const uniqueProducts = new Set(calculatedData.map(c => c.sku)).size;
    const deadStocks = calculatedData.filter((d) => d.status === "Dead Stock");

    const totalQuantity = deadStocks.reduce(
      (acc, curr) => acc + curr.availableQty,
      0,
    );

    const totalBlockedCapital = deadStocks.reduce(
      (acc, curr) => acc + curr.blockedCapital,
      0,
    );
    
    let maxDays = 0;
    calculatedData.forEach(c => {
      if (c.daysSinceLastMovement > maxDays) maxDays = c.daysSinceLastMovement;
    });

    let oldestStr = '0 Days';
    if (maxDays > 365) {
      oldestStr = `${(maxDays / 365).toFixed(1)} Years`;
    } else {
      oldestStr = `${maxDays} Days`;
    }

    return {
      uniqueProducts,
      totalQuantity,
      totalBlockedCapital,
      oldestDeadStock: oldestStr
    };
  }, [calculatedData]);

  const filteredData = calculatedData.filter((item) => {
    const term = search.toLowerCase();
    return item.productName.toLowerCase().includes(term) || 
           item.sku.toLowerCase().includes(term) || 
           item.batchNo.toLowerCase().includes(term) ||
           item.barcode.toLowerCase().includes(term) ||
           item.warehouse.toLowerCase().includes(term) ||
           item.status.toLowerCase().includes(term);
  });

  const sortedData = [...filteredData].sort((a, b) => {
    const dateA = new Date(a.createdDate).getTime();
    const dateB = new Date(b.createdDate).getTime();
    if (!isNaN(dateA) && !isNaN(dateB)) {
      return dateB - dateA; // Newest first
    }
    return 0;
  });

  const columns: Column<CalculatedDeadStock>[] = [
    { key: 'productName', label: 'Product Name', render: (row) => <span className="font-semibold text-slate-900">{row.productName}</span> },
    { key: 'sku', label: 'SKU', render: (row) => <span className="font-mono text-slate-500">{row.sku}</span> },
    { key: 'batchNo', label: 'Batch No', render: (row) => <span className="font-mono text-slate-700">{row.batchNo}</span> },
    { key: 'warehouse', label: 'Warehouse' },
    { key: 'availableQty', label: 'Available Qty', render: (row) => <span className="font-bold text-rose-600">{row.availableQty.toLocaleString()}</span> },
    { key: 'daysSinceLastMovement', label: 'Days Since Last Movement', render: (row) => <span className="font-medium text-slate-800">{row.daysSinceLastMovement} Days</span> },
    { key: 'lastMovedDate', label: 'Last Moved Date', render: (row) => formatDate(row.lastMovedDate) },
    { key: 'expiryDate', label: 'Expiry Date', render: (row) => <span className={row.status === 'Expired' ? 'text-rose-600 font-medium' : ''}>{formatDate(row.expiryDate)}</span> },
    { key: 'blockedCapital', label: 'Blocked Capital', render: (row) => <span className="font-bold text-slate-800">₹ {row.blockedCapital.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span> },
    {
      key: 'status',
      label: 'Status',
      render: (row) => {
        let variant: 'success' | 'warning' | 'danger' | 'neutral' | 'info' | 'purple' = 'neutral';
        if (row.status === 'Dead Stock') variant = 'neutral';
        if (row.status === 'Near Expiry') variant = 'warning';
        if (row.status === 'Expired') variant = 'danger';
        if (row.status === 'Discontinued') variant = 'purple';
        return <Badge variant={variant as any}>{row.status}</Badge>;
      },
    },
    {
      key: 'id',
      label: 'Actions',
      render: (row) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setSelectedRecord(row);
          }}
          className="text-violet-600 font-medium hover:text-violet-800"
        >
          View
        </button>
      )
    }
  ];

  const handleExportExcel = () => {
    const exportData = sortedData.map(row => ({
      'Product Name': row.productName,
      'SKU': row.sku,
      'Batch No': row.batchNo,
      'Warehouse': row.warehouse,
      'Available Qty': row.availableQty,
      'Days Since Last Movement': row.daysSinceLastMovement,
      'Last Moved Date': formatDate(row.lastMovedDate),
      'Expiry Date': formatDate(row.expiryDate),
      'Blocked Capital': row.blockedCapital,
      'Status': row.status
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Dead Stock Tracking');
    
    const fileName = `dead_stock_tracking_${new Date().getTime()}.xlsx`;
    XLSX.writeFile(workbook, fileName);
    setShowExportMenu(false);
  };

  const handleExportCSV = () => {
    const headers = [
      'Product Name', 'SKU', 'Batch No', 'Warehouse', 'Available Qty', 
      'Days Since Last Movement', 'Last Moved Date', 'Expiry Date', 
      'Blocked Capital', 'Status'
    ];
    const csvContent = [
      headers.join(','),
      ...sortedData.map(row => 
        [
          `"${row.productName}"`,
          `"${row.sku}"`,
          `"${row.batchNo}"`,
          `"${row.warehouse}"`,
          row.availableQty, 
          row.daysSinceLastMovement,
          formatDate(row.lastMovedDate),
          formatDate(row.expiryDate),
          row.blockedCapital,
          row.status
        ].join(',')
      )
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    const fileName = `dead_stock_tracking_${new Date().getTime()}.csv`;
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowExportMenu(false);
  };

  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader
        title="Dead Stock Tracking"
        subtitle="Identify non-moving inventory and blocked capital."
        actions={
          <div className="relative inline-block text-left" ref={exportMenuRef}>
            <ActionButton 
              variant="secondary" 
              icon={<Download className="w-4 h-4" />}
              onClick={() => setShowExportMenu(!showExportMenu)}
            >
              Export Report
              <ChevronDown className="w-3 h-3 ml-1" />
            </ActionButton>
            
            {showExportMenu && (
              <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
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
          title="Total Dead Stock Products"
          value={dashboardMetrics.uniqueProducts.toString()}
          subtitle="Unique SKUs"
          icon={<PackageMinus className="w-6 h-6" />}
          colorClass="text-violet-600"
          bgClass="bg-violet-50"
        />
        <SummaryCard
          title="Total Dead Stock Quantity"
          value={`${(dashboardMetrics.totalQuantity / 1000).toFixed(1)}k`}
          subtitle="Units currently blocked"
          icon={<AlertTriangle className="w-6 h-6" />}
          colorClass="text-rose-600"
          bgClass="bg-rose-50"
        />
        <SummaryCard
          title="Total Blocked Capital"
          value={formatCurrency(dashboardMetrics.totalBlockedCapital)}
          subtitle="Value tied in dead inventory"
          icon={<IndianRupee className="w-6 h-6" />}
          colorClass="text-amber-600"
          bgClass="bg-amber-50"
        />
        <SummaryCard
          title="Oldest Dead Stock"
          value={dashboardMetrics.oldestDeadStock}
          subtitle="Since last movement"
          icon={<Clock className="w-6 h-6" />}
          colorClass="text-slate-600"
          bgClass="bg-slate-100"
        />
      </div>

      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search product, SKU, batch, barcode or warehouse..." />
      </FilterBar>

      <TableCard>
        <div className="overflow-x-auto">
          <DataTable
            columns={columns}
            data={sortedData}
            emptyMessage="No dead stock found. Great job!"
          />
        </div>
      </TableCard>

      {/* Dead Stock Details Drawer */}
      <Drawer
        open={!!selectedRecord}
        onClose={() => setSelectedRecord(null)}
        title="Dead Stock Details"
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
                <DrawerField label="Status" value={<Badge variant={selectedRecord.status === 'Dead Stock' ? 'neutral' : selectedRecord.status === 'Near Expiry' ? 'warning' : selectedRecord.status === 'Expired' ? 'danger' : 'purple'}>{selectedRecord.status}</Badge>} />
              </div>
            </div>

            {/* Batch Information */}
            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">Batch Information</h3>
              <div className="space-y-2">
                <DrawerField label="Batch Number" value={<span className="font-mono text-slate-700 bg-slate-50 px-2 py-1 rounded border border-slate-100">{selectedRecord.batchNo}</span>} />
                <DrawerField label="Expiry Date" value={<span className={selectedRecord.status === 'Expired' ? 'text-rose-600 font-semibold' : ''}>{formatDate(selectedRecord.expiryDate)}</span>} />
              </div>
            </div>

            {/* Inventory Information */}
            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">Inventory Information</h3>
              <div className="space-y-2">
                <DrawerField label="Warehouse" value={selectedRecord.warehouse} />
                <DrawerField label="Location / Bin" value={selectedRecord.location} />
                <div className="pt-2">
                  <DrawerField label="Available Quantity" value={<span className="text-xl font-bold text-rose-600">{selectedRecord.availableQty.toLocaleString()}</span>} />
                </div>
              </div>
            </div>

            {/* Movement Information */}
            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">Movement Information</h3>
              <div className="space-y-2 bg-amber-50 p-4 rounded-xl border border-amber-100">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-amber-800 font-medium">Last Movement Date</span>
                  <span className="font-semibold text-amber-900">{formatDate(selectedRecord.lastMovedDate)}</span>
                </div>
                <div className="flex justify-between items-center text-sm pt-2 border-t border-amber-200">
                  <span className="text-amber-800 font-medium">Days Since Last Movement</span>
                  <span className="font-bold text-amber-900">{selectedRecord.daysSinceLastMovement} Days</span>
                </div>
              </div>
            </div>

            {/* Financial Information */}
            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">Financial Information</h3>
              <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500">Unit Cost</span>
                  <span className="font-semibold text-slate-900">₹ {selectedRecord.unitCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between items-center text-sm pt-2 border-t border-slate-200">
                  <span className="font-medium text-slate-700">Blocked Capital</span>
                  <span className="text-lg font-bold text-slate-900">₹ {selectedRecord.blockedCapital.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>

            {/* Audit Information */}
            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">Audit Information</h3>
              <div className="space-y-2">
                <DrawerField label="Created By" value={selectedRecord.createdBy || 'System'} />
                <DrawerField label="Created On" value={formatDate(selectedRecord.createdDate)} />
                <DrawerField label="Updated By" value={selectedRecord.lastUpdatedBy || 'System'} />
                <DrawerField label="Updated On" value={formatDate(selectedRecord.lastUpdatedDate)} />
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100 flex justify-end gap-3">
              <ActionButton variant="secondary" onClick={() => setSelectedRecord(null)}>Close</ActionButton>
            </div>
          </div>
        )}
      </Drawer>

    </div>
  );
}