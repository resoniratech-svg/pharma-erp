import { useState, useMemo, useRef, useEffect } from 'react';
import { Download, Filter, PackageSearch, PackageCheck, Tags, AlertCircle, Eye, ChevronDown } from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
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
  SummaryCard,
  Drawer,
  DrawerField
} from './components/shared';
import { type Column, type BadgeVariant } from './components/shared';

interface CatalogItem {
  id: string;
  productCode: string;
  productName: string;
  company: string;
  category: string;
  packType: string;
  mrp: number;
  ptr: number;
  pts: number;
  availableStock: number;
  reservedStock: number;
  reorderLevel: number;
  schemeAvailable: string;
  schemeType: string;
  schemeValidFrom: string;
  schemeValidTo: string;
  schemeDescription: string;
  status: 'Available' | 'Low Stock' | 'Out Of Stock';
}

const fallbackCatalogItems: CatalogItem[] = [
  { 
    id: '1', productCode: 'PRD-001', productName: 'Amoxicillin 500mg', company: 'PharmaCorp', category: 'Antibiotics', 
    packType: '10x10 Tablets', mrp: 150.00, ptr: 110.00, pts: 95.00, 
    availableStock: 5000, reservedStock: 200, reorderLevel: 1000, 
    schemeAvailable: '10+1 Free', schemeType: 'Quantity Bonus', schemeValidFrom: '01-Oct-2026', schemeValidTo: '31-Dec-2026', schemeDescription: 'Buy 10 packs, get 1 pack free.',
    status: 'Available' 
  },
  { 
    id: '2', productCode: 'PRD-002', productName: 'Paracetamol 650mg', company: 'HealthPlus', category: 'Analgesics', 
    packType: '15x10 Tablets', mrp: 60.00, ptr: 45.00, pts: 38.00, 
    availableStock: 250, reservedStock: 50, reorderLevel: 500, 
    schemeAvailable: 'No Scheme', schemeType: '-', schemeValidFrom: '-', schemeValidTo: '-', schemeDescription: '-',
    status: 'Low Stock' 
  },
  { 
    id: '3', productCode: 'PRD-003', productName: 'Vitamin C 1000mg', company: 'VitaLife', category: 'Vitamins', 
    packType: '20 Tablets Tube', mrp: 250.00, ptr: 180.00, pts: 150.00, 
    availableStock: 1200, reservedStock: 100, reorderLevel: 300, 
    schemeAvailable: '5% Off', schemeType: 'Discount', schemeValidFrom: '15-Sep-2026', schemeValidTo: '15-Nov-2026', schemeDescription: 'Flat 5% discount on invoice value.',
    status: 'Available' 
  },
  { 
    id: '4', productCode: 'PRD-004', productName: 'Cough Syrup 100ml', company: 'MediCare', category: 'Respiratory', 
    packType: '100ml Bottle', mrp: 85.00, ptr: 65.00, pts: 55.00, 
    availableStock: 0, reservedStock: 0, reorderLevel: 100, 
    schemeAvailable: 'No Scheme', schemeType: '-', schemeValidFrom: '-', schemeValidTo: '-', schemeDescription: '-',
    status: 'Out Of Stock' 
  }
];

const formatCurrency = (amount: number) => `₹ ${amount.toFixed(2)}`;

export default function ProductCatalog() {
  const [data, setData] = useState<CatalogItem[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  const [selectedProduct, setSelectedProduct] = useState<CatalogItem | null>(null);

  // Sync catalog dynamically with newly created products from ProductMaster
  useEffect(() => {
    const rawProducts = localStorage.getItem("pharma_erp_products");
    if (rawProducts) {
      try {
        const parsedProducts = JSON.parse(rawProducts);
        
        // Map ProductMaster structure cleanly into Catalog format
        const mappedCatalog: CatalogItem[] = parsedProducts.map((p: any) => {
          const availStock = p.totalUnits ? Number(p.totalUnits) : 100; // default safe fallback fallback stock allocation
          const reorderLvl = p.reorderLevel ? Number(p.reorderLevel) : 50;

          // Compute operational availability flags status dynamically
          let derivedStatus: 'Available' | 'Low Stock' | 'Out Of Stock' = 'Available';
          if (availStock === 0) {
            derivedStatus = 'Out Of Stock';
          } else if (availStock <= reorderLvl) {
            derivedStatus = 'Low Stock';
          }

          return {
            id: p.id || Math.random().toString(),
            productCode: p.code || 'N/A',
            productName: p.name || 'Unnamed Product',
            company: p.manufacturer || 'General Pharma',
            category: p.category || 'General',
            packType: p.packingType ? `${p.packingType} (${p.unitsPerPack || 1}s)` : 'Pack',
            mrp: p.mrp ? Number(p.mrp) : 0,
            ptr: p.ptr ? Number(p.ptr) : 0,
            pts: p.pts ? Number(p.pts) : 0,
            availableStock: availStock,
            reservedStock: 0,
            reorderLevel: reorderLvl,
            schemeAvailable: p.scheme || 'No Scheme',
            schemeType: p.scheme && p.scheme !== 'No Scheme' ? 'Promotional Offer' : '-',
            schemeValidFrom: 'Current',
            schemeValidTo: 'Open',
            schemeDescription: p.scheme || '-',
            status: derivedStatus
          };
        });

        setData(mappedCatalog);
      } catch (err) {
        console.error("Failed to parse master product listings", err);
        setData(fallbackCatalogItems);
      }
    } else {
      setData(fallbackCatalogItems);
    }
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setShowExportMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter Logic
  const filteredData = useMemo(() => {
    return data.filter((item) => {
      const matchSearch = item.productName.toLowerCase().includes(search.toLowerCase()) || 
                          item.productCode.toLowerCase().includes(search.toLowerCase()) ||
                          item.company.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter ? item.status === statusFilter : true;
      return matchSearch && matchStatus;
    });
  }, [data, search, statusFilter]);

  // Dynamic KPI Calculation (based on full dataset as it's the global catalog overview)
  const kpis = useMemo(() => {
    return {
      totalProducts: data.length,
      availableProducts: data.filter(p => p.availableStock > 0).length,
      activeSchemes: data.filter(p => p.schemeAvailable !== 'No Scheme').length,
      lowStockProducts: data.filter(p => p.status === 'Low Stock').length,
    };
  }, [data]);

  // Export Implementation
  const getFormattedDate = () => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}${mm}${dd}`;
  };

  const handleExportExcel = () => {
    const exportData = filteredData.map(row => ({
      'Product Code': row.productCode,
      'Product Name': row.productName,
      'Company': row.company,
      'Category': row.category,
      'Pack Type': row.packType,
      'MRP': row.mrp,
      'PTR': row.ptr,
      'Available Stock': row.availableStock,
      'Scheme': row.schemeAvailable,
      'Status': row.status
    }));
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Product Catalog');
    XLSX.writeFile(workbook, `product_catalog_${getFormattedDate()}.xlsx`);
    setShowExportMenu(false);
  };

  const handleExportCSV = () => {
    const headers = ['Product Code', 'Product Name', 'Company', 'Category', 'Pack Type', 'MRP', 'PTR', 'Available Stock', 'Scheme', 'Status'];
    const csvContent = [
      headers.join(','),
      ...filteredData.map(row => 
        [
          `"${row.productCode}"`, `"${row.productName}"`, `"${row.company}"`, `"${row.category}"`, `"${row.packType}"`,
          row.mrp, row.ptr, row.availableStock, `"${row.schemeAvailable}"`, `"${row.status}"`
        ].join(',')
      )
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `product_catalog_${getFormattedDate()}.csv`;
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowExportMenu(false);
  };

  const handleExportPDF = () => {
    const doc = new jsPDF('landscape');
    doc.setFontSize(16);
    doc.text('Product Catalog Export', 14, 15);
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 22);

    autoTable(doc, {
      startY: 30,
      head: [['Product Code', 'Name', 'Company', 'Category', 'Pack Type', 'MRP', 'PTR', 'Stock', 'Scheme', 'Status']],
      body: filteredData.map(row => [
        row.productCode,
        row.productName,
        row.company,
        row.category,
        row.packType,
        formatCurrency(row.mrp),
        formatCurrency(row.ptr),
        row.availableStock,
        row.schemeAvailable,
        row.status
      ]),
      theme: 'grid',
      headStyles: { fillColor: [139, 92, 246] }
    });
    doc.save(`product_catalog_${getFormattedDate()}.pdf`);
    setShowExportMenu(false);
  };

  const columns: Column<CatalogItem>[] = [
    { key: 'productCode', label: 'Product Code', render: (row) => <span className="font-semibold text-slate-900">{row.productCode}</span> },
    { key: 'productName', label: 'Product Name', render: (row) => <span className="font-semibold text-slate-900">{row.productName}</span> },
    { key: 'company', label: 'Company' },
    { key: 'category', label: 'Category' },
    { key: 'packType', label: 'Pack Type' },
    { key: 'mrp', label: 'MRP', render: (row) => <span className="text-slate-800">{formatCurrency(row.mrp)}</span> },
    { key: 'ptr', label: 'PTR', render: (row) => <span className="font-bold text-slate-800">{formatCurrency(row.ptr)}</span> },
    { key: 'availableStock', label: 'Available Stock', render: (row) => <span className="font-mono text-slate-700">{row.availableStock}</span> },
    { key: 'schemeAvailable', label: 'Scheme Available', render: (row) => <span className="text-emerald-600 font-medium">{row.schemeAvailable}</span> },
    {
      key: 'status',
      label: 'Status',
      render: (row) => {
        let variant: BadgeVariant = 'neutral';
        if (row.status === 'Available') variant = 'success';
        if (row.status === 'Low Stock') variant = 'warning';
        if (row.status === 'Out Of Stock') variant = 'danger';
        return <Badge variant={variant}>{row.status}</Badge>;
      },
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <button
          onClick={(e) => { e.stopPropagation(); setSelectedProduct(row); }}
          className="text-slate-400 hover:text-violet-600 transition-colors p-1"
          title="View Details"
        >
          <Eye className="w-4 h-4" />
        </button>
      )
    }
  ];

  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader
        title="Product Catalog Access"
        subtitle="Browse available products, pricing, schemes, stock availability, and product information."
        actions={
          <div className="relative inline-block text-left" ref={exportMenuRef}>
            <ActionButton 
              variant="secondary" 
              icon={<Download className="w-4 h-4" />}
              onClick={() => setShowExportMenu(!showExportMenu)}
            >
              Export Catalog
              <ChevronDown className="w-3 h-3 ml-1" />
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

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <SummaryCard
          title="Total Products"
          value={kpis.totalProducts.toString()}
          subtitle="In catalog"
          icon={<PackageSearch className="w-6 h-6" />}
          colorClass="text-violet-600"
          bgClass="bg-violet-50"
        />
        <SummaryCard
          title="Available Products"
          value={kpis.availableProducts.toString()}
          subtitle="Currently in stock"
          icon={<PackageCheck className="w-6 h-6" />}
          colorClass="text-emerald-600"
          bgClass="bg-emerald-50"
        />
        <SummaryCard
          title="Active Schemes"
          value={kpis.activeSchemes.toString()}
          subtitle="Products with offers"
          icon={<Tags className="w-6 h-6" />}
          colorClass="text-blue-600"
          bgClass="bg-blue-50"
        />
        <SummaryCard
          title="Low Stock Products"
          value={kpis.lowStockProducts.toString()}
          subtitle="Requires attention"
          icon={<AlertCircle className="w-6 h-6" />}
          colorClass="text-amber-600"
          bgClass="bg-amber-50"
        />
      </div>

      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search by name, code, or company..." />
        <div className="w-px h-6 bg-slate-200 mx-2 hidden sm:block" />
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-medium text-slate-600">Filters:</span>
        </div>
        <SelectFilter
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { label: 'Available', value: 'Available' },
            { label: 'Low Stock', value: 'Low Stock' },
            { label: 'Out Of Stock', value: 'Out Of Stock' },
          ]}
          placeholder="Availability Status"
        />
      </FilterBar>

      <TableCard>
        <div className="[&>div::-webkit-scrollbar]:hidden [&>div]:[-ms-overflow-style:none] [&>div]:[scrollbar-width:none]">
          <DataTable
            columns={columns}
            data={filteredData}
            emptyMessage="No products found in the catalog."
          />
        </div>
      </TableCard>

      <Drawer 
        open={!!selectedProduct} 
        onClose={() => setSelectedProduct(null)} 
        title="Product Details"
      >
        {selectedProduct && (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">Product Information</h3>
              <div className="space-y-2">
                <DrawerField label="Product Code" value={<span className="font-semibold text-slate-900">{selectedProduct.productCode}</span>} />
                <DrawerField label="Product Name" value={selectedProduct.productName} />
                <DrawerField label="Company" value={selectedProduct.company} />
                <DrawerField label="Category" value={selectedProduct.category} />
                <DrawerField label="Pack Type" value={selectedProduct.packType} />
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">Pricing Information</h3>
              <div className="space-y-2">
                <DrawerField label="MRP" value={formatCurrency(selectedProduct.mrp)} />
                <DrawerField label="PTR (Price To Retailer)" value={<span className="font-semibold">{formatCurrency(selectedProduct.ptr)}</span>} />
                <DrawerField label="PTS (Price To Stockist)" value={formatCurrency(selectedProduct.pts)} />
                <DrawerField label="Distributor Margin" value={<span className="text-emerald-600 font-semibold">{formatCurrency(selectedProduct.ptr - selectedProduct.pts)}</span>} />
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">Stock Information</h3>
              <div className="space-y-2">
                <DrawerField label="Available Stock" value={<span className="font-mono">{selectedProduct.availableStock}</span>} />
                <DrawerField label="Reserved Stock" value={<span className="font-mono">{selectedProduct.reservedStock}</span>} />
                <DrawerField label="Reorder Level" value={<span className="font-mono">{selectedProduct.reorderLevel}</span>} />
                <DrawerField label="Status" value={
                  <Badge variant={
                    selectedProduct.status === 'Available' ? 'success' : 
                    selectedProduct.status === 'Low Stock' ? 'warning' : 'danger'
                  }>
                    {selectedProduct.status}
                  </Badge>
                } />
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">Scheme Information</h3>
              <div className="space-y-2">
                <DrawerField label="Scheme Name" value={<span className={selectedProduct.schemeAvailable !== 'No Scheme' ? 'text-emerald-600 font-medium' : ''}>{selectedProduct.schemeAvailable}</span>} />
                <DrawerField label="Scheme Type" value={selectedProduct.schemeType} />
                <DrawerField label="Valid From" value={selectedProduct.schemeValidFrom} />
                <DrawerField label="Valid To" value={selectedProduct.schemeValidTo} />
                <DrawerField label="Description" value={selectedProduct.schemeDescription} />
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100 flex justify-end">
              <ActionButton variant="secondary" onClick={() => setSelectedProduct(null)}>Close</ActionButton>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}