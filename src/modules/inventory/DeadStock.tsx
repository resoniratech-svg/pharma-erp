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

// --- Deep Mock Data Layer ---
// interface RawDeadStock {
//   id: string;
//   productName: string;
//   sku: string;
//   category: string;
//   batchNo: string;
//   mfgDate: string;
//   expiryDate: string;
//   warehouse: string;
//   location: string;
//   availableQty: number;
//   unitCost: number;
//   lastMovedDate: string;
//   isDiscontinued: boolean;
//   createdDate: string;
//   lastUpdatedDate: string;
// }

// // Generate data relative to "today" to make 'Days Since Last Movement' dynamic but realistic
// const getPastDate = (daysAgo: number) => {
//   const d = new Date();
//   d.setDate(d.getDate() - daysAgo);
//   return d.toISOString().split('T')[0];
// };

// const getFutureDate = (daysAhead: number) => {
//   const d = new Date();
//   d.setDate(d.getDate() + daysAhead);
//   return d.toISOString().split('T')[0];
// };

// const rawDatabase: RawDeadStock[] = [
//   {
//     id: 'DS-001',
//     productName: 'Old Formula Syrup',
//     sku: 'PRD-099',
//     category: 'Syrups',
//     batchNo: 'B-2023-01',
//     mfgDate: '2023-01-15',
//     expiryDate: getFutureDate(30), // Near expiry
//     warehouse: 'Hyderabad Warehouse',
//     location: 'Aisle 4, Rack B',
//     availableQty: 450,
//     unitCost: 50,
//     lastMovedDate: getPastDate(850), // 850 days ago
//     isDiscontinued: false,
//     createdDate: '15-Jan-2023',
//     lastUpdatedDate: '15-Jan-2023',
//   },
//   {
//     id: 'DS-002',
//     productName: 'Discontinued Tablets',
//     sku: 'PRD-102',
//     category: 'Tablets',
//     batchNo: 'B-2024-11',
//     mfgDate: '2024-02-10',
//     expiryDate: getFutureDate(400),
//     warehouse: 'Mumbai Warehouse',
//     location: 'Aisle 9, Rack A',
//     availableQty: 1200,
//     unitCost: 12,
//     lastMovedDate: getPastDate(365), // 1 year ago
//     isDiscontinued: true,
//     createdDate: '10-Feb-2024',
//     lastUpdatedDate: '20-Feb-2024',
//   },
//   {
//     id: 'DS-003',
//     productName: 'Vintage Ointment 50g',
//     sku: 'PRD-145',
//     category: 'Ointments',
//     batchNo: 'B-2022-05',
//     mfgDate: '2022-05-20',
//     expiryDate: getPastDate(10), // Expired
//     warehouse: 'Delhi Warehouse',
//     location: 'Aisle 2, Rack C',
//     availableQty: 800,
//     unitCost: 18,
//     lastMovedDate: getPastDate(540), // 540 days ago
//     isDiscontinued: false,
//     createdDate: '20-May-2022',
//     lastUpdatedDate: '22-May-2022',
//   },
//   {
//     id: 'DS-004',
//     productName: 'Seasonal Flu Vaccine (Outdated)',
//     sku: 'PRD-882',
//     category: 'Vaccines',
//     batchNo: 'B-2024-02',
//     mfgDate: '2024-06-01',
//     expiryDate: getFutureDate(180),
//     warehouse: 'Hyderabad Warehouse',
//     location: 'Cold Storage 1',
//     availableQty: 45000,
//     unitCost: 450,
//     lastMovedDate: getPastDate(120),
//     isDiscontinued: false,
//     createdDate: '01-Jun-2024',
//     lastUpdatedDate: '01-Jun-2024',
//   }
// ];

// --- Calculated Interfaces ---
interface CalculatedDeadStock {

  id: string;

  productName: string;

  sku: string;

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

  isDiscontinued: boolean;

}
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

  // --- Dynamic Calculation Engine ---
  const calculatedData: CalculatedDeadStock[] = useMemo(() => {
    const today = new Date();
    // Normalize to midnight for accurate day calculation
    today.setHours(0, 0, 0, 0);

    return inventory.map((stock) => {
      // const lastMoved = new Date(stock.lastUpdated);
      // lastMoved.setHours(0, 0, 0, 0);
      // const diffTime = Math.abs(today.getTime() - lastMoved.getTime());
      // const daysSinceLastMovement = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      // const expiry = new Date(expiryDate);
      // expiry.setHours(0, 0, 0, 0);
      // const expiryDiffTime = expiry.getTime() - today.getTime();
      // const daysToExpiry = Math.floor(expiryDiffTime / (1000 * 60 * 60 * 24));

      // const blockedCapital =
      //   stock.availableQty * Number(product?.sellingPrice ?? 0);
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

      // Status Rules Priority: Discontinued -> Expired -> Near Expiry -> Dead Stock
      let status: CalculatedDeadStock["status"];

      if (product?.status === "Discontinued") {
        status = "Discontinued";
      } else if (expiryStatus === "Expired") {
        status = "Expired";
      } else if (expiryStatus === "Near Expiry") {
        status = "Near Expiry";
      } else if (daysSinceLastMovement >= 180 && stock.availableQty > 0) {
        status = "Dead Stock";
      } else {
        status = "Near Expiry";
      }

      return {

    id: stock.id,

    productName:
        product?.name ?? "",

    sku:
        stock.productCode,

    category:
        product?.category ?? "",

    batchNo:
        stock.batchNo,

    warehouse:
        warehouse?.name ?? "",

    location:
        warehouse?.code ?? "",

    availableQty:
        stock.availableQty,

    unitCost:
        Number(product?.sellingPrice ?? 0),

    expiryDate,

    daysToExpiry,

    daysSinceLastMovement,

    blockedCapital,
    lastMovedDate: stock.lastUpdated,

    status,

    createdDate:
        stock.lastUpdated,

    lastUpdatedDate:
        stock.lastUpdated,

    isDiscontinued:
        product?.status === "Discontinued",

};
    });
  }, [
    inventory,
    batches,
    products,
    warehouses,
]);

  // --- Dashboard Card Metrics ---
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

  // --- Filtering ---
  const filteredData = calculatedData.filter((item) => {
    const term = search.toLowerCase();
    return item.productName.toLowerCase().includes(term) || 
           item.sku.toLowerCase().includes(term) || 
           item.batchNo.toLowerCase().includes(term);
  });

  const columns: Column<CalculatedDeadStock>[] = [
    { key: 'productName', label: 'Product Name', render: (row) => <span className="font-semibold text-slate-900">{row.productName}</span> },
    { key: 'sku', label: 'SKU', render: (row) => <span className="font-mono text-slate-500">{row.sku}</span> },
    { key: 'batchNo', label: 'Batch No', render: (row) => <span className="font-mono text-slate-700">{row.batchNo}</span> },
    { key: 'warehouse', label: 'Warehouse' },
    { key: 'availableQty', label: 'Available Qty', render: (row) => <span className="font-bold text-rose-600">{row.availableQty.toLocaleString()}</span> },
    { key: 'daysSinceLastMovement', label: 'Days Since Last Movement', render: (row) => <span className="font-medium text-slate-800">{row.daysSinceLastMovement} Days</span> },
    { key: 'lastMovedDate', label: 'Last Moved Date' },
    { key: 'expiryDate', label: 'Expiry Date', render: (row) => <span className={row.status === 'Expired' ? 'text-rose-600 font-medium' : ''}>{row.expiryDate}</span> },
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
      'Batch No': row.batchNo,
      'Warehouse': row.warehouse,
      'Available Qty': row.availableQty,
      'Days Since Last Movement': row.daysSinceLastMovement,
      'Last Moved Date': row.lastMovedDate,
      'Expiry Date': row.expiryDate,
      'Blocked Capital': row.blockedCapital,
      'Status': row.status
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Dead Stock Tracking');
    
    const fileName = `dead_stock_tracking_${getFormattedDate()}.xlsx`;
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
      ...filteredData.map(row => 
        [
          `"${row.productName}"`,
          `"${row.sku}"`,
          `"${row.batchNo}"`,
          `"${row.warehouse}"`,
          row.availableQty, 
          row.daysSinceLastMovement,
          row.lastMovedDate,
          row.expiryDate,
          row.blockedCapital,
          row.status
        ].join(',')
      )
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    const fileName = `dead_stock_tracking_${getFormattedDate()}.csv`;
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
        <SearchInput value={search} onChange={setSearch} placeholder="Search product, SKU or Batch No..." />
      </FilterBar>

      <TableCard>
        <div className="overflow-x-auto">
          <DataTable
            columns={columns}
            data={filteredData}
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
                {/* <DrawerField label="Manufacturing Date" value={selectedRecord.mfgDate} /> */}
                <DrawerField label="Expiry Date" value={<span className={selectedRecord.status === 'Expired' ? 'text-rose-600 font-semibold' : ''}>{selectedRecord.expiryDate}</span>} />
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
                  <span className="font-semibold text-amber-900">{selectedRecord.lastMovedDate}</span>
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
                <DrawerField label="Created Date" value={selectedRecord.createdDate} />
                <DrawerField label="Last Updated Date" value={selectedRecord.lastUpdatedDate} />
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
