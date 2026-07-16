import { useState, useRef, useEffect, useMemo } from 'react';
import { Download, Filter, Eye, Map, FileText, ChevronDown, CheckCircle2, Truck, XCircle, Plus, Calendar, Hash, Tag, Package, Box, Layers, Building2, User, Phone, MapPin, Search, Printer } from 'lucide-react';
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
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { generateLRPdf } from '../../documents/generators/generateLRPdf';
import { generatePODPdf } from '../../documents/generators/generatePODPdf';
import { dispatchService } from '../../services/dispatchService';
import authService from '../../services/authService';
import { salesInvoiceService } from '../../services/salesInvoiceService';

interface Milestone {
  status: string;
  date: string;
  location: string;
  completed: boolean;
}

interface DispatchItem {
  id: string;
  dispatchNo: string;
  orderNo: string;
  distributorId?: string;
  distributorCode?: string;
  distributorName?: string;
  distributor: string;
  dispatchDate: string;
  transporter: string;
  vehicleNo: string;
  lrNo: string;
  expectedDeliveryDate: string;
  actualDeliveryDate: string;
  dispatchStatus: 'Pending Dispatch' | 'Packed' | 'Dispatched' | 'In Transit' | 'Out For Delivery' | 'Delivered' | 'Delayed' | 'Cancelled';
  podStatus: 'Pending POD' | 'Uploaded' | 'Verified';
  driverName: string;
  driverMobile: string;
  milestones: Milestone[];
}

const getDDMMYYYY = (dateStr: string) => {
  if (!dateStr || dateStr === '-' || dateStr === 'TBD' || dateStr === 'N/A' || dateStr === 'Pending') return dateStr;
  if (dateStr.includes('-')) {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      if (parts[2].length === 4) return dateStr;
      if (parts[0].length === 4) {
        return `${parts[2].padStart(2, '0')}-${parts[1].padStart(2, '0')}-${parts[0]}`;
      }
    }
  }
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(amount || 0);
};

export default function DispatchTracking() {
  const [activeTab, setActiveTab] = useState<'inbound' | 'outbound'>('inbound');

  // --- Inbound Tab State ---
  const [inboundDispatches, setInboundDispatches] = useState<DispatchItem[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [podFilter, setPodFilter] = useState('');
  const [transporterFilter, setTransporterFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  
  const [viewDispatch, setViewDispatch] = useState<DispatchItem | null>(null);
  const [trackDispatch, setTrackDispatch] = useState<DispatchItem | null>(null);
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // --- Outbound Tab State ---
  const [retailerOrders, setRetailerOrders] = useState<any[]>([]);
  const [outboundDispatches, setOutboundDispatches] = useState<any[]>([]);
  const [distributorInventory, setDistributorInventory] = useState<any[]>([]);
  const [batchInventory, setBatchInventory] = useState<any[]>([]);
  const [salesInvoices, setSalesInvoices] = useState<any[]>([]);
  
  const [outboundSearch, setOutboundSearch] = useState('');
  const [outboundStatusFilter, setOutboundStatusFilter] = useState('');
  const [outboundHistoryView, setOutboundHistoryView] = useState(false);

  const [isCreateDrawerOpen, setIsCreateDrawerOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string>('');

  const [dispatchFormData, setDispatchFormData] = useState({
    dispatchNo: '',
    dispatchDate: '',
    remarks: '',
    transportMode: 'Road',
    transporterName: '',
    vehicleNumber: '',
    driverName: '',
    driverMobile: '',
    expectedDeliveryDate: '',
    freightPaidBy: 'Distributor',
    freightCharges: 0,
    lrNumber: '',
    numberOfPackages: 1,
    packageType: 'Box'
  });

  const [allocationData, setAllocationData] = useState<Record<string, { batchId: string; batchNo: string; expiry: string; mfgDate: string; availableQty: number; dispatchQty: number }>>({});

  const [viewOutboundDispatch, setViewOutboundDispatch] = useState<any | null>(null);

  const loggedInDistributor = useMemo(() => {
    const user = authService.getCurrentUser();
    const linkedCode = user?.linkedDistributorCode;
    if (!linkedCode) return { name: '', code: '' };

    const savedDistributorsRaw = localStorage.getItem('pharma_erp_distributors');
    if (savedDistributorsRaw) {
      try {
        const parsedDists = JSON.parse(savedDistributorsRaw);
        const masterRecord = parsedDists.find((d: any) => d.code === linkedCode || d.distributorCode === linkedCode || d.id === linkedCode);
        if (masterRecord) {
          return {
            name: masterRecord.name || masterRecord.distributorName || '',
            code: masterRecord.code || masterRecord.distributorCode || masterRecord.id || linkedCode
          };
        }
      } catch (e) {}
    }
    return { name: '', code: linkedCode };
  }, []);

  // --- Data Loading ---
  const loadOutboundData = () => {
    try {
      const orders = JSON.parse(localStorage.getItem('pharma_erp_retailer_orders') || '[]');
      const dispatches = JSON.parse(localStorage.getItem('pharma_erp_outbound_dispatches') || '[]');
      const inventory = JSON.parse(localStorage.getItem('pharma_erp_distributor_inventory') || '[]');
      const batches = JSON.parse(localStorage.getItem('pharma_erp_batches') || '[]');
      
      setRetailerOrders(orders);
      setOutboundDispatches(dispatches);
      setDistributorInventory(inventory);
      setBatchInventory(batches);
      setSalesInvoices(salesInvoiceService.getAll());
    } catch (e) {
      console.error("Failed to load outbound data", e);
    }
  };

  useEffect(() => {
    try {
      const allDispatches = dispatchService.getAll().filter((d: any) => d.dispatchType === 'Distributor Order');
      const mappedDispatches: DispatchItem[] = allDispatches.map((d: any) => ({
        id: d.id || d.dispatchId || d.dispatchNo,
        dispatchNo: d.dispatchNo || d.dispatchId || 'N/A',
        orderNo: d.orderNo || d.orderId || 'N/A',
        distributorId: d.distributorId,
        distributorCode: d.distributorCode,
        distributorName: d.distributorName || d.client,
        distributor: d.distributor || d.client || d.distributorName,
        dispatchDate: getDDMMYYYY(d.dispatchDate || d.date),
        transporter: d.transporter || 'N/A',
        vehicleNo: d.vehicleNo || d.vehicleNumber || 'N/A',
        lrNo: d.lrNo || d.lrNumber || 'N/A',
        expectedDeliveryDate: getDDMMYYYY(d.expectedDeliveryDate || d.orderData?.expectedDeliveryDate || 'TBD'),
        actualDeliveryDate: getDDMMYYYY(d.actualDeliveryDate || 'TBD'),
        dispatchStatus: d.dispatchStatus || d.status,
        podStatus: d.podStatus || 'Pending POD',
        driverName: d.driverName || 'Pending',
        driverMobile: d.driverMobile || 'Pending',
        milestones: Array.isArray(d.milestones) ? d.milestones.map((m: any) => ({
          status: m.status || 'Unknown',
          date: m.date && m.date !== 'Pending' ? getDDMMYYYY(m.date) : 'Pending',
          location: m.location || 'Pending',
          completed: !!m.completed
        })) : []
      }));
      setInboundDispatches(mappedDispatches);
    } catch (e) {
      console.error("Error formatting local storage dispatch records", e);
      setInboundDispatches([]);
    }

    loadOutboundData();
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowExportDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // --- Inbound Tab Filtering ---
  const filteredInboundData = useMemo(() => {
    if (!loggedInDistributor.code) return [];

    const distributorDispatches = inboundDispatches.filter(item => 
      (item.distributorCode && item.distributorCode === loggedInDistributor.code) ||
      (item.distributorId && item.distributorId === loggedInDistributor.code) ||
      item.distributorName === loggedInDistributor.name ||
      item.distributor === loggedInDistributor.name ||
      item.distributor === loggedInDistributor.code
    );
    
    return distributorDispatches.filter((item) => {
      const searchLower = search.toLowerCase();
      const matchSearch = 
        item.dispatchNo.toLowerCase().includes(searchLower) || 
        item.orderNo.toLowerCase().includes(searchLower) || 
        item.lrNo.toLowerCase().includes(searchLower) ||
        item.transporter.toLowerCase().includes(searchLower);

      const matchStatus = statusFilter ? item.dispatchStatus === statusFilter : true;
      const matchPod = podFilter ? item.podStatus === podFilter : true;
      const matchTransporter = transporterFilter ? item.transporter === transporterFilter : true;
      
      let matchDate = true;
      if (fromDate || toDate) {
        const dispatchDateParts = item.dispatchDate.split('-');
        if (dispatchDateParts.length === 3) {
          const isoDate = `${dispatchDateParts[2]}-${dispatchDateParts[1]}-${dispatchDateParts[0]}`;
          if (fromDate && isoDate < fromDate) matchDate = false;
          if (toDate && isoDate > toDate) matchDate = false;
        }
      }
      
      return matchSearch && matchStatus && matchPod && matchTransporter && matchDate;
    });
  }, [inboundDispatches, search, statusFilter, podFilter, transporterFilter, fromDate, toDate, loggedInDistributor]);

  // --- Outbound Tab Filtering ---
  const pendingOutboundOrders = useMemo(() => {
    if (!loggedInDistributor.code) return [];
    return retailerOrders.filter(order => 
      (order.distributorCode === loggedInDistributor.code || order.distributorId === loggedInDistributor.code) &&
      order.status === 'Approved'
    ).filter(order => {
      if (!outboundSearch) return true;
      const term = outboundSearch.toLowerCase();
      return order.orderId?.toLowerCase().includes(term) || 
             order.retailerName?.toLowerCase().includes(term) || 
             order.retailerCode?.toLowerCase().includes(term);
    });
  }, [retailerOrders, outboundSearch, loggedInDistributor]);

  const outboundHistoryData = useMemo(() => {
    if (!loggedInDistributor.code) return [];
    return outboundDispatches.filter(d => 
      (d.distributorCode === loggedInDistributor.code)
    ).filter(d => {
      const term = outboundSearch.toLowerCase();
      const matchSearch = !outboundSearch || 
             d.dispatchNo?.toLowerCase().includes(term) || 
             d.orderNo?.toLowerCase().includes(term) || 
             d.retailerName?.toLowerCase().includes(term) ||
             d.lrNo?.toLowerCase().includes(term);
      const matchStatus = !outboundStatusFilter || d.dispatchStatus === outboundStatusFilter;
      return matchSearch && matchStatus;
    });
  }, [outboundDispatches, outboundSearch, outboundStatusFilter, loggedInDistributor]);

  const createDispatchOrder = useMemo(() => {
    if (!selectedOrderId) return null;
    return pendingOutboundOrders.find(o => o.orderId === selectedOrderId) || null;
  }, [selectedOrderId, pendingOutboundOrders]);

  const getDispatchStatusVariant = (status: string) => {
    switch (status) {
      case 'Delivered': return 'success';
      case 'In Transit': case 'Out For Delivery': case 'Dispatched': return 'info';
      case 'Packed': case 'Pending Dispatch': return 'secondary';
      case 'Delayed': case 'Cancelled': return 'danger';
      case 'Approved': return 'info';
      default: return 'neutral';
    }
  };

  const getPodStatusVariant = (status: string) => {
    switch (status) {
      case 'Verified': return 'success';
      case 'Uploaded': return 'info';
      case 'Pending POD': return 'warning';
      default: return 'neutral';
    }
  };

  // ----- INBOUND EXPORT LOGIC -----
  const getExportData = () => {
    return filteredInboundData.map(item => ({
      'Dispatch No': item.dispatchNo,
      'Order No': item.orderNo,
      'Dispatch Date': item.dispatchDate,
      'Transporter': item.transporter,
      'LR No': item.lrNo,
      'Expected Delivery Date': item.expectedDeliveryDate,
      'Dispatch Status': item.dispatchStatus
    }));
  };

  const handleExportExcel = () => {
    const data = getExportData();
    if (data.length === 0) {
      setShowExportDropdown(false);
      return;
    }
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Dispatch_Tracking");
    XLSX.writeFile(wb, "Dispatch_Tracking_Export.xlsx");
    setShowExportDropdown(false);
  };

  const handleExportCSV = () => {
    const data = getExportData();
    if (data.length === 0) {
      setShowExportDropdown(false);
      return;
    }
    const ws = XLSX.utils.json_to_sheet(data);
    const csv = XLSX.utils.sheet_to_csv(ws);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "Dispatch_Tracking_Export.csv");
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowExportDropdown(false);
  };

  const handleExportPDF = () => {
    const data = getExportData();
    if (data.length === 0) {
      setShowExportDropdown(false);
      return;
    }
    const doc = new jsPDF('landscape');
    const headers = Object.keys(data[0] || {});
    const body = data.map(obj => headers.map(header => (obj as any)[header]));
    
    doc.text("Dispatch Tracking Export", 14, 15);
    autoTable(doc, {
      startY: 20,
      head: [headers],
      body: body,
      theme: 'striped',
      headStyles: { fillColor: [124, 58, 237] },
      styles: { fontSize: 8 }
    });
    doc.save("Dispatch_Tracking_Export.pdf");
    setShowExportDropdown(false);
  };

  const handleDownloadLR = (row: DispatchItem) => {
    generateLRPdf(row);
  };

  // ----- OUTBOUND DISPATCH ACTIONS -----
  const handleOrderSelect = (orderId: string, orderData?: any) => {
    setSelectedOrderId(orderId);
    const order = orderData || pendingOutboundOrders.find(o => o.orderId === orderId);
    if (!order) {
      setAllocationData({});
      return;
    }
    
    const newAllocations: Record<string, any> = {};
    if (order.items) {
      const today = new Date().toISOString().split('T')[0];
      order.items.forEach((item: any) => {
        // Filter valid batches: product match, distributor match, qty > 0, NOT EXPIRED
        const itemBatches = batchInventory.filter(b => 
          b.productCode === item.productCode && 
          b.distributorCode === loggedInDistributor.code && 
          b.quantity > 0 &&
          b.expiryDate >= today
        );

        if (itemBatches.length > 0) {
          // Pre-select the batch that expires first (FIFO)
          const selectedBatch = itemBatches.sort((a, b) => (a.expiryDate > b.expiryDate ? 1 : -1))[0];
          newAllocations[item.id] = {
            batchId: selectedBatch.id,
            batchNo: selectedBatch.batchNumber,
            mfgDate: selectedBatch.manufacturingDate || '-',
            expiry: selectedBatch.expiryDate,
            availableQty: selectedBatch.quantity,
            dispatchQty: Math.min(item.quantity, selectedBatch.quantity)
          };
        } else {
          newAllocations[item.id] = {
            batchId: '',
            batchNo: '',
            mfgDate: '',
            expiry: '',
            availableQty: 0,
            dispatchQty: 0
          };
        }
      });
    }
    setAllocationData(newAllocations);
  };

  const openCreateDispatch = (order?: any) => {
    setIsCreateDrawerOpen(true);
    const ts = Date.now().toString().slice(-6);
    setDispatchFormData({
      dispatchNo: `DISP-OUT-${ts}`,
      dispatchDate: new Date().toISOString().split('T')[0],
      remarks: '',
      transportMode: 'Road',
      transporterName: '',
      vehicleNumber: '',
      driverName: '',
      driverMobile: '',
      expectedDeliveryDate: order?.expectedDeliveryDate || '',
      freightPaidBy: 'Distributor',
      freightCharges: 0,
      lrNumber: '',
      numberOfPackages: 1,
      packageType: 'Box'
    });

    if (order) {
      handleOrderSelect(order.orderId, order);
    } else {
      setSelectedOrderId('');
      setAllocationData({});
    }
  };

  const confirmDispatch = () => {
    if (!createDispatchOrder) {
      alert("Please select a Retailer Order to dispatch.");
      return;
    }
    
    // Validate quantities
    for (const item of createDispatchOrder.items) {
      const alloc = allocationData[item.id];
      if (!alloc || alloc.dispatchQty === 0) {
        if (!window.confirm(`Item ${item.productName} has 0 dispatch quantity. Do you want to proceed?`)) {
          return;
        }
      }
      if (alloc && alloc.dispatchQty > item.quantity) {
        alert(`Dispatch quantity for ${item.productName} cannot exceed ordered quantity.`);
        return;
      }
      if (alloc && alloc.batchId) {
        const batch = batchInventory.find(b => b.id === alloc.batchId);
        if (batch && alloc.dispatchQty > batch.quantity) {
          alert(`Dispatch quantity for ${item.productName} cannot exceed available batch quantity.`);
          return;
        }
      }
    }

    // --- PRODUCTION CONDITIONAL VALIDATION ---
    if (!dispatchFormData.dispatchDate) {
      alert("Dispatch Date is mandatory."); return;
    }
    if (!dispatchFormData.transportMode) {
      alert("Transport Mode is mandatory."); return;
    }
    if (!dispatchFormData.transporterName?.trim()) {
      alert("Transport Company / Transporter Name is mandatory."); return;
    }
    if (!dispatchFormData.expectedDeliveryDate) {
      alert("Expected Delivery Date is mandatory."); return;
    }
    
    // Vehicle validations
    const requiresVehicle = ['Road', 'Own Vehicle'].includes(dispatchFormData.transportMode);
    if (requiresVehicle && !dispatchFormData.vehicleNumber?.trim()) {
      alert("Vehicle Number is mandatory for the selected Transport Mode."); return;
    }
    
    // Own Vehicle / Driver validations
    if (dispatchFormData.transportMode === 'Own Vehicle') {
      if (!dispatchFormData.driverName?.trim()) {
        alert("Driver Name is mandatory when using Own Vehicle."); return;
      }
      if (!dispatchFormData.driverMobile?.trim()) {
        alert("Driver Mobile Number is mandatory when using Own Vehicle."); return;
      }
      const mobileRegex = /^\d{10}$/;
      if (!mobileRegex.test(dispatchFormData.driverMobile.trim())) {
        alert("Driver Mobile Number must be a valid 10-digit number."); return;
      }
    }
    
    // Freight validations
    if (!dispatchFormData.freightPaidBy) {
      alert("Freight Paid By is mandatory."); return;
    }
    if (dispatchFormData.freightCharges === undefined || dispatchFormData.freightCharges === null || dispatchFormData.freightCharges < 0) {
      alert("Freight Charges must be a valid numeric value and cannot be negative."); return;
    }
    
    // LR validations
    const externalTransporter = ['Road', 'Rail', 'Air'].includes(dispatchFormData.transportMode);
    if (externalTransporter && !dispatchFormData.lrNumber?.trim()) {
      alert("LR Number is mandatory when using an external transporter."); return;
    }
    
    // Package validations
    if (!dispatchFormData.numberOfPackages || dispatchFormData.numberOfPackages <= 0) {
      alert("Number of Packages must be greater than zero."); return;
    }
    if (!dispatchFormData.packageType) {
      alert("Package Type is mandatory."); return;
    }
    // -----------------------------------------

    // 1 & 2. Create Dispatch Record
    const generatedChallanNo = `DC-OUT-${Date.now().toString().slice(-6)}`;
    const newDispatch = {
      ...dispatchFormData,
      id: dispatchFormData.dispatchNo,
      deliveryChallan: generatedChallanNo,
      challanNo: generatedChallanNo,
      warehouse: 'Main Warehouse',
      dispatchPriority: 'Normal',
      orderNo: createDispatchOrder.orderId,
      distributorCode: loggedInDistributor.code,
      retailerName: createDispatchOrder.retailerName,
      retailerCode: createDispatchOrder.retailerCode,
      dispatchStatus: 'Dispatched',
      items: createDispatchOrder.items.map((item: any) => ({
        ...item,
        allocatedBatch: allocationData[item.id]?.batchNo || '',
        dispatchQty: allocationData[item.id]?.dispatchQty || 0
      })),
      milestones: [
        { status: 'Order Approved', completed: true, date: getDDMMYYYY(createDispatchOrder.updatedAt || createDispatchOrder.date), location: 'Warehouse' },
        { status: 'Packed', completed: true, date: getDDMMYYYY(new Date().toISOString()), location: 'Warehouse' },
        { status: 'Dispatched', completed: true, date: getDDMMYYYY(new Date().toISOString()), location: 'Dispatch Hub' },
        { status: 'In Transit', completed: false, date: 'Pending', location: 'Pending' },
        { status: 'Out For Delivery', completed: false, date: 'Pending', location: 'Pending' },
        { status: 'Delivered', completed: false, date: 'Pending', location: 'Pending' }
      ]
    };

    // 3, 4, 5. Update Inventory and Orders
    const updatedInventory = [...distributorInventory];
    const updatedBatches = [...batchInventory];
    
    createDispatchOrder.items.forEach((item: any) => {
      const alloc = allocationData[item.id];
      if (alloc && alloc.dispatchQty > 0) {
        // Reduce Distributor Inventory
        const invIndex = updatedInventory.findIndex(inv => inv.productCode === item.productCode && inv.distributorCode === loggedInDistributor.code);
        if (invIndex >= 0) {
          updatedInventory[invIndex] = {
            ...updatedInventory[invIndex],
            quantity: Math.max(0, updatedInventory[invIndex].quantity - alloc.dispatchQty)
          };
        }
        
        // Reduce Batch Inventory
        if (alloc.batchId) {
          const batchIndex = updatedBatches.findIndex(b => b.id === alloc.batchId);
          if (batchIndex >= 0) {
            updatedBatches[batchIndex] = {
              ...updatedBatches[batchIndex],
              quantity: Math.max(0, updatedBatches[batchIndex].quantity - alloc.dispatchQty)
            };
          }
        }
      }
    });

    const updatedOrders = retailerOrders.map(o => {
      if (o.orderId === createDispatchOrder.orderId) {
        return { ...o, status: 'Dispatched', dispatchNo: dispatchFormData.dispatchNo };
      }
      return o;
    });

    const updatedOutboundDispatches = [...outboundDispatches, newDispatch];

    // Save all to localStorage atomically
    localStorage.setItem('pharma_erp_retailer_orders', JSON.stringify(updatedOrders));
    localStorage.setItem('pharma_erp_outbound_dispatches', JSON.stringify(updatedOutboundDispatches));
    localStorage.setItem('pharma_erp_distributor_inventory', JSON.stringify(updatedInventory));
    localStorage.setItem('pharma_erp_batches', JSON.stringify(updatedBatches));

    // Update local state
    setRetailerOrders(updatedOrders);
    setOutboundDispatches(updatedOutboundDispatches);
    setDistributorInventory(updatedInventory);
    setBatchInventory(updatedBatches);
    
    setIsCreateDrawerOpen(false);
    setSelectedOrderId('');
    setOutboundHistoryView(true);
  };

  const cancelDispatch = (dispatchRecord: any) => {
    if (dispatchRecord.dispatchStatus === 'Delivered') {
      alert("Cannot cancel a dispatch that has already been delivered.");
      return;
    }

    if (!window.confirm("Are you sure you want to cancel this dispatch? This will restore inventory and reset order status.")) return;
    
    const updatedOutboundDispatches = outboundDispatches.map(d => {
      if (d.dispatchNo === dispatchRecord.dispatchNo) {
        return { ...d, dispatchStatus: 'Cancelled' };
      }
      return d;
    });

    // Restore Inventory & Batches
    const updatedInventory = [...distributorInventory];
    const updatedBatches = [...batchInventory];
    
    dispatchRecord.items.forEach((item: any) => {
      if (item.dispatchQty > 0) {
        const invIndex = updatedInventory.findIndex(inv => inv.productCode === item.productCode && inv.distributorCode === loggedInDistributor.code);
        if (invIndex >= 0) {
          updatedInventory[invIndex] = {
            ...updatedInventory[invIndex],
            quantity: updatedInventory[invIndex].quantity + item.dispatchQty
          };
        }
        
        if (item.allocatedBatch) {
          const batchIndex = updatedBatches.findIndex(b => b.batchNumber === item.allocatedBatch && b.distributorCode === loggedInDistributor.code && b.productCode === item.productCode);
          if (batchIndex >= 0) {
            updatedBatches[batchIndex] = {
              ...updatedBatches[batchIndex],
              quantity: updatedBatches[batchIndex].quantity + item.dispatchQty
            };
          }
        }
      }
    });

    const updatedOrders = retailerOrders.map(o => {
      if (o.orderId === dispatchRecord.orderNo) {
        return { ...o, status: 'Cancelled' };
      }
      return o;
    });

    localStorage.setItem('pharma_erp_retailer_orders', JSON.stringify(updatedOrders));
    localStorage.setItem('pharma_erp_outbound_dispatches', JSON.stringify(updatedOutboundDispatches));
    localStorage.setItem('pharma_erp_distributor_inventory', JSON.stringify(updatedInventory));
    localStorage.setItem('pharma_erp_batches', JSON.stringify(updatedBatches));

    setRetailerOrders(updatedOrders);
    setOutboundDispatches(updatedOutboundDispatches);
    setDistributorInventory(updatedInventory);
    setBatchInventory(updatedBatches);
    setViewOutboundDispatch(null);
  };

  const handleGenerateInvoice = (dispatchRecord: any) => {
    // 1. Validations
    if (!['Dispatched', 'In Transit', 'Out For Delivery', 'Delivered'].includes(dispatchRecord.dispatchStatus)) {
      alert("Invoice can only be generated for dispatches that have been shipped (Dispatched or later).");
      return;
    }
    
    if (salesInvoiceService.checkInvoiceExists(dispatchRecord.dispatchNo)) {
      alert("An invoice already exists for this dispatch.");
      return;
    }
    
    const order = retailerOrders.find(o => o.orderId === dispatchRecord.orderNo);
    if (!order) {
      alert("Associated Retailer Order not found.");
      return;
    }
    
    if (!dispatchRecord.items || dispatchRecord.items.length === 0) {
      alert("No products allocated in this dispatch.");
      return;
    }
    
    const totalDispatchQty = dispatchRecord.items.reduce((sum: number, item: any) => sum + (item.dispatchQty || 0), 0);
    if (totalDispatchQty <= 0) {
      alert("Total dispatch quantity must be greater than zero.");
      return;
    }
    
    // Check Distributor Info
    const distributorsRaw = localStorage.getItem('pharma_erp_distributors');
    const distributors = distributorsRaw ? JSON.parse(distributorsRaw) : [];
    const distInfo = distributors.find((d: any) => d.code === loggedInDistributor.code || d.id === loggedInDistributor.code);
    
    if (!distInfo) {
      alert("Distributor information is missing or not configured properly.");
      return;
    }
    
    // Check Retailer Info
    const retailersRaw = localStorage.getItem('pharma_erp_retailers');
    const retailers = retailersRaw ? JSON.parse(retailersRaw) : [];
    const retInfo = retailers.find((r: any) => r.code === dispatchRecord.retailerCode || r.retailerId === dispatchRecord.retailerCode || r.name === dispatchRecord.retailerName);
    
    if (!retInfo) {
      alert("Retailer information is missing or not configured properly.");
      return;
    }
    
    // Process Items and Math
    let taxableAmount = 0;
    let totalDiscount = 0;
    let totalGst = 0;
    
    const invoiceItems = dispatchRecord.items.map((item: any) => {
      const qty = item.dispatchQty || 0;
      if (qty === 0) return null;
      
      const ptr = item.ptr || item.price || 100;
      const baseTotal = qty * ptr;
      const discountPerc = item.discount || 0;
      const discountAmt = baseTotal * (discountPerc / 100);
      const afterDiscount = baseTotal - discountAmt;
      
      const gstPerc = item.gst || 12; // fallback 12%
      const gstAmt = afterDiscount * (gstPerc / 100);
      
      taxableAmount += afterDiscount;
      totalDiscount += discountAmt;
      totalGst += gstAmt;
      
      return {
        id: item.id || Math.random().toString(),
        productName: item.productName || item.product,
        productCode: item.productCode || item.code,
        batchNumber: item.allocatedBatch || item.batchNo || '-',
        expiry: item.expiry || '-',
        hsnCode: item.hsn || item.hsnCode || '30049099',
        qty: qty,
        unit: item.unit || 'Box',
        mrp: item.mrp || 0,
        ptr: ptr,
        discount: discountPerc,
        gst: gstPerc,
        amount: afterDiscount + gstAmt,
        taxableValue: afterDiscount,
        gstAmount: gstAmt
      };
    }).filter(Boolean);
    
    const rawTotal = taxableAmount + totalGst;
    const grandTotal = Math.round(rawTotal);
    const roundOff = grandTotal - rawTotal;
    
    try {
      salesInvoiceService.createSalesInvoice({
        date: new Date().toISOString().split('T')[0],
        paymentStatus: 'Pending',
        dispatchNo: dispatchRecord.dispatchNo,
        orderNo: dispatchRecord.orderNo,
        distributorId: distInfo.id || distInfo.code,
        distributorCode: distInfo.code,
        distributorName: distInfo.name || distInfo.distributorName,
        retailerId: retInfo.id || retInfo.retailerId || retInfo.code,
        retailerCode: retInfo.code || retInfo.retailerId,
        retailerName: retInfo.name || retInfo.retailerName,
        billingAddress: retInfo.billingAddress || retInfo.address || 'Retailer Address',
        shippingAddress: retInfo.shippingAddress || retInfo.address || 'Retailer Address',
        items: invoiceItems,
        taxableAmount,
        totalDiscount,
        totalGst,
        roundOff,
        grandTotal
      });
      
      // Refresh invoices
      setSalesInvoices(salesInvoiceService.getAll());
      alert("Invoice generated successfully!");
      
    } catch (e: any) {
      alert("Error generating invoice: " + e.message);
    }
  };

  // ----- COLUMNS -----
  const inboundColumns: Column<DispatchItem>[] = [
    { key: 'dispatchNo', label: 'Dispatch No', render: (row) => <span className="font-semibold text-slate-900">{row.dispatchNo}</span> },
    { key: 'orderNo', label: 'Order No', render: (row) => <span className="text-slate-600">{row.orderNo}</span> },
    { key: 'dispatchDate', label: 'Dispatch Date', render: (row) => <span className="text-slate-600">{row.dispatchDate}</span> },
    { key: 'transporter', label: 'Transporter', render: (row) => <span className="text-slate-600">{row.transporter}</span> },
    { key: 'lrNo', label: 'LR Number', render: (row) => <span className="font-medium text-slate-800">{row.lrNo}</span> },
    { key: 'expectedDeliveryDate', label: 'Expected Delivery', render: (row) => <span className="text-slate-600">{row.expectedDeliveryDate}</span> },
    { key: 'dispatchStatus', label: 'Dispatch Status', render: (row) => <Badge variant={getDispatchStatusVariant(row.dispatchStatus) as any}>{row.dispatchStatus}</Badge> },
    { key: 'podStatus', label: 'POD Status', render: (row) => <Badge variant={getPodStatusVariant(row.podStatus) as any}>{row.podStatus}</Badge> },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
          <button onClick={() => setViewDispatch(row)} className="text-slate-400 hover:text-[#163c78] transition-colors p-1" title="View Details">
            <Eye className="w-4 h-4" />
          </button>
          <button onClick={() => setTrackDispatch(row)} className="text-slate-400 hover:text-blue-600 transition-colors p-1" title="Track Shipment">
            <Map className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  const pendingOutboundColumns: Column<any>[] = [
    { key: 'orderId', label: 'Order Number', render: (row) => <span className="font-semibold text-slate-900">{row.orderId}</span> },
    { key: 'retailerName', label: 'Retailer', render: (row) => <span className="text-slate-600 font-medium">{row.retailerName}</span> },
    { key: 'date', label: 'Order Date', render: (row) => <span className="text-slate-600">{getDDMMYYYY(row.date)}</span> },
    { key: 'totalAmount', label: 'Total Amount', render: (row) => <span className="text-slate-800 font-bold">{formatCurrency(row.totalAmount)}</span> },
    { key: 'status', label: 'Order Status', render: (row) => <Badge variant={getDispatchStatusVariant(row.status) as any}>{row.status}</Badge> },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <ActionButton onClick={() => openCreateDispatch(row)} icon={<Truck className="w-4 h-4" />}>
          Create Dispatch
        </ActionButton>
      )
    }
  ];

  const historyOutboundColumns: Column<any>[] = [
    { key: 'dispatchNo', label: 'Dispatch Number', render: (row) => <span className="font-semibold text-slate-900">{row.dispatchNo}</span> },
    { key: 'orderNo', label: 'Order No', render: (row) => <span className="text-slate-600">{row.orderNo}</span> },
    { key: 'retailerName', label: 'Retailer', render: (row) => <span className="text-slate-600 font-medium">{row.retailerName}</span> },
    { key: 'dispatchDate', label: 'Dispatch Date', render: (row) => <span className="text-slate-600">{getDDMMYYYY(row.dispatchDate)}</span> },
    { key: 'transporterName', label: 'Transporter', render: (row) => <span className="text-slate-600">{row.transporterName || 'N/A'}</span> },
    { key: 'lrNumber', label: 'LR No', render: (row) => <span className="font-medium text-slate-800">{row.lrNumber || 'N/A'}</span> },
    { key: 'dispatchStatus', label: 'Status', render: (row) => <Badge variant={getDispatchStatusVariant(row.dispatchStatus) as any}>{row.dispatchStatus}</Badge> },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => {
        const invoice = salesInvoices.find(inv => inv.dispatchNo === row.dispatchNo);
        return (
          <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
            <ActionButton variant="ghost" onClick={() => setViewOutboundDispatch(row)} icon={<Eye className="w-4 h-4" />}>
              View Dispatch
            </ActionButton>
            
            {invoice ? (
              <>
                <button onClick={() => salesInvoiceService.downloadInvoice(invoice.invoiceNo, 'Distributor')} className="text-slate-400 hover:text-[#163c78] transition-colors p-1 flex items-center" title="Download Invoice">
                  <Download className="w-4 h-4" />
                </button>
                <button onClick={() => salesInvoiceService.printInvoice(invoice.invoiceNo, 'Distributor')} className="text-slate-400 hover:text-slate-900 transition-colors p-1 flex items-center" title="Print Invoice">
                  <Printer className="w-4 h-4" />
                </button>
              </>
            ) : (
              <button 
                onClick={() => handleGenerateInvoice(row)} 
                className="text-violet-600 hover:text-violet-700 text-sm font-medium flex items-center bg-violet-50 hover:bg-violet-100 px-3 py-1.5 rounded-lg transition-colors"
              >
                <FileText className="w-4 h-4 mr-1.5" /> Generate Invoice
              </button>
            )}
          </div>
        );
      }
    }
  ];

  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader
        title="Dispatch & Logistics"
        subtitle="Manage inbound shipments from wholesale and outbound dispatches to retailers."
        actions={
          activeTab === 'inbound' ? (
            <div className="relative" ref={dropdownRef}>
              <ActionButton 
                variant="secondary" 
                icon={<Download className="w-4 h-4" />} 
                onClick={() => setShowExportDropdown(!showExportDropdown)}
              >
                Export Logistics Report <ChevronDown className="w-3 h-3 opacity-50 ml-1" />
              </ActionButton>
              
              {showExportDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-200 overflow-hidden z-10 animate-in slide-in-from-top-2">
                  <div className="p-1">
                    <button onClick={handleExportExcel} className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-violet-700 rounded transition-colors">
                      Export as Excel (.xlsx)
                    </button>
                    <button onClick={handleExportCSV} className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-violet-700 rounded transition-colors">
                      Export as CSV (.csv)
                    </button>
                    <button onClick={handleExportPDF} className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-violet-700 rounded transition-colors">
                      Export as PDF (.pdf)
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : null
        }
      />

      {/* Tabs */}
      <div className="flex border-b border-slate-200 mb-6">
        <button
          className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'inbound' 
              ? 'border-violet-600 text-violet-700' 
              : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
          }`}
          onClick={() => setActiveTab('inbound')}
        >
          Inbound Dispatch
        </button>
        <button
          className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'outbound' 
              ? 'border-violet-600 text-violet-700' 
              : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
          }`}
          onClick={() => { setActiveTab('outbound'); setOutboundHistoryView(false); }}
        >
          Outbound Dispatch
        </button>
      </div>

      {/* --- INBOUND TAB --- */}
      {activeTab === 'inbound' && (
        <>
          <FilterBar>
            <SearchInput 
              value={search} 
              onChange={setSearch} 
              placeholder="Search dispatch, order or LR..." 
            />
            <div className="w-px h-6 bg-slate-200 mx-2 hidden sm:block" />
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <span className="text-sm font-medium text-slate-600">Filters:</span>
            </div>

            <input 
              type="date" 
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="text-sm border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:outline-none focus:border-violet-400 bg-white"
              title="From Date"
            />
            <span className="text-slate-400">-</span>
            <input 
              type="date" 
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="text-sm border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:outline-none focus:border-violet-400 bg-white"
              title="To Date"
            />

            <SelectFilter
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { label: 'All Statuses', value: '' },
                { label: 'Pending Dispatch', value: 'Pending Dispatch' },
                { label: 'Packed', value: 'Packed' },
                { label: 'Dispatched', value: 'Dispatched' },
                { label: 'In Transit', value: 'In Transit' },
                { label: 'Out For Delivery', value: 'Out For Delivery' },
                { label: 'Delivered', value: 'Delivered' },
                { label: 'Delayed', value: 'Delayed' },
                { label: 'Cancelled', value: 'Cancelled' },
              ]}
              placeholder="Dispatch Status"
            />
            <SelectFilter
              value={podFilter}
              onChange={setPodFilter}
              options={[
                { label: 'All PODs', value: '' },
                { label: 'Pending POD', value: 'Pending POD' },
                { label: 'Uploaded', value: 'Uploaded' },
                { label: 'Verified', value: 'Verified' },
              ]}
              placeholder="POD Status"
            />
            <SelectFilter
              value={transporterFilter}
              onChange={setTransporterFilter}
              options={[
                { label: 'All Transporters', value: '' },
                { label: 'VRL Logistics', value: 'VRL Logistics' },
                { label: 'Gati', value: 'Gati' },
                { label: 'Delhivery', value: 'Delhivery' },
                { label: 'Blue Dart', value: 'Blue Dart' },
                { label: 'Others', value: 'Others' },
              ]}
              placeholder="Transporter"
            />
          </FilterBar>

          <TableCard>
            <div className="[&>div::-webkit-scrollbar]:hidden [&>div]:[-ms-overflow-style:none] [&>div]:[scrollbar-width:none]">
              <DataTable
                columns={inboundColumns}
                data={filteredInboundData}
                emptyMessage="No inbound dispatch records found."
              />
            </div>
          </TableCard>
        </>
      )}

      {/* --- OUTBOUND TAB --- */}
      {activeTab === 'outbound' && (
        <>
          <div className="mb-6">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Distributor → Retailer Dispatch</h2>
                <p className="text-sm text-slate-500 mt-1 max-w-2xl">Manage dispatch creation, stock allocation, transport documents, LR generation, delivery challans and shipment tracking for approved retailer orders.</p>
              </div>
              <ActionButton icon={<Plus className="w-4 h-4" />} onClick={() => openCreateDispatch()}>
                Create Dispatch
              </ActionButton>
            </div>
          </div>

          <div className="flex justify-between items-center mb-6">
            <div className="flex space-x-2 bg-slate-100 p-1 rounded-lg">
              <button
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${!outboundHistoryView ? 'bg-white text-violet-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                onClick={() => setOutboundHistoryView(false)}
              >
                Ready For Dispatch
              </button>
              <button
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${outboundHistoryView ? 'bg-white text-violet-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                onClick={() => setOutboundHistoryView(true)}
              >
                Dispatch History
              </button>
            </div>
            
            <div className="!mb-0 flex-1 ml-6 max-w-2xl">
              <FilterBar>
              <SearchInput 
                value={outboundSearch} 
                onChange={setOutboundSearch} 
                placeholder="Search order or retailer..." 
              />
              {outboundHistoryView && (
                <>
                  <div className="w-px h-6 bg-slate-200 mx-2 hidden sm:block" />
                  <SelectFilter
                    value={outboundStatusFilter}
                    onChange={setOutboundStatusFilter}
                    options={[
                      { label: 'All Statuses', value: '' },
                      { label: 'Dispatched', value: 'Dispatched' },
                      { label: 'Delivered', value: 'Delivered' },
                      { label: 'Cancelled', value: 'Cancelled' },
                    ]}
                    placeholder="Status"
                  />
                </>
              )}
              </FilterBar>
            </div>
          </div>

          {!outboundHistoryView ? (
            <TableCard>
              <div className="[&>div::-webkit-scrollbar]:hidden [&>div]:[-ms-overflow-style:none] [&>div]:[scrollbar-width:none]">
                <DataTable
                  columns={pendingOutboundColumns}
                  data={pendingOutboundOrders}
                  emptyMessage="No approved orders pending dispatch."
                />
              </div>
            </TableCard>
          ) : (
            <TableCard>
              <div className="[&>div::-webkit-scrollbar]:hidden [&>div]:[-ms-overflow-style:none] [&>div]:[scrollbar-width:none]">
                <DataTable
                  columns={historyOutboundColumns}
                  data={outboundHistoryData}
                  emptyMessage="No outbound dispatch history found."
                />
              </div>
            </TableCard>
          )}
        </>
      )}

      {/* --- DRAWERS --- */}

      {/* View Inbound Drawer */}
      <Drawer
        open={viewDispatch !== null && activeTab === 'inbound'}
        onClose={() => setViewDispatch(null)}
        title="Inbound Shipment Details"
      >
        {viewDispatch && (
          <div className="space-y-6 pb-20">
            {/* Dispatch Information */}
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">Dispatch Information</h3>
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <DrawerField label="Dispatch No" value={<span className="font-semibold">{viewDispatch.dispatchNo}</span>} />
                <DrawerField label="Order No" value={viewDispatch.orderNo} />
                <DrawerField label="Dispatch Date" value={viewDispatch.dispatchDate} />
              </div>
            </div>

            {/* Transport Information */}
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">Transport Information</h3>
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <DrawerField label="Transporter" value={viewDispatch.transporter} />
                <DrawerField label="LR Number" value={viewDispatch.lrNo} />
                <DrawerField label="Vehicle No" value={viewDispatch.vehicleNo} />
                <DrawerField label="Driver Name" value={viewDispatch.driverName} />
                <DrawerField label="Driver Mobile" value={viewDispatch.driverMobile} />
              </div>
            </div>

            {/* Delivery Information */}
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">Delivery Information</h3>
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <DrawerField label="Expected Delivery" value={viewDispatch.expectedDeliveryDate} />
                <DrawerField label="Current Status" value={<Badge variant={getDispatchStatusVariant(viewDispatch.dispatchStatus) as any}>{viewDispatch.dispatchStatus}</Badge>} />
              </div>
            </div>

            {/* Status Timeline */}
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">Status Timeline</h3>
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <div className="flex flex-col space-y-4">
                  {viewDispatch.milestones.length > 0 ? viewDispatch.milestones.map((ms, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <div className={`mt-0.5 w-2.5 h-2.5 rounded-full ${ms.completed ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                      <div>
                        <p className={`text-sm font-medium ${ms.completed ? 'text-slate-800' : 'text-slate-400'}`}>{ms.status}</p>
                        {ms.completed && <p className="text-xs text-slate-500">{ms.date}</p>}
                      </div>
                    </div>
                  )) : (
                    <div className="text-sm text-slate-500">No timeline events available.</div>
                  )}
                </div>
              </div>
            </div>

            {/* POD Information */}
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">POD Information</h3>
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <DrawerField label="POD Status" value={<Badge variant={getPodStatusVariant(viewDispatch.podStatus) as any}>{viewDispatch.podStatus}</Badge>} />
                {viewDispatch.podStatus !== 'Pending POD' && (
                  <DrawerField label="POD Upload Date" value={viewDispatch.actualDeliveryDate} />
                )}
                {viewDispatch.podStatus !== 'Pending POD' && (
                  <div className="mt-4 pt-4 border-t border-slate-200">
                    <ActionButton variant="secondary" onClick={() => generatePODPdf(viewDispatch)} icon={<Download className="w-4 h-4" />}>
                      Download POD
                    </ActionButton>
                  </div>
                )}
              </div>
            </div>

            {/* Drawer Actions */}
            {viewDispatch.lrNo !== 'Pending' && (
              <div className="mt-6 pt-6 border-t border-slate-200">
                <ActionButton onClick={() => handleDownloadLR(viewDispatch)} icon={<FileText className="w-4 h-4" />}>
                  Download LR
                </ActionButton>
              </div>
            )}
          </div>
        )}
      </Drawer>

      {/* Track Shipment Modal */}
      {trackDispatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900">
                Track Shipment
              </h2>
              <button
                onClick={() => setTrackDispatch(null)}
                className="text-slate-500 hover:text-slate-800"
              >
                ✕
              </button>
            </div>

            <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-slate-500">Dispatch No</span>
                <span className="font-semibold text-slate-800">{trackDispatch.dispatchNo}</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-slate-500">Transporter</span>
                <span className="font-medium text-slate-800">{trackDispatch.transporter}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-500">LR Number</span>
                <span className="font-medium text-slate-800">{trackDispatch.lrNo}</span>
              </div>
            </div>

            <h3 className="font-bold text-slate-900 mb-4">Tracking History</h3>
            <div className="relative pl-4 border-l-2 border-slate-200 ml-2 space-y-6">
              {trackDispatch.milestones.length > 0 ? trackDispatch.milestones.map((ms, idx) => (
                <div key={idx} className="relative">
                  <div className={`absolute -left-[21px] top-1 w-3 h-3 rounded-full border-2 border-white ${ms.completed ? 'bg-[#163c78]' : 'bg-slate-300'}`} />
                  <div className="pl-2">
                    <p className={`font-semibold text-sm ${ms.completed ? 'text-slate-900' : 'text-slate-500'}`}>{ms.status}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{ms.location}</p>
                    {ms.completed && <p className="text-xs text-slate-400 mt-1">{ms.date}</p>}
                  </div>
                </div>
              )) : (
                <div className="text-sm text-slate-500">Tracking information currently unavailable.</div>
              )}
            </div>

            <div className="mt-8 pt-4 border-t border-slate-100 flex justify-end">
              <ActionButton variant="ghost" onClick={() => setTrackDispatch(null)}>
                Close
              </ActionButton>
            </div>
          </div>
        </div>
      )}

      {/* Create Outbound Dispatch Modal */}
      {isCreateDrawerOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setIsCreateDrawerOpen(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-white sticky top-0 z-10">
              <h2 className="text-xl font-bold text-slate-900">Create Outbound Dispatch</h2>
              <button onClick={() => setIsCreateDrawerOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors outline-none">✕</button>
            </div>
            
            <div className="p-6 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] space-y-8 bg-slate-50/30">
          
          {/* Section 1: Retailer Order */}
          <section>
            <div className="flex items-center gap-2 mb-4 border-b border-slate-200 pb-2">
              <div className="w-6 h-6 rounded bg-violet-100 text-violet-700 flex items-center justify-center font-bold text-xs">1</div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Retailer Order</h3>
            </div>
            
            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm space-y-5">
              <div className="w-full">
                <label className="text-xs font-medium text-slate-600 block mb-1.5 flex items-center"><Search className="w-3.5 h-3.5 mr-1" /> Search Approved Orders</label>
                <select
                  className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 bg-slate-50 hover:bg-white transition-colors cursor-pointer"
                  value={selectedOrderId}
                  onChange={(e) => handleOrderSelect(e.target.value)}
                >
                  <option value="">-- Select Approved Order --</option>
                  {pendingOutboundOrders.map(o => (
                    <option key={o.orderId} value={o.orderId}>{o.orderId} - {o.retailerName} ({o.retailerCode})</option>
                  ))}
                </select>
              </div>

              {createDispatchOrder && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pt-5 border-t border-slate-100">
                  <DrawerField label="Order Number" value={<span className="font-semibold text-slate-900">{createDispatchOrder.orderId}</span>} />
                  <DrawerField label="Retailer Name" value={<span className="font-medium">{createDispatchOrder.retailerName}</span>} />
                  <DrawerField label="Retailer Code" value={<span className="font-mono text-xs bg-slate-100 px-2 py-1 rounded">{createDispatchOrder.retailerCode}</span>} />
                  <DrawerField label="Order Date" value={getDDMMYYYY(createDispatchOrder.date)} />
                  
                  <DrawerField label="Order Status" value={<Badge variant={getDispatchStatusVariant(createDispatchOrder.status) as any}>{createDispatchOrder.status}</Badge>} />
                  <DrawerField label="Payment Status" value={<Badge variant={createDispatchOrder.paymentStatus === 'Paid' ? 'success' : 'warning'}>{createDispatchOrder.paymentStatus || 'Pending'}</Badge>} />
                  <DrawerField label="Order Value" value={<span className="font-bold text-slate-900">{formatCurrency(createDispatchOrder.totalAmount)}</span>} />
                  <DrawerField label="Expected Delivery" value={<span className="text-slate-700">{getDDMMYYYY(createDispatchOrder.expectedDeliveryDate || dispatchFormData.expectedDeliveryDate || '-')}</span>} />
                </div>
              )}
            </div>
          </section>

          {/* Section 2: Products & Batch Allocation */}
          <section>
            <div className="flex items-center gap-2 mb-4 border-b border-slate-200 pb-2">
              <div className="w-6 h-6 rounded bg-violet-100 text-violet-700 flex items-center justify-center font-bold text-xs">2</div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Products & Batch Allocation</h3>
            </div>
            
            <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
              {!createDispatchOrder ? (
                <div className="p-8 text-center text-slate-500 bg-slate-50">Please select a Retailer Order to allocate products and batches.</div>
              ) : (
                <div className="divide-y divide-slate-200">
                  {createDispatchOrder.items?.map((item: any) => {
                    const availableInv = distributorInventory.find(inv => inv.productCode === item.productCode && inv.distributorCode === loggedInDistributor.code);
                    const maxAvailable = availableInv?.quantity || 0;
                    const currentDispatchQty = allocationData[item.id]?.dispatchQty || 0;
                    const remaining = maxAvailable - currentDispatchQty;

                    const validBatches = batchInventory.filter(b => 
                      b.productCode === item.productCode && 
                      b.distributorCode === loggedInDistributor.code && 
                      b.quantity > 0 && 
                      b.expiryDate >= new Date().toISOString().split('T')[0]
                    );

                    return (
                      <div key={item.id} className="p-5 hover:bg-slate-50/30 transition-colors">
                        <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-4 mb-4">
                          <div className="xl:col-span-2">
                            <p className="text-xs font-medium text-slate-500 mb-1">Product</p>
                            <p className="font-semibold text-slate-900">{item.productName} <span className="text-xs text-slate-500 font-mono ml-1">({item.productCode})</span></p>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-slate-500 mb-1">Ordered Qty</p>
                            <p className="font-bold text-slate-900">{item.quantity}</p>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-slate-500 mb-1">Available Stock</p>
                            <p className="font-medium text-emerald-600">{maxAvailable}</p>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-slate-500 mb-1">Dispatch Qty</p>
                            <p className="font-bold text-violet-700">{currentDispatchQty}</p>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-slate-500 mb-1">Remaining Stock</p>
                            <p className="font-medium text-slate-600">{remaining}</p>
                          </div>
                        </div>

                        <div className="bg-slate-50 rounded-lg p-4 border border-slate-100 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-end">
                          <div>
                            <label className="text-xs font-medium text-slate-600 block mb-1.5 flex items-center"><Layers className="w-3.5 h-3.5 mr-1" /> Select Batch</label>
                            <select 
                              className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 bg-white"
                              value={allocationData[item.id]?.batchId || ''}
                              onChange={(e) => {
                                const selected = validBatches.find(b => b.id === e.target.value);
                                setAllocationData({
                                  ...allocationData,
                                  [item.id]: {
                                    ...allocationData[item.id],
                                    batchId: e.target.value,
                                    batchNo: selected ? selected.batchNumber : '',
                                    mfgDate: selected ? (selected.manufacturingDate || '-') : '',
                                    expiry: selected ? selected.expiryDate : '',
                                    availableQty: selected ? selected.quantity : 0,
                                    dispatchQty: Math.min(item.quantity, selected ? selected.quantity : 0)
                                  }
                                });
                              }}
                            >
                              <option value="">-- Select Valid Batch --</option>
                              {validBatches.map(b => (
                                <option key={b.id} value={b.id}>{b.batchNumber} - Qty: {b.quantity} (Exp: {b.expiryDate})</option>
                              ))}
                            </select>
                          </div>
                          
                          <div>
                            <label className="text-xs font-medium text-slate-600 block mb-1.5 flex items-center"><Calendar className="w-3.5 h-3.5 mr-1" /> Mfg & Expiry</label>
                            <div className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-slate-100/50 text-slate-600 min-h-[42px] flex flex-col justify-center text-xs">
                              {allocationData[item.id]?.batchId ? (
                                <div className="flex justify-between items-center">
                                  <span>{allocationData[item.id]?.mfgDate}</span>
                                  <span className="text-rose-600 font-medium">{allocationData[item.id]?.expiry}</span>
                                </div>
                              ) : (
                                <span className="text-slate-400 italic">Select batch first</span>
                              )}
                            </div>
                          </div>

                          <div>
                            <label className="text-xs font-medium text-slate-600 block mb-1.5">Available Batch Qty</label>
                            <input 
                              type="text" 
                              readOnly 
                              className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2.5 bg-slate-100/50 font-semibold text-emerald-600" 
                              value={allocationData[item.id]?.availableQty || 0} 
                            />
                          </div>

                          <div>
                            <label className="text-xs font-medium text-violet-700 block mb-1.5">Allocated Dispatch Qty</label>
                            <input 
                              type="number"
                              min={0}
                              max={Math.min(item.quantity, allocationData[item.id]?.availableQty || 0)}
                              className="w-full text-sm border border-violet-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 bg-white font-bold text-violet-900 shadow-sm"
                              value={allocationData[item.id]?.dispatchQty || 0}
                              onChange={(e) => {
                                const val = parseInt(e.target.value) || 0;
                                const maxAllowed = Math.min(item.quantity, allocationData[item.id]?.availableQty || 0);
                                setAllocationData({
                                  ...allocationData,
                                  [item.id]: {
                                    ...allocationData[item.id],
                                    dispatchQty: Math.min(val, maxAllowed)
                                  }
                                });
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>

          {/* Section 3: Dispatch & Logistics */}
          <section>
            <div className="flex items-center gap-2 mb-4 border-b border-slate-200 pb-2">
              <div className="w-6 h-6 rounded bg-violet-100 text-violet-700 flex items-center justify-center font-bold text-xs">3</div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Dispatch & Logistics</h3>
            </div>
            
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm divide-y divide-slate-100">
              
              {/* Dispatch Group */}
              <div className="p-5">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center"><FileText className="w-4 h-4 mr-1.5" /> Dispatch Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-600 whitespace-nowrap block">Dispatch Number</label>
                    <input type="text" readOnly className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2.5 bg-slate-50 text-slate-600 font-mono" value={dispatchFormData.dispatchNo} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-600 whitespace-nowrap block">Dispatch Date</label>
                    <input type="date" className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 bg-white" value={dispatchFormData.dispatchDate} onChange={e => setDispatchFormData({...dispatchFormData, dispatchDate: e.target.value})} />
                  </div>
                  <div className="space-y-1.5 lg:col-span-2">
                    <label className="text-xs font-medium text-slate-600 block">Remarks</label>
                    <input type="text" className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 bg-white" value={dispatchFormData.remarks} onChange={e => setDispatchFormData({...dispatchFormData, remarks: e.target.value})} placeholder="Any special instructions..." />
                  </div>
                </div>
              </div>

              {/* Transport Group */}
              <div className="p-5 bg-slate-50/30">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center"><Truck className="w-4 h-4 mr-1.5" /> Transport Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-600 whitespace-nowrap block">Transport Mode</label>
                    <select className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 bg-white" value={dispatchFormData.transportMode} onChange={e => setDispatchFormData({...dispatchFormData, transportMode: e.target.value})}>
                      <option>Road</option>
                      <option>Rail</option>
                      <option>Air</option>
                      <option>Own Vehicle</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-600 whitespace-nowrap block">Transport Company <span className="text-rose-500">*</span></label>
                    <input type="text" className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 bg-white" value={dispatchFormData.transporterName} onChange={e => setDispatchFormData({...dispatchFormData, transporterName: e.target.value})} placeholder="e.g. VRL Logistics" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-600 whitespace-nowrap block">Vehicle Number</label>
                    <input type="text" className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 bg-white uppercase" value={dispatchFormData.vehicleNumber} onChange={e => setDispatchFormData({...dispatchFormData, vehicleNumber: e.target.value})} placeholder="MH 12 AB 1234" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-600 whitespace-nowrap block">Expected Delivery Date <span className="text-rose-500">*</span></label>
                    <input type="date" className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 bg-white" value={dispatchFormData.expectedDeliveryDate} onChange={e => setDispatchFormData({...dispatchFormData, expectedDeliveryDate: e.target.value})} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-600 whitespace-nowrap block">Driver Name</label>
                    <input type="text" className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 bg-white" value={dispatchFormData.driverName} onChange={e => setDispatchFormData({...dispatchFormData, driverName: e.target.value})} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-600 whitespace-nowrap block">Driver Mobile Number</label>
                    <input type="text" className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 bg-white" value={dispatchFormData.driverMobile} onChange={e => setDispatchFormData({...dispatchFormData, driverMobile: e.target.value})} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-600 whitespace-nowrap block">Freight Paid By</label>
                    <select className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 bg-white" value={dispatchFormData.freightPaidBy} onChange={e => setDispatchFormData({...dispatchFormData, freightPaidBy: e.target.value})}>
                      <option>Distributor</option>
                      <option>Retailer</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-600 whitespace-nowrap block">Freight Charges (₹)</label>
                    <input type="number" min="0" className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 bg-white" value={dispatchFormData.freightCharges} onChange={e => setDispatchFormData({...dispatchFormData, freightCharges: parseFloat(e.target.value) || 0})} />
                  </div>
                </div>
              </div>

              {/* Shipment Group */}
              <div className="p-5">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center"><Package className="w-4 h-4 mr-1.5" /> LR / Consignment Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-600 whitespace-nowrap block">LR Number</label>
                    <input type="text" className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 bg-white" value={dispatchFormData.lrNumber} onChange={e => setDispatchFormData({...dispatchFormData, lrNumber: e.target.value})} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-600 whitespace-nowrap block">Number of Packages</label>
                    <input type="number" min="1" className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 bg-white" value={dispatchFormData.numberOfPackages} onChange={e => setDispatchFormData({...dispatchFormData, numberOfPackages: parseInt(e.target.value) || 1})} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-600 whitespace-nowrap block">Package Type</label>
                    <select className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 bg-white" value={dispatchFormData.packageType} onChange={e => setDispatchFormData({...dispatchFormData, packageType: e.target.value})}>
                      <option>Box</option>
                      <option>Carton</option>
                      <option>Pallet</option>
                      <option>Cold Chain Box</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Section 4: Dispatch Summary */}
          <section>
            <div className="flex items-center gap-2 mb-4 border-b border-slate-200 pb-2">
              <div className="w-6 h-6 rounded bg-violet-100 text-violet-700 flex items-center justify-center font-bold text-xs">4</div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Dispatch Summary</h3>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
              <div className="bg-violet-50 border border-violet-100 rounded-xl p-5 shadow-sm w-full">
                <h4 className="text-xs font-bold text-violet-800 uppercase tracking-wider mb-4 border-b border-violet-200 pb-2">Overview</h4>
                {(() => {
                  const totalItems = createDispatchOrder?.items?.length || 0;
                  let totalDispatchQty = 0;
                  createDispatchOrder?.items?.forEach((item: any) => {
                    totalDispatchQty += (allocationData[item.id]?.dispatchQty || 0);
                  });
                  
                  return (
                    <div className="grid grid-cols-2 gap-y-5 gap-x-6">
                      <div>
                        <p className="text-xs font-medium text-violet-600 mb-1">Total Products</p>
                        <p className="text-xl font-bold text-violet-900">{totalItems}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-violet-600 mb-1">Total Quantity</p>
                        <p className="text-xl font-bold text-violet-900">{totalDispatchQty} units</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-violet-600 mb-1">Total Packages</p>
                        <p className="text-xl font-bold text-violet-900">{dispatchFormData.numberOfPackages}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-violet-600 mb-1">Total Weight</p>
                        <p className="text-xl font-bold text-violet-900">0 kg</p>
                      </div>
                      <div className="col-span-2 pt-4 border-t border-violet-200/50">
                        <p className="text-xs font-medium text-violet-600 mb-1">Dispatch Value</p>
                        <p className="text-3xl font-black text-violet-900">{createDispatchOrder ? formatCurrency(createDispatchOrder.totalAmount) : '₹0.00'}</p>
                      </div>
                    </div>
                  );
                })()}
              </div>

              <div className="border border-emerald-100 rounded-xl overflow-hidden bg-white shadow-sm w-full flex flex-col">
                <div className="p-4 bg-emerald-50/50 border-b border-emerald-100">
                  <h4 className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Inventory Impact</h4>
                </div>
                <div className="flex-1 overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 border-b border-slate-100">
                      <tr>
                        <th className="px-4 py-3 font-medium text-slate-600">Product</th>
                        <th className="px-4 py-3 font-medium text-slate-600 text-center">Stock</th>
                        <th className="px-4 py-3 font-medium text-slate-600 text-center">Dispatch</th>
                        <th className="px-4 py-3 font-medium text-slate-600 text-center">Remaining</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {!createDispatchOrder ? (
                        <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-400">No impact data.</td></tr>
                      ) : createDispatchOrder.items?.map((item: any) => {
                        const availableInv = distributorInventory.find(inv => inv.productCode === item.productCode && inv.distributorCode === loggedInDistributor.code);
                        const maxAvailable = availableInv?.quantity || 0;
                        const currentDispatchQty = allocationData[item.id]?.dispatchQty || 0;
                        const remaining = maxAvailable - currentDispatchQty;

                        return (
                          <tr key={`impact-${item.id}`} className="hover:bg-slate-50/50">
                            <td className="px-4 py-3 font-medium text-slate-900">{item.productName}</td>
                            <td className="px-4 py-3 text-center text-slate-600">{maxAvailable}</td>
                            <td className="px-4 py-3 text-center font-semibold text-rose-500">-{currentDispatchQty}</td>
                            <td className="px-4 py-3 text-center font-bold text-emerald-600">{remaining}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          </section>
        </div>

        {/* FOOTER ACTIONS */}
        <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 rounded-b-2xl">
          <ActionButton variant="secondary" onClick={() => setIsCreateDrawerOpen(false)}>Cancel</ActionButton>
          <ActionButton onClick={confirmDispatch}>Create Dispatch</ActionButton>
        </div>
      </div>
    </div>
  )}

      {/* View Outbound Dispatch History Drawer */}
      <Drawer
        open={viewOutboundDispatch !== null}
        onClose={() => setViewOutboundDispatch(null)}
        title="Outbound Dispatch Details"
      >
        {viewOutboundDispatch && (
          <div className="space-y-6 pb-20">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex justify-between items-center">
              <div>
                <p className="text-xs text-slate-500 mb-1">Dispatch Status</p>
                <Badge variant={getDispatchStatusVariant(viewOutboundDispatch.dispatchStatus) as any}>{viewOutboundDispatch.dispatchStatus}</Badge>
              </div>
              {viewOutboundDispatch.dispatchStatus !== 'Cancelled' && viewOutboundDispatch.dispatchStatus !== 'Delivered' && (
                <button onClick={() => cancelDispatch(viewOutboundDispatch)} className="text-rose-600 hover:text-rose-700 text-sm font-medium flex items-center bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-lg transition-colors">
                  <XCircle className="w-4 h-4 mr-1.5" /> Cancel Dispatch
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">Dispatch Information</h3>
                <div className="bg-white rounded-xl p-4 border border-slate-200 space-y-4">
                  <DrawerField label="Dispatch No" value={<span className="font-semibold text-violet-700">{viewOutboundDispatch.dispatchNo}</span>} />
                  <DrawerField label="Delivery Challan" value={<span className="font-mono text-slate-700">{viewOutboundDispatch.deliveryChallan}</span>} />
                  <DrawerField label="Dispatch Date" value={getDDMMYYYY(viewOutboundDispatch.dispatchDate)} />
                  <DrawerField label="Order Number" value={viewOutboundDispatch.orderNo} />
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">Retailer Information</h3>
                <div className="bg-white rounded-xl p-4 border border-slate-200 space-y-4">
                  <DrawerField label="Retailer Name" value={<span className="font-medium text-slate-900">{viewOutboundDispatch.retailerName}</span>} />
                  <DrawerField label="Retailer Code" value={<span className="font-mono text-xs">{viewOutboundDispatch.retailerCode}</span>} />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">Allocated Products</h3>
              <div className="border border-slate-200 rounded-xl overflow-hidden [&>div::-webkit-scrollbar]:hidden [&>div]:[-ms-overflow-style:none] [&>div]:[scrollbar-width:none]">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3 font-medium text-slate-600">Product</th>
                      <th className="px-4 py-3 font-medium text-slate-600">Batch No</th>
                      <th className="px-4 py-3 font-medium text-slate-600 text-right">Dispatch Qty</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {viewOutboundDispatch.items?.map((item: any, idx: number) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="px-4 py-3 font-medium text-slate-900">{item.productName}</td>
                        <td className="px-4 py-3 text-slate-600 font-mono text-xs">{item.allocatedBatch || '-'}</td>
                        <td className="px-4 py-3 text-slate-900 font-semibold text-right">{item.dispatchQty || item.quantity}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">Transport & LR Details</h3>
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-4">
                <DrawerField label="Transporter" value={viewOutboundDispatch.transporterName || viewOutboundDispatch.transportCompany || '-'} />
                <DrawerField label="Transport Mode" value={viewOutboundDispatch.transportMode || '-'} />
                <DrawerField label="Vehicle No" value={viewOutboundDispatch.vehicleNumber || '-'} />
                <DrawerField label="Driver Details" value={viewOutboundDispatch.driverName ? `${viewOutboundDispatch.driverName} (${viewOutboundDispatch.driverMobile})` : '-'} />
                <DrawerField label="LR Number" value={<span className="font-mono">{viewOutboundDispatch.lrNumber || '-'}</span>} />
                <DrawerField label="Expected Delivery" value={getDDMMYYYY(viewOutboundDispatch.expectedDeliveryDate) || '-'} />
              </div>
            </div>

            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">Status Timeline</h3>
              <div className="bg-white rounded-xl p-4 border border-slate-200">
                <div className="flex flex-col space-y-4">
                  {viewOutboundDispatch.milestones?.length > 0 ? viewOutboundDispatch.milestones.map((ms: any, idx: number) => (
                    <div key={idx} className="flex items-start gap-3">
                      <div className={`mt-0.5 w-2.5 h-2.5 rounded-full ${ms.completed ? 'bg-violet-500' : 'bg-slate-200'}`} />
                      <div>
                        <p className={`text-sm font-medium ${ms.completed ? 'text-slate-800' : 'text-slate-400'}`}>{ms.status}</p>
                        {ms.completed && <p className="text-xs text-slate-500">{ms.date}</p>}
                      </div>
                    </div>
                  )) : (
                    <div className="text-sm text-slate-500">No timeline available.</div>
                  )}
                </div>
              </div>
            </div>
            
          </div>
        )}
      </Drawer>
    </div>
  );
}