// @ts-nocheck
import { useState, useMemo, useEffect, useRef } from 'react';
import { Plus, Download, Filter, ChevronDown,  } from 'lucide-react';
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
import { warehouseTransferService } from '../../services/warehouseTransferService';
import { outwardStockService } from '../../services/outwardStockService';

import { transportChallanService } from '../../services/transportChallanService';

import { orderService } from '../../services/orderService';
import { distributorDispatchService } from '../../services/distributorDispatchService';
import { productService } from '../../services/productService';
import { batchService } from '../../services/batchService';
import authService from '../../services/authService';


const formatDate = (dateString: string) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
};

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
  dispatchType?: string;
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
  remarks?: string;
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
  const [newRemarks, setNewRemarks] = useState('');
  const [newExpectedDeliveryDate, setNewExpectedDeliveryDate] = useState('');
  const [newProducts, setNewProducts] = useState<OrderProduct[]>([]);

  const [showTransporterDropdown, setShowTransporterDropdown] = useState(false);
  const [transporters, setTransporters] = useState<string[]>(['Blue Dart', 'Delhivery', 'DTDC', 'VRL Logistics']);
  const [showDriverDropdown, setShowDriverDropdown] = useState(false);
  const [showVehicleDropdown, setShowVehicleDropdown] = useState(false);
  const [knownDrivers, setKnownDrivers] = useState<{name: string, mobile: string}[]>([]);
  const [knownVehicles, setKnownVehicles] = useState<string[]>([]);

  const [eligibleWarehouses, setEligibleWarehouses] = useState<any[]>([]);
  const [showEligibleWarehouseDropdown, setShowEligibleWarehouseDropdown] = useState(false);
  const [eligibleWarehouseSearch, setEligibleWarehouseSearch] = useState('');

  const [dispatchType, setDispatchType] = useState('');
  const [destinationWarehouse, setDestinationWarehouse] = useState('');
  const [dispatchAddress, setDispatchAddress] = useState('');
  const [referenceSearch, setReferenceSearch] = useState('');
  const [showReferenceDropdown, setShowReferenceDropdown] = useState(false);
  const [selectedReference, setSelectedReference] = useState<any>(null);

  const [allTransfers, setAllTransfers] = useState<any[]>([]);
  const [allOutwards, setAllOutwards] = useState<any[]>([]);
  const [allApprovedOrders, setAllApprovedOrders] = useState<any[]>([]);

  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [availableInventory, setAvailableInventory] = useState<InventoryRecord[]>([]);
  const [selectedInventoryId, setSelectedInventoryId] = useState('');

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowCreateModal(false);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  useEffect(() => {
    transportChallanService.loadDispatches().then((data) => {
      setDispatches(data);
      const vehicles = Array.from(new Set(data.map((d: any) => d.vehicleNumber).filter(Boolean))) as string[];
      setKnownVehicles(vehicles);
      
      const driversMap = new Map<string, string>();
      data.forEach((d: any) => {
        if (d.driverName) {
          driversMap.set(d.driverName, d.driverMobile || '');
        }
      });
      setKnownDrivers(Array.from(driversMap.entries()).map(([name, mobile]) => ({name, mobile})));
    });
    
    const whs = warehouseService.getAll();
    setWarehouses(whs.filter((w: any) => w.status === 'Active'));

    warehouseTransferService.getAll().then(async (data) => {
      const products = await productService.loadProducts();
      const batches = await batchService.loadBatches();
      const whsAll = warehouseService.getAll();
      const enrichedData = data.map((r: any) => {
        const fromWh = whsAll.find((w: any) => String(w.id) === String(r.fromWarehouseId));
        const toWh = whsAll.find((w: any) => String(w.id) === String(r.toWarehouseId));
        return {
          ...r,
          fromWarehouseName: fromWh ? fromWh.name : `Warehouse ${r.fromWarehouseId}`,
          toWarehouseName: toWh ? toWh.name : `Warehouse ${r.toWarehouseId}`
        };
      });
      setAllTransfers(enrichedData);
    });
    outwardStockService.getAll().then(async (data) => {
      const products = await productService.loadProducts();
      const batches = await batchService.loadBatches();
      const whsAll = warehouseService.getAll();

      const enrichedData = data.map((r: any) => {
        const wh = whsAll.find((w: any) => String(w.id) === String(r.warehouseId));
        return {
          ...r,
          warehouseName: wh ? wh.name : r.warehouseName || `Warehouse ${r.warehouseId}`,
          items: (r.items || []).map((item: any) => {
            const product = products.find((p: any) => String(p.id) === String(item.productId));
            const batch = batches.find((b: any) => String(b.id) === String(item.batchId));
            return {
              ...item,
              productName: product ? product.name : `Product ${item.productId}`,
              batchNo: batch ? batch.batchNumber : `Batch ${item.batchId}`
            };
          })
        };
      });
      setAllOutwards(enrichedData);
    });
    setAllApprovedOrders(distributorDispatchService.getApprovedOrders());

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

  const handleDispatchTypeChange = (val: string) => {
    setDispatchType(val);
    setReferenceSearch('');
    setSelectedReference(null);
    setNewProducts([]);
    setNewWarehouse('');
    setDestinationWarehouse('');
    setNewCustomer('');
    setDispatchAddress('');
    setNewOrder('');
  };

  const handleReferenceSelect = (record: any) => {
    setSelectedReference(record);
    setShowReferenceDropdown(false);
    
    if (dispatchType === 'Warehouse Transfer') {
      setReferenceSearch(record.transferNo);
      setNewOrder(record.transferNo);
      setNewWarehouse(record.fromWarehouseName);
      setDestinationWarehouse(record.toWarehouseName);

      const sourceInv = inventoryService.getByWarehouse(String(record.fromWarehouseId));
      setAvailableInventory(sourceInv);
      
      if (sourceInv.length === 1) {
        setNewProducts([{
          productName: sourceInv[0].productName,
          batchNo: sourceInv[0].batchNo,
          availableQty: sourceInv[0].availableQty,
          dispatchQty: sourceInv[0].availableQty,
        }]);
      } else {
        setNewProducts([]);
      }
    } else if (dispatchType === 'Distributor Order') {
      setReferenceSearch(record.orderNo);
      setNewOrder(record.orderNo);
      setNewWarehouse('');
      setNewCustomer(record.distributorName);
      setDispatchAddress(record.deliveryLocation || 'Address from customer profile');
      setNewProducts([]);

      if (record.expectedDeliveryDate) {
        let formatted = record.expectedDeliveryDate;
        if (record.expectedDeliveryDate.includes('-')) {
          const parts = record.expectedDeliveryDate.split('-');
          if (parts.length === 3 && parts[2].length === 4) {
            formatted = `${parts[2]}-${parts[1]}-${parts[0]}`;
          }
        }
        setNewExpectedDeliveryDate(formatted);
      } else {
        setNewExpectedDeliveryDate('');
      }
      
      const orderProducts = record.items || [];
      const validWarehouses = warehouses.filter(wh => {
        return orderProducts.every((p: any) => {
          const productStock = inventoryService.getByProduct(p.productCode)
            .filter(i => i.warehouseId === wh.id && i.availableQty > 0);
          const totalAvailable = productStock.reduce((sum, item) => sum + item.availableQty, 0);
          return totalAvailable > 0;
        });
      });

      setEligibleWarehouses(validWarehouses);
      
      if (validWarehouses.length === 0) {
        alert("None of the available warehouses have sufficient stock for the selected order.");
      }
    } else {
      setReferenceSearch(record.dispatchNo);
      setNewOrder(record.dispatchNo);
      setNewWarehouse(record.warehouseName);
      setNewCustomer(record.client);
      setDispatchAddress(record.address || '');
      const mapped = (record.items || record.products || []).map((p: any) => ({
        productName: p.productName || p.product,
        batchNo: p.batchNo || p.batchNumber,
        availableQty: p.availableQty || p.stock || p.quantity || 0,
        dispatchQty: p.dispatchQty || p.quantity || 0
      }));
      setNewProducts(mapped);
    }
  };

  const handleWarehouseSelect = (wh: any) => {
    setNewWarehouse(wh.name);
    setEligibleWarehouseSearch('');
    setShowEligibleWarehouseDropdown(false);
    
    if (dispatchType === 'Distributor Order' && selectedReference) {
      const whId = wh.id;
      const mapped: OrderProduct[] = [];
      
      (selectedReference.items || []).forEach((p: any) => {
        const inv = inventoryService.getByProduct(p.productCode).filter(i => i.warehouseId === whId && i.availableQty > 0);
        let remainingQty = p.quantity;
        if (inv.length > 0) {
          for (const stock of inv) {
            if (remainingQty <= 0) break;
            const allocate = Math.min(stock.availableQty, remainingQty);
            mapped.push({
              productName: stock.productName,
              batchNo: stock.batchNo,
              availableQty: stock.availableQty,
              dispatchQty: allocate
            });
            remainingQty -= allocate;
          }
        }
        if (remainingQty > 0) {
          mapped.push({
             productName: p.productName || p.product,
             batchNo: 'NO STOCK',
             availableQty: 0,
             dispatchQty: remainingQty
          });
        }
      });
      setNewProducts(mapped);
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
    { key: 'date', label: 'Dispatch Date', render: (row) => <span className="text-slate-600">{formatDate(row.date)}</span> },
    { key: 'orderId', label: 'Reference Number', render: (row) => <span className="text-slate-700">{row.orderId}</span> },
    { key: 'dispatchType' as any, label: 'Dispatch Type', render: (row) => <span className="text-slate-600">{row.dispatchType || 'Outward Stock'}</span> },
    { key: 'client', label: 'Customer / Destination', render: (row) => <span className="font-medium text-slate-800">{row.client}</span> },
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
          className="text-[#163c78] font-medium hover:text-[#0c1f3d]"
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
      'Dispatch Date': formatDate(row.date),
      'Reference Number': row.orderId,
      'Dispatch Type': row.dispatchType || 'Outward Stock',
      'Customer / Destination': row.client,
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
    const headers = ['Dispatch No', 'Dispatch Date', 'Reference Number', 'Dispatch Type', 'Customer / Destination', 'Source Warehouse', 'Total Items', 'Total Quantity', 'Transporter', 'LR Number', 'Status'];
    const csvContent = [
      headers.join(','),
      ...filteredData.map(row => 
        [
          `"${row.dispatchId}"`, `"${formatDate(row.date)}"`, `"${row.orderId}"`, `"${row.dispatchType || 'Outward Stock'}"`, `"${row.client}"`,
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
    if (!dispatchType) return alert("Dispatch Type is required.");
    if (!selectedReference) return alert("Please select a valid reference.");
    
    const today = new Date();
    today.setHours(0,0,0,0);
    const selDate = new Date(newDate);
    selDate.setHours(0,0,0,0);
    if (selDate > today) return alert("Dispatch Date cannot be a future date.");

    const tTransporter = newTransporter.trim();
    if (!tTransporter) return alert("Transporter is required.");
    if (tTransporter.length > 100) return alert("Transporter cannot exceed 100 characters.");

    const tLR = newLRNumber.trim();
    if (!tLR) return alert("LR Number is required.");
    if (tLR.length > 30) return alert("LR Number cannot exceed 30 characters.");
    if (dispatches.some(d => d.lrNumber.trim().toLowerCase() === tLR.toLowerCase())) {
       return alert("LR Number must be unique.");
    }

    const tVehicle = newVehicle.trim();
    if (!tVehicle) return alert("Vehicle Number is required.");
    if (tVehicle.length > 20) return alert("Vehicle Number cannot exceed 20 characters.");
    if (!/^[A-Za-z0-9 -]+$/.test(tVehicle)) return alert("Vehicle Number allows only letters, numbers, spaces, and hyphens.");

    const tDriver = newDriverName.trim();
    if (!tDriver) return alert("Driver Name is required.");
    if (tDriver.length > 100) return alert("Driver Name cannot exceed 100 characters.");
    if (!/^[A-Za-z\s]+$/.test(tDriver)) return alert("Driver Name can only contain alphabets and spaces.");

    const tMobile = newDriverMobile.trim();
    if (!tMobile) return alert("Driver Mobile is required.");
    if (!/^\d{10}$/.test(tMobile)) return alert("Driver Mobile must be exactly 10 digits (no alphabets or special characters).");

    const tRemarks = newRemarks.trim().substring(0, 250);

    if (newProducts.length === 0) return alert("At least one product must be added to dispatch.");
    
    let totalQty = 0;
    for (const p of newProducts) {
      if (p.dispatchQty > p.availableQty) {
        return alert(`Dispatch quantity for ${p.productName} cannot exceed available quantity (${p.availableQty}).`);
      }
      totalQty += p.dispatchQty;
    }

    if (totalQty <= 0) return alert("Total dispatch quantity must be greater than zero.");

    const currentUser = authService.getCurrentUser() || { fullName: 'System' };
    const dispatchId = `DSP-${new Date().getFullYear()}-${String(dispatches.length + 1).padStart(4, '0')}`;
    
    if (dispatchType === 'Distributor Order') {
      const dispatchData = {
        dispatchId,
        date: newDate,
        dispatchType,
        orderId: newOrder,
        client: newCustomer,
        distributorId: selectedReference?.distributorId || selectedReference?.distributorCode,
        distributorCode: selectedReference?.distributorCode,
        distributorName: newCustomer,
        sourceWarehouse: newWarehouse,
        products: newProducts,
        transporter: tTransporter,
        lrNumber: tLR,
        vehicleNumber: tVehicle,
        driverName: tDriver,
        driverMobile: tMobile,
        remarks: tRemarks,
        totalItems: newProducts.length,
        totalQuantity: totalQty,
        orderData: selectedReference,
        expectedDeliveryDate: newExpectedDeliveryDate
      };
      
      const newDispatchObj: any = distributorDispatchService.processDispatch(dispatchData, currentUser);
      
      const updatedDispatches = [newDispatchObj, ...dispatches];
      setDispatches(updatedDispatches);
      setAllApprovedOrders(distributorDispatchService.getApprovedOrders());
      
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
      setNewRemarks('');
      setNewExpectedDeliveryDate('');
      setNewProducts([]);
      setSelectedInventoryId('');
      setDispatchType('');
      setDestinationWarehouse('');
      setDispatchAddress('');
      setReferenceSearch('');
      setSelectedReference(null);
      return;
    }

    const relatedOrder = dispatchType === 'Outward Stock' ? orderService.getAll().find((o: any) => o.orderNo === newOrder || o.id === newOrder) : null;
    
    const newDispatchObj: Dispatch = {
      id: Date.now().toString(),
      dispatchId,
      date: newDate,
      dispatchType,
      orderId: newOrder,
      client: dispatchType === 'Warehouse Transfer' ? destinationWarehouse : newCustomer,
      sourceWarehouse: newWarehouse,
      totalItems: newProducts.length,
      totalQuantity: totalQty,
      status: 'Ready to Ship',
      products: [...newProducts],
      transporter: tTransporter,
      lrNumber: tLR,
      vehicleNumber: tVehicle,
      driverName: tDriver,
      driverMobile: tMobile,
      remarks: tRemarks,
      createdBy: currentUser?.fullName || 'System User',
      createdDate: formatDate(new Date().toISOString().split('T')[0])
    };

    const wh = warehouses.find((w: any) => w.name === newWarehouse);
    if (wh) {
      newProducts.forEach(p => {
        inventoryService.updateAvailableQty(p.batchNo, wh.id, -p.dispatchQty).catch(() => {});
      });
    }

    transportChallanService.createDispatch(newDispatchObj)
      .then(() => {
        transportChallanService.loadDispatches().then((data) => {
          setDispatches(data);
        });
      })
      .catch((err: any) => {
        alert(err.message || "Failed to save dispatch");
      });

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
    setNewRemarks('');
    setNewExpectedDeliveryDate('');
    setNewProducts([]);
    setSelectedInventoryId('');
    setDispatchType('');
    setDestinationWarehouse('');
    setDispatchAddress('');
    setReferenceSearch('');
    setSelectedReference(null);
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      setShowCreateModal(false);
    }
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
                <DrawerField label="Dispatch Date" value={formatDate(selectedDispatch.date)} />
                <DrawerField label="Dispatch Type" value={selectedDispatch.dispatchType || 'Outward Stock'} />
                <DrawerField label="Reference Number" value={selectedDispatch.orderId} />
                <DrawerField label="Customer / Destination" value={selectedDispatch.client} />
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
                {selectedDispatch.remarks && <DrawerField label="Remarks" value={selectedDispatch.remarks} />}
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
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={handleBackdropClick}
        >
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
                <label className="block text-sm font-medium mb-1">Expected Delivery Date</label>
                <input type="date" value={newExpectedDeliveryDate} onChange={e => setNewExpectedDeliveryDate(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Dispatch Type *</label>
                <select value={dispatchType} onChange={e => handleDispatchTypeChange(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2">
                  <option value="">Select Dispatch Type</option>
                  <option value="Warehouse Transfer">Warehouse Transfer</option>
                  <option value="Outward Stock">Outward Stock</option>
                  <option value="Distributor Order">Distributor Order</option>
                </select>
              </div>

              {dispatchType === 'Warehouse Transfer' && (
                <div className="relative">
                  <label className="block text-sm font-medium mb-1 text-slate-700">Transfer Number *</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={referenceSearch}
                      onChange={(e) => {
                        setReferenceSearch(e.target.value);
                        setShowReferenceDropdown(true);
                      }}
                      onFocus={() => setShowReferenceDropdown(true)}
                      placeholder="Search Transfer Number..."
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 pr-8 focus:outline-none focus:border-violet-400"
                    />
                    <ChevronDown
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 cursor-pointer"
                      onClick={() => setShowReferenceDropdown(!showReferenceDropdown)}
                    />
                  </div>
                  {showReferenceDropdown && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setShowReferenceDropdown(false)} />
                      <div className="absolute z-20 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 flex flex-col overflow-y-auto p-1">
                        {allTransfers
                          .filter(t => !['Dispatched', 'Completed', 'Cancelled'].includes(t.status))
                          .filter(t => (t.transferNo || '').toLowerCase().includes(referenceSearch.toLowerCase()))
                          .map((record) => (
                            <div
                              key={record.id}
                              className="px-3 py-2 text-sm hover:bg-slate-50 cursor-pointer rounded text-slate-700"
                              onClick={() => handleReferenceSelect(record)}
                            >
                              <span className="font-medium text-slate-900">{record.transferNo}</span> - {record.fromWarehouseName} to {record.toWarehouseName}
                            </div>
                          ))}
                        {allTransfers.filter(t => !['Dispatched', 'Completed', 'Cancelled'].includes(t.status)).filter(t => (t.transferNo || '').toLowerCase().includes(referenceSearch.toLowerCase())).length === 0 && (
                          <div className="px-3 py-2 text-sm text-slate-500 italic">No eligible transfers found</div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}

              {dispatchType === 'Outward Stock' && (
                <div className="relative">
                  <label className="block text-sm font-medium mb-1 text-slate-700">Outward Number *</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={referenceSearch}
                      onChange={(e) => {
                        setReferenceSearch(e.target.value);
                        setShowReferenceDropdown(true);
                      }}
                      onFocus={() => setShowReferenceDropdown(true)}
                      placeholder="Search Outward Number..."
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 pr-8 focus:outline-none focus:border-violet-400"
                    />
                    <ChevronDown
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 cursor-pointer"
                      onClick={() => setShowReferenceDropdown(!showReferenceDropdown)}
                    />
                  </div>
                  {showReferenceDropdown && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setShowReferenceDropdown(false)} />
                      <div className="absolute z-20 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 flex flex-col overflow-y-auto p-1">
                        {allOutwards
                          .filter(t => !['Dispatched', 'Completed', 'Cancelled'].includes(t.status))
                          .filter(t => (t.dispatchNo || '').toLowerCase().includes(referenceSearch.toLowerCase()))
                          .map((record) => (
                            <div
                              key={record.id}
                              className="px-3 py-2 text-sm hover:bg-slate-50 cursor-pointer rounded text-slate-700"
                              onClick={() => handleReferenceSelect(record)}
                            >
                              <span className="font-medium text-slate-900">{record.dispatchNo}</span> - {record.client}
                            </div>
                          ))}
                        {allOutwards.filter(t => !['Dispatched', 'Completed', 'Cancelled'].includes(t.status)).filter(t => (t.dispatchNo || '').toLowerCase().includes(referenceSearch.toLowerCase())).length === 0 && (
                          <div className="px-3 py-2 text-sm text-slate-500 italic">No eligible outward records found</div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}

              {dispatchType === 'Distributor Order' && (
                <div className="relative">
                  <label className="block text-sm font-medium mb-1 text-slate-700">Approved Distributor Order *</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={referenceSearch}
                      onChange={(e) => {
                        setReferenceSearch(e.target.value);
                        setShowReferenceDropdown(true);
                      }}
                      onFocus={() => setShowReferenceDropdown(true)}
                      placeholder="Search Order Number..."
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 pr-8 focus:outline-none focus:border-violet-400"
                    />
                    <ChevronDown
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 cursor-pointer"
                      onClick={() => setShowReferenceDropdown(!showReferenceDropdown)}
                    />
                  </div>
                  {showReferenceDropdown && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setShowReferenceDropdown(false)} />
                      <div className="absolute z-20 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 flex flex-col overflow-y-auto p-1">
                        {allApprovedOrders
                          .filter(t => (t.orderNo || '').toLowerCase().includes(referenceSearch.toLowerCase()))
                          .map((record) => (
                            <div
                              key={record.id}
                              className="px-3 py-2 text-sm hover:bg-slate-50 cursor-pointer rounded text-slate-700"
                              onClick={() => handleReferenceSelect(record)}
                            >
                              <span className="font-medium text-slate-900">{record.orderNo}</span> - {record.distributorName} <br />
                              <span className="text-xs text-slate-500">Date: {formatDate(record.date)}</span>
                            </div>
                          ))}
                        {allApprovedOrders.filter(t => (t.orderNo || '').toLowerCase().includes(referenceSearch.toLowerCase())).length === 0 && (
                          <div className="px-3 py-2 text-sm text-slate-500 italic">No approved orders found</div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}

              {dispatchType === 'Warehouse Transfer' && selectedReference && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-1">Source Warehouse</label>
                    <input type="text" value={newWarehouse} disabled className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 text-slate-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Destination Warehouse</label>
                    <input type="text" value={destinationWarehouse} disabled className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 text-slate-500" />
                  </div>
                </>
              )}

              {dispatchType === 'Outward Stock' && selectedReference && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-1">Customer / Client</label>
                    <input type="text" value={newCustomer} disabled className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 text-slate-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Dispatch Address</label>
                    <input type="text" value={dispatchAddress} onChange={e => setDispatchAddress(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 text-slate-500" />
                  </div>
                </>
              )}

              {dispatchType === 'Distributor Order' && selectedReference && (
                <>
                  <div className="relative">
                    <label className="block text-sm font-medium mb-1 text-slate-700">Source Warehouse *</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={eligibleWarehouseSearch || newWarehouse}
                        onChange={(e) => {
                          setEligibleWarehouseSearch(e.target.value);
                          setShowEligibleWarehouseDropdown(true);
                          if (e.target.value === '') setNewWarehouse('');
                        }}
                        onFocus={() => setShowEligibleWarehouseDropdown(true)}
                        placeholder="Select Warehouse..."
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 pr-8 focus:outline-none focus:border-violet-400"
                      />
                      <ChevronDown
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 cursor-pointer"
                        onClick={() => setShowEligibleWarehouseDropdown(!showEligibleWarehouseDropdown)}
                      />
                    </div>
                    {showEligibleWarehouseDropdown && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setShowEligibleWarehouseDropdown(false)} />
                        <div className="absolute z-20 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 flex flex-col overflow-y-auto p-1">
                          {eligibleWarehouses
                            .filter(w => (w.name || '').toLowerCase().includes(eligibleWarehouseSearch.toLowerCase()))
                            .map((w) => (
                              <div
                                key={w.id}
                                className="px-3 py-2 text-sm hover:bg-slate-50 cursor-pointer rounded text-slate-700"
                                onClick={() => handleWarehouseSelect(w)}
                              >
                                {w.name}
                              </div>
                            ))}
                          {eligibleWarehouses.filter(w => (w.name || '').toLowerCase().includes(eligibleWarehouseSearch.toLowerCase())).length === 0 && (
                            <div className="px-3 py-2 text-sm text-slate-500 italic">No valid warehouse found</div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Distributor</label>
                    <input type="text" value={newCustomer} disabled className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 text-slate-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Delivery Address</label>
                    <input type="text" value={dispatchAddress} disabled className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 text-slate-500" />
                  </div>
                </>
              )}

              <div className="md:col-span-2 mt-4">
                <h3 className="text-sm font-semibold text-slate-700 border-b pb-2 mb-2">Product Details</h3>
                
                {selectedReference && (newProducts.length > 0 || (dispatchType === 'Warehouse Transfer' && availableInventory.length > 1)) ? (
                  <div className="overflow-x-auto border border-slate-200 rounded-lg">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                          <th className="py-2 px-3 font-semibold text-slate-600">Product</th>
                          <th className="py-2 px-3 font-semibold text-slate-600">Batch No (FEFO)</th>
                          <th className="py-2 px-3 font-semibold text-slate-600 text-right">Available Qty</th>
                          <th className="py-2 px-3 font-semibold text-slate-600 text-right w-40">Dispatch Qty *</th>
                          <th className="py-2 px-3 font-semibold text-slate-600 w-16"></th>
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
                                onChange={e => {
                                  const val = Math.min(Number(e.target.value) || 0, p.availableQty);
                                  const updated = [...newProducts];
                                  updated[i].dispatchQty = val;
                                  setNewProducts(updated);
                                }}
                                className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-right focus:outline-none focus:border-violet-400"
                              />
                            </td>
                            <td className="py-2 px-3 text-center">
                              <button onClick={() => {
                                const updated = newProducts.filter((_, idx) => idx !== i);
                                setNewProducts(updated);
                              }} className="text-red-500 hover:text-red-700 font-medium text-xs">Remove</button>
                            </td>
                          </tr>
                        ))}
                        {selectedReference && dispatchType === 'Warehouse Transfer' && availableInventory.length > 1 && (
                          <tr className="border-b border-slate-100 last:border-0 bg-slate-50/50">
                            <td className="py-2 px-3">
                              <select 
                                className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:border-violet-400"
                                value={selectedInventoryId}
                                onChange={e => {
                                  setSelectedInventoryId(e.target.value);
                                  if (e.target.value) {
                                    const inv = availableInventory.find(i => i.id === e.target.value);
                                    if (inv) {
                                      setNewProducts([...newProducts, {
                                        productName: inv.productName,
                                        batchNo: inv.batchNo,
                                        availableQty: inv.availableQty,
                                        dispatchQty: inv.availableQty
                                      }]);
                                      setSelectedInventoryId('');
                                    }
                                  }
                                }}
                              >
                                <option value="">Select Product...</option>
                                {availableInventory.filter(inv => !newProducts.some(np => np.batchNo === inv.batchNo && np.productName === inv.productName)).map(inv => (
                                  <option key={inv.id} value={inv.id}>
                                    {inv.productName} (Batch: {inv.batchNo})
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="py-2 px-3 text-slate-400 text-xs italic">-</td>
                            <td className="py-2 px-3 text-right text-slate-400 italic">-</td>
                            <td className="py-2 px-3"></td>
                            <td className="py-2 px-3"></td>
                          </tr>
                        )}
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
                    {dispatchType ? "Please select a reference number to load products." : "Please select a Dispatch Type to load reference records."}
                  </div>
                )}
              </div><div className="md:col-span-2 mt-4"><h3 className="text-sm font-semibold text-slate-700 border-b pb-2 mb-2">Transport Information</h3></div>
              <div className="relative">
                <label className="block text-sm font-medium mb-1 text-slate-700">Transporter *</label>
                <div className="relative">
                  <input
                    type="text"
                    value={newTransporter}
                    onChange={(e) => {
                      setNewTransporter(e.target.value);
                      setShowTransporterDropdown(true);
                    }}
                    onFocus={() => setShowTransporterDropdown(true)}
                    placeholder="Search or enter Transporter..."
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 pr-8 bg-white text-slate-900 focus:outline-none focus:border-violet-400"
                  />
                  <ChevronDown
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 cursor-pointer"
                    onClick={() => setShowTransporterDropdown(!showTransporterDropdown)}
                  />
                </div>
                {showTransporterDropdown && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowTransporterDropdown(false)} />
                    <div className="absolute z-20 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 flex flex-col overflow-y-auto p-1">
                      {transporters
                        .filter((t) => t.toLowerCase().includes((newTransporter || "").toLowerCase()))
                        .map((trans) => (
                          <div
                            key={trans}
                            className="px-3 py-2 text-sm hover:bg-slate-50 cursor-pointer rounded text-slate-700"
                            onClick={() => {
                              setNewTransporter(trans);
                              setShowTransporterDropdown(false);
                            }}
                          >
                            {trans}
                          </div>
                        ))}
                      {(newTransporter || "").trim() !== "" &&
                        !transporters.some(
                          (t) => t.trim().toLowerCase() === (newTransporter || "").trim().toLowerCase()
                        ) && (
                          <div
                            className="px-3 py-2 text-sm text-[#163c78] font-medium hover:bg-[#163c78]/10 cursor-pointer rounded flex items-center gap-2"
                            onClick={() => {
                              const newType = (newTransporter || "").trim();
                              const updatedTypes = [...transporters, newType];
                              setTransporters(updatedTypes);
                              // Not saving to localStorage anymore
                              // localStorage.setItem("pharma_erp_transporters", JSON.stringify(updatedTypes));
                              setNewTransporter(newType);
                              setShowTransporterDropdown(false);
                            }}
                          >
                            <Plus className="w-4 h-4" /> Add "{newTransporter.trim()}"
                          </div>
                        )}
                    </div>
                  </>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">LR Number *</label>
                <input type="text" value={newLRNumber} onChange={e => setNewLRNumber(e.target.value)} placeholder="e.g. LR-2026-45896" className="w-full border border-slate-200 rounded-lg px-3 py-2 font-mono text-sm" />
              </div>
              <div className="relative">
                <label className="block text-sm font-medium mb-1">Driver Name *</label>
                <div className="relative">
                  <input 
                    type="text" 
                    value={newDriverName} 
                    onChange={e => {
                      const val = e.target.value.replace(/[^A-Za-z\s]/g, '');
                      setNewDriverName(val);
                      setShowDriverDropdown(true);
                    }}
                    onFocus={() => setShowDriverDropdown(true)}
                    placeholder="e.g. John Doe" 
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 pr-8 bg-white focus:outline-none focus:border-violet-400" 
                  />
                  <ChevronDown
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 cursor-pointer"
                    onClick={() => setShowDriverDropdown(!showDriverDropdown)}
                  />
                </div>
                {showDriverDropdown && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowDriverDropdown(false)} />
                    <div className="absolute z-20 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 flex flex-col overflow-y-auto p-1">
                      {knownDrivers
                        .filter((d) => d.name.toLowerCase().includes((newDriverName || "").toLowerCase()))
                        .map((driver) => (
                          <div
                            key={driver.name}
                            className="px-3 py-2 text-sm hover:bg-slate-50 cursor-pointer rounded text-slate-700"
                            onClick={() => {
                              setNewDriverName(driver.name);
                              if (driver.mobile) setNewDriverMobile(driver.mobile);
                              setShowDriverDropdown(false);
                            }}
                          >
                            {driver.name}
                          </div>
                        ))}
                      {(newDriverName || "").trim() !== "" &&
                        !knownDrivers.some(
                          (d) => d.name.trim().toLowerCase() === (newDriverName || "").trim().toLowerCase()
                        ) && (
                          <div
                            className="px-3 py-2 text-sm text-violet-600 font-medium hover:bg-violet-50 cursor-pointer rounded flex items-center gap-2"
                            onClick={() => setShowDriverDropdown(false)}
                          >
                            <Plus className="w-4 h-4" /> Add "{newDriverName.trim()}"
                          </div>
                        )}
                    </div>
                  </>
                )}
              </div>
              <div className="relative">
                <label className="block text-sm font-medium mb-1">Vehicle Number *</label>
                <div className="relative">
                  <input 
                    type="text" 
                    value={newVehicle} 
                    onChange={e => {
                      setNewVehicle(e.target.value);
                      setShowVehicleDropdown(true);
                    }} 
                    onFocus={() => setShowVehicleDropdown(true)}
                    placeholder="Enter Vehicle Number" 
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 pr-8 bg-white focus:outline-none focus:border-violet-400" 
                  />
                  <ChevronDown
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 cursor-pointer"
                    onClick={() => setShowVehicleDropdown(!showVehicleDropdown)}
                  />
                </div>
                {showVehicleDropdown && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowVehicleDropdown(false)} />
                    <div className="absolute z-20 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 flex flex-col overflow-y-auto p-1">
                      {knownVehicles
                        .filter((v) => v.toLowerCase().includes((newVehicle || "").toLowerCase()))
                        .map((veh) => (
                          <div
                            key={veh}
                            className="px-3 py-2 text-sm hover:bg-slate-50 cursor-pointer rounded text-slate-700"
                            onClick={() => {
                              setNewVehicle(veh);
                              setShowVehicleDropdown(false);
                            }}
                          >
                            {veh}
                          </div>
                        ))}
                      {(newVehicle || "").trim() !== "" &&
                        !knownVehicles.some(
                          (v) => v.trim().toLowerCase() === (newVehicle || "").trim().toLowerCase()
                        ) && (
                          <div
                            className="px-3 py-2 text-sm text-violet-600 font-medium hover:bg-violet-50 cursor-pointer rounded flex items-center gap-2"
                            onClick={() => setShowVehicleDropdown(false)}
                          >
                            <Plus className="w-4 h-4" /> Add "{newVehicle.trim()}"
                          </div>
                        )}
                    </div>
                  </>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Driver Mobile *</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-medium">+91</span>
                  <input 
                    type="text" 
                    value={newDriverMobile} 
                    onChange={e => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                      setNewDriverMobile(val);
                    }} 
                    placeholder="9876543210" 
                    className="w-full border border-slate-200 rounded-lg pl-12 pr-3 py-2" 
                    maxLength={10}
                  />
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Remarks</label>
                <textarea value={newRemarks} onChange={e => setNewRemarks(e.target.value)} placeholder="Optional (Max 250 characters)" maxLength={250} className="w-full border border-slate-200 rounded-lg px-3 py-2 h-20 resize-none"></textarea>
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