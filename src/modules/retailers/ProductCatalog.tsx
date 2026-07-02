import { useState, useRef, useEffect, useMemo } from 'react';
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

// Import services to fetch live entries from local storage / service pipelines
import { productService } from "../../services/productService";
import { schemeService } from "../../services/schemeService";

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
  schemeType?: string;
  schemeValidFrom?: string;
  schemeValidTo?: string;
  schemeDescription?: string;
}

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

  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setShowExportMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Sync real Master database state array rows with Catalog View
  useEffect(() => {
    const fetchCatalogData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch products directly from your existing productService backend layer
        const rawProducts = await productService.getProducts();
        
        let schemes: any[] = [];
        try {
          schemes = await schemeService.getAll();
        } catch (schemeErr) {
          console.warn("Scheme engine lookup bypassed:", schemeErr);
        }

        const mappedProducts: Product[] = (rawProducts || []).map((p: any) => {
          const linkedScheme = schemes?.find((s: any) => s.id === p.scheme || s.name === p.scheme);
          
          // FIXED: Reading fields exactly matching your ProductMaster specification layout keys
          const rawStockValue = p.totalUnits !== undefined ? p.totalUnits : (p.stock || p.availableStock || '0');
          const totalStock = typeof rawStockValue === 'number' ? rawStockValue : parseInt(rawStockValue || '0', 10);
          
          // Setup a dynamic fallback evaluation checkpoint for warning states
          const lowLimit = p.reorderLevel ? parseInt(p.reorderLevel, 10) : 20;
          
          let computedStatus: Product['status'] = 'Available';
          if (totalStock <= 0 || p.status === 'Inactive' || p.status === 'Discontinued') {
            computedStatus = 'Out Of Stock';
          } else if (totalStock <= lowLimit) {
            computedStatus = 'Low Stock';
          }

          return {
            id: p.id || String(Math.random()),
            code: p.code || p.productCode || 'N/A',
            name: p.name || p.productName || 'Unnamed Product',
            category: p.category || 'General',
            brand: p.brandName || p.manufacturer || 'N/A',
            packSize: p.packingType ? `${p.packingType} (${p.unitsPerPack || 10}s)` : `${p.unitsPerPack || 10} Units`,
            baseUnit: p.packingType || 'Pack',
            unitsPerPack: String(p.unitsPerPack || '10'),
            mrp: String(p.mrp).startsWith('₹') ? p.mrp : `₹ ${parseFloat(p.mrp || '0').toFixed(2)}`,
            ptr: String(p.ptr).startsWith('₹') ? p.ptr : `₹ ${parseFloat(p.ptr || '0').toFixed(2)}`,
            scheme: p.scheme && p.scheme !== 'None' && p.scheme !== 'No Scheme' ? p.scheme : null,
            stock: `${totalStock.toLocaleString()} Units`,
            status: computedStatus,
            schemeType: linkedScheme?.type || 'N/A',
            schemeValidFrom: linkedScheme?.validFrom || 'N/A',
            schemeValidTo: linkedScheme?.validTo || 'N/A',
            schemeDescription: linkedScheme?.description || 'No promotional conditions found.'
          };
        });

        setProducts(mappedProducts);
      } catch (error) {
        console.error("Error aligning Catalog component indexes with Product Master:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCatalogData();
  }, []);

  const dynamicCategories = useMemo(() => {
    const unique = new Set(products.map(p => p.category).filter(Boolean));
    return Array.from(unique).map(cat => ({ label: cat, value: cat }));
  }, [products]);

  const filteredData = useMemo(() => {
    return products.filter((item) => {
      const searchStr = search.toLowerCase();
      const matchSearch = item.name.toLowerCase().includes(searchStr) || item.code.toLowerCase().includes(searchStr);
      const matchCategory = categoryFilter ? item.category === categoryFilter : true;
      const matchStatus = statusFilter ? item.status === statusFilter : true;
      return matchSearch && matchCategory && matchStatus;
    });
  }, [search, categoryFilter, statusFilter, products]);

  const getStatusVariant = (status: string): BadgeVariant => {
    if (status === 'Available') return 'success';
    if (status === 'Low Stock') return 'warning';
    return 'danger';
  };

  const columns: Column<Product>[] = [
    { key: 'code', label: 'code', render: (row) => <span className="font-semibold text-slate-700">{row.code}</span> },
    { key: 'name', label: 'name', render: (row) => <span className="font-semibold text-slate-900">{row.name}</span> },
    { key: 'category', label: 'category', render: (row) => <span className="text-slate-600">{row.category}</span> },
    { key: 'packSize', label: 'packSize', render: (row) => <span className="text-slate-600">{row.packSize}</span> },
    { key: 'ptr', label: 'ptr', render: (row) => <span className="font-bold text-violet-700">{row.ptr}</span> },
    { key: 'scheme', label: 'scheme', render: (row) => row.scheme ? <span className="text-emerald-600 font-medium">{row.scheme}</span> : <Badge variant="neutral">No Active Scheme</Badge> },
    { key: 'stock', label: 'stock', render: (row) => <span className="font-medium text-slate-800">{row.stock}</span> },
    { key: 'status', label: 'status', render: (row) => <Badge variant={getStatusVariant(row.status)}>{row.status}</Badge> },
    {
      key: 'actions',
      label: 'id',
      render: (row) => (
        <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
          <button onClick={() => setSelectedProduct(row)} className="text-slate-400 hover:text-violet-600 transition-colors p-1" title="View Details">
            <Eye className="w-4 h-4" />
          </button>
          {activeRole === ROLE_RETAILER && (
            <button 
              onClick={() => { setCartProduct(row); setOrderQty('1'); }} 
              disabled={row.status === 'Out Of Stock'}
              className="text-slate-400 hover:text-emerald-600 transition-colors p-1 disabled:opacity-30 disabled:cursor-not-allowed" 
              title="Add To Cart"
            >
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
    if (data.length === 0) return;
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
    if (!orderQty || isNaN(Number(orderQty)) || Number(orderQty) <= 0 || !cartProduct) {
      alert("Please enter a valid order quantity.");
      return;
    }
    
    const qty = parseInt(orderQty, 10);
    const numericPtr = parseFloat(cartProduct.ptr.replace(/[^0-9.]/g, '')) || 0;
    
    const cartKey = 'pharma_erp_retailer_cart';
    const existingCartRaw = localStorage.getItem(cartKey);
    let currentItems = existingCartRaw ? JSON.parse(existingCartRaw) : [];

    const duplicateIndex = currentItems.findIndex((i: any) => i.productCode === cartProduct.code);

    const cartPayload = {
      productCode: cartProduct.code,
      productName: cartProduct.name,
      packType: cartProduct.packSize,
      ptr: numericPtr,
      scheme: cartProduct.scheme || 'No Scheme',
      quantity: qty,
      lineTotal: numericPtr * qty
    };

    if (duplicateIndex > -1) {
      currentItems[duplicateIndex].quantity += qty;
      currentItems[duplicateIndex].lineTotal = currentItems[duplicateIndex].quantity * currentItems[duplicateIndex].ptr;
    } else {
      currentItems.push(cartPayload);
    }

    localStorage.setItem(cartKey, JSON.stringify(currentItems));
    window.dispatchEvent(new Event('cartUpdated'));

    alert(`Successfully added ${qty} of ${cartProduct.name} to cart.`);
    setCartProduct(null);
    setOrderQty('');
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
          options={dynamicCategories}
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
        {isLoading ? (
          <div className="p-12 text-center text-slate-500 font-medium animate-pulse">
            Synchronizing live catalog indexes...
          </div>
        ) : (
          <div className="[&>div::-webkit-scrollbar]:hidden [&>div]:[-ms-overflow-style:none] [&>div]:[scrollbar-width:none]">
            <DataTable
              columns={columns}
              data={filteredData}
              emptyMessage="No products found matching your search or filters."
            />
          </div>
        )}
      </TableCard>

      <Drawer
        open={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
        title="Product Details"
      >
        {selectedProduct && (
          <div className="space-y-6 pb-20">
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">Product Information</h3>
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <DrawerField label="Product Code" value={<span className="font-semibold text-slate-900">{selectedProduct.code}</span>} />
                <DrawerField label="Product Name" value={selectedProduct.name} />
                <DrawerField label="Category" value={selectedProduct.category} />
                <DrawerField label="Brand" value={selectedProduct.brand} />
              </div>
            </div>

            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">Pricing</h3>
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <DrawerField label="MRP" value={selectedProduct.mrp} />
                <DrawerField label="PTR" value={<span className="font-bold text-violet-700">{selectedProduct.ptr}</span>} />
              </div>
            </div>

            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">Packaging</h3>
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <DrawerField label="Base Unit" value={selectedProduct.baseUnit} />
                <DrawerField label="Pack Size" value={selectedProduct.packSize} />
                <DrawerField label="Units Per Pack" value={selectedProduct.unitsPerPack} />
              </div>
            </div>

            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">Stock Information</h3>
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <DrawerField label="Available Stock" value={<span className="font-medium text-slate-800">{selectedProduct.stock}</span>} />
                <DrawerField label="Stock Status" value={<Badge variant={getStatusVariant(selectedProduct.status)}>{selectedProduct.status}</Badge>} />
              </div>
            </div>

            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">Active Schemes</h3>
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <DrawerField label="Scheme Name" value={selectedProduct.scheme ? <span className="font-medium text-emerald-600">{selectedProduct.scheme}</span> : <span className="text-slate-500 font-medium">No Active Scheme</span>} />
                {selectedProduct.scheme && (
                  <>
                    <DrawerField label="Scheme Type" value={selectedProduct.schemeType} />
                    <DrawerField label="Valid From" value={selectedProduct.schemeValidFrom} />
                    <DrawerField label="Valid To" value={selectedProduct.schemeValidTo} />
                    <DrawerField label="Conditions" value={<span className="text-xs text-slate-600 block mt-1">{selectedProduct.schemeDescription}</span>} />
                  </>
                )}
              </div>
            </div>
            
            {activeRole === ROLE_RETAILER && selectedProduct.status !== 'Out Of Stock' && (
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
                  className="w-full h-10 px-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 text-sm" 
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