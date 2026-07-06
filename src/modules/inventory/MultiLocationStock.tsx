import { useState, useRef, useEffect, useMemo } from 'react';
import { Download, ChevronDown, Filter, Search } from 'lucide-react';
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
import { inventoryService } from "../../services/inventoryService";
import { warehouseService } from "../../services/warehouseService";
import { productService } from "../../services/productService";
import { batchService } from "../../services/batchService";

interface WarehouseSummary {
  id: string;
  code: string;
  name: string;
  city: string;
  state: string;
  type: string;
  status: string;
  numProducts: number;
  totalStock: number;
  lowStockProducts: number;
  outOfStockProducts: number;
}

interface ProductInventory {
  id: string;
  productCode: string;
  productName: string;
  category: string;
  packType: string;
  uom: string;
  availableQty: number;
  reorderLevel: number;
  status: 'In Stock' | 'Low Stock' | 'Out Of Stock';
}

interface BatchInventory {
  id: string;
  batchNo: string;
  barcode: string;
  availableQty: number;
  mfgDate: string;
  expiryDate: string;
  status: string;
}

const formatDate = (dateString: string | undefined) => {
  if (!dateString) return "-";
  if (dateString.match(/^\d{2}-\d{2}-\d{4}$/)) {
    return dateString;
  }
  if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
    const [year, month, day] = dateString.split('-');
    return `${day}-${month}-${year}`;
  }
  const date = new Date(dateString);
  if (!isNaN(date.getTime())) {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  }
  return dateString;
};

export default function MultiLocationStock() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  const [inventory, setInventory] = useState(inventoryService.getAll());
  const [warehouses] = useState(warehouseService.getAll());
  const [products] = useState(productService.getProducts());
  const [batches] = useState(batchService.getAll());

  useEffect(() => {
    setInventory(inventoryService.getAll());
  }, []);

  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  const [selectedWarehouse, setSelectedWarehouse] = useState<WarehouseSummary | null>(null);
  const [productSearch, setProductSearch] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<ProductInventory | null>(null);

  // Handle clicking outside export menu to close it
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setShowExportMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const warehouseSummaries = useMemo(() => {
    return warehouses.map(warehouse => {
      const whInventory = inventory.filter(item => item.warehouseId === warehouse.id || item.warehouseCode === warehouse.code);
      
      const productMap = new Map<string, number>();
      whInventory.forEach(item => {
        const code = item.productCode;
        const qty = Number(item.availableQty) || 0;
        productMap.set(code, (productMap.get(code) || 0) + qty);
      });

      let numProducts = 0;
      let totalStock = 0;
      let lowStockProducts = 0;
      let outOfStockProducts = 0;

      productMap.forEach((qty, productCode) => {
        const product = products.find(p => p.code === productCode);
        const reorderLevel = Number(product?.reorderLevel) || 0;

        numProducts++;
        totalStock += qty;

        if (qty <= 0) {
          outOfStockProducts++;
        } else if (qty <= reorderLevel) {
          lowStockProducts++;
        }
      });

      return {
        id: warehouse.id,
        code: warehouse.code,
        name: warehouse.name,
        city: warehouse.city,
        state: warehouse.state,
        type: warehouse.type,
        status: warehouse.status,
        numProducts,
        totalStock,
        lowStockProducts,
        outOfStockProducts
      };
    });
  }, [warehouses, inventory, products]);

  const filteredWarehouses = warehouseSummaries.filter(w => {
    const matchesSearch = w.code.toLowerCase().includes(search.toLowerCase()) || 
                          w.name.toLowerCase().includes(search.toLowerCase()) || 
                          w.city.toLowerCase().includes(search.toLowerCase());
                          
    const matchesStatus = statusFilter ? w.status === statusFilter : true;
    return matchesSearch && matchesStatus;
  });

  const columns: Column<WarehouseSummary>[] = [
    { key: 'code', label: 'Warehouse Code', render: (row) => <span className="font-semibold text-violet-700">{row.code}</span> },
    { key: 'name', label: 'Warehouse Name', render: (row) => <span className="font-medium text-slate-900">{row.name}</span> },
    { key: 'numProducts', label: 'Number of Products' },
    { key: 'totalStock', label: 'Total Stock' },
    { key: 'lowStockProducts', label: 'Low Stock Products' },
    { key: 'outOfStockProducts', label: 'Out Of Stock Products' },
    { 
      key: 'status', 
      label: 'Status', 
      render: (row) => (
        <Badge variant={row.status === 'Active' ? 'success' : 'neutral'}>
          {row.status}
        </Badge>
      )
    },
    {
      key: 'id',
      label: 'Actions',
      render: (row) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setSelectedWarehouse(row);
            setProductSearch('');
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
    return `${dd}-${mm}-${yyyy}`;
  };

  const handleExportExcel = () => {
    const exportData = filteredWarehouses.map(row => ({
      'Warehouse Code': row.code,
      'Warehouse Name': row.name,
      'City': row.city,
      'Number of Products': row.numProducts,
      'Total Stock': row.totalStock,
      'Low Stock Products': row.lowStockProducts,
      'Out Of Stock Products': row.outOfStockProducts,
      'Status': row.status
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Warehouse Summary');
    
    const fileName = `multi_location_inventory_${getFormattedDate()}.xlsx`;
    XLSX.writeFile(workbook, fileName);
    setShowExportMenu(false);
  };

  const handleExportCSV = () => {
    const headers = ['Warehouse Code', 'Warehouse Name', 'City', 'Number of Products', 'Total Stock', 'Low Stock Products', 'Out Of Stock Products', 'Status'];
    const csvContent = [
      headers.join(','),
      ...filteredWarehouses.map(row => 
        [
          row.code,
          `"${row.name}"`, 
          `"${row.city}"`,
          row.numProducts, 
          row.totalStock,
          row.lowStockProducts,
          row.outOfStockProducts,
          row.status
        ].join(',')
      )
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    const fileName = `multi_location_inventory_${getFormattedDate()}.csv`;
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowExportMenu(false);
  };

  const warehouseProducts = useMemo(() => {
    if (!selectedWarehouse) return [];
    const whInventory = inventory.filter(item => item.warehouseId === selectedWarehouse.id || item.warehouseCode === selectedWarehouse.code);
    
    const productMap = new Map<string, ProductInventory>();
    
    whInventory.forEach(item => {
      const code = item.productCode;
      const qty = Number(item.availableQty) || 0;
      
      if (productMap.has(code)) {
        const existing = productMap.get(code)!;
        existing.availableQty += qty;
        
        const reorderLevel = existing.reorderLevel;
        if (existing.availableQty <= 0) existing.status = "Out Of Stock";
        else if (existing.availableQty <= reorderLevel) existing.status = "Low Stock";
        else existing.status = "In Stock";
      } else {
        const product = products.find(p => p.code === code);
        const reorderLevel = Number(product?.reorderLevel) || 0;
        let status: 'In Stock' | 'Low Stock' | 'Out Of Stock' = 'In Stock';
        if (qty <= 0) status = 'Out Of Stock';
        else if (qty <= reorderLevel) status = 'Low Stock';
        
        productMap.set(code, {
          id: code,
          productCode: code,
          productName: item.productName || product?.name || '',
          category: product?.category || '',
          packType: product?.packingType || '',
          uom: product?.type || '',
          availableQty: qty,
          reorderLevel,
          status
        });
      }
    });
  
    return Array.from(productMap.values()).sort((a, b) => a.productName.localeCompare(b.productName));
  }, [selectedWarehouse, inventory, products]);

  const filteredWarehouseProducts = warehouseProducts.filter(p => {
    return p.productCode.toLowerCase().includes(productSearch.toLowerCase()) ||
           p.productName.toLowerCase().includes(productSearch.toLowerCase());
  });

  const productColumns: Column<ProductInventory>[] = [
    { key: 'productCode', label: 'Product Code', render: (row) => <span className="font-medium text-slate-700">{row.productCode}</span> },
    { key: 'productName', label: 'Product Name', render: (row) => <span className="font-semibold text-slate-900">{row.productName}</span> },
    { key: 'availableQty', label: 'Available Quantity', render: (row) => <span className="font-medium text-slate-900">{row.availableQty}</span> },
    { key: 'reorderLevel', label: 'Reorder Level', render: (row) => <span className="text-slate-500">{row.reorderLevel}</span> },
    { 
      key: 'status', 
      label: 'Status', 
      render: (row) => {
        const variant = row.status === 'In Stock' ? 'success' : row.status === 'Low Stock' ? 'warning' : 'danger';
        return <Badge variant={variant}>{row.status}</Badge>;
      } 
    },
    {
      key: 'id',
      label: 'Actions',
      render: (row) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setSelectedProduct(row);
          }}
          className="text-violet-600 font-medium hover:text-violet-800"
        >
          View
        </button>
      )
    }
  ];

  const productBatches = useMemo(() => {
    if (!selectedWarehouse || !selectedProduct) return [];
    
    const whProductInventory = inventory.filter(item => 
      (item.warehouseId === selectedWarehouse.id || item.warehouseCode === selectedWarehouse.code) &&
      item.productCode === selectedProduct.productCode
    );
    
    return whProductInventory.map((item, index) => {
      const batchInfo = batches.find(b => b.batchNo === item.batchNo && (b.productCode === item.productCode || b.productName === item.productName));
      return {
        id: item.id || `batch-${index}`,
        batchNo: item.batchNo,
        barcode: batchInfo?.barcode || '-',
        availableQty: Number(item.availableQty) || 0,
        mfgDate: batchInfo?.mfgDate || '-',
        expiryDate: batchInfo?.expDate || '-',
        status: batchInfo?.status || 'Active'
      };
    });
  }, [selectedWarehouse, selectedProduct, inventory, batches]);

  const batchColumns: Column<BatchInventory>[] = [
    { key: 'batchNo', label: 'Batch Number', render: (row) => <span className="font-medium text-slate-900">{row.batchNo}</span> },
    { key: 'barcode', label: 'Barcode', render: (row) => <span className="text-slate-600">{row.barcode}</span> },
    { key: 'availableQty', label: 'Available Quantity', render: (row) => <span className="font-medium text-slate-900">{row.availableQty}</span> },
    { key: 'mfgDate', label: 'Manufacturing Date', render: (row) => formatDate(row.mfgDate) },
    { key: 'expiryDate', label: 'Expiry Date', render: (row) => formatDate(row.expiryDate) },
    { 
      key: 'status', 
      label: 'Status', 
      render: (row) => (
        <Badge variant={row.status === 'Active' ? 'success' : 'neutral'}>
          {row.status}
        </Badge>
      )
    }
  ];

  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader
        title="Multi-Location Inventory Management"
        subtitle="Track inventory levels across all registered warehouses and branches."
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
          </>
        }
      />

      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search warehouse code, name, or city..." />
        
        <div className="w-px h-6 bg-slate-200 mx-2 hidden sm:block" />
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-medium text-slate-600">Filters:</span>
        </div>

        <SelectFilter
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { label: 'Active', value: 'Active' },
            { label: 'Inactive', value: 'Inactive' },
          ]}
          placeholder="All Status"
        />
      </FilterBar>

      <TableCard>
        <div className="overflow-x-auto">
          <DataTable
            columns={columns}
            data={filteredWarehouses}
            emptyMessage="No warehouse data found."
          />
        </div>
      </TableCard>

      {/* Warehouse Details Drawer (First Drawer) */}
      <Drawer
        open={!!selectedWarehouse}
        onClose={() => setSelectedWarehouse(null)}
        title="Warehouse Details"
      >
        {selectedWarehouse && (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">Warehouse Information</h3>
              <div className="space-y-2">
                <DrawerField label="Warehouse Code" value={selectedWarehouse.code} />
                <DrawerField label="Warehouse Name" value={selectedWarehouse.name} />
                <DrawerField label="Warehouse Type" value={selectedWarehouse.type} />
                <DrawerField label="City" value={selectedWarehouse.city} />
                <DrawerField label="State" value={selectedWarehouse.state} />
                <DrawerField 
                  label="Status" 
                  value={
                    <Badge variant={selectedWarehouse.status === 'Active' ? 'success' : 'neutral'}>
                      {selectedWarehouse.status}
                    </Badge>
                  } 
                />
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">Warehouse Inventory</h3>
              
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    placeholder="Search product code or name..."
                    className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400"
                  />
                </div>
              </div>

              <div className="overflow-x-auto border border-slate-200 rounded-lg">
                <DataTable
                  columns={productColumns}
                  data={filteredWarehouseProducts}
                  emptyMessage="No products found in this warehouse."
                />
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100 flex justify-end gap-3">
              <ActionButton variant="secondary" onClick={() => setSelectedWarehouse(null)}>Close</ActionButton>
            </div>
          </div>
        )}
      </Drawer>

      {/* Product Details Drawer (Second Drawer) */}
      <Drawer
        open={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
        title="Product Inventory Details"
      >
        {selectedProduct && (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">Product Information</h3>
              <div className="space-y-2">
                <DrawerField label="Product Code" value={selectedProduct.productCode} />
                <DrawerField label="Product Name" value={selectedProduct.productName} />
                <DrawerField label="Category" value={selectedProduct.category} />
                <DrawerField label="Packing Type" value={selectedProduct.packType} />
                <DrawerField label="Unit of Measure" value={selectedProduct.uom} />
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">Batch Inventory</h3>
              <div className="overflow-x-auto border border-slate-200 rounded-lg">
                <DataTable
                  columns={batchColumns}
                  data={productBatches}
                  emptyMessage="No batch records found."
                />
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100 flex justify-end gap-3">
              <ActionButton variant="secondary" onClick={() => setSelectedProduct(null)}>Close</ActionButton>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}