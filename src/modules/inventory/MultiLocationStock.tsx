import { useState, useRef, useEffect } from 'react';
import { Download, ChevronDown, Filter } from 'lucide-react';
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
  Drawer,
  DrawerField
} from './components/shared';
import { type Column } from './components/shared';
import { inventoryService } from "../../services/inventoryService";
import { warehouseService } from "../../services/warehouseService";
import { productService } from "../../services/productService";

// --- Data Models ---

// interface Product {
//   name: string;
//   sku: string;
//   category: string;
//   packType: string;
//   uom: string;
//   reorderLevel: number;
// }

// interface Location {
//   code: string;
//   name: string;
//   city: string;
//   state: string;
//   type: string;
//   status: 'Active' | 'Inactive';
// }

interface InventoryRecord {
  id: string;
  productName: string;
  sku: string;
  category: string;
  packType: string;
  uom: string;
  location: string;
  locationCode: string;
  city: string;
  state: string;
  type: string;
  locationStatus: string;
  availableQty: number;
  reorderLevel: number;
  status: 'In Stock' | 'Low Stock' | 'Out Of Stock';
  createdBy: string;
  createdDate: string;
  lastUpdatedBy: string;
  lastUpdatedDate: string;
}

// interface Transaction {
//   sku: string;
//   locationCode: string;
//   type: 'Inward' | 'Outward';
//   qty: number;
// }

// interface Batch {
//   sku: string;
//   locationCode: string;
//   batchNo: string;
//   expiryDate: string;
//   qty: number;
// }

// const mockProducts: Product[] = [
//   { name: 'Paracetamol 650mg', sku: 'PRD-001', category: 'Tablets', packType: 'Box', uom: 'Units', reorderLevel: 1000 },
//   { name: 'Amoxicillin 500mg', sku: 'PRD-002', category: 'Capsules', packType: 'Bottle', uom: 'Units', reorderLevel: 500 },
// ];

// const initialLocations: Location[] = [
//   { code: 'HYD001', name: 'Hyderabad Warehouse', city: 'Hyderabad', state: 'Telangana', type: 'Regional Warehouse', status: 'Active' },
//   { code: 'MUM001', name: 'Mumbai Warehouse', city: 'Mumbai', state: 'Maharashtra', type: 'Regional Warehouse', status: 'Active' },
//   { code: 'DEL001', name: 'Delhi Warehouse', city: 'Delhi', state: 'Delhi', type: 'Distribution Center', status: 'Active' },
// ];

// // Mapping: `${SKU}_${LocationCode}` -> quantity
// const initialInventoryMap: Record<string, number> = {
//   'PRD-001_HYD001': 5000,
//   'PRD-001_MUM001': 2000,
//   'PRD-001_DEL001': 500,
//   'PRD-002_HYD001': 1200,
//   'PRD-002_MUM001': 0,
//   'PRD-002_DEL001': 1500,
// };

// const mockTransactions: Transaction[] = [
//   { sku: 'PRD-001', locationCode: 'HYD001', type: 'Inward', qty: 8000 },
//   { sku: 'PRD-001', locationCode: 'HYD001', type: 'Outward', qty: 3000 },
//   { sku: 'PRD-001', locationCode: 'MUM001', type: 'Inward', qty: 4000 },
//   { sku: 'PRD-001', locationCode: 'MUM001', type: 'Outward', qty: 2000 },
//   { sku: 'PRD-001', locationCode: 'DEL001', type: 'Inward', qty: 1000 },
//   { sku: 'PRD-001', locationCode: 'DEL001', type: 'Outward', qty: 500 },
// ];

// const mockBatches: Batch[] = [
//   { sku: 'PRD-001', locationCode: 'HYD001', batchNo: 'B-2025-001', expiryDate: '2026-12-15', qty: 2000 },
//   { sku: 'PRD-001', locationCode: 'HYD001', batchNo: 'B-2025-002', expiryDate: '2027-01-20', qty: 3000 },
//   { sku: 'PRD-001', locationCode: 'MUM001', batchNo: 'B-2024-089', expiryDate: '2025-11-10', qty: 2000 },
// ];

export default function MultiLocationStock() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [inventory, setInventory] = useState(inventoryService.getAll());

  const [warehouses] = useState(warehouseService.getAll());

  const [products] = useState(productService.getProducts());
  useEffect(() => {
    setInventory(inventoryService.getAll());
  }, []);

 
  
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  const [selectedRecord, setSelectedRecord] = useState<InventoryRecord | null>(null);

  

  // Handle clicking outside export menu to close it
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setShowExportMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Compute flattened table data
  const tableData = inventory.map((stock) => {

  const warehouse = warehouses.find(
    (w) => w.id === stock.warehouseId
  );

  const product = products.find(
    (p) => p.code === stock.productCode
  );

  const reorderLevel = Number(product?.reorderLevel ?? 0);

  let status: "In Stock" | "Low Stock" | "Out Of Stock";

  if (stock.availableQty <= 0) {
    status = "Out Of Stock";
  } else if (stock.availableQty <= reorderLevel) {
    status = "Low Stock";
  } else {
    status = "In Stock";
  }

  return {
  ...stock,

  sku: stock.productCode,

  productName: stock.productName,

  category: product?.category ?? "",

  packType: product?.packingType ?? "",

  uom: product?.type ?? "",

  location: warehouse
    ? `${warehouse.code} - ${warehouse.name}`
    : "",

  locationCode: warehouse?.code ?? "",

  city: warehouse?.city ?? "",

  state: warehouse?.state ?? "",

  type: warehouse?.type ?? "",

  locationStatus: warehouse?.status ?? "",

  availableQty: stock.availableQty,

  reorderLevel,

  status,

  createdBy: "",
createdDate: "",
lastUpdatedBy: "",
lastUpdatedDate: "",

  
};

});

  const filteredData = tableData.filter((item) => {
    const matchesSearch = item.productName.toLowerCase().includes(search.toLowerCase()) || 
                          item.sku.toLowerCase().includes(search.toLowerCase()) ||
                          item.location.toLowerCase().includes(search.toLowerCase());
                          
    const matchesStatus = statusFilter ? item.status === statusFilter : true;

    return matchesSearch && matchesStatus;
  });

  const columns: Column<InventoryRecord>[] = [
    { key: 'productName', label: 'Product Name', render: (row) => <span className="font-semibold text-slate-900">{row.productName}</span> },
    { key: 'sku', label: 'SKU', render: (row) => <span className="text-slate-600">{row.sku}</span> },
    { key: 'location', label: 'Location' },
    { key: 'availableQty', label: 'Available Qty', render: (row) => <span className="font-medium text-slate-900">{row.availableQty}</span> },
    { key: 'reorderLevel', label: 'Reorder Level', render: (row) => <span className="text-slate-500">{row.reorderLevel}</span> },
    { 
      key: 'status', 
      label: 'Status', 
      render: (row) => {
        const variant = row.status === 'In Stock' ? 'success' : row.status === 'Low Stock' ? 'warning' : 'danger';
        return <Badge variant={variant}>{row.status}</Badge>;
      } 
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
      'Location': row.location,
      'Available Qty': row.availableQty,
      'Reorder Level': row.reorderLevel,
      'Status': row.status
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Inventory');
    
    const fileName = `multi_location_inventory_${getFormattedDate()}.xlsx`;
    XLSX.writeFile(workbook, fileName);
    setShowExportMenu(false);
  };

  const handleExportCSV = () => {
    const headers = ['Product Name', 'SKU', 'Location', 'Available Qty', 'Reorder Level', 'Status'];
    const csvContent = [
      headers.join(','),
      ...filteredData.map(row => 
        [
          `"${row.productName}"`, 
          row.sku, 
          `"${row.location}"`, 
          row.availableQty, 
          row.reorderLevel, 
          row.status
        ].join(',')
      )
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    const fileName = `multi_location_inventory_${getFormattedDate()}.csv`;
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowExportMenu(false);
  };

  

  // const handleSaveLocation = () => {
  //   if (!newLocation.code || !newLocation.name || !newLocation.city || !newLocation.state || !newLocation.type || !newLocation.status) {
  //     alert("Please fill all mandatory fields.");
  //     return;
  //   }

  //   const codeExists = warehouses.some(
  //     (w) => w.code.toLowerCase() === newLocation.code.toLowerCase(),
  //   );

  //   if (codeExists) {
  //     alert("Location Code must be unique.");
  //     return;
  //   }

  //   const nameExists = warehouses.some(
  //     (w) => w.name.toLowerCase() === newLocation.name.toLowerCase(),
  //   );

  //   if (nameExists) {
  //     alert("Location Name must be unique.");
  //     return;
  //   }

  //   const updatedWarehouses = [
  //     ...warehouses,
  //     {
  //       id: Date.now().toString(),
  //       ...newLocation,
  //     },
  //   ];

  //   setWarehouses(updatedWarehouses);

  //   warehouseService.saveAll(updatedWarehouses);

  //   setShowLocationModal(false);
  // };

  // const getStockMovementSummary = (sku: string, locationCode: string) => {
  //   const relevantTransactions = mockTransactions.filter(t => t.sku === sku && t.locationCode === locationCode);
  //   const totalInward = relevantTransactions.filter(t => t.type === 'Inward').reduce((acc, curr) => acc + curr.qty, 0);
  //   const totalOutward = relevantTransactions.filter(t => t.type === 'Outward').reduce((acc, curr) => acc + curr.qty, 0);
  //   return { totalInward, totalOutward };
  // };

  // const getBatchInformation = (sku: string, locationCode: string) => {
  //   const relevantBatches = mockBatches.filter(b => b.sku === sku && b.locationCode === locationCode);
    
  //   // Ensure accurate active batch count (qty > 0 and expiry in future)
  //   const today = new Date();
  //   today.setHours(0,0,0,0);

  //   const activeBatchesList = relevantBatches.filter(b => {
  //     const exp = new Date(b.expiryDate);
  //     return b.qty > 0 && exp >= today;
  //   });

  //   const activeBatchesCount = activeBatchesList.length;

  //   // Find nearest expiry
  //   let nearestBatch: Batch | null = null;
  //   if (activeBatchesList.length > 0) {
  //     nearestBatch = activeBatchesList.reduce((prev, curr) => {
  //       return new Date(prev.expiryDate) < new Date(curr.expiryDate) ? prev : curr;
  //     });
  //   }

  //   return {
  //     activeBatches: activeBatchesCount,
  //     nearestBatchNo: nearestBatch ? nearestBatch.batchNo : 'N/A',
  //     nearestExpiryDate: nearestBatch ? new Date(nearestBatch.expiryDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-') : 'N/A'
  //   };
  // };

  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader
        title="Multi-Location Inventory Management"
        subtitle="Track inventory levels across all registered warehouses and branches."
        actions={
          <>
            <div className="relative inline-block text-left" ref={exportMenuRef}>
              <ActionButton 
                variant="secondary" 
                icon={<Download className="w-4 h-4" />}
                onClick={() => setShowExportMenu(!showExportMenu)}
              >
                Export
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
            {/* <ActionButton icon={<Plus className="w-4 h-4" />} onClick={openAddLocationModal}>
              Add Location
            </ActionButton> */}
          </>
        }
      />

      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search product, SKU or location..." />
        
        <div className="w-px h-6 bg-slate-200 mx-2 hidden sm:block" />
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-medium text-slate-600">Filters:</span>
        </div>

        <SelectFilter
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { label: 'In Stock', value: 'In Stock' },
            { label: 'Low Stock', value: 'Low Stock' },
            { label: 'Out Of Stock', value: 'Out Of Stock' },
          ]}
          placeholder="All Status"
        />
      </FilterBar>

      <TableCard>
        <DataTable
          columns={columns}
          data={filteredData}
          emptyMessage="No location stock data found."
        />
      </TableCard>

      {/* Add Location Modal
      {showLocationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900">Add Location</h2>
              <button onClick={() => setShowLocationModal(false)} className="text-slate-500 hover:text-slate-800">✕</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2 mt-2 first:mt-0">
                <h3 className="text-sm font-semibold text-slate-700 border-b pb-2 mb-2">Location Information</h3>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Location Code *</label>
                <input 
                  type="text"
                  value={newLocation.code} 
                  onChange={(e) => setNewLocation({ ...newLocation, code: e.target.value })} 
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 uppercase" 
                  placeholder="e.g. WH001"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Location Name *</label>
                <input 
                  type="text"
                  value={newLocation.name} 
                  onChange={(e) => setNewLocation({ ...newLocation, name: e.target.value })} 
                  className="w-full border border-slate-200 rounded-lg px-3 py-2" 
                  placeholder="e.g. Central Warehouse"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">City *</label>
                <input 
                  type="text"
                  value={newLocation.city} 
                  onChange={(e) => setNewLocation({ ...newLocation, city: e.target.value })} 
                  className="w-full border border-slate-200 rounded-lg px-3 py-2" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">State *</label>
                <input 
                  type="text"
                  value={newLocation.state} 
                  onChange={(e) => setNewLocation({ ...newLocation, state: e.target.value })} 
                  className="w-full border border-slate-200 rounded-lg px-3 py-2" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Type *</label>
                <select 
                  value={newLocation.type} 
                  onChange={(e) => setNewLocation({ ...newLocation, type: e.target.value as any })} 
                  className="w-full border border-slate-200 rounded-lg px-3 py-2"
                >
                  <option value="Central Warehouse">Central Warehouse</option>
                  <option value="Regional Hub">Regional Hub</option>
                  <option value="Branch">Branch</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Status *</label>
                <select 
                  value={newLocation.status} 
                  onChange={(e) => setNewLocation({ ...newLocation, status: e.target.value as any })} 
                  className="w-full border border-slate-200 rounded-lg px-3 py-2"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-slate-200">
              <ActionButton variant="secondary" onClick={() => setShowLocationModal(false)}>Cancel</ActionButton>
              <ActionButton onClick={handleSaveLocation}>Save Location</ActionButton>
            </div>
          </div>
        </div>
      )} */}

      {/* Inventory Details Drawer */}
      <Drawer
        open={!!selectedRecord}
        onClose={() => setSelectedRecord(null)}
        title="Inventory Details"
      >
        {selectedRecord && (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">Product Information</h3>
              <div className="space-y-2">
                <DrawerField label="Product Name" value={selectedRecord.productName} />
                <DrawerField label="SKU" value={selectedRecord.sku} />
                <DrawerField label="Category" value={selectedRecord.category} />
                <DrawerField label="Pack Type" value={selectedRecord.packType} />
                <DrawerField label="Unit of Measure" value={selectedRecord.uom} />
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">Location Information</h3>
              <div className="space-y-2">
                <DrawerField label="Location Code" value={selectedRecord.locationCode} />
                <DrawerField label="Location Name" value={selectedRecord.location} />
                <DrawerField label="City" value={selectedRecord.city} />
                <DrawerField label="State" value={selectedRecord.state} />
                <DrawerField label="Type" value={selectedRecord.type} />
                <DrawerField label="Status" value={selectedRecord.locationStatus} />
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">Inventory Information</h3>
              <div className="space-y-2">
                <DrawerField label="Available Quantity" value={selectedRecord.availableQty} />
                <DrawerField label="Reorder Level" value={selectedRecord.reorderLevel} />
                <DrawerField 
                  label="Inventory Status" 
                  value={
                    <Badge variant={selectedRecord.status === 'In Stock' ? 'success' : selectedRecord.status === 'Low Stock' ? 'warning' : 'danger'}>
                      {selectedRecord.status}
                    </Badge>
                  } 
                />
              </div>
            </div>

            {/* <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">Stock Movement Summary</h3>
              <div className="space-y-2">
                <DrawerField label="Total Inward" value={getStockMovementSummary(selectedRecord.sku, selectedRecord.locationCode).totalInward} />
                <DrawerField label="Total Outward" value={getStockMovementSummary(selectedRecord.sku, selectedRecord.locationCode).totalOutward} />
                <DrawerField label="Current Balance" value={selectedRecord.availableQty} />
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">Batch Information</h3>
              <div className="space-y-2">
                <DrawerField label="Active Batches" value={getBatchInformation(selectedRecord.sku, selectedRecord.locationCode).activeBatches} />
                <DrawerField label="Nearest Expiry Batch" value={getBatchInformation(selectedRecord.sku, selectedRecord.locationCode).nearestBatchNo} />
                <DrawerField label="Expiry Date" value={getBatchInformation(selectedRecord.sku, selectedRecord.locationCode).nearestExpiryDate} />
              </div>
            </div> */}

            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">Audit Information</h3>
              <div className="space-y-2">
                <DrawerField label="Created By" value={selectedRecord.createdBy} />
                <DrawerField label="Created Date" value={selectedRecord.createdDate} />
                <DrawerField label="Last Updated By" value={selectedRecord.lastUpdatedBy} />
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
