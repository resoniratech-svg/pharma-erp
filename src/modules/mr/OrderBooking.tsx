// import { useState } from 'react';
// import { Plus, Download, Filter, ShoppingBag } from 'lucide-react';
// import {
//   PageHeader,
//   FilterBar,
//   SearchInput,
//   SelectFilter,
//   ActionButton,
//   TableCard,
//   DataTable,
//   Badge,
// } from './components/shared';
// import { type Column } from './components/shared';

// interface POB {
//   id: string;
//   orderNo: string;
//   chemist: string;
//   date: string;
//   amount: string;
//   distributor: string;
//   status: 'Booked' | 'Forwarded' | 'Fulfilled';
// }

// const mockData: any[] = [];

// export default function OrderBooking() {
//   const [search, setSearch] = useState('');
//   const [statusFilter, setStatusFilter] = useState('');

//   const columns: Column<POB>[] = [
//     { key: 'orderNo', label: 'Order No', render: (row) => <span className="font-semibold text-violet-700">{row.orderNo}</span> },
//     { key: 'chemist', label: 'Chemist' },
//     { key: 'distributor', label: 'Forwarded To' },
//     { key: 'date', label: 'Date' },
//     { key: 'amount', label: 'Amount', render: (row) => <span className="font-medium text-slate-800">{row.amount}</span> },
//     {
//       key: 'status',
//       label: 'Status',
//       render: (row) => {
//         const variant = row.status === 'Fulfilled' ? 'success' : row.status === 'Forwarded' ? 'info' : 'warning';
//         return <Badge variant={variant}>{row.status}</Badge>;
//       },
//     },
//     {
//       key: 'action',
//       label: '',
//       render: () => <button className="text-[#163c78] hover:text-violet-700 p-1"><ShoppingBag className="w-4 h-4" /></button>
//     }
//   ];

//   const filteredData = mockData.filter((item) => {
//     const matchSearch = item.orderNo.toLowerCase().includes(search.toLowerCase()) || item.chemist.toLowerCase().includes(search.toLowerCase());
//     const matchStatus = statusFilter ? item.status === statusFilter : true;
//     return matchSearch && matchStatus;
//   });

//   return (
//     <div className="animate-in fade-in duration-500">
//       <PageHeader
//         title="Order Booking"
//         subtitle="Manage orders collected from chemists on behalf of distributors."
//         actions={
//           <>
//             <ActionButton variant="secondary" icon={<Download className="w-4 h-4" />}>Export POB</ActionButton>
//             <ActionButton icon={<Plus className="w-4 h-4" />}>New Order</ActionButton>
//           </>
//         }
//       />

//       <FilterBar>
//         <SearchInput value={search} onChange={setSearch} placeholder="Search order or chemist..." />
//         <div className="w-px h-6 bg-slate-200 mx-2 hidden sm:block" />
//         <div className="flex items-center gap-2">
//           <Filter className="w-4 h-4 text-slate-400" />
//           <span className="text-sm font-medium text-slate-600">Filters:</span>
//         </div>
//         <SelectFilter
//           value={statusFilter}
//           onChange={setStatusFilter}
//           options={[
//             { label: 'Booked', value: 'Booked' },
//             { label: 'Forwarded', value: 'Forwarded' },
//             { label: 'Fulfilled', value: 'Fulfilled' },
//           ]}
//           placeholder="All Status"
//         />
//       </FilterBar>

//       <TableCard>
//         <DataTable
//           columns={columns}
//           data={filteredData}
//           emptyMessage="No orders found."
//         />
//       </TableCard>
//     </div>
//   );
// }
////////////////////////////////////////////////////////////l
import { useState, useEffect } from 'react';
import { ExportService } from '../../services/exportService';
import { Plus, Download, Filter, Edit, Trash2 } from 'lucide-react';
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

// ✅ Unified interface — matches your React Native BookOrderScreen exactly
export interface OrderData {
  id: string | number;
  orderNumber: string;
  customerType: string;
  customerName: string;
  customerMobile: string;
  productName: string;
  quantity: number;
  rate: number;
  totalAmount: number;
  distributor: string;
  remarks: string;
  status: 'Booked' | 'Forwarded' | 'Delivered' | 'Cancelled';
  dateFormatted: string;
}

import { productService } from '../../services/productService';
import type { Product } from '../../services/productService';
import { retailerService } from '../../services/retailerService';
import type { RetailerRecord } from '../../services/retailerService';
import { chemistService } from '../../services/chemistService';
import type { ChemistRecord } from '../../services/chemistService';
import { retailerOrderService } from '../../services/retailerOrderService';
import type { RetailerOrderRecord } from '../../services/retailerOrderService';

export default function OrderBooking() {
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [retailers, setRetailers] = useState<RetailerRecord[]>([]);
  const [chemists, setChemists] = useState<ChemistRecord[]>([]);
  
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [selectedProductId, setSelectedProductId] = useState<string>('');

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingOrderId, setEditingOrderId] = useState<string | number | null>(null);

  const [isExportOpen, setIsExportOpen] = useState(false);


  // Form states matching React Native exactly
  const [customerType, setCustomerType] = useState('Chemist');
  const [customerName, setCustomerName] = useState('');
  const [customerMobile, setCustomerMobile] = useState('');
  const [selectedProduct, setSelectedProduct] = useState('');
  const [quantity, setQuantity] = useState('');
  const [rate, setRate] = useState('0');
  const [distributor, setDistributor] = useState('');
  const [remarks, setRemarks] = useState('');
  
  const mrId = Number(localStorage.getItem('mrId') || '1');

  // Load backend data on mount
  useEffect(() => {
    async function loadData() {
      try {
        const loadedProducts = await productService.loadProducts();
        setProducts(loadedProducts);
        if (loadedProducts.length > 0) {
          setSelectedProductId(loadedProducts[0].id);
          setSelectedProduct(loadedProducts[0].name);
          setRate(loadedProducts[0].mrp || '0');
        }

        const loadedRetailers = await retailerService.getRetailers();
        setRetailers(loadedRetailers);

        const loadedChemists = await chemistService.getChemists();
        setChemists(loadedChemists);

        const loadedOrders = await retailerOrderService.getRetailerOrders();
        setOrders(loadedOrders.map(o => ({
          id: o.id,
          orderNumber: o.orderNumber,
          customerType: 'Retailer',
          customerName: o.retailer?.name || 'Retailer',
          customerMobile: o.retailer?.mobile || '',
          productName: o.orderItems && o.orderItems.length > 0 ? (o.orderItems[0] as any).product?.name || 'Product' : 'Product',
          quantity: o.orderItems && o.orderItems.length > 0 ? o.orderItems[0].quantity : 0,
          rate: o.orderItems && o.orderItems.length > 0 ? o.orderItems[0].rate : 0,
          totalAmount: o.totalAmount,
          distributor: 'Assigned Stockist',
          remarks: '',
          status: o.status === 'PENDING' ? 'Booked' : (o.status === 'DELIVERED' ? 'Delivered' : 'Booked'),
          dateFormatted: o.orderDate ? o.orderDate.split('T')[0] : '',
        })));
      } catch (error) {
        console.error('Failed to load order booking dependency masters:', error);
      }
    }
    loadData();
  }, []);

  const saveOrders = (updatedList: OrderData[]) => {
    setOrders(updatedList);
  };

  // Auto pre-fill default rate when product changes
  useEffect(() => {
    const prod = products.find(p => p.id === selectedProductId);
    if (prod) {
      setSelectedProduct(prod.name);
      setRate(prod.mrp || '0');
    }
  }, [selectedProductId, products]);

  // Reset customer details on type change
  useEffect(() => {
    setSelectedCustomerId('');
    setCustomerName('');
    setCustomerMobile('');
  }, [customerType]);

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

  const formatOrderDate = (date: Date) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const day = date.getDate().toString().padStart(2, '0');
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    let hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    return `${day}-${month}-${year} ${hours}:${minutes} ${ampm}`;
  };

  const handleSubmit = async () => {
    if (!validateCheckIn()) {
      return; 
    }
    if (!selectedCustomerId) {
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
      const orderPayload: any = {
        totalAmount: Number(totalAmount),
        orderItems: [
          {
            productId: Number(selectedProductId),
            quantity: Number(quantity),
            rate: Number(rate),
            amount: Number(totalAmount)
          }
        ]
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

      const result = await retailerOrderService.addRetailerOrder(orderPayload);
      
      const newOrder: OrderData = {
        id: result.id,
        orderNumber: result.orderNumber || `ORD-${Date.now().toString().slice(-4)}`,
        customerType: customerType,
        customerName: customerName,
        customerMobile: customerMobile,
        productName: selectedProduct,
        quantity: parseFloat(quantity),
        rate: parseFloat(rate),
        totalAmount,
        distributor: distributor || 'Assigned Stockist',
        remarks,
        status: 'Booked',
        dateFormatted: formatOrderDate(new Date()),
      };

      setOrders([newOrder, ...orders]);
      alert('✅ Order booked successfully in database!');

      // Reset Form
      setIsDrawerOpen(false);
      setSelectedCustomerId('');
      setSelectedProductId('');
      setCustomerName(''); setCustomerMobile(''); setQuantity(''); setRemarks('');
    } catch (error: any) {
      console.error(error);
      alert('Failed to book order: ' + error.message);
    }
  };

  const handleEdit = (order: OrderData) => {
    setEditingOrderId(order.id);
    setCustomerType(order.customerType || 'Chemist');
    setCustomerName(order.customerName || (order as any).chemist || ''); 
    setCustomerMobile(order.customerMobile || '');
    setSelectedProduct(order.productName || (products[0] ? products[0].name : ''));
    setQuantity(order.quantity ? order.quantity.toString() : '');
    setRate(order.rate ? order.rate.toString() : (products[0] ? products[0].mrp : '0'));
    setDistributor(order.distributor || '');
    setRemarks(order.remarks || '');
    setIsDrawerOpen(true);
  };

  const handleCancelOrder = (id: string | number) => {
    if (confirm('Are you sure you want to cancel this order?')) {
      const updatedOrders = orders.map(o => o.id === id ? { ...o, status: 'Cancelled' as const } : o);
      saveOrders(updatedOrders);
    }
  };

  const cycleStatus = (id: string | number) => {
    const updatedOrders = orders.map(o => {
      if (o.id === id) {
        let nextStatus: OrderData['status'] = 'Booked';
        if (o.status === 'Booked' || (o as any).status === 'Pending') nextStatus = 'Forwarded';
        else if (o.status === 'Forwarded' || (o as any).status === 'Approved') nextStatus = 'Delivered';
        else if (o.status === 'Delivered' || (o as any).status === 'Fulfilled') nextStatus = 'Cancelled';
        else nextStatus = 'Booked';
        return { ...o, status: nextStatus };
      }
      return o;
    });
    saveOrders(updatedOrders);
  };

  const columns: Column<any>[] = [
    { key: 'orderNumber', label: 'Order No', render: (row) => <span className="font-semibold text-violet-700">{row.orderNumber || row.orderNo}</span> },
    { key: 'customerName', label: 'Customer', render: (row) => (
      <div>
        <div className="font-medium text-slate-800">{row.customerName || row.chemist}</div>
        <div className="text-xs text-slate-500">{row.customerType || 'Chemist'}</div>
      </div>
    )},
    { key: 'product', label: 'Product', render: (row) => (
      <div>
        <div className="text-sm text-slate-700">{row.productName || 'N/A'}</div>
        <div className="text-xs text-slate-500">{row.quantity ? `${row.quantity} x ₹${row.rate}` : ''}</div>
      </div>
    )},
    { key: 'dateFormatted', label: 'Date', render: (row) => <span className="text-sm">{row.dateFormatted || row.date}</span> },
    { key: 'totalAmount', label: 'Net Amount', render: (row) => <span className="font-medium text-slate-800">₹{(row.totalAmount || row.amount)?.toLocaleString() || 0}</span> },
    {
      key: 'status',
      label: 'Status',
      render: (row) => {
        let variant: 'success' | 'info' | 'warning' | 'danger' = 'warning';
        if (row.status === 'Delivered' || row.status === 'Fulfilled') variant = 'success';
        if (row.status === 'Approved' || row.status === 'Forwarded') variant = 'info';
        if (row.status === 'Cancelled') variant = 'danger';
        return (
          <button onClick={() => cycleStatus(row.id)} title="Click to change status" className="hover:opacity-80 transition-opacity">
            <Badge variant={variant}>{row.status || 'Booked'} 🔄</Badge>
          </button>
        );
      },
    },
    {
      key: 'action',
      label: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-2">
          <button title="Edit Order" onClick={() => handleEdit(row)} className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 p-1.5 rounded-lg transition-colors">
            <Edit className="w-4 h-4" />
          </button>
          <button title="Cancel Order" onClick={() => handleCancelOrder(row.id)} className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 p-1.5 rounded-lg transition-colors">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  const filteredData = orders.filter((item) => {
    const searchLower = search.toLowerCase();
    const matchSearch = 
      (item.orderNumber || (item as any).orderNo || '').toLowerCase().includes(searchLower) || 
      (item.customerName || (item as any).chemist || '').toLowerCase().includes(searchLower) ||
      (item.productName || '').toLowerCase().includes(searchLower);
    const matchStatus = statusFilter ? item.status === statusFilter : true;
    return matchSearch && matchStatus;
  });
  // --- START OF NEW EXPORT LOGIC ---
  const exportColumns = [
    { header: 'Order No', dataKey: 'orderNumber' },
    { header: 'Date', dataKey: 'dateFormatted' },
    { header: 'Customer', dataKey: 'customerName' },
    { header: 'Type', dataKey: 'customerType' },
    { header: 'Mobile', dataKey: 'customerMobile' },
    { header: 'Product', dataKey: 'productName' },
    { header: 'Quantity', dataKey: 'quantity' },
    // { header: 'Rate (₹)', dataKey: 'rate' },
    // { header: 'Total (₹)', dataKey: 'totalAmount' },
        { header: 'Rate (Rs.)', dataKey: 'rate' },
    { header: 'Total (Rs.)', dataKey: 'totalAmount' },
    { header: 'Status', dataKey: 'status' }
  ];

  const handleExportPDF = () => {
    if (filteredData.length === 0) return alert("No orders to export.");
    ExportService.exportToPDF({
      title: 'Personal Order Booking (POB) Report',
      filename: `POB_Report_${new Date().toISOString().split('T')[0]}`,
      data: filteredData,
      columns: exportColumns
    });
  };

  const handleExportExcel = () => {
    if (filteredData.length === 0) return alert("No orders to export.");
    ExportService.exportToExcel({
      title: 'Personal Order Booking (POB) Report',
      filename: `POB_Report_${new Date().toISOString().split('T')[0]}`,
      data: filteredData,
      columns: exportColumns
    });
  };
    const handleExportCSV = () => {
    if (filteredData.length === 0) return alert("No data to export.");
    ExportService.exportToCSV({
      title: 'Order Booking Report',
      filename: `Orders_${new Date().toISOString().split('T')[0]}`,
      data: filteredData,
      columns: exportColumns
    });
  };
  // --- END OF NEW EXPORT LOGIC ---
  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader
        title="Order Booking"
        subtitle="Manage and book orders for Chemists, Hospitals, and Stockists."
        // actions={
        //   <>
        //     <ActionButton variant="secondary" icon={<Download className="w-4 h-4" />}>Export POB</ActionButton>
        //     <ActionButton onClick={() => { setEditingOrderId(null); setIsDrawerOpen(true); }} icon={<Plus className="w-4 h-4" />}>Book New Order</ActionButton>
        //   </>
        // }
                    actions={
          <div className="flex items-center gap-3">
            {/* START OF EXPORT DROPDOWN */}
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
                    className="w-full text-left px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    PDF Document
                  </button>
                    <button 
    onClick={() => { handleExportCSV(); setIsExportOpen(false); }} 
    className="w-full text-left px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors border-b border-slate-100"
  >
    CSV (.csv)
  </button>
                </div>
              )}
            </div>
            {/* END OF EXPORT DROPDOWN */}
            
            <ActionButton onClick={() => { setEditingOrderId(null); setIsDrawerOpen(true); }} icon={<Plus className="w-4 h-4" />}>
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
        <DataTable columns={columns} data={filteredData} emptyMessage="No orders found." />
      </TableCard>

      {/* DRAWER FORM */}
      <Drawer open={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} title={editingOrderId ? `Edit Order` : `Book New Order`}>
        <form onSubmit={(e) => e.preventDefault()} className="space-y-4 pb-8">
          
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Customer Type *</label>
            <div className="flex gap-2">
              {['Chemist', 'Hospital', 'Stockist'].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setCustomerType(type)}
                  className={`flex-1 py-2 text-sm font-medium rounded-lg border transition-colors ${customerType === type ? 'bg-[#163c78] text-white border-[#163c78]' : 'bg-white text-slate-600 border-slate-200'}`}
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
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:border-violet-500 cursor-pointer"
            >
              <option value="">-- Choose Customer --</option>
              {customerType === 'Chemist' ? (
                chemists.map(c => (
                  <option key={c.id} value={String(c.id)}>{c.name}</option>
                ))
              ) : (
                retailers.map(r => (
                  <option key={r.id} value={String(r.id)}>{r.name}</option>
                ))
              )}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Customer Name (Read-Only) *</label>
            <input type="text" value={customerName} readOnly
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 text-slate-500 focus:outline-none"
              placeholder="Select a customer above" />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Customer Mobile *</label>
            <input type="tel" value={customerMobile} readOnly
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 text-slate-500 focus:outline-none"
              placeholder="e.g. 9876543210" />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Product Name *</label>
            <select value={selectedProductId} onChange={(e) => setSelectedProductId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:border-violet-500 cursor-pointer">
              <option value="">-- Select Product --</option>
              {products.map(prod => (
                <option key={prod.id} value={String(prod.id)}>{prod.name} (MRP: ₹{prod.mrp})</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Quantity *</label>
              <input type="number" min="1" value={quantity} onChange={(e) => setQuantity(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-violet-500" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Price (₹) *</label>
              <input type="number" min="0" value={rate} onChange={(e) => setRate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-violet-500" />
            </div>
          </div>
          {/* New Total Amount Box */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <p className="text-sm font-medium text-slate-500 mb-1">Total Amount</p>
            <p className="text-2xl font-bold text-slate-900">₹{totalAmount.toFixed(2)}</p>
            {schemeDiscount > 0 && (
              <p className="text-xs font-bold text-emerald-600 mt-1 bg-emerald-100 px-2 py-1 rounded inline-block">
                {appliedSchemeName} (Saved ₹{schemeDiscount.toFixed(2)})
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Forward To Distributor</label>
            <input type="text" value={distributor} onChange={(e) => setDistributor(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-violet-500" placeholder="e.g. Metro Pharma" />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Remarks</label>
            <textarea value={remarks} onChange={(e) => setRemarks(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-violet-500 min-h-[80px] resize-none" />
          </div>

          <div className="pt-4 flex gap-3">
            <ActionButton onClick={handleSubmit} className="flex-1 justify-center">{editingOrderId ? 'Update Order' : 'Submit Order'}</ActionButton>
            <ActionButton variant="secondary" onClick={() => setIsDrawerOpen(false)} className="flex-1 justify-center">Cancel</ActionButton>
          </div>
        </form>
      </Drawer>
    </div>
  );
}