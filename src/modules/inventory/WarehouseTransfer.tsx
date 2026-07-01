import { useState, useRef, useEffect, useMemo } from 'react';
import { ArrowRightLeft, Download, Filter, ChevronDown, Plus, Trash2 } from 'lucide-react';
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
import {
  warehouseTransferService,
  type WarehouseTransfer,
} from "../../services/warehouseTransferService";

import { warehouseService } from "../../services/warehouseService";
import { inventoryService } from "../../services/inventoryService";
import { productService } from "../../services/productService";
import { stockLedgerService } from "../../services/stockLedgerService";

// --- Data Models ---

interface TransferLineItem {
  id: string;
  product: string;
  batchNo: string;
  availableQty: number;
  transferQty: number;
}

interface Transfer {
  id: string;
  transferNo: string;
  date: string;
  fromLocation: string;
  toLocation: string;
  remarks?: string;
  itemsCount: number;
  totalQuantity: number;
  status: 'Draft' | 'In Transit' | 'Completed' | 'Cancelled';
  products: TransferLineItem[];
  createdBy: string;
  createdDate: string;
  lastUpdatedBy: string;
  lastUpdatedDate: string;
}

// const mockData: Transfer[] = [
//   { 
//     id: '1', 
//     transferNo: 'TRF-2026-001', 
//     date: '2026-10-14', 
//     fromLocation: 'Hyderabad Warehouse', 
//     toLocation: 'Bangalore Warehouse',
//     remarks: 'Emergency Stock Replenishment',
//     itemsCount: 2, 
//     totalQuantity: 2000,
//     status: 'In Transit',
//     products: [
//       { id: 'p1', product: 'Paracetamol 650mg', batchNo: 'B-2026-01', availableQty: 5000, transferQty: 1000 },
//       { id: 'p2', product: 'Amoxicillin 500mg', batchNo: 'B-2026-02', availableQty: 2000, transferQty: 1000 }
//     ],
//     createdBy: 'Admin User',
//     createdDate: '14-Oct-2026',
//     lastUpdatedBy: 'Admin User',
//     lastUpdatedDate: '14-Oct-2026'
//   },
//   { 
//     id: '2', 
//     transferNo: 'TRF-2026-002', 
//     date: '2026-10-10', 
//     fromLocation: 'Mumbai Warehouse', 
//     toLocation: 'Hyderabad Warehouse',
//     itemsCount: 1, 
//     totalQuantity: 500,
//     status: 'Completed',
//     products: [
//       { id: 'p3', product: 'Vitamin C 1000mg', batchNo: 'B-2026-03', availableQty: 1000, transferQty: 500 }
//     ],
//     createdBy: 'System User',
//     createdDate: '10-Oct-2026',
//     lastUpdatedBy: 'Dispatch Dept',
//     lastUpdatedDate: '11-Oct-2026'
//   },
// ];

// const MOCK_LOCATIONS = ['Hyderabad Warehouse', 'Mumbai Warehouse', 'Bangalore Warehouse', 'Delhi Warehouse'];
// const MOCK_PRODUCTS = ['Paracetamol 650mg', 'Amoxicillin 500mg', 'Vitamin C 1000mg', 'Cough Syrup 100ml'];

// // Mock Batch Database for cross-referencing Available Qty
// const MOCK_BATCHES: Record<string, { batchNo: string, availableQty: number }[]> = {
//   'Paracetamol 650mg': [
//     { batchNo: 'B-2026-01', availableQty: 5000 },
//     { batchNo: 'B-2026-11', availableQty: 1500 }
//   ],
//   'Amoxicillin 500mg': [
//     { batchNo: 'B-2026-02', availableQty: 2000 }
//   ],
//   'Vitamin C 1000mg': [
//     { batchNo: 'B-2026-03', availableQty: 1000 }
//   ],
//   'Cough Syrup 100ml': [
//     { batchNo: 'B-2026-04', availableQty: 800 }
//   ]
// };

export default function WarehouseTransfer() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
 const [transferRecords, setTransferRecords] = useState<WarehouseTransfer[]>(
   [],
 );
  useEffect(() => {
    setTransferRecords(warehouseTransferService.getAll());
  }, []);

  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  const [showCreateModal, setShowCreateModal] = useState(false);
  //const [selectedRecord, setSelectedRecord] = useState<Transfer | null>(null);
  const [selectedRecord, setSelectedRecord] =  useState<WarehouseTransfer | null>(null);

  // Initiate Transfer Form State
  const [formData, setFormData] = useState({
    date: "",

    fromWarehouseId: "",
    toWarehouseId: "",

    remarks: "",

   status: "In Transit" as
  | "Draft"
  | "In Transit"
  | "Completed"
  | "Cancelled",
  });

  const [formProducts, setFormProducts] = useState<TransferLineItem[]>([]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setShowExportMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredData = transferRecords.filter((item) => {
    const matchSearch = item.transferNo.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter ? item.status === statusFilter : true;
    return matchSearch && matchStatus;
  });

  const columns: Column<WarehouseTransfer>[] = [
    { key: 'transferNo', label: 'Transfer ID', render: (row) => <span className="font-semibold text-violet-700">{row.transferNo}</span> },
    { key: 'date', label: 'Transfer Date' },
    { key: 'fromWarehouseName', label: 'From Location', render: (row) => <span className="font-medium text-slate-800">{row.fromWarehouseName}</span> },
    { key: 'toWarehouseName', label: 'To Location', render: (row) => <span className="font-medium text-slate-800">{row.toWarehouseName}</span> },
    { key: 'itemsCount', label: 'Total Items' },
    { key: 'totalQuantity', label: 'Total Quantity', render: (row) => row.totalQuantity.toLocaleString() },
    {
      key: 'status',
      label: 'Status',
      render: (row) => {
        let variant: 'success' | 'warning' | 'danger' | 'neutral' | 'info' = 'neutral';
        if (row.status === 'Completed') variant = 'success';
        if (row.status === 'In Transit') variant = 'info';
        if (row.status === 'Cancelled') variant = 'danger';
        if (row.status === 'Draft') variant = 'warning';
        return <Badge variant={variant}>{row.status}</Badge>;
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
      'Transfer ID': row.transferNo,
      'Transfer Date': row.date,
      'From Warehouse': row.fromWarehouseName,
      'To Warehouse': row.toWarehouseName,
      'Total Items': row.itemsCount,
      'Total Quantity': row.totalQuantity,
      'Status': row.status
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Warehouse Transfer');
    
    const fileName = `warehouse_transfer_${getFormattedDate()}.xlsx`;
    XLSX.writeFile(workbook, fileName);
    setShowExportMenu(false);
  };

  const handleExportCSV = () => {
    const headers = ['Transfer ID', 'Transfer Date', 'From Location', 'To Location', 'Total Items', 'Total Quantity', 'Status'];
    const csvContent = [
      headers.join(','),
      ...filteredData.map(row => 
        [
          row.transferNo, 
          row.date, 
          `"${row.fromWarehouseName}"`, 
          `"${row.toWarehouseName}"`, 
          row.itemsCount, 
          row.totalQuantity, 
          row.status
        ].join(',')
      )
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    const fileName = `warehouse_transfer_${getFormattedDate()}.csv`;
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowExportMenu(false);
  };

  // Initiate Transfer Modal Logic
  const openCreateModal = () => {
    setFormData({
      date: new Date().toISOString().split("T")[0],

      fromWarehouseId: "",
      toWarehouseId: "",

      remarks: "",

      status: "In Transit",
    });
    setFormProducts([]);
    setShowCreateModal(true);
  };

  const closeCreateModal = () => {
    const isDirty = formProducts.length > 0 || formData.fromWarehouseId!== '' || formData.toWarehouseId !== '' || formData.remarks !== '';
    if (isDirty) {
      if (window.confirm("You have unsaved changes. Are you sure you want to close?")) {
        setShowCreateModal(false);
      }
    } else {
      setShowCreateModal(false);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showCreateModal) {
        closeCreateModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showCreateModal, formProducts, formData]);

  const handleAddProductRow = () => {
    setFormProducts([
      ...formProducts, 
      { id: Date.now().toString(), product: '', batchNo: '', availableQty: 0, transferQty: 0 }
    ]);
  };

  const handleProductChange = (id: string, field: keyof TransferLineItem, value: any) => {
    setFormProducts(prev => prev.map(p => {
      if (p.id !== id) return p;
      const updated = { ...p, [field]: value };
      
      // Auto-populate batch info when batchNo changes
      if (field === 'batchNo' && updated.product) {
      //  const batchInfo = MOCK_BATCHES[updated.product]?.find(b => b.batchNo === value);
      const batchInfo = inventory.find(
  (i) =>
    i.productCode === updated.product &&
    i.batchNo === value &&
    i.warehouseId === formData.fromWarehouseId
);

updated.availableQty = batchInfo?.availableQty ?? 0;
        if (batchInfo) {
          updated.availableQty = batchInfo.availableQty;
        } else {
          updated.availableQty = 0;
        }
      }
      
      // Reset batch info if product changes
      if (field === 'product') {
        updated.batchNo = '';
        updated.availableQty = 0;
      }
      
      return updated;
    }));
  };

  const handleRemoveProductRow = (id: string) => {
    setFormProducts(formProducts.filter(p => p.id !== id));
  };

  const autoCalculatedMetrics = useMemo(() => {
    const totalItems = formProducts.length;
    const totalQuantity = formProducts.reduce((acc, curr) => acc + (Number(curr.transferQty) || 0), 0);
    return { totalItems, totalQuantity };
  }, [formProducts]);

  const handleSaveTransfer = () => {
    if (
      !formData.fromWarehouseId ||
      !formData.toWarehouseId ||
      !formData.date
    ) {
      alert("Please fill all mandatory fields (Transfer Date, From Location, To Location).");
      return;
    }

    if (
  formData.fromWarehouseId ===
  formData.toWarehouseId
){
      alert("From Location and To Location cannot be the same.");
      return;
    }

    if (formProducts.length === 0) {
      alert("Please add at least one product to transfer.");
      return;
    }

    for (const p of formProducts) {
      if (!p.product || !p.batchNo || !p.transferQty) {
        alert("Please select a Product, Batch No, and enter Transfer Qty for all rows.");
        return;
      }
      if (Number(p.transferQty) <= 0) {
        alert(`Transfer quantity must be greater than zero for batch ${p.batchNo}.`);
        return;
      }
      if (Number(p.transferQty) > p.availableQty) {
        alert(`Transfer quantity cannot exceed Available Qty (${p.availableQty}) for batch ${p.batchNo}.`);
        return;
      }
    }

    // Save Logic
    const newTransferNo = `TRF-${new Date().getFullYear()}-${String(transferRecords.length + 1).padStart(3, '0')}`;
    
    const newRecord: WarehouseTransfer = {
      id: Date.now().toString(),
      transferNo: newTransferNo,
      date: formData.date,
      fromWarehouseId: formData.fromWarehouseId,

fromWarehouseName:
  warehouses.find(
    w => w.id === formData.fromWarehouseId
  )?.name ?? "",

toWarehouseId: formData.toWarehouseId,

toWarehouseName:
  warehouses.find(
    w => w.id === formData.toWarehouseId
  )?.name ?? "",
      remarks: formData.remarks,
      itemsCount: autoCalculatedMetrics.totalItems,
      totalQuantity: autoCalculatedMetrics.totalQuantity,
      status: formData.status,
      products: [...formProducts],
      createdBy: 'Current User',
      createdDate: new Date().toLocaleDateString('en-GB').replace(/\//g, '-'),
      lastUpdatedBy: 'Current User',
      lastUpdatedDate: new Date().toLocaleDateString('en-GB').replace(/\//g, '-')
    };

//     const inventoryRecords = inventoryService.getAll();

// formProducts.forEach((item) => {
//   // Reduce stock in source warehouse
//   const source = inventoryRecords.find(
//     (r) =>
//       r.productCode === item.product &&
//       r.batchNo === item.batchNo &&
//       r.warehouseId === formData.fromWarehouseId,
//   );

//   if (source) {
//     source.availableQty -= Number(item.transferQty);
//     source.lastUpdated = new Date().toISOString();
//   }

//   // Increase stock in destination warehouse
//   const destination = inventoryRecords.find(
//     (r) =>
//       r.productCode === item.product &&
//       r.batchNo === item.batchNo &&
//       r.warehouseId === formData.toWarehouseId,
//   );

//   if (destination) {
//     destination.availableQty += Number(item.transferQty);
//     destination.lastUpdated = new Date().toISOString();
//   } else if (source) {
//     inventoryRecords.push({
//       ...source,
//       id: Date.now().toString() + item.batchNo,
//       warehouseId: formData.toWarehouseId,
//       warehouseCode:
//         warehouses.find((w) => w.id === formData.toWarehouseId)?.code ?? "",
//       warehouseName:
//         warehouses.find((w) => w.id === formData.toWarehouseId)?.name ?? "",
//       availableQty: Number(item.transferQty),
//       lastUpdated: new Date().toISOString(),
//     });
//   }
// });

// inventoryService.saveAll(inventoryRecords);

// formProducts.forEach((item) => {

//   stockLedgerService.addRecord({

//     id: Date.now().toString() + item.batchNo,

//     date: new Date().toISOString(),

//     productCode: item.product,

//     batchNo: item.batchNo,

//     warehouseId: formData.fromWarehouseId,

//     transactionType: "Transfer Out",

//     quantity: Number(item.transferQty),

//     referenceNo: newTransferNo,

//   });

//   stockLedgerService.addRecord({

//     id: Date.now().toString() + item.batchNo + "IN",

//     date: new Date().toISOString(),

//     productCode: item.product,

//     batchNo: item.batchNo,

//     warehouseId: formData.toWarehouseId,

//     transactionType: "Transfer In",

//     quantity: Number(item.transferQty),

//     referenceNo: newTransferNo,

//   });

// });

if (newRecord.status === "In Transit") {

  const inventoryRecords = inventoryService.getAll();

  formProducts.forEach((item) => {

    const source = inventoryRecords.find(
      r =>
        r.productCode === item.product &&
        r.batchNo === item.batchNo &&
        r.warehouseId === newRecord.fromWarehouseId
    );

    if (source) {

      source.availableQty -= Number(item.transferQty);

      source.lastUpdated = new Date().toISOString();

    }

    stockLedgerService.addRecord({

      id: Date.now().toString(),

      date: new Date().toISOString(),

      productCode: item.product,

      batchNo: item.batchNo,

      warehouseId: newRecord.fromWarehouseId,

      transactionType: "Transfer Out",

      quantity: Number(item.transferQty),

      referenceNo: newRecord.transferNo,

    });

  });

  inventoryService.saveAll(inventoryRecords);

}

    warehouseTransferService.addRecord(newRecord);

setTransferRecords(
  warehouseTransferService.getAll()
);
    setShowCreateModal(false);
    alert("Warehouse transfer initiated successfully!");
  };


  const handleCompleteTransfer = (
  transfer: WarehouseTransfer,
) => {

  const transfers = warehouseTransferService.getAll();

  const updatedTransfers: WarehouseTransfer[] = transfers.map((t) =>
  t.id === transfer.id
    ? {
        ...t,
        status: "Completed" as const,
        lastUpdatedBy: "System Admin",
        lastUpdatedDate: new Date().toISOString(),
      }
    : t
);

  warehouseTransferService.saveAll(updatedTransfers);

  setTransferRecords(updatedTransfers);

  setSelectedRecord({
    ...transfer,
    status: "Completed",
  });

  alert("Transfer completed successfully.");
};

  const warehouses = warehouseService.getAll();

const inventory = inventoryService.getAll();

const products = productService.getProducts();

  const availableProducts = inventory
    .filter(
      (stock) =>
        stock.warehouseId === formData.fromWarehouseId &&
        stock.availableQty > 0,
    )
    .filter(
      (item, index, arr) =>
        arr.findIndex((x) => x.productCode === item.productCode) === index,
    );

  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader
        title="Warehouse Transfer Management"
        subtitle="Manage stock transfers between internal warehouses."
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
            <ActionButton icon={<ArrowRightLeft className="w-4 h-4" />} onClick={openCreateModal}>
              Initiate Transfer
            </ActionButton>
          </>
        }
      />

      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search transfer ID..." />
        <div className="w-px h-6 bg-slate-200 mx-2 hidden sm:block" />
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-medium text-slate-600">Filters:</span>
        </div>
        <SelectFilter
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { label: 'In Transit', value: 'In Transit' },
            { label: 'Completed', value: 'Completed' },
            { label: 'Draft', value: 'Draft' },
            { label: 'Cancelled', value: 'Cancelled' },
          ]}
          placeholder="All Status"
        />
      </FilterBar>

      <TableCard>
        <div className="overflow-x-auto">
          <DataTable
            columns={columns}
            data={filteredData}
            emptyMessage="No transfer records found."
          />
        </div>
      </TableCard>

      {/* Initiate Transfer Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900">Initiate Warehouse Transfer</h2>
              <button onClick={closeCreateModal} className="text-slate-500 hover:text-slate-800">✕</button>
            </div>

            <div className="space-y-8">
              
              {/* Transfer Information */}
              <section>
                <h3 className="text-sm font-semibold text-slate-700 border-b pb-2 mb-2">Transfer Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Transfer Number</label>
                    <input type="text" readOnly value="Auto Generated" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-500 cursor-not-allowed" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Transfer Date *</label>
                    <input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">From Location *</label>
                    {/* <select value={formData.fromLocation} onChange={e => setFormData({...formData, fromLocation: e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2">
                      <option value="">Select Location</option>
                      {MOCK_LOCATIONS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select> */}
                    

                    <select  value={formData.fromWarehouseId}onChange={(e) => setFormData({...formData,fromWarehouseId: e.target.value,})  }>
                        <option value="">Select Warehouse</option>  {warehouses.filter(w => w.status === "Active").map(w => (<option key={w.id} value={w.id}>
        {w.code} - {w.name}
      </option>
    ))}
</select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">To Location *</label>
                    <select value={formData.toWarehouseId} onChange={e => setFormData({...formData, toWarehouseId: e.target.value})} className={`w-full border border-slate-200 rounded-lg px-3 py-2 ${formData.fromWarehouseId && formData.toWarehouseId === formData.fromWarehouseId ? 'border-rose-400 bg-rose-50' : ''}`}>
                      <option value="">Select Location</option>
                      {warehouses.filter(w => w.status === "Active").map(w => (
                        <option key={w.id} value={w.id}>
                          {w.code} - {w.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Remarks (Optional)</label>
                    <input type="text" value={formData.remarks} onChange={e => setFormData({...formData, remarks: e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2" placeholder="e.g. Emergency Stock Replenishment" />
                  </div>
                </div>
              </section>

              {/* Product Details Grid */}
              <section>
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
                  <h3 className="text-sm font-semibold text-slate-700">Product Details</h3>
                  <button onClick={handleAddProductRow} className="text-sm text-violet-600 font-medium hover:text-violet-800 flex items-center">
                    <Plus className="w-4 h-4 mr-1" /> Add Row
                  </button>
                </div>
                
                <div className="overflow-x-auto pb-4">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-slate-500 uppercase bg-slate-50">
                      <tr>
                        <th className="px-3 py-2 whitespace-nowrap">Product</th>
                        <th className="px-3 py-2 whitespace-nowrap">Batch No</th>
                        <th className="px-3 py-2 whitespace-nowrap w-32">Available Qty</th>
                        <th className="px-3 py-2 whitespace-nowrap w-32">Transfer Qty</th>
                        <th className="px-3 py-2"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {formProducts.map((prod) => (
                        <tr key={prod.id} className="border-b border-slate-100">
                          <td className="px-2 py-2 min-w-[200px]">
                            <select value={prod.product} onChange={e => handleProductChange(prod.id, 'product', e.target.value)} className="w-full border border-slate-200 rounded px-2 py-1.5 text-sm">
                              <option value="">Select Product</option>
                              {availableProducts.map(p => {
                                const prodDetails = products.find(x => x.code === p.productCode);
                                return <option key={p.productCode} value={p.productCode}>{prodDetails?.name || p.productCode}</option>;
                              })}
                            </select>
                          </td>
                          <td className="px-2 py-2 min-w-[150px]">
                            <select value={prod.batchNo} onChange={e => handleProductChange(prod.id, 'batchNo', e.target.value)} className="w-full border border-slate-200 rounded px-2 py-1.5 text-sm" disabled={!prod.product}>
                              <option value="">Select Batch</option>
                              {prod.product && inventory.filter(i => i.productCode === prod.product && i.warehouseId === formData.fromWarehouseId && i.availableQty > 0).map(b => (
                                <option key={b.batchNo} value={b.batchNo}>{b.batchNo}</option>
                              ))}
                            </select>
                          </td>
                          <td className="px-2 py-2">
                            <input type="number" readOnly value={prod.availableQty || ''} className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1.5 text-sm text-slate-500 cursor-not-allowed" placeholder="0" />
                          </td>
                          <td className="px-2 py-2">
                            <input type="number" value={prod.transferQty || ''} onChange={e => handleProductChange(prod.id, 'transferQty', e.target.value)} className={`w-full border rounded px-2 py-1.5 text-sm ${prod.transferQty > prod.availableQty ? 'border-rose-300 bg-rose-50' : 'border-slate-200'}`} min="1" max={prod.availableQty} placeholder="0" />
                          </td>
                          <td className="px-2 py-2 text-center">
                            <button onClick={() => handleRemoveProductRow(prod.id)} className="text-slate-400 hover:text-rose-600 transition-colors">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {formProducts.length === 0 && (
                        <tr>
                          <td colSpan={5} className="text-center py-6 text-sm text-slate-500">
                            No products added yet. Click "Add Row" to begin.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* Summary Section */}
              <section className="bg-slate-50 p-4 rounded-xl border border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Total Items</span>
                  <span className="text-lg font-bold text-slate-900">{autoCalculatedMetrics.totalItems}</span>
                </div>
                <div>
                  <span className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Total Quantity</span>
                  <span className="text-lg font-bold text-slate-900">{autoCalculatedMetrics.totalQuantity.toLocaleString()}</span>
                </div>
              </section>

              {/* Status Section */}
              <section>
                <h3 className="text-sm font-semibold text-slate-700 border-b pb-2 mb-2">Transfer Status</h3>
                <div className="w-full md:w-1/2">
                  <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as any})} className="w-full border border-slate-200 rounded-lg px-3 py-2">
                    <option value="Draft">Draft</option>
                    <option value="In Transit">In Transit</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              </section>

            </div>

            {/* Modal Footer */}
            <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-slate-200">
              <ActionButton variant="secondary" onClick={closeCreateModal}>Cancel</ActionButton>
              <ActionButton onClick={handleSaveTransfer}>Initiate Transfer</ActionButton>
            </div>
          </div>
        </div>
      )}

      {/* Transfer Details Drawer */}
      <Drawer
        open={!!selectedRecord}
        onClose={() => setSelectedRecord(null)}
        title="Warehouse Transfer Details"
      >
        {selectedRecord && (
          <div className="space-y-6">
            
            {/* Transfer Information */}
            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">Transfer Information</h3>
              <div className="space-y-2">
                <DrawerField label="Transfer Number" value={<span className="font-mono text-violet-700 bg-violet-50 px-2 py-1 rounded">{selectedRecord.transferNo}</span>} />
                <DrawerField label="Transfer Date" value={selectedRecord.date} />
                {/* <DrawerField label="From Location" value={selectedRecord.fromLocation} /> */}
                                <DrawerField label="From Location" value={selectedRecord.fromWarehouseName} />

                {/* <DrawerField label="To Location" value={selectedRecord.toLocation} /> */}
                                <DrawerField label="To Location" value={selectedRecord.toWarehouseName} />

                <DrawerField label="Status" value={<Badge variant={selectedRecord.status === 'Completed' ? 'success' : selectedRecord.status === 'In Transit' ? 'info' : selectedRecord.status === 'Cancelled' ? 'danger' : 'warning'}>{selectedRecord.status}</Badge>} />
                <DrawerField label="Remarks" value={selectedRecord.remarks || 'N/A'} />
              </div>
            </div>

            {/* Product Details Table */}
            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">Product Details</h3>
              <div className="overflow-x-auto border border-slate-200 rounded-lg">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-3 py-2">Product</th>
                      <th className="px-3 py-2">Batch No</th>
                      <th className="px-3 py-2 text-right">Transfer Quantity</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedRecord.products.map(prod => (
                      <tr key={prod.id}>
                        <td className="px-3 py-2 font-medium text-slate-900">{prod.product}</td>
                        <td className="px-3 py-2 text-slate-600">{prod.batchNo}</td>
                        <td className="px-3 py-2 text-right font-medium">{prod.transferQty.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Summary Information */}
            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">Summary</h3>
              <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500">Total Items</span>
                  <span className="font-semibold text-slate-900">{selectedRecord.itemsCount}</span>
                </div>
                <div className="flex justify-between items-center text-sm pt-2 border-t border-slate-200">
                  <span className="font-medium text-slate-700">Total Quantity</span>
                  <span className="text-lg font-bold text-violet-700">{selectedRecord.totalQuantity.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Audit Information */}
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

  {selectedRecord &&
 selectedRecord.status === "In Transit" && (
    <ActionButton
        onClick={() => handleCompleteTransfer(selectedRecord)}
    >
        Complete Transfer
    </ActionButton>
)}
  <ActionButton
    variant="secondary"
    onClick={() => setSelectedRecord(null)}
  >
    Close
  </ActionButton>

</div>
          </div>
        )}
      </Drawer>

    </div>
  );
}
