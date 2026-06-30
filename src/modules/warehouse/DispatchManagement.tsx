import { useState, useMemo, useEffect, useRef } from 'react';
import { Plus, Download, Filter, ChevronDown, Trash2 } from 'lucide-react';
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
import { type Column, type BadgeVariant } from './components/shared';
import { warehouseService } from '../../services/warehouseService';
import { inventoryService, type InventoryRecord } from '../../services/inventoryService';
import activityLogService from '../../services/activityLogService';

interface OrderProduct {
  productName: string;
  batchNo: string;
  availableQty: number;
  dispatchQty: number;
}

interface Dispatch {
  id: string;
  dispatchId: string;
  date: string;
  orderId: string;
  client: string;
  sourceWarehouse: string;
  totalItems: number;
  totalQuantity: number;
  status: 'Draft' | 'Ready to Ship' | 'Packed' | 'Dispatched' | 'In Transit' | 'Delivered' | 'Cancelled';
  products: OrderProduct[];
  transporter: string;
  lrNumber: string;
  vehicleNumber?: string;
  driverName?: string;
  driverMobile?: string;
  createdBy: string;
  createdDate: string;
}

export default function DispatchManagement() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dispatches, setDispatches] = useState<Dispatch[]>([]);
  
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  const [selectedDispatch, setSelectedDispatch] = useState<Dispatch | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
  const [newOrder, setNewOrder] = useState('');
  const [newCustomer, setNewCustomer] = useState('');
  const [newWarehouse, setNewWarehouse] = useState('');
  const [newTransporter, setNewTransporter] = useState('');
  const [newLRNumber, setNewLRNumber] = useState('');
  const [newVehicle, setNewVehicle] = useState('');
  const [newDriverName, setNewDriverName] = useState('');
  const [newDriverMobile, setNewDriverMobile] = useState('');
  const [newProducts, setNewProducts] = useState<OrderProduct[]>([]);

  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [availableInventory, setAvailableInventory] = useState<InventoryRecord[]>([]);
  const [selectedInventoryId, setSelectedInventoryId] = useState('');

  useEffect(() => {
    const stored = localStorage.getItem('pharma_erp_dispatches');
    if (stored) {
      try {
        setDispatches(JSON.parse(stored));
      } catch (e) {
        setDispatches([]);
      }
    }
    
    const whs = warehouseService.getAll();
    setWarehouses(whs.filter((w: any) => w.status === 'Active'));

    function handleClickOutside(event: MouseEvent) {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setShowExportMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleWarehouseChange = (warehouseName: string) => {
    setNewWarehouse(warehouseName);
    setNewProducts([]);
    setSelectedInventoryId('');
    const wh = warehouses.find((w: any) => w.name === warehouseName);
    if (wh) {
      setAvailableInventory(inventoryService.getByWarehouse(wh.id));
    } else {
      setAvailableInventory([]);
    }
  };

  const handleAddProduct = () => {
    if (!selectedInventoryId) return;
    const inv = availableInventory.find(i => i.id === selectedInventoryId);
    if (!inv) return;

    if (newProducts.some(p => p.productName === inv.productName && p.batchNo === inv.batchNo)) {
      alert("This product batch is already added.");
      return;
    }

    setNewProducts([...newProducts, {
      productName: inv.productName,
      batchNo: inv.batchNo,
      availableQty: inv.availableQty,
      dispatchQty: 1
    }]);
    setSelectedInventoryId('');
  };

  const handleRemoveProduct = (index: number) => {
    const updated = [...newProducts];
    updated.splice(index, 1);
    setNewProducts(updated);
  };

  const handleProductQtyChange = (index: number, val: string) => {
    const qty = parseInt(val, 10) || 0;
    const updated = [...newProducts];
    updated[index].dispatchQty = qty;
    setNewProducts(updated);
  };

  const filteredData = useMemo(() => {
    return dispatches.filter((item) => {
      const matchSearch = item.dispatchId.toLowerCase().includes(search.toLowerCase()) || 
                          item.orderId.toLowerCase().includes(search.toLowerCase()) || 
                          item.client.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter ? item.status === statusFilter : true;
      return matchSearch && matchStatus;
    });
  }, [dispatches, search, statusFilter]);

  const columns: Column<Dispatch>[] = [
    { key: 'dispatchId', label: 'Dispatch No', render: (row) => <span className="font-semibold text-slate-900">{row.dispatchId}</span> },
    { key: 'date', label: 'Dispatch Date', render: (row) => <span className="text-slate-600">{row.date}</span> },
    { key: 'orderId', label: 'Order No', render: (row) => <span className="text-slate-700">{row.orderId}</span> },
    { key: 'client', label: 'Customer', render: (row) => <span className="font-medium text-slate-800">{row.client}</span> },
    { key: 'sourceWarehouse', label: 'Source Warehouse' },
    { key: 'totalItems', label: 'Total Items', render: (row) => <span className="text-slate-600">{row.totalItems}</span> },
    { key: 'totalQuantity', label: 'Total Quantity', render: (row) => <span className="text-slate-600 font-medium">{row.totalQuantity}</span> },
    {
      key: 'status',
      label: 'Status',
      render: (row) => {
        let variant: BadgeVariant = 'neutral';
        if (row.status === 'Ready to Ship') variant = 'info';
        if (row.status === 'Packed') variant = 'purple';
        if (row.status === 'Dispatched') variant = 'warning';
        if (row.status === 'In Transit') variant = 'warning';
        if (row.status === 'Delivered') variant = 'success';
        if (row.status === 'Cancelled') variant = 'danger';
        return <Badge variant={variant}>{row.status}</Badge>;
      },
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setSelectedDispatch(row);
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
      'Dispatch No': row.dispatchId,
      'Dispatch Date': row.date,
      'Order No': row.orderId,
      'Customer': row.client,
      'Source Warehouse': row.sourceWarehouse,
      'Total Items': row.totalItems,
      'Total Quantity': row.totalQuantity,
      'Transporter': row.transporter,
      'LR Number': row.lrNumber,
      'Status': row.status
    }));
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Dispatches');
    XLSX.writeFile(workbook, `dispatch_list_${getFormattedDate()}.xlsx`);
    setShowExportMenu(false);
  };

  const handleExportCSV = () => {
    const headers = ['Dispatch No', 'Dispatch Date', 'Order No', 'Customer', 'Source Warehouse', 'Total Items', 'Total Quantity', 'Transporter', 'LR Number', 'Status'];
    const csvContent = [
      headers.join(','),
      ...filteredData.map(row => 
        [
          `"${row.dispatchId}"`, `"${row.date}"`, `"${row.orderId}"`, `"${row.client}"`,
          `"${row.sourceWarehouse}"`, row.totalItems, row.totalQuantity, `"${row.transporter}"`, `"${row.lrNumber}"`, `"${row.status}"`
        ].join(',')
      )
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `dispatch_list_${getFormattedDate()}.csv`;
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowExportMenu(false);
  };

  const handleSaveDispatch = () => {
    if (!newOrder) return alert("Order Number is required.");
    if (!newCustomer) return alert("Customer is required.");
    if (!newWarehouse) return alert("Source Warehouse is required.");
    if (!newTransporter) return alert("Transporter is required.");
    if (!newLRNumber) return alert("LR Number is required.");
    if (newProducts.length === 0) return alert("At least one product must be added to dispatch.");
    
    let totalQty = 0;
    for (const p of newProducts) {
      if (p.dispatchQty > p.availableQty) {
        return alert(`Dispatch quantity for ${p.productName} cannot exceed available quantity (${p.availableQty}).`);
      }
      totalQty += p.dispatchQty;
    }

    if (totalQty <= 0) return alert("Total dispatch quantity must be greater than zero.");

    const currentUser = JSON.parse(localStorage.getItem('authUser') || '{}');
    const dispatchId = `DSP-${new Date().getFullYear()}-${String(dispatches.length + 1).padStart(4, '0')}`;
    
    const newDispatchObj: Dispatch = {
      id: Date.now().toString(),
      dispatchId,
      date: newDate,
      orderId: newOrder,
      client: newCustomer,
      sourceWarehouse: newWarehouse,
      totalItems: newProducts.length,
      totalQuantity: totalQty,
      status: 'Ready to Ship',
      products: [...newProducts],
      transporter: newTransporter,
      lrNumber: newLRNumber,
      vehicleNumber: newVehicle,
      driverName: newDriverName,
      driverMobile: newDriverMobile,
      createdBy: currentUser?.fullName || 'System User',
      createdDate: new Date().toLocaleString()
    };

    const updatedDispatches = [newDispatchObj, ...dispatches];
    setDispatches(updatedDispatches);
    localStorage.setItem('pharma_erp_dispatches', JSON.stringify(updatedDispatches));
    
    const wh = warehouses.find((w: any) => w.name === newWarehouse);
    if (wh) {
      newProducts.forEach(p => {
        inventoryService.updateAvailableQty(p.batchNo, wh.id, -p.dispatchQty);
      });
    }

    try {
        activityLogService.addLog({
          userId: currentUser?.id || 'sys',
          userName: currentUser?.fullName || 'System User',
          action: `Created Dispatch ${dispatchId} for Order ${newOrder}`,
          module: 'Dispatch Management'
        });
    } catch(e) {}
    
    setShowCreateModal(false);
    
    setNewDate(new Date().toISOString().split('T')[0]);
    setNewOrder('');
    setNewCustomer('');
    setNewWarehouse('');
    setNewTransporter('');
    setNewLRNumber('');
    setNewVehicle('');
    setNewDriverName('');
    setNewDriverMobile('');
    setNewProducts([]);
    setSelectedInventoryId('');
  };

  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader
        title="Dispatch Management"
        subtitle="Manage pick, pack, and ship operations."
        actions={
          <>
            <div className="relative inline-block text-left" ref={exportMenuRef}>
              <ActionButton 
                variant="secondary" 
                icon={<Download className="w-4 h-4" />}
                onClick={() => setShowExportMenu(!showExportMenu)}
              >
                Export List
                <ChevronDown className="w-3 h-3 ml-1" />
              </ActionButton>
              {showExportMenu && (
                <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
                  <div className="py-1" role="menu" aria-orientation="vertical">
                    <button onClick={handleExportExcel} className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">Export as Excel (.xlsx)</button>
                    <button onClick={handleExportCSV} className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">Export as CSV (.csv)</button>
                  </div>
                </div>
              )}
            </div>
            <ActionButton icon={<Plus className="w-4 h-4" />} onClick={() => setShowCreateModal(true)}>
              New Dispatch
            </ActionButton>
          </>
        }
      />

      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search dispatch, order or customer..." />
        <div className="w-px h-6 bg-slate-200 mx-2 hidden sm:block" />
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-medium text-slate-600">Status:</span>
        </div>
        <SelectFilter
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { label: 'Draft', value: 'Draft' },
            { label: 'Ready to Ship', value: 'Ready to Ship' },
            { label: 'Packed', value: 'Packed' },
            { label: 'Dispatched', value: 'Dispatched' },
            { label: 'In Transit', value: 'In Transit' },
            { label: 'Delivered', value: 'Delivered' },
            { label: 'Cancelled', value: 'Cancelled' },
          ]}
          placeholder="All Statuses"
        />
      </FilterBar>

      <TableCard>
        <DataTable
          columns={columns}
          data={filteredData}
          emptyMessage="No dispatch records found."
        />
      </TableCard>

      <Drawer open={!!selectedDispatch} onClose={() => setSelectedDispatch(null)} title="Dispatch Details">
        {selectedDispatch && (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">Dispatch Information</h3>
              <div className="space-y-2">
                <DrawerField label="Dispatch Number" value={<span className="font-semibold text-slate-900">{selectedDispatch.dispatchId}</span>} />
                <DrawerField label="Dispatch Date" value={selectedDispatch.date} />
                <DrawerField label="Order Number" value={selectedDispatch.orderId} />
                <DrawerField label="Customer" value={selectedDispatch.client} />
                <DrawerField label="Source Warehouse" value={selectedDispatch.sourceWarehouse} />
                <DrawerField label="Status" value={
                  <Badge variant={
                    selectedDispatch.status === 'Ready to Ship' ? 'info' : 
                    selectedDispatch.status === 'Packed' ? 'purple' : 
                    selectedDispatch.status === 'Delivered' ? 'success' : 
                    selectedDispatch.status === 'Cancelled' ? 'danger' : 'warning'
                  }>
                    {selectedDispatch.status}
                  </Badge>
                } />
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">Product Details</h3>
              <div className="overflow-x-auto border border-slate-200 rounded-lg">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="py-2 px-3 font-semibold text-slate-600">Product</th>
                      <th className="py-2 px-3 font-semibold text-slate-600">Batch No</th>
                      <th className="py-2 px-3 font-semibold text-slate-600">Available</th>
                      <th className="py-2 px-3 font-semibold text-slate-600 text-right">Dispatch Qty</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedDispatch.products.map((p, i) => (
                      <tr key={i} className="border-b border-slate-100 last:border-0">
                        <td className="py-2 px-3 text-slate-800">{p.productName}</td>
                        <td className="py-2 px-3 text-slate-600">{p.batchNo}</td>
                        <td className="py-2 px-3 text-slate-600">{p.availableQty}</td>
                        <td className="py-2 px-3 text-slate-900 font-medium text-right">{p.dispatchQty}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">Transport Information</h3>
              <div className="space-y-2">
                <DrawerField label="Transporter" value={selectedDispatch.transporter} />
                <DrawerField label="LR Number" value={<span className="font-mono text-slate-700 font-medium">{selectedDispatch.lrNumber}</span>} />
                <DrawerField label="Vehicle Number" value={selectedDispatch.vehicleNumber || '—'} />
                <DrawerField label="Driver Name" value={selectedDispatch.driverName || '—'} />
                <DrawerField label="Driver Mobile" value={selectedDispatch.driverMobile || '—'} />
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">Summary & Audit</h3>
              <div className="space-y-2">
                <DrawerField label="Total Items" value={selectedDispatch.totalItems} />
                <DrawerField label="Total Quantity" value={<span className="font-semibold text-slate-900">{selectedDispatch.totalQuantity}</span>} />
                <DrawerField label="Created By" value={selectedDispatch.createdBy} />
                <DrawerField label="Created Date" value={selectedDispatch.createdDate} />
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100 flex justify-end gap-3">
              <ActionButton variant="secondary" onClick={() => setSelectedDispatch(null)}>Close</ActionButton>
            </div>
          </div>
        )}
      </Drawer>

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900">
                Create Dispatch
              </h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-500 hover:text-slate-800"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2 mt-2 first:mt-0">
                <h3 className="text-sm font-semibold text-slate-700 border-b pb-2 mb-2">Dispatch Information</h3>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Dispatch Number</label>
                <input type="text" value={`DSP-${new Date().getFullYear()}-${String(dispatches.length + 1).padStart(4, '0')}`} disabled className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 text-slate-500" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Dispatch Date *</label>
                <input type="date" value={newDate} onChange={e => setNewDate(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Order Number *</label>
                <input type="text" value={newOrder} onChange={e => setNewOrder(e.target.value)} placeholder="Enter Order Number" className="w-full border border-slate-200 rounded-lg px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Customer *</label>
                <input type="text" value={newCustomer} onChange={e => setNewCustomer(e.target.value)} placeholder="Enter Customer Name" className="w-full border border-slate-200 rounded-lg px-3 py-2" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Source Warehouse *</label>
                <select value={newWarehouse} onChange={e => handleWarehouseChange(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2">
                  <option value="">Select Warehouse</option>
                  {warehouses.map(w => <option key={w.id} value={w.name}>{w.name}</option>)}
                </select>
              </div>

              <div className="md:col-span-2 mt-4">
                <h3 className="text-sm font-semibold text-slate-700 border-b pb-2 mb-2">Product Details</h3>
                
                {newWarehouse && (
                  <div className="flex gap-3 mb-4">
                    <select 
                      value={selectedInventoryId} 
                      onChange={e => setSelectedInventoryId(e.target.value)}
                      className="flex-1 border border-slate-200 rounded-lg px-3 py-2"
                    >
                      <option value="">Select Product from Warehouse</option>
                      {availableInventory.filter(i => i.availableQty > 0).map(i => (
                        <option key={i.id} value={i.id}>
                          {i.productName} (Batch: {i.batchNo}) - Available: {i.availableQty}
                        </option>
                      ))}
                    </select>
                    <ActionButton onClick={handleAddProduct} variant="secondary">Add</ActionButton>
                  </div>
                )}

                {newProducts.length > 0 ? (
                  <div className="overflow-x-auto border border-slate-200 rounded-lg">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                          <th className="py-2 px-3 font-semibold text-slate-600">Product</th>
                          <th className="py-2 px-3 font-semibold text-slate-600">Batch No (FEFO)</th>
                          <th className="py-2 px-3 font-semibold text-slate-600 text-right">Available Qty</th>
                          <th className="py-2 px-3 font-semibold text-slate-600 text-right w-40">Dispatch Qty *</th>
                          <th className="py-2 px-3 font-semibold text-slate-600 w-10"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {newProducts.map((p, i) => (
                          <tr key={i} className="border-b border-slate-100 last:border-0">
                            <td className="py-2 px-3 text-slate-800">{p.productName}</td>
                            <td className="py-2 px-3 text-slate-600 font-mono text-xs">{p.batchNo}</td>
                            <td className="py-2 px-3 text-right text-slate-600">{p.availableQty}</td>
                            <td className="py-2 px-3 text-right">
                              <input 
                                type="number" 
                                min="0"
                                max={p.availableQty}
                                value={p.dispatchQty}
                                onChange={e => handleProductQtyChange(i, e.target.value)}
                                className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-right"
                              />
                            </td>
                            <td className="py-2 px-3 text-right">
                              <button onClick={() => handleRemoveProduct(i)} className="text-rose-500 hover:text-rose-700 transition-colors">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                        <tr className="bg-slate-50 font-semibold text-slate-900 border-t border-slate-200">
                          <td colSpan={2} className="py-2 px-3 text-right">Total Summary:</td>
                          <td className="py-2 px-3 text-right text-slate-500 font-normal">{newProducts.length} Items</td>
                          <td className="py-2 px-3 text-right text-lg text-violet-700">{newProducts.reduce((acc, curr) => acc + curr.dispatchQty, 0)}</td>
                          <td></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-500 text-sm border border-dashed border-slate-200 rounded-lg bg-slate-50">
                    {newWarehouse ? "Please select and add products from the warehouse above." : "Please select a Source Warehouse to load available inventory."}
                  </div>
                )}
              </div>

              <div className="md:col-span-2 mt-4">
                <h3 className="text-sm font-semibold text-slate-700 border-b pb-2 mb-2">Transport Information</h3>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Transporter *</label>
                <input list="transporters" type="text" value={newTransporter} onChange={e => setNewTransporter(e.target.value)} placeholder="Enter Transporter" className="w-full border border-slate-200 rounded-lg px-3 py-2" />
                <datalist id="transporters">
                  <option value="Blue Dart" />
                  <option value="Delhivery" />
                  <option value="DTDC" />
                  <option value="VRL Logistics" />
                </datalist>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">LR Number *</label>
                <input type="text" value={newLRNumber} onChange={e => setNewLRNumber(e.target.value)} placeholder="e.g. LR-2026-45896" className="w-full border border-slate-200 rounded-lg px-3 py-2 font-mono text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Vehicle Number</label>
                <input type="text" value={newVehicle} onChange={e => setNewVehicle(e.target.value)} placeholder="Optional" className="w-full border border-slate-200 rounded-lg px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Driver Name</label>
                <input type="text" value={newDriverName} onChange={e => setNewDriverName(e.target.value)} placeholder="Optional" className="w-full border border-slate-200 rounded-lg px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Driver Mobile</label>
                <input type="text" value={newDriverMobile} onChange={e => setNewDriverMobile(e.target.value)} placeholder="Optional" className="w-full border border-slate-200 rounded-lg px-3 py-2" />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-slate-200">
              <ActionButton variant="secondary" onClick={() => setShowCreateModal(false)}>Cancel</ActionButton>
              <ActionButton onClick={handleSaveDispatch}>Save Dispatch</ActionButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}