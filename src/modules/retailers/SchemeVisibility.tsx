import { useState, useRef, useEffect } from 'react';
import { Download, Filter, Eye, ChevronDown } from 'lucide-react';
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

interface SchemeItem {
  id: string;
  schemeCode: string;
  schemeName: string;
  schemeType: string;
  applicableTo: 'Product' | 'Category' | 'Brand' | 'All Products';
  product?: string;
  category?: string;
  brand?: string;
  discountPct?: string;
  freeQuantity?: string;
  ptrDiscount?: string;
  bonusProduct?: string;
  minOrderQty: string;
  validFrom: string;
  validTo: string;
  status: 'Active' | 'Upcoming' | 'Expired';
  terms: string;
}

const mockSchemes: SchemeItem[] = [
  { 
    id: '1', schemeCode: 'SCH-VOL-01', schemeName: 'Q3 Volume Discount', schemeType: 'Percentage Discount', 
    applicableTo: 'Category', category: 'Antibiotics', 
    discountPct: '12%', minOrderQty: '50 Boxes',
    validFrom: '01 Oct 2026', validTo: '31 Dec 2026', status: 'Active',
    terms: 'Discount applied automatically at invoice generation. Minimum quantity must be met in a single order.' 
  },
  { 
    id: '2', schemeCode: 'SCH-QTY-02', schemeName: 'Paracetamol Bulk Bonus', schemeType: 'Quantity Discount', 
    applicableTo: 'Product', product: 'Paracetamol 650mg', 
    freeQuantity: '10+1', minOrderQty: '100 Strips',
    validFrom: '15 Sep 2026', validTo: '15 Oct 2026', status: 'Expired',
    terms: 'Free goods will be dispatched with the primary order. No returns on free goods.' 
  },
  { 
    id: '3', schemeCode: 'SCH-TRD-03', schemeName: 'Year End Trade Deal', schemeType: 'Trade Discount', 
    applicableTo: 'All Products', 
    bonusProduct: 'Free Hand Sanitizer 500ml', minOrderQty: '₹ 1,00,000',
    validFrom: '01 Dec 2026', validTo: '31 Dec 2026', status: 'Upcoming',
    terms: 'Cumulative invoice value must exceed ₹1,00,000 within the scheme period to qualify.' 
  },
  { 
    id: '4', schemeCode: 'SCH-PTR-04', schemeName: 'Special PTR Margin', schemeType: 'PTR Discount', 
    applicableTo: 'Brand', brand: 'Cipla', 
    ptrDiscount: '15% PTR Discount', minOrderQty: '20 Boxes',
    validFrom: '01 Oct 2026', validTo: '15 Nov 2026', status: 'Active',
    terms: 'PTR discount applied directly to the base rate. Cannot be combined with volume discounts.' 
  },
];

export default function SchemeVisibility() {
  const activeRole = localStorage.getItem('activeRole') || ROLE_RETAILER;
  
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  const [viewScheme, setViewScheme] = useState<SchemeItem | null>(null);
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

  const filteredSchemes = mockSchemes.filter((item) => {
    const searchStr = search.toLowerCase();
    const matchSearch = item.schemeCode.toLowerCase().includes(searchStr) || item.schemeName.toLowerCase().includes(searchStr);
    const matchStatus = statusFilter ? item.status === statusFilter : true;
    return matchSearch && matchStatus;
  });

  const getStatusVariant = (status: string): BadgeVariant => {
    if (status === 'Active') return 'success';
    if (status === 'Upcoming') return 'info';
    return 'neutral';
  };

  const getAggregatedBenefit = (row: SchemeItem) => {
    if (row.freeQuantity) return `${row.freeQuantity} Free`;
    if (row.discountPct) return `${row.discountPct} Discount`;
    if (row.ptrDiscount) return row.ptrDiscount;
    if (row.bonusProduct) return row.bonusProduct;
    return 'N/A';
  };

  const getAggregatedApplicability = (row: SchemeItem) => {
    if (row.applicableTo === 'All Products') return 'All Products';
    if (row.applicableTo === 'Category') return row.category;
    if (row.applicableTo === 'Brand') return row.brand;
    if (row.applicableTo === 'Product') return row.product;
    return row.applicableTo;
  };

  const adminColumns: Column<SchemeItem>[] = [
    { key: 'schemeCode', label: 'Scheme Code', render: (row) => <span className="font-semibold text-violet-700">{row.schemeCode}</span> },
    { key: 'schemeName', label: 'Scheme Name', render: (row) => <span className="font-semibold text-slate-900">{row.schemeName}</span> },
    { key: 'schemeType', label: 'Scheme Type', render: (row) => <span className="text-slate-600">{row.schemeType}</span> },
    { key: 'applicableTo', label: 'Applicable To', render: (row) => <span className="text-slate-600">{row.applicableTo}</span> },
    { key: 'validFrom', label: 'Valid From', render: (row) => <span className="text-slate-600">{row.validFrom}</span> },
    { key: 'validTo', label: 'Valid To', render: (row) => <span className="text-slate-600">{row.validTo}</span> },
    { key: 'status', label: 'Status', render: (row) => <Badge variant={getStatusVariant(row.status)}>{row.status}</Badge> },
    {
      key: 'actions',
      label: 'Action',
      render: (row) => (
        <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
          <button onClick={() => setViewScheme(row)} className="text-slate-400 hover:text-violet-600 transition-colors p-1" title="View Details">
            <Eye className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  const retailerColumns: Column<SchemeItem>[] = [
    { key: 'schemeCode', label: 'Scheme Code', render: (row) => <span className="font-semibold text-violet-700">{row.schemeCode}</span> },
    { key: 'schemeName', label: 'Scheme Name', render: (row) => <span className="font-semibold text-slate-900">{row.schemeName}</span> },
    { key: 'schemeType', label: 'Scheme Type', render: (row) => <span className="text-slate-600">{row.schemeType}</span> },
    { key: 'benefit', label: 'Benefit', render: (row) => <span className="font-medium text-emerald-700">{getAggregatedBenefit(row)}</span> },
    { key: 'applicableItems', label: 'Applicable Products / Category', render: (row) => <span className="text-slate-600">{getAggregatedApplicability(row)}</span> },
    { key: 'validTill', label: 'Valid Till', render: (row) => <span className="text-slate-600">{row.validTo}</span> },
    { key: 'status', label: 'Status', render: (row) => <Badge variant={getStatusVariant(row.status)}>{row.status}</Badge> },
    {
      key: 'actions',
      label: 'Action',
      render: (row) => (
        <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
          <button onClick={() => setViewScheme(row)} className="text-slate-400 hover:text-violet-600 transition-colors p-1" title="View Details">
            <Eye className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  const columns = activeRole === ROLE_SUPER_ADMIN ? adminColumns : retailerColumns;

  const getExportData = () => {
    if (activeRole === ROLE_SUPER_ADMIN) {
      return filteredSchemes.map(item => ({
        'Scheme Code': item.schemeCode,
        'Scheme Name': item.schemeName,
        'Scheme Type': item.schemeType,
        'Applicable To': item.applicableTo,
        'Valid From': item.validFrom,
        'Valid To': item.validTo,
        'Status': item.status
      }));
    } else {
      return filteredSchemes.map(item => ({
        'Scheme Code': item.schemeCode,
        'Scheme Name': item.schemeName,
        'Scheme Type': item.schemeType,
        'Benefit': getAggregatedBenefit(item),
        'Applicable Products / Category': getAggregatedApplicability(item),
        'Valid Till': item.validTo,
        'Status': item.status
      }));
    }
  };

  const handleExportExcel = () => {
    const data = getExportData();
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Schemes");
    XLSX.writeFile(wb, "Scheme_Visibility.xlsx");
    setShowExportMenu(false);
  };

  const handleExportCSV = () => {
    const data = getExportData();
    const ws = XLSX.utils.json_to_sheet(data);
    const csv = XLSX.utils.sheet_to_csv(ws);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "Scheme_Visibility.csv";
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
    
    doc.text("Scheme Visibility", 14, 15);
    autoTable(doc, {
      startY: 20,
      head: [headers],
      body: body,
      theme: 'striped',
      headStyles: { fillColor: [124, 58, 237] },
      styles: { fontSize: 9 }
    });
    doc.save("Scheme_Visibility.pdf");
    setShowExportMenu(false);
  };

  const handlePrint = () => {
    window.print();
    setShowExportMenu(false);
  };

  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader
        title="Scheme Visibility"
        subtitle="View trade schemes, volume discounts, and operational commercial deals."
        actions={
          <div className="relative inline-block text-left" ref={exportMenuRef}>
            <ActionButton 
              variant="secondary" 
              icon={<Download className="w-4 h-4" />}
              onClick={() => setShowExportMenu(!showExportMenu)}
            >
              Export Schemes <ChevronDown className="w-3 h-3 ml-1" />
            </ActionButton>
            {showExportMenu && (
              <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
                <div className="py-1" role="menu" aria-orientation="vertical">
                  <button onClick={handleExportCSV} className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">Export CSV</button>
                  <button onClick={handleExportExcel} className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">Export Excel</button>
                  <button onClick={handleExportPDF} className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">Export PDF</button>
                  <button onClick={handlePrint} className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 border-t border-slate-100">Print</button>
                </div>
              </div>
            )}
          </div>
        }
      />

      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search scheme code or scheme name..." />
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
            { label: 'Upcoming', value: 'Upcoming' },
            { label: 'Expired', value: 'Expired' },
          ]}
          placeholder="Status"
        />
      </FilterBar>

      <TableCard>
        <div className="[&>div::-webkit-scrollbar]:hidden [&>div]:[-ms-overflow-style:none] [&>div]:[scrollbar-width:none]">
          <DataTable
            columns={columns}
            data={filteredSchemes}
            emptyMessage="No schemes found matching your criteria."
          />
        </div>
      </TableCard>

      <Drawer
        open={!!viewScheme}
        onClose={() => setViewScheme(null)}
        title="Scheme Details"
      >
        {viewScheme && (
          <div className="space-y-6 pb-20">
            {/* Section 1: Scheme Information */}
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">Scheme Information</h3>
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <DrawerField label="Scheme Code" value={<span className="font-semibold text-violet-700">{viewScheme.schemeCode}</span>} />
                <DrawerField label="Scheme Name" value={<span className="font-semibold text-slate-900">{viewScheme.schemeName}</span>} />
                <DrawerField label="Scheme Type" value={viewScheme.schemeType} />
              </div>
            </div>

            {/* Section 2: Eligibility */}
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">Eligibility</h3>
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                {viewScheme.category && <DrawerField label="Product Category" value={viewScheme.category} />}
                {viewScheme.product && <DrawerField label="Product" value={viewScheme.product} />}
                {viewScheme.brand && <DrawerField label="Brand" value={viewScheme.brand} />}
                <DrawerField label="Minimum Order Quantity" value={<span className="font-medium text-slate-800">{viewScheme.minOrderQty}</span>} />
              </div>
            </div>

            {/* Section 3: Benefits */}
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">Benefits</h3>
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                {viewScheme.discountPct && <DrawerField label="Discount Percentage" value={<span className="font-bold text-emerald-600">{viewScheme.discountPct}</span>} />}
                {viewScheme.freeQuantity && <DrawerField label="Free Quantity" value={<span className="font-bold text-indigo-600">{viewScheme.freeQuantity}</span>} />}
                {viewScheme.ptrDiscount && <DrawerField label="PTR Discount" value={<span className="font-bold text-emerald-600">{viewScheme.ptrDiscount}</span>} />}
                {viewScheme.bonusProduct && <DrawerField label="Bonus Product" value={<span className="font-bold text-indigo-600">{viewScheme.bonusProduct}</span>} />}
              </div>
            </div>

            {/* Section 4: Validity */}
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">Validity</h3>
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <DrawerField label="Valid From" value={viewScheme.validFrom} />
                <DrawerField label="Valid To" value={<span className="font-medium text-slate-800">{viewScheme.validTo}</span>} />
              </div>
            </div>

            {/* Section 5: Terms & Conditions */}
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">Terms & Conditions</h3>
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <p className="text-sm text-slate-600 leading-relaxed italic">{viewScheme.terms}</p>
              </div>
            </div>
            
          </div>
        )}
      </Drawer>
    </div>
  );
}
