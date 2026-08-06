import { useState, useEffect, useCallback } from 'react';
import { ExportService } from '../../services/exportService';
import { Plus, Download, Filter, Edit, Trash2, IndianRupee, RefreshCw } from 'lucide-react';
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
} from './components/shared';
import { type Column } from './components/shared';
import { validateCheckIn } from '../../utils/attendanceValidation';

import { productService, type Product } from '../../services/productService';
import { retailerService, type RetailerRecord } from '../../services/retailerService';
import { chemistService, type ChemistRecord } from '../../services/chemistService';
import { distributorMasterService, type DistributorMasterRecord } from '../../services/distributorMasterService';
import { retailerOrderService } from '../../services/retailerOrderService';

export interface OrderData {
  id: string | number;
  orderNumber: string;
  customerType: string;
  customerName: string;
  customerMobile: string;
  productName: string;
  productId?: number | string;
  quantity: number;
  rate: number;
  totalAmount: number;
  distributor: string;
  remarks: string;
  status: 'Booked' | 'Forwarded' | 'Delivered' | 'Cancelled';
  dateFormatted: string;
}

export default function OrderBooking() {
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [retailers, setRetailers] = useState<RetailerRecord[]>([]);
  const [chemists, setChemists] = useState<ChemistRecord[]>([]);
  const [distributors, setDistributors] = useState<DistributorMasterRecord[]>([]);
  const [loading, setLoading] = useState(false);

  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [selectedProductId, setSelectedProductId] = useState<string>('');

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingOrderId, setEditingOrderId] = useState<string | number | null>(null);

  const [isExportOpen, setIsExportOpen] = useState(false);

  // Form states
  const [customerType, setCustomerType] = useState('Chemist');
  const [customerName, setCustomerName] = useState('');
  const [customerMobile, setCustomerMobile] = useState('');
  const [selectedProduct, setSelectedProduct] = useState('');
  const [quantity, setQuantity] = useState('');
  const [rate, setRate] = useState('0');
  const [distributor, setDistributor] = useState('');
  const [remarks, setRemarks] = useState('');

  const formatOrderDate = (dateStr?: string | Date) => {
    const d = dateStr ? new Date(dateStr) : new Date();
    if (isNaN(d.getTime())) return String(dateStr || '');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const day = d.getDate().toString().padStart(2, '0');
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    let hours = d.getHours();
    const minutes = d.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    return `${day}-${month}-${year} ${hours}:${minutes} ${ampm}`;
  };

  const mapBackendOrderToData = (o: any): OrderData => {
    const custType = o.chemist ? 'Chemist' : (o.hospital ? 'Hospital' : (o.stockist ? 'Stockist' : 'Retailer'));
    const custName = o.chemist?.name || o.hospital?.name || o.stockist?.name || o.retailer?.name || 'Customer';
    const custMobile = o.chemist?.mobile || o.hospital?.mobile || o.stockist?.mobile || o.retailer?.mobile || '';
    const firstItem = o.orderItems && o.orderItems.length > 0 ? o.orderItems[0] : null;
    const prodName = firstItem?.product?.name || (firstItem ? `Product #${firstItem.productId}` : 'Product');
    const qty = firstItem?.quantity || 0;
    const itemRate = firstItem?.rate || 0;

    let uiStatus: OrderData['status'] = 'Booked';
    const rawStatus = (o.status || '').toUpperCase();
    if (rawStatus === 'DELIVERED' || rawStatus === 'FULFILLED') uiStatus = 'Delivered';
    else if (rawStatus === 'FORWARDED' || rawStatus === 'APPROVED') uiStatus = 'Forwarded';
    else if (rawStatus === 'CANCELLED') uiStatus = 'Cancelled';
    else uiStatus = 'Booked';

    return {
      id: o.id,
      orderNumber: o.orderNumber || `ORD-${o.id}`,
      customerType: custType,
      customerName: custName,
      customerMobile: custMobile,
      productName: prodName,
      productId: firstItem?.productId,
      quantity: qty,
      rate: itemRate,
      totalAmount: Number(o.totalAmount) || 0,
      distributor: o.stockist?.name || 'Assigned Stockist',
      remarks: o.remarks || '',
      status: uiStatus,
      dateFormatted: formatOrderDate(o.orderDate || o.createdAt),
    };
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [loadedProducts, loadedRetailers, loadedChemists, loadedDistributors, loadedOrders] = await Promise.all([
        productService.loadProducts(),
        retailerService.getRetailers(),
        chemistService.getChemists(),
        distributorMasterService.load(),
        retailerOrderService.getRetailerOrders(),
      ]);

      setProducts(loadedProducts);
      setRetailers(loadedRetailers);
      setChemists(loadedChemists);
      setDistributors(loadedDistributors);

      if (loadedProducts.length > 0 && !selectedProductId) {
        setSelectedProductId(loadedProducts[0].id);
        setSelectedProduct(loadedProducts[0].name);
        setRate(loadedProducts[0].mrp || '0');
      }

      setOrders(loadedOrders.map(mapBackendOrderToData));
    } catch (error) {
      console.error('Failed to load order booking data:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedProductId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Auto pre-fill default rate when product changes
  useEffect(() => {
    const prod = products.find(p => String(p.id) === String(selectedProductId));
    if (prod) {
      setSelectedProduct(prod.name);
      setRate(prod.mrp || '0');
    }
  }, [selectedProductId, products]);

  // Reset customer details on type change
  useEffect(() => {
    if (!editingOrderId) {
      setSelectedCustomerId('');
      setCustomerName('');
      setCustomerMobile('');
    }
  }, [customerType, editingOrderId]);

  // Handle customer selection from master lists
  const handleSelectCustomer = (customerIdStr: string) => {
    setSelectedCustomerId(customerIdStr);
    if (customerType === 'Chemist') {
      const chem = chemists.find(c => String(c.id) === customerIdStr);
      if (chem) {
        setCustomerName(chem.name);
        setCustomerMobile(chem.mobile || '');
      }
    } else {
      const ret = retailers.find(r => String(r.id) === customerIdStr);
      if (ret) {
        setCustomerName(ret.name);
        setCustomerMobile(ret.mobile || '');
      }
    }
  };

  const qtyNum = parseFloat(quantity) || 0;
  const rateNum = parseFloat(rate) || 0;
  const baseAmount = qtyNum * rateNum;

  let schemeDiscount = 0;
  let appliedSchemeName = '';

  // Apply a "Buy 10, Get 10% Off" Scheme
  if (qtyNum >= 10) {
    schemeDiscount = baseAmount * 0.10;
    appliedSchemeName = '10% Bulk Discount Scheme';
  }

  const totalAmount = baseAmount - schemeDiscount;

  const resetForm = () => {
    setEditingOrderId(null);
    setSelectedCustomerId('');
    setCustomerName('');
    setCustomerMobile('');
    setQuantity('');
    setRemarks('');
    setDistributor('');
    if (products.length > 0) {
      setSelectedProductId(products[0].id);
      setSelectedProduct(products[0].name);
      setRate(products[0].mrp || '0');
    }
  };

  const handleSubmit = async () => {
    if (!validateCheckIn()) {
      return;
    }
    if (!selectedCustomerId && !editingOrderId) {
      alert('Please select a customer from the list.');
      return;
    }
    if (!selectedProductId) {
      alert('Please select a product from the list.');
      return;
    }
    if (!quantity.trim() || parseFloat(quantity) <= 0) {
      alert('Please enter a valid quantity');
      return;
    }
    if (!rate.trim() || parseFloat(rate) <= 0) {
      alert('Please enter a valid rate');
      return;
    }

    try {
      if (editingOrderId) {
        await retailerOrderService.updateRetailerOrder(editingOrderId, {
          totalAmount: Number(totalAmount),
          remarks,
        });
        alert('✅ Order updated successfully!');
      } else {
        const orderPayload: any = {
          totalAmount: Number(totalAmount),
          orderItems: [
            {
              productId: Number(selectedProductId),
              quantity: Number(quantity),
              rate: Number(rate),
              amount: Number(totalAmount),
            },
          ],
        };

        if (customerType === 'Chemist') {
          orderPayload.chemistId = Number(selectedCustomerId);
        } else if (customerType === 'Retailer') {
          orderPayload.retailerId = Number(selectedCustomerId);
        } else if (customerType === 'Hospital') {
          orderPayload.hospitalId = Number(selectedCustomerId);
        } else if (customerType === 'Stockist') {
          orderPayload.stockistId = Number(selectedCustomerId);
        }

        await retailerOrderService.addRetailerOrder(orderPayload);
        alert('✅ Order booked successfully in database!');
      }

      setIsDrawerOpen(false);
      resetForm();
      const updatedOrders = await retailerOrderService.getRetailerOrders();
      setOrders(updatedOrders.map(mapBackendOrderToData));
    } catch (error: any) {
      console.error(error);
      alert('Failed to save order: ' + error.message);
    }
  };

  const handleEdit = (order: OrderData) => {
    setEditingOrderId(order.id);
    setCustomerType(order.customerType || 'Chemist');
    setCustomerName(order.customerName || '');
    setCustomerMobile(order.customerMobile || '');
    if (order.productId) {
      setSelectedProductId(String(order.productId));
    }
    setSelectedProduct(order.productName || (products[0] ? products[0].name : ''));
    setQuantity(order.quantity ? order.quantity.toString() : '');
    setRate(order.rate ? order.rate.toString() : (products[0] ? products[0].mrp : '0'));
    setDistributor(order.distributor || '');
    setRemarks(order.remarks || '');
    setIsDrawerOpen(true);
  };

  const handleCancelOrder = async (id: string | number) => {
    if (confirm('Are you sure you want to cancel / delete this order?')) {
      try {
        const success = await retailerOrderService.deleteRetailerOrder(id);
        if (success) {
          setOrders(prev => prev.filter(o => o.id !== id));
          alert('Order removed successfully.');
        } else {
          // Fallback to updating status to CANCELLED
          await retailerOrderService.updateRetailerOrder(id, { status: 'CANCELLED' });
          setOrders(prev => prev.map(o => o.id === id ? { ...o, status: 'Cancelled' } : o));
          alert('Order marked as Cancelled.');
        }
      } catch (err: any) {
        alert('Failed to cancel order: ' + err.message);
      }
    }
  };

  const cycleStatus = async (id: string | number) => {
    const current = orders.find(o => o.id === id);
    if (!current) return;

    let nextUiStatus: OrderData['status'] = 'Booked';
    let nextBackendStatus = 'PENDING';

    if (current.status === 'Booked') {
      nextUiStatus = 'Forwarded';
      nextBackendStatus = 'FORWARDED';
    } else if (current.status === 'Forwarded') {
      nextUiStatus = 'Delivered';
      nextBackendStatus = 'DELIVERED';
    } else if (current.status === 'Delivered') {
      nextUiStatus = 'Cancelled';
      nextBackendStatus = 'CANCELLED';
    } else {
      nextUiStatus = 'Booked';
      nextBackendStatus = 'PENDING';
    }

    try {
      await retailerOrderService.updateRetailerOrder(id, { status: nextBackendStatus });
      setOrders(prev => prev.map(o => o.id === id ? { ...o, status: nextUiStatus } : o));
    } catch (err: any) {
      console.error('Failed to update status:', err);
      alert('Failed to update status: ' + err.message);
    }
  };

  const columns: Column<OrderData>[] = [
    {
      key: 'orderNumber',
      label: 'Order No',
      render: (row) => <span className="font-semibold text-violet-700">{row.orderNumber}</span>,
    },
    {
      key: 'customerName',
      label: 'Customer',
      render: (row) => (
        <div>
          <div className="font-medium text-slate-800">{row.customerName}</div>
          <div className="text-xs text-slate-500">{row.customerType} • {row.customerMobile || 'No mobile'}</div>
        </div>
      ),
    },
    {
      key: 'productName',
      label: 'Product & Qty',
      render: (row) => (
        <div>
          <div className="text-sm text-slate-700 font-medium">{row.productName}</div>
          <div className="text-xs text-slate-500">{row.quantity} units @ ₹{row.rate}</div>
        </div>
      ),
    },
    {
      key: 'dateFormatted',
      label: 'Date',
      render: (row) => <span className="text-sm text-slate-600">{row.dateFormatted}</span>,
    },
    {
      key: 'totalAmount',
      label: 'Net Amount',
      render: (row) => (
        <span className="font-semibold text-slate-900">
          ₹{row.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => {
        let variant: 'success' | 'info' | 'warning' | 'danger' = 'warning';
        if (row.status === 'Delivered') variant = 'success';
        if (row.status === 'Forwarded') variant = 'info';
        if (row.status === 'Cancelled') variant = 'danger';
        return (
          <button
            onClick={() => cycleStatus(row.id)}
            title="Click to toggle status (Booked -> Forwarded -> Delivered -> Cancelled)"
            className="hover:opacity-80 transition-opacity cursor-pointer flex items-center gap-1"
          >
            <Badge variant={variant}>{row.status}</Badge>
            <RefreshCw className="w-3 h-3 text-slate-400" />
          </button>
        );
      },
    },
    {
      key: 'action',
      label: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-2">
          <button
            title="Edit Order"
            onClick={() => handleEdit(row)}
            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 p-1.5 rounded-lg transition-colors"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            title="Cancel / Delete Order"
            onClick={() => handleCancelOrder(row.id)}
            className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 p-1.5 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  const filteredData = orders.filter((item) => {
    const searchLower = search.toLowerCase();
    const matchSearch =
      item.orderNumber.toLowerCase().includes(searchLower) ||
      item.customerName.toLowerCase().includes(searchLower) ||
      item.productName.toLowerCase().includes(searchLower);
    const matchStatus = statusFilter ? item.status === statusFilter : true;
    return matchSearch && matchStatus;
  });

  const exportColumns = [
    { header: 'Order No', dataKey: 'orderNumber' },
    { header: 'Date', dataKey: 'dateFormatted' },
    { header: 'Customer', dataKey: 'customerName' },
    { header: 'Type', dataKey: 'customerType' },
    { header: 'Mobile', dataKey: 'customerMobile' },
    { header: 'Product', dataKey: 'productName' },
    { header: 'Quantity', dataKey: 'quantity' },
    { header: 'Rate (Rs.)', dataKey: 'rate' },
    { header: 'Total (Rs.)', dataKey: 'totalAmount' },
    { header: 'Status', dataKey: 'status' },
  ];

  const handleExportPDF = () => {
    if (filteredData.length === 0) return alert('No orders to export.');
    ExportService.exportToPDF({
      title: 'Personal Order Booking (POB) Report',
      filename: `POB_Report_${new Date().toISOString().split('T')[0]}`,
      data: filteredData,
      columns: exportColumns,
    });
  };

  const handleExportExcel = () => {
    if (filteredData.length === 0) return alert('No orders to export.');
    ExportService.exportToExcel({
      title: 'Personal Order Booking (POB) Report',
      filename: `POB_Report_${new Date().toISOString().split('T')[0]}`,
      data: filteredData,
      columns: exportColumns,
    });
  };

  const handleExportCSV = () => {
    if (filteredData.length === 0) return alert('No data to export.');
    ExportService.exportToCSV({
      title: 'Order Booking Report',
      filename: `Orders_${new Date().toISOString().split('T')[0]}`,
      data: filteredData,
      columns: exportColumns,
    });
  };

  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader
        title="Order Booking"
        subtitle="Manage and book orders for Chemists, Retailers, and Distributors."
        actions={
          <div className="flex items-center gap-3">
            {/* EXPORT DROPDOWN */}
            <div className="relative">
              <ActionButton
                variant="secondary"
                onClick={() => setIsExportOpen(!isExportOpen)}
                icon={<Download className="w-4 h-4" />}
              >
                Export
              </ActionButton>

              {isExportOpen && (
                <div className="absolute right-0 mt-2 w-40 bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden z-50">
                  <button
                    onClick={() => { handleExportExcel(); setIsExportOpen(false); }}
                    className="w-full text-left px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors border-b border-slate-100"
                  >
                    Excel (.xlsx)
                  </button>
                  <button
                    onClick={() => { handleExportPDF(); setIsExportOpen(false); }}
                    className="w-full text-left px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors border-b border-slate-100"
                  >
                    PDF Document
                  </button>
                  <button
                    onClick={() => { handleExportCSV(); setIsExportOpen(false); }}
                    className="w-full text-left px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    CSV (.csv)
                  </button>
                </div>
              )}
            </div>

            <ActionButton
              onClick={() => { resetForm(); setIsDrawerOpen(true); }}
              icon={<Plus className="w-4 h-4" />}
            >
              Book New Order
            </ActionButton>
          </div>
        }
      />

      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search order, customer, or product..." />
        <div className="w-px h-6 bg-slate-200 mx-2 hidden sm:block" />
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-medium text-slate-600">Filters:</span>
        </div>
        <SelectFilter
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { label: 'Booked', value: 'Booked' },
            { label: 'Forwarded', value: 'Forwarded' },
            { label: 'Delivered', value: 'Delivered' },
            { label: 'Cancelled', value: 'Cancelled' },
          ]}
          placeholder="All Status"
        />
      </FilterBar>

      <TableCard>
        <DataTable
          columns={columns}
          data={filteredData}
          emptyMessage={loading ? "Loading orders from server..." : "No orders found."}
        />
      </TableCard>

      {/* DRAWER FORM */}
      <Drawer
        open={isDrawerOpen}
        onClose={() => { setIsDrawerOpen(false); resetForm(); }}
        title={editingOrderId ? `Edit Order` : `Book New Order`}
      >
        <form onSubmit={(e) => e.preventDefault()} className="space-y-4 pb-8">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Customer Type *</label>
            <div className="flex gap-2">
              {['Chemist', 'Retailer'].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setCustomerType(type)}
                  className={`flex-1 py-2 text-sm font-medium rounded-lg border transition-colors ${
                    customerType === type
                      ? 'bg-[#163c78] text-white border-[#163c78]'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Select Customer *</label>
            <select
              value={selectedCustomerId}
              onChange={(e) => handleSelectCustomer(e.target.value)}
              disabled={!!editingOrderId}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:border-violet-500 cursor-pointer disabled:bg-slate-100"
            >
              <option value="">-- Choose Customer --</option>
              {customerType === 'Chemist' ? (
                chemists.map((c) => (
                  <option key={c.id} value={String(c.id)}>
                    {c.name} {c.territory ? `(${c.territory})` : ''}
                  </option>
                ))
              ) : (
                retailers.map((r) => (
                  <option key={r.id} value={String(r.id)}>
                    {r.name}
                  </option>
                ))
              )}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Customer Name *</label>
            <input
              type="text"
              value={customerName}
              readOnly
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 text-slate-600 focus:outline-none"
              placeholder="Select a customer above"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Customer Mobile</label>
            <input
              type="tel"
              value={customerMobile}
              readOnly
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 text-slate-600 focus:outline-none"
              placeholder="e.g. 9876543210"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Product Name *</label>
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:border-violet-500 cursor-pointer"
            >
              <option value="">-- Select Product --</option>
              {products.map((prod) => (
                <option key={prod.id} value={String(prod.id)}>
                  {prod.name} (MRP: ₹{prod.mrp})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Quantity *</label>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-violet-500"
                placeholder="1"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Price (₹) *</label>
              <input
                type="number"
                min="0"
                value={rate}
                onChange={(e) => setRate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-violet-500"
                placeholder="0"
              />
            </div>
          </div>

          {/* Total Amount Box */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <p className="text-sm font-medium text-slate-500 mb-1">Total Amount</p>
            <div className="flex items-center gap-1 text-2xl font-bold text-slate-900">
              <IndianRupee className="w-5 h-5" />
              <span>{totalAmount.toFixed(2)}</span>
            </div>
            {schemeDiscount > 0 && (
              <p className="text-xs font-bold text-emerald-600 mt-2 bg-emerald-100 px-2 py-1 rounded inline-block">
                {appliedSchemeName} (Saved ₹{schemeDiscount.toFixed(2)})
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Forward To Distributor / Stockist</label>
            <select
              value={distributor}
              onChange={(e) => setDistributor(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:border-violet-500 cursor-pointer"
            >
              <option value="">-- Choose Distributor --</option>
              {distributors.map((d) => (
                <option key={d.id} value={d.name}>
                  {d.name} {d.state ? `(${d.state})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Remarks</label>
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-violet-500 min-h-[80px] resize-none"
              placeholder="Notes or special delivery instructions..."
            />
          </div>

          <div className="pt-4 flex gap-3">
            <ActionButton onClick={handleSubmit} className="flex-1 justify-center">
              {editingOrderId ? 'Update Order' : 'Submit Order'}
            </ActionButton>
            <ActionButton
              variant="secondary"
              onClick={() => { setIsDrawerOpen(false); resetForm(); }}
              className="flex-1 justify-center"
            >
              Cancel
            </ActionButton>
          </div>
        </form>
      </Drawer>
    </div>
  );
}