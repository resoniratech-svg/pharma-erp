import { useState, useRef, useEffect } from 'react';
import { Download, Filter, RefreshCcw, Eye, ChevronDown, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
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
import { ROLE_SUPER_ADMIN, ROLE_RETAILER } from '../../constants/roles';

// Inline Modal component since it's not exported from shared.tsx
function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="fixed inset-0 bg-slate-900/30 backdrop-blur-[2px] z-50" onClick={onClose} />
          <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }} transition={{ type: 'spring', damping: 25, stiffness: 300 }} className="fixed inset-0 m-auto z-50 w-full max-w-lg max-h-[85vh] bg-white shadow-2xl rounded-2xl flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 flex-shrink-0">
              <h2 className="text-base font-bold text-slate-800">{title}</h2>
              <button onClick={onClose} className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

type ReorderStatus = 'Recommended' | 'Already Reordered' | 'Ignored';

interface Reorder {
  id: string;
  retailer: string;
  productName: string;
  productCode: string;
  lastOrderDate: string;
  lastOrderedQty: string;
  suggestedQty: string;
  availability: string;
  availableStock: string;
  purchaseFreq: string;
  reason: string;
  status: ReorderStatus;
}

const initialMockData: Reorder[] = [
  { 
    id: '1', retailer: 'Apollo Pharmacy', productName: 'Amoxicillin 500mg', productCode: 'AMX-500', 
    lastOrderDate: '01-Oct-2026', lastOrderedQty: '200 Strips', suggestedQty: '500 Strips', 
    availability: 'In Stock', availableStock: '5000+ Strips', purchaseFreq: 'Every 14 Days', 
    reason: 'Fast Moving Product', status: 'Recommended' 
  },
  { 
    id: '2', retailer: 'MedPlus Store', productName: 'Paracetamol 650mg', productCode: 'PRC-650', 
    lastOrderDate: '15-Sep-2026', lastOrderedQty: '500 Strips', suggestedQty: '1000 Strips', 
    availability: 'In Stock', availableStock: '12000+ Strips', purchaseFreq: 'Every 7 Days', 
    reason: 'Frequently Ordered', status: 'Already Reordered' 
  },
  { 
    id: '3', retailer: 'Apollo Pharmacy', productName: 'Cough Syrup 100ml', productCode: 'CGH-100', 
    lastOrderDate: '20-Aug-2026', lastOrderedQty: '50 Bottles', suggestedQty: '50 Bottles', 
    availability: 'Low Stock', availableStock: '120 Bottles', purchaseFreq: 'Seasonal', 
    reason: 'Seasonal Demand', status: 'Ignored' 
  },
];

export default function Reorders() {
  const activeRole = localStorage.getItem('activeRole') || ROLE_RETAILER;
  const isRetailer = activeRole === ROLE_RETAILER;
  
  const [data, setData] = useState<Reorder[]>(initialMockData);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  const [viewDetails, setViewDetails] = useState<Reorder | null>(null);
  const [reorderItem, setReorderItem] = useState<Reorder | null>(null);
  const [reorderQty, setReorderQty] = useState('');
  const [remarks, setRemarks] = useState('');
  
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setShowExportMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Set quantity when modal opens
  useEffect(() => {
    if (reorderItem) {
      setReorderQty(reorderItem.suggestedQty.split(' ')[0]);
      setRemarks('');
    }
  }, [reorderItem]);

  // Filter Data
  const baseData = isRetailer ? data.filter(d => d.retailer === 'Apollo Pharmacy') : data;
  const filteredData = baseData.filter((item) => {
    const searchStr = search.toLowerCase();
    const matchSearch = item.productName.toLowerCase().includes(searchStr) || item.productCode.toLowerCase().includes(searchStr);
    const matchStatus = statusFilter ? item.status === statusFilter : true;
    return matchSearch && matchStatus;
  });

  const getStatusVariant = (status: ReorderStatus): BadgeVariant => {
    if (status === 'Already Reordered') return 'success';
    if (status === 'Recommended') return 'info';
    if (status === 'Ignored') return 'neutral';
    return 'neutral';
  };

  const handleAddToCart = () => {
    if (!reorderQty || isNaN(Number(reorderQty)) || Number(reorderQty) <= 0) {
      alert("Please enter a valid quantity greater than zero.");
      return;
    }
    if (reorderItem) {
      const updatedData = data.map(d => 
        d.id === reorderItem.id ? { ...d, status: 'Already Reordered' as ReorderStatus } : d
      );
      setData(updatedData);
      setReorderItem(null);
      // Simulate success notification
      console.log(`Added ${reorderQty} of ${reorderItem.productName} to cart.`);
    }
  };

  const adminColumns: Column<Reorder>[] = [
    { key: 'retailer', label: 'Retailer Name', render: (row) => <span className="font-semibold text-slate-900">{row.retailer}</span> },
    { key: 'productName', label: 'Product Name', render: (row) => <span className="font-semibold text-violet-700">{row.productName}</span> },
    { key: 'lastOrderDate', label: 'Last Order Date', render: (row) => <span className="text-slate-600">{row.lastOrderDate}</span> },
    { key: 'suggestedQty', label: 'Suggested Qty', render: (row) => <span className="font-medium text-slate-800">{row.suggestedQty}</span> },
    { key: 'status', label: 'Reorder Status', render: (row) => <Badge variant={getStatusVariant(row.status)}>{row.status}</Badge> },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
          <ActionButton variant="ghost" className="text-violet-600 text-xs px-2 py-1" onClick={() => setViewDetails(row)}>
            View Details
          </ActionButton>
        </div>
      )
    }
  ];

  const retailerColumns: Column<Reorder>[] = [
    { key: 'productName', label: 'Product Name', render: (row) => <span className="font-semibold text-violet-700">{row.productName}</span> },
    { key: 'productCode', label: 'Product Code', render: (row) => <span className="text-slate-600">{row.productCode}</span> },
    { key: 'lastOrderDate', label: 'Last Order Date', render: (row) => <span className="text-slate-600">{row.lastOrderDate}</span> },
    { key: 'lastOrderedQty', label: 'Last Ordered Qty', render: (row) => <span className="text-slate-600">{row.lastOrderedQty}</span> },
    { key: 'suggestedQty', label: 'Suggested Qty', render: (row) => <span className="font-medium text-slate-800">{row.suggestedQty}</span> },
    { key: 'availability', label: 'Availability', render: (row) => <span className={`font-medium ${row.availability === 'In Stock' ? 'text-emerald-600' : 'text-amber-600'}`}>{row.availability}</span> },
    { key: 'status', label: 'Reorder Status', render: (row) => <Badge variant={getStatusVariant(row.status)}>{row.status}</Badge> },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
          {row.status === 'Recommended' && (
            <ActionButton variant="ghost" className="text-violet-600 text-xs px-2 py-1" onClick={() => setReorderItem(row)}>
              <RefreshCcw className="w-3 h-3 mr-1" /> Reorder
            </ActionButton>
          )}
          {row.status === 'Ignored' && (
            <ActionButton variant="ghost" className="text-violet-600 text-xs px-2 py-1" onClick={() => setReorderItem(row)}>
              <RefreshCcw className="w-3 h-3 mr-1" /> Reorder Again
            </ActionButton>
          )}
          {row.status === 'Already Reordered' && (
            <ActionButton variant="ghost" className="text-slate-500 text-xs px-2 py-1" onClick={() => setViewDetails(row)}>
              <Eye className="w-3 h-3 mr-1" /> View Order
            </ActionButton>
          )}
        </div>
      )
    }
  ];

  const columns = isRetailer ? retailerColumns : adminColumns;

  // Exports
  const getExportData = () => {
    if (activeRole === ROLE_SUPER_ADMIN) {
      return filteredData.map(item => ({
        'Retailer Name': item.retailer,
        'Product Name': item.productName,
        'Last Order Date': item.lastOrderDate,
        'Suggested Qty': item.suggestedQty,
        'Reorder Status': item.status
      }));
    } else {
      return filteredData.map(item => ({
        'Product Name': item.productName,
        'Product Code': item.productCode,
        'Last Order Date': item.lastOrderDate,
        'Last Ordered Qty': item.lastOrderedQty,
        'Suggested Qty': item.suggestedQty,
        'Availability': item.availability,
        'Reorder Status': item.status
      }));
    }
  };

  const handleExportExcel = () => {
    const data = getExportData();
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Reorder_Recommendations");
    XLSX.writeFile(wb, "Reorder_Recommendations.xlsx");
    setShowExportMenu(false);
  };

  const handleExportCSV = () => {
    const data = getExportData();
    const ws = XLSX.utils.json_to_sheet(data);
    const csv = XLSX.utils.sheet_to_csv(ws);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "Reorder_Recommendations.csv";
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowExportMenu(false);
  };

  const handleExportPDF = () => {
    const data = getExportData();
    const doc = new jsPDF('landscape');
    const headers = Object.keys(data[0] || {});
    const body = data.map(obj => headers.map(header => (obj as any)[header]));
    
    doc.text("Reorder Recommendations", 14, 15);
    autoTable(doc, {
      startY: 20,
      head: [headers],
      body: body,
      theme: 'striped',
      headStyles: { fillColor: [124, 58, 237] },
      styles: { fontSize: 9 }
    });
    doc.save("Reorder_Recommendations.pdf");
    setShowExportMenu(false);
  };

  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader
        title="Reorder Functionality"
        subtitle="View and manage automated reorder recommendations based on purchase history."
        actions={
          <div className="relative inline-block text-left" ref={exportMenuRef}>
            <ActionButton 
              variant="secondary" 
              icon={<Download className="w-4 h-4" />}
              onClick={() => setShowExportMenu(!showExportMenu)}
            >
              Export <ChevronDown className="w-3 h-3 ml-1" />
            </ActionButton>
            {showExportMenu && (
              <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
                <div className="py-1" role="menu" aria-orientation="vertical">
                  <button onClick={handleExportCSV} className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">Export CSV</button>
                  <button onClick={handleExportExcel} className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">Export Excel</button>
                  <button onClick={handleExportPDF} className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">Export PDF</button>
                </div>
              </div>
            )}
          </div>
        }
      />

      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search product name or code..." />
        <div className="w-px h-6 bg-slate-200 mx-2 hidden sm:block" />
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-medium text-slate-600">Filters:</span>
        </div>
        <SelectFilter
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { label: 'All', value: '' },
            { label: 'Recommended', value: 'Recommended' },
            { label: 'Already Reordered', value: 'Already Reordered' },
            { label: 'Ignored', value: 'Ignored' },
          ]}
          placeholder="Status"
        />
      </FilterBar>

      <TableCard>
        <div className="[&>div::-webkit-scrollbar]:hidden [&>div]:[-ms-overflow-style:none] [&>div]:[scrollbar-width:none]">
          <DataTable
            columns={columns}
            data={filteredData}
            emptyMessage="No reorder recommendations found."
          />
        </div>
      </TableCard>

      {/* View Details Drawer */}
      <Drawer
        open={!!viewDetails}
        onClose={() => setViewDetails(null)}
        title="Recommendation Details"
      >
        {viewDetails && (
          <div className="space-y-6 pb-20">
            {/* Section 1: Recommendation Information */}
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">Recommendation Information</h3>
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="col-span-full">
                  <DrawerField label="Product Name" value={<span className="font-semibold text-violet-700">{viewDetails.productName}</span>} />
                </div>
                <DrawerField label="Product Code" value={viewDetails.productCode} />
                <DrawerField label="Status" value={<Badge variant={getStatusVariant(viewDetails.status)}>{viewDetails.status}</Badge>} />
                <DrawerField label="Last Order Date" value={viewDetails.lastOrderDate} />
                <DrawerField label="Last Ordered Quantity" value={viewDetails.lastOrderedQty} />
                <div className="col-span-full">
                  <DrawerField label="Suggested Quantity" value={<span className="font-bold text-slate-900">{viewDetails.suggestedQty}</span>} />
                </div>
              </div>
            </div>

            {/* Section 2: Retailer Information (Admin only) */}
            {!isRetailer && (
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">Retailer Information</h3>
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                  <DrawerField label="Retailer Name" value={<span className="font-medium text-slate-900">{viewDetails.retailer}</span>} />
                </div>
              </div>
            )}

            {/* Section 3: Availability Information */}
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">Availability Information</h3>
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-4">
                <DrawerField label="Available Stock" value={<span className={`font-medium ${viewDetails.availability === 'In Stock' ? 'text-emerald-600' : 'text-amber-600'}`}>{viewDetails.availableStock}</span>} />
                <DrawerField label="Last Purchase Frequency" value={viewDetails.purchaseFreq} />
              </div>
            </div>

            {/* Section 4: Recommendation Summary */}
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">Recommendation Summary</h3>
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <DrawerField label="Reason for Recommendation" value={<span className="italic text-slate-700">{viewDetails.reason}</span>} />
              </div>
            </div>

          </div>
        )}
      </Drawer>

      {/* Reorder Modal (Retailer Only) */}
      <Modal
        open={!!reorderItem}
        onClose={() => setReorderItem(null)}
        title="Reorder Product"
      >
        {reorderItem && (
          <div className="space-y-6">
            {/* Product Info */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Product</p>
                <p className="text-sm font-bold text-slate-900">{reorderItem.productName} <span className="font-normal text-slate-500">({reorderItem.productCode})</span></p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Last Ordered</p>
                <p className="text-sm font-medium text-slate-800">{reorderItem.lastOrderedQty}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Suggested</p>
                <p className="text-sm font-medium text-slate-800">{reorderItem.suggestedQty}</p>
              </div>
              <div className="col-span-2">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Current Availability</p>
                <p className={`text-sm font-medium ${reorderItem.availability === 'In Stock' ? 'text-emerald-600' : 'text-amber-600'}`}>{reorderItem.availability}</p>
              </div>
            </div>

            {/* Editable Fields */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Reorder Quantity <span className="text-red-500">*</span></label>
                <div className="relative">
                  <input 
                    type="number" 
                    min="1"
                    value={reorderQty} 
                    onChange={(e) => setReorderQty(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                    placeholder="Enter quantity"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">Units</span>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Remarks (Optional)</label>
                <textarea 
                  value={remarks} 
                  onChange={(e) => setRemarks(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                  placeholder="Any specific instructions"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <ActionButton variant="secondary" onClick={() => setReorderItem(null)}>
                Cancel
              </ActionButton>
              <ActionButton onClick={handleAddToCart}>
                Add To Cart
              </ActionButton>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
