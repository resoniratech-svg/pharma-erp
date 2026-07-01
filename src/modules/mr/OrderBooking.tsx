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

// const mockData: POB[] = [
//   { id: '1', orderNo: 'POB-26-001', chemist: 'Apollo Pharmacy', date: '15-Oct-2026', amount: '₹ 15,000', distributor: 'Metro Pharma', status: 'Booked' },
//   { id: '2', orderNo: 'POB-26-002', chemist: 'MedPlus Store', date: '14-Oct-2026', amount: '₹ 8,500', distributor: 'Global Health', status: 'Forwarded' },
//   { id: '3', orderNo: 'POB-26-003', chemist: 'Wellness Medicos', date: '10-Oct-2026', amount: '₹ 22,000', distributor: 'Carewell Agencies', status: 'Fulfilled' },
// ];

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
//       render: () => <button className="text-violet-600 hover:text-violet-700 p-1"><ShoppingBag className="w-4 h-4" /></button>
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

const PRODUCT_LIST = [
  { name: 'Paracetamol 650mg', defaultRate: 15.00 },
  { name: 'Augmentin 625 Duo', defaultRate: 120.00 },
  { name: 'Calpol 500mg', defaultRate: 12.00 },
  { name: 'Azithromycin 500mg', defaultRate: 85.00 },
  { name: 'Pan-D Capsule', defaultRate: 45.00 },
  { name: 'Limcee Vitamin C', defaultRate: 8.00 }
];

const CUSTOMER_MASTERS: Record<string, Array<{ name: string; mobile: string; due: number }>> = {
  Stockist: [
    { name: 'Metro Pharma', mobile: '9876543210', due: 0 },
    { name: 'Global Health', mobile: '8765432109', due: 0 },
    { name: 'Carewell Agencies', mobile: '7654321098', due: 0 }
  ],
  Chemist: [
    { name: 'Apollo Pharmacy', mobile: '9988776655', due: 5000 },
    { name: 'MedPlus Drugs', mobile: '8877665544', due: 3500 },
    { name: 'Sri Rama Medicals', mobile: '7766554433', due: 7200 },
    { name: 'Care Chemists', mobile: '6655443322', due: 1800 }
  ],
  Hospital: [
    { name: 'Yashoda Hospital', mobile: '9123456789', due: 15000 },
    { name: 'Apollo Hospitals', mobile: '9234567890', due: 28000 },
    { name: 'Care Hospital', mobile: '9345678901', due: 12500 },
    { name: 'Sunshine Clinic', mobile: '9456789012', due: 4500 }
  ]
};

export default function OrderBooking() {
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingOrderId, setEditingOrderId] = useState<string | number | null>(null);

  const [isExportOpen, setIsExportOpen] = useState(false);


  // Form states matching React Native exactly
  const [customerType, setCustomerType] = useState('Chemist');
  const [customerName, setCustomerName] = useState('');
  const [customerMobile, setCustomerMobile] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(PRODUCT_LIST[0].name);
  const [quantity, setQuantity] = useState('');
  const [rate, setRate] = useState(PRODUCT_LIST[0].defaultRate.toString());
  const [distributor, setDistributor] = useState('');
  const [remarks, setRemarks] = useState('');
  
 // const totalAmount = (parseFloat(quantity) || 0) * (parseFloat(rate) || 0);
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

  // Auto pre-fill default rate when product changes
  useEffect(() => {
    const prod = PRODUCT_LIST.find(p => p.name === selectedProduct);
    if (prod) setRate(prod.defaultRate.toString());
  }, [selectedProduct]);

  // Reset customer details on type change
  useEffect(() => {
    setCustomerName('');
    setCustomerMobile('');
    // Removed dues logic
  }, [customerType]);

  // Load from local storage
  useEffect(() => {
    try {
      // NOTE: We used 'web_orders' in ChemistVisits for the POB auto-save previously.
      // We look for both so you don't lose old data.
      const stored = localStorage.getItem('@orders') || localStorage.getItem('web_orders');
      if (stored) {
        setOrders(JSON.parse(stored));
      }
    } catch (err) {
      console.log('Failed to load orders', err);
    }
  }, []);

  const saveOrders = (updatedList: OrderData[]) => {
    setOrders(updatedList);
    localStorage.setItem('@orders', JSON.stringify(updatedList));
    localStorage.setItem('web_orders', JSON.stringify(updatedList)); // Keep synced with old name
  };

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

  const handleSubmit = () => {
       if (!validateCheckIn()) {
      return; 
    }
    if (!customerName.trim()) { alert('Please enter or select customer name'); return; }
    if (!customerMobile.trim() || customerMobile.length !== 10) { alert('Please enter a valid 10-digit mobile number'); return; }
    if (!quantity.trim() || parseFloat(quantity) <= 0) { alert('Please enter a valid quantity'); return; }
    if (!rate.trim() || parseFloat(rate) <= 0) { alert('Please enter a valid rate'); return; }

    if (editingOrderId !== null) {
      const updatedOrders = orders.map(o => {
        if (o.id === editingOrderId) {
          return {
            ...o,
            customerType, customerName, customerMobile,
            productName: selectedProduct, quantity: parseFloat(quantity),
            rate: parseFloat(rate), totalAmount, distributor, remarks
          };
        }
        return o;
      });
      saveOrders(updatedOrders);
      setEditingOrderId(null);
    } else {
      const nextOrderNum = 1000 + orders.length + 1;
      const orderNumber = `ORD-${nextOrderNum}`;

      const newOrder: OrderData = {
        id: Date.now(),
        orderNumber,
        customerType,
        customerName,
        customerMobile,
        productName: selectedProduct,
        quantity: parseFloat(quantity),
        rate: parseFloat(rate),
        totalAmount,
        distributor,
        remarks,
        status: 'Booked',
        dateFormatted: formatOrderDate(new Date()),
      };
      saveOrders([newOrder, ...orders]);
            alert('✅ Order booked successfully!');

    }

    // Reset Form
    setIsDrawerOpen(false);
    setCustomerName(''); setCustomerMobile(''); setQuantity(''); setRemarks('');
  };

  const handleEdit = (order: OrderData) => {
    setEditingOrderId(order.id);
    setCustomerType(order.customerType || 'Chemist');
    setCustomerName(order.customerName || (order as any).chemist || ''); 
    setCustomerMobile(order.customerMobile || '');
    setSelectedProduct(order.productName || PRODUCT_LIST[0].name);
    setQuantity(order.quantity ? order.quantity.toString() : '');
    setRate(order.rate ? order.rate.toString() : PRODUCT_LIST[0].defaultRate.toString());
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
        <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-4 pb-8">
          
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Customer Type *</label>
            <div className="flex gap-2">
              {['Chemist', 'Hospital', 'Stockist'].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setCustomerType(type)}
                  className={`flex-1 py-2 text-sm font-medium rounded-lg border transition-colors ${customerType === type ? 'bg-violet-600 text-white border-violet-600' : 'bg-white text-slate-600 border-slate-200'}`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Select Predefined Customer *</label>
            <select
              onChange={(e) => {
                if(e.target.value) {
                  const cust = CUSTOMER_MASTERS[customerType].find(c => c.name === e.target.value);
                  if (cust) {
                    setCustomerName(cust.name); setCustomerMobile(cust.mobile);
                  }
                }
              }}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:border-violet-500 cursor-pointer"
            >
              <option value="">-- Choose {customerType} --</option>
              {CUSTOMER_MASTERS[customerType].map(cust => (
                <option key={cust.name} value={cust.name}>{cust.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Customer Name (Editable) *</label>
            <input type="text" value={customerName} onChange={(e) => setCustomerName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-violet-500" />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Customer Mobile *</label>
            <input type="tel" value={customerMobile} onChange={(e) => setCustomerMobile(e.target.value.replace(/[^0-9]/g, '').slice(0, 10))}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-violet-500" maxLength={10} />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Product Name *</label>
            <select value={selectedProduct} onChange={(e) => setSelectedProduct(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:border-violet-500 cursor-pointer">
              {PRODUCT_LIST.map(prod => (
                <option key={prod.name} value={prod.name}>{prod.name} (₹{prod.defaultRate.toFixed(2)})</option>
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