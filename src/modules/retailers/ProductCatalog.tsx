import { useState, useRef, useEffect } from 'react';
import { Download, Filter, ShoppingCart, Eye, ChevronDown, X } from 'lucide-react';
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

interface Product {
  id: string;
  code: string;
  name: string;
  category: string;
  brand: string;
  packSize: string;
  baseUnit: string;
  unitsPerPack: string;
  mrp: string;
  ptr: string;
  scheme: string | null;
  stock: string;
  status: 'Available' | 'Low Stock' | 'Out Of Stock';
}

const mockData: Product[] = [
  { 
    id: '1', code: 'AMX-500', name: 'Amoxicillin 500mg', category: 'Antibiotics', brand: 'GlaxoSmithKline',
    packSize: '10 x 10 Tablets', baseUnit: 'Strip', unitsPerPack: '10 Tablets', mrp: '₹ 110.00', ptr: '₹ 85.50',
    scheme: 'Buy 10 Get 1', stock: '5,000 Strips', status: 'Available'
  },
  { 
    id: '2', code: 'PAR-650', name: 'Paracetamol 650mg', category: 'Analgesics', brand: 'Cipla',
    packSize: '20 x 15 Tablets', baseUnit: 'Box', unitsPerPack: '15 Tablets', mrp: '₹ 30.00', ptr: '₹ 22.00',
    scheme: '5% Cash Discount', stock: '12,000 Boxes', status: 'Available'
  },
  { 
    id: '3', code: 'COF-100', name: 'Cough Syrup 100ml', category: 'Respiratory', brand: 'Sun Pharma',
    packSize: '100 ml Bottle', baseUnit: 'Bottle', unitsPerPack: '100 ml', mrp: '₹ 120.00', ptr: '₹ 95.00',
    scheme: null, stock: '0 Bottles', status: 'Out Of Stock'
  },
  { 
    id: '4', code: 'ATO-10', name: 'Atorvastatin 10mg', category: 'Cardiac', brand: 'Torrent',
    packSize: '10 x 15 Tablets', baseUnit: 'Strip', unitsPerPack: '15 Tablets', mrp: '₹ 145.00', ptr: '₹ 110.00',
    scheme: 'Quarter Target Bonus', stock: '1,200 Strips', status: 'Available'
  },
  { 
    id: '5', code: 'MET-500', name: 'Metformin 500mg', category: 'Diabetic', brand: 'USV',
    packSize: '10 x 10 Tablets', baseUnit: 'Strip', unitsPerPack: '10 Tablets', mrp: '₹ 55.00', ptr: '₹ 42.00',
    scheme: null, stock: '150 Strips', status: 'Low Stock'
  },
];

export default function ProductCatalog() {
  const activeRole = localStorage.getItem('activeRole') || ROLE_RETAILER;
  
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [cartProduct, setCartProduct] = useState<Product | null>(null);
  const [orderQty, setOrderQty] = useState('');
  
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

  const filteredData = mockData.filter((item) => {
    const searchStr = search.toLowerCase();
    const matchSearch = item.name.toLowerCase().includes(searchStr) || item.code.toLowerCase().includes(searchStr);
    const matchCategory = categoryFilter ? item.category === categoryFilter : true;
    const matchStatus = statusFilter ? item.status === statusFilter : true;
    return matchSearch && matchCategory && matchStatus;
  });

  const getStatusVariant = (status: string): BadgeVariant => {
    if (status === 'Available') return 'success';
    if (status === 'Low Stock') return 'warning';
    return 'danger';
  };

  const columns: Column<Product>[] = [
    { key: 'code', label: 'Product Code', render: (row) => <span className="font-semibold text-slate-700">{row.code}</span> },
    { key: 'name', label: 'Product Name', render: (row) => <span className="font-semibold text-slate-900">{row.name}</span> },
    { key: 'category', label: 'Category', render: (row) => <span className="text-slate-600">{row.category}</span> },
    { key: 'packSize', label: 'Pack Size', render: (row) => <span className="text-slate-600">{row.packSize}</span> },
    { key: 'ptr', label: 'PTR', render: (row) => <span className="font-bold text-violet-700">{row.ptr}</span> },
    { key: 'scheme', label: 'Active Scheme', render: (row) => row.scheme ? <span className="text-emerald-600 font-medium">{row.scheme}</span> : <Badge variant="neutral">No Active Scheme</Badge> },
    { key: 'stock', label: 'Available Stock', render: (row) => <span className="font-medium text-slate-800">{row.stock}</span> },
    { key: 'status', label: 'Status', render: (row) => <Badge variant={getStatusVariant(row.status)}>{row.status}</Badge> },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
          <button onClick={() => setSelectedProduct(row)} className="text-slate-400 hover:text-violet-600 transition-colors p-1" title="View Details">
            <Eye className="w-4 h-4" />
          </button>
          {activeRole === ROLE_RETAILER && (
            <button onClick={() => { setCartProduct(row); setOrderQty('1'); }} className="text-slate-400 hover:text-emerald-600 transition-colors p-1" title="Add To Cart">
              <ShoppingCart className="w-4 h-4" />
            </button>
          )}
        </div>
      )
    }
  ];

  const getExportData = () => {
    return filteredData.map(item => ({
      'Product Code': item.code,
      'Product Name': item.name,
      'Category': item.category,
      'Pack Size': item.packSize,
      'PTR': item.ptr,
      'Active Scheme': item.scheme || 'No Active Scheme',
      'Available Stock': item.stock,
      'Status': item.status
    }));
  };

  const handleExportExcel = () => {
    const data = getExportData();
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Product_Catalog");
    XLSX.writeFile(wb, "Product_Catalog.xlsx");
    setShowExportMenu(false);
  };

  const handleExportCSV = () => {
    const data = getExportData();
    const ws = XLSX.utils.json_to_sheet(data);
    const csv = XLSX.utils.sheet_to_csv(ws);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "Product_Catalog.csv";
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
    
    doc.text("Product Catalog", 14, 15);
    autoTable(doc, {
      startY: 20,
      head: [headers],
      body: body,
      theme: 'striped',
      headStyles: { fillColor: [124, 58, 237] },
      styles: { fontSize: 8 }
    });
    doc.save("Product_Catalog.pdf");
    setShowExportMenu(false);
  };

  const handleAddToCart = () => {
    if (!orderQty || isNaN(Number(orderQty)) || Number(orderQty) <= 0) {
      alert("Please enter a valid order quantity.");
      return;
    }
    console.log(`Added ${orderQty} of ${cartProduct?.name} to cart.`);
    alert(`Successfully added ${orderQty} of ${cartProduct?.name} to cart.`);
    setCartProduct(null);
  };

  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader
        title="Product Browsing"
        subtitle={activeRole === ROLE_SUPER_ADMIN ? "View and manage retailer catalog visibility." : "Browse products, check availability, and add to cart."}
        actions={
          <div className="relative inline-block text-left" ref={exportMenuRef}>
            <ActionButton 
              variant="secondary" 
              icon={<Download className="w-4 h-4" />}
              onClick={() => setShowExportMenu(!showExportMenu)}
            >
              Download Price List <ChevronDown className="w-3 h-3 ml-1" />
            </ActionButton>
            {showExportMenu && (
              <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
                <div className="py-1" role="menu" aria-orientation="vertical">
                  <button onClick={handleExportExcel} className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">Export Excel (.xlsx)</button>
                  <button onClick={handleExportCSV} className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">Export CSV (.csv)</button>
                  <button onClick={handleExportPDF} className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">Export PDF (.pdf)</button>
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
          value={categoryFilter}
          onChange={setCategoryFilter}
          options={[
            { label: 'Antibiotics', value: 'Antibiotics' },
            { label: 'Analgesics', value: 'Analgesics' },
            { label: 'Respiratory', value: 'Respiratory' },
            { label: 'Cardiac', value: 'Cardiac' },
            { label: 'Diabetic', value: 'Diabetic' },
          ]}
          placeholder="All Categories"
        />
        <SelectFilter
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { label: 'Available', value: 'Available' },
            { label: 'Low Stock', value: 'Low Stock' },
            { label: 'Out Of Stock', value: 'Out Of Stock' },
          ]}
          placeholder="All Status"
        />
      </FilterBar>

      <TableCard>
        <div className="[&>div::-webkit-scrollbar]:hidden [&>div]:[-ms-overflow-style:none] [&>div]:[scrollbar-width:none]">
          <DataTable
            columns={columns}
            data={filteredData}
            emptyMessage="No products found matching your search or filters."
          />
        </div>
      </TableCard>

      <Drawer
        open={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
        title="Product Details"
      >
        {selectedProduct && (
          <div className="space-y-6 pb-20">
            {/* Section A: Product Information */}
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">Product Information</h3>
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <DrawerField label="Product Code" value={<span className="font-semibold text-slate-900">{selectedProduct.code}</span>} />
                <DrawerField label="Product Name" value={selectedProduct.name} />
                <DrawerField label="Category" value={selectedProduct.category} />
                <DrawerField label="Brand" value={selectedProduct.brand} />
              </div>
            </div>

            {/* Section B: Pricing */}
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">Pricing</h3>
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <DrawerField label="MRP" value={selectedProduct.mrp} />
                <DrawerField label="PTR" value={<span className="font-bold text-violet-700">{selectedProduct.ptr}</span>} />
              </div>
            </div>

            {/* Section C: Packaging */}
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">Packaging</h3>
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <DrawerField label="Base Unit" value={selectedProduct.baseUnit} />
                <DrawerField label="Pack Size" value={selectedProduct.packSize} />
                <DrawerField label="Units Per Pack" value={selectedProduct.unitsPerPack} />
              </div>
            </div>

            {/* Section D: Stock Information */}
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">Stock Information</h3>
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <DrawerField label="Available Stock" value={<span className="font-medium text-slate-800">{selectedProduct.stock}</span>} />
                <DrawerField label="Stock Status" value={<Badge variant={getStatusVariant(selectedProduct.status)}>{selectedProduct.status}</Badge>} />
              </div>
            </div>

            {/* Section E: Active Schemes */}
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">Active Schemes</h3>
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <DrawerField label="Scheme Name" value={selectedProduct.scheme ? <span className="font-medium text-emerald-600">{selectedProduct.scheme}</span> : <span className="text-slate-500 font-medium">No Active Scheme</span>} />
                <DrawerField label="Benefit" value={selectedProduct.scheme ? selectedProduct.scheme : '-'} />
              </div>
            </div>
            
            {activeRole === ROLE_RETAILER && (
              <div className="mt-6 pt-6 border-t border-slate-200">
                <ActionButton 
                  onClick={() => {
                    setCartProduct(selectedProduct);
                    setOrderQty('1');
                    setSelectedProduct(null);
                  }} 
                  icon={<ShoppingCart className="w-4 h-4" />}
                >
                  Add To Cart
                </ActionButton>
              </div>
            )}
          </div>
        )}
      </Drawer>

      {/* Add To Cart Modal */}
      {cartProduct && activeRole === ROLE_RETAILER && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-0">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity" onClick={() => setCartProduct(null)}></div>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200 relative z-10 flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
              <h3 className="text-lg font-semibold text-slate-900">Add To Cart</h3>
              <button onClick={() => setCartProduct(null)} className="text-slate-400 hover:text-slate-500 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Product</label>
                <div className="font-semibold text-slate-900 text-sm">{cartProduct.name}</div>
                <div className="text-xs text-slate-500">{cartProduct.code} • {cartProduct.packSize}</div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">PTR</label>
                  <div className="font-bold text-violet-700 text-sm">{cartProduct.ptr}</div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Available</label>
                  <div className="font-medium text-slate-900 text-sm">{cartProduct.stock}</div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Order Quantity</label>
                <input 
                  type="number" 
                  min="1"
                  value={orderQty}
                  onChange={(e) => setOrderQty(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500" 
                  placeholder="Enter quantity"
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 shrink-0">
              <button onClick={() => setCartProduct(null)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors">Cancel</button>
              <button onClick={handleAddToCart} className="px-4 py-2 text-sm font-medium bg-violet-600 text-white rounded-lg hover:bg-violet-700 shadow-sm transition-all active:scale-[0.98] flex items-center gap-2">
                <ShoppingCart className="w-4 h-4" /> Add To Cart
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
