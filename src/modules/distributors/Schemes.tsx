import { useState, useRef, useEffect, useMemo } from 'react';
import { Download, Filter, Eye, ChevronDown } from 'lucide-react';
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

import { schemeService } from "../../services/schemeService";

interface Scheme {
  id: string;
  schemeCode: string;
  schemeName: string;
  schemeType: string;
  applicableTo: string;
  validFrom: string;
  validTo: string;
  status: 'Draft' | 'Active' | 'Upcoming' | 'Expired' | 'Inactive' | 'Cancelled';
  benefit: string;
  product?: string;
  category?: string;
  brand?: string;
  remarks?: string;
}

const getDDMMYYYY = (dateStr: string) => {
  if (!dateStr || dateStr === '-') return '-';
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

const calculateSchemeStatus = (validFrom: string, validTo: string): 'Active' | 'Upcoming' | 'Expired' => {
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const parseDate = (dStr: string) => {
    if (!dStr) return new Date(NaN);
    if (dStr.includes('-')) {
      const parts = dStr.split('-');
      if (parts.length === 3) {
        if (parts[2].length === 4) {
          return new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
        } else if (parts[0].length === 4) {
          return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        }
      }
    }
    return new Date(dStr);
  };

  const from = parseDate(validFrom);
  const to = parseDate(validTo);

  if (!isNaN(to.getTime()) && now > to) return 'Expired';
  if (!isNaN(from.getTime()) && now < from) return 'Upcoming';
  return 'Active';
};

export default function Schemes() {
  const [schemesList, setSchemesList] = useState<Scheme[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [schemeTypeFilter, setSchemeTypeFilter] = useState('');
  const [viewScheme, setViewScheme] = useState<Scheme | null>(null);
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const loggedInDistributor = useMemo(() => {
    const raw = localStorage.getItem('pharma_erp_distributors');
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (parsed.length > 0) {
          const dist = parsed[0];
          return {
            name: dist.name || dist.distributorName || 'Unknown',
            code: dist.code || dist.distributorCode || dist.id || 'DIST-001',
            tier: dist.tier || 'Gold Tier',
            category: dist.category || 'Retailer',
            region: dist.region || 'West'
          };
        }
      } catch (e) {}
    }
    return { name: 'Metro Pharma Distributors', code: 'DIST-001', tier: 'Gold Tier', category: 'Retailer', region: 'West' };
  }, []);

  useEffect(() => {
    const savedData = schemeService.getAll();
    if (savedData && savedData.length > 0) {
      const normalizedData = savedData.map((item: any) => ({
        id: item.id || Date.now().toString(),
        schemeCode: item.schemeCode || '',
        schemeName: item.name || item.schemeName || '',
        schemeType: item.type || item.schemeType || 'Quantity Scheme',
        applicableTo: item.applicableTo || 'All Distributors',
        validFrom: getDDMMYYYY(item.validFrom || ''),
        validTo: getDDMMYYYY(item.validTo || ''),
        status: calculateSchemeStatus(item.validFrom || '', item.validTo || ''),
        benefit: item.benefit || `${item.benefitType || ''} ${item.benefitValue || ''}`.trim() || `Buy ${item.minQuantity || 10} Get ${item.freeQuantity || 1} Free`,
        product: item.applicableSelection || item.product || '',
        category: item.category || '',
        brand: item.brand || '',
        remarks: item.remarks || ''
      }));
      setSchemesList(normalizedData);
    } else {
      setSchemesList([]);
    }
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

  const isApplicable = (applicableTo: string) => {
    if (!applicableTo) return true;
    const lower = applicableTo.toLowerCase().trim();
    
    // Scheme Management currently stores product applicability in applicableTo
    if (['all products', 'product', 'category', 'brand'].includes(lower)) return true;
    
    if (lower === 'all distributors' || lower === 'all') return true;
    if (lower.includes(loggedInDistributor.name.toLowerCase())) return true;
    if (lower.includes(loggedInDistributor.code.toLowerCase())) return true;
    if (lower.includes(loggedInDistributor.tier.toLowerCase())) return true;
    if (lower.includes(loggedInDistributor.category.toLowerCase())) return true;
    if (lower.includes(loggedInDistributor.region.toLowerCase())) return true;
    return false;
  };

  const visibleSchemes = schemesList.filter(item => 
    ['Active', 'Upcoming', 'Expired'].includes(item.status) && isApplicable(item.applicableTo)
  );

  const filteredData = visibleSchemes.filter((item) => {
    const searchLower = search.toLowerCase();
    const matchSearch = item.schemeCode.toLowerCase().includes(searchLower) || item.schemeName.toLowerCase().includes(searchLower);
    const matchStatus = statusFilter ? item.status === statusFilter : true;
    const matchType = schemeTypeFilter ? item.schemeType === schemeTypeFilter : true;
    return matchSearch && matchStatus && matchType;
  });

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'Active': return 'success';
      case 'Upcoming': return 'info';
      case 'Draft': return 'secondary';
      case 'Expired': return 'warning';
      case 'Inactive': 
      case 'Cancelled': return 'danger';
      default: return 'neutral';
    }
  };

  const getExportData = () => {
    return filteredData.map(item => ({
      'Scheme Code': item.schemeCode,
      'Scheme Name': item.schemeName,
      'Scheme Type': item.schemeType,
      'Applicable Product/Category': item.product || item.category || 'All Products',
      'Benefit': item.benefit,
      'Valid From': item.validFrom,
      'Valid To': item.validTo,
      'Status': item.status
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
    XLSX.utils.book_append_sheet(wb, ws, "Schemes");
    XLSX.writeFile(wb, "Schemes_Export.xlsx");
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
    link.setAttribute("download", "Schemes_Export.csv");
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
    const doc = new jsPDF();
    const headers = Object.keys(data[0] || {});
    const body = data.map(obj => headers.map(header => (obj as any)[header]));
    
    doc.text("Scheme Visibility Export", 14, 15);
    autoTable(doc, {
      startY: 20,
      head: [headers],
      body: body,
      theme: 'striped',
      headStyles: { fillColor: [124, 58, 237] },
      styles: { fontSize: 8 }
    });
    doc.save("Schemes_Export.pdf");
    setShowExportDropdown(false);
  };

  const columns: Column<Scheme>[] = [
    { key: 'schemeCode', label: 'Scheme Code', render: (row) => <span className="font-semibold text-violet-700">{row.schemeCode}</span> },
    { key: 'schemeName', label: 'Scheme Name', render: (row) => <span className="font-medium text-slate-800">{row.schemeName}</span> },
    { key: 'schemeType', label: 'Scheme Type', render: (row) => <span className="text-slate-600">{row.schemeType}</span> },
    { key: 'product', label: 'Applicable Product/Category', render: (row) => <span className="text-slate-600">{row.product || row.category || 'All Products'}</span> },
    { key: 'benefit', label: 'Benefit', render: (row) => <span className="text-slate-700 font-medium">{row.benefit}</span> },
    { key: 'validFrom', label: 'Valid From', render: (row) => <span className="text-slate-600">{row.validFrom}</span> },
    { key: 'validTo', label: 'Valid To', render: (row) => <span className="text-slate-600">{row.validTo}</span> },
    {
      key: 'status',
      label: 'Status',
      render: (row) => <Badge variant={getStatusVariant(row.status) as any}>{row.status}</Badge>,
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
          <button onClick={() => setViewScheme(row)} className="text-slate-400 hover:text-violet-600 transition-colors p-1" title="View">
            <Eye className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader
        title="Scheme Visibility"
        subtitle="View active and upcoming schemes applicable to your account."
        actions={
          <div className="flex items-center gap-2">
            <div className="relative" ref={dropdownRef}>
              <ActionButton 
                variant="secondary" 
                icon={<Download className="w-4 h-4" />} 
                onClick={() => setShowExportDropdown(!showExportDropdown)}
              >
                Export List <ChevronDown className="w-3 h-3 opacity-50 ml-1" />
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
          </div>
        }
      />

      <FilterBar>
        <SearchInput 
          value={search} 
          onChange={setSearch} 
          placeholder="Search scheme or code..." 
        />
        <div className="w-px h-6 bg-slate-200 mx-2 hidden sm:block" />
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-medium text-slate-600">Filters:</span>
        </div>
        <SelectFilter
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { label: 'All Status', value: '' },
            { label: 'Active', value: 'Active' },
            { label: 'Upcoming', value: 'Upcoming' },
            { label: 'Expired', value: 'Expired' },
          ]}
          placeholder="All Status"
        />
        <SelectFilter
          value={schemeTypeFilter}
          onChange={setSchemeTypeFilter}
          options={[
            { label: 'All Types', value: '' },
            { label: 'Quantity Scheme', value: 'Quantity Scheme' },
            { label: 'Cash Discount (CD)', value: 'Cash Discount (CD)' },
            { label: 'Target Scheme', value: 'Target Scheme' },
            { label: 'Bonus Scheme', value: 'Bonus Scheme' },
          ]}
          placeholder="All Types"
        />
      </FilterBar>

      <TableCard>
        <div className="[&>div::-webkit-scrollbar]:hidden [&>div]:[-ms-overflow-style:none] [&>div]:[scrollbar-width:none]">
          <DataTable
            columns={columns}
            data={filteredData}
            onRowClick={setViewScheme}
            emptyMessage="No Active Schemes Available"
          />
        </div>
      </TableCard>

      <Drawer
        open={viewScheme !== null}
        onClose={() => setViewScheme(null)}
        title="Scheme Details"
      >
        {viewScheme && (
          <div className="space-y-6 pb-20">
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">Scheme Information</h3>
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <DrawerField label="Scheme Code" value={<span className="font-semibold">{viewScheme.schemeCode}</span>} />
                <DrawerField label="Scheme Name" value={<span className="font-semibold text-slate-900">{viewScheme.schemeName}</span>} />
                <DrawerField label="Scheme Type" value={viewScheme.schemeType} />
              </div>
            </div>

            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">Applicability</h3>
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <DrawerField label="Product" value={viewScheme.product || 'All Applicable'} />
                <DrawerField label="Category" value={viewScheme.category || '-'} />
                <DrawerField label="Brand" value={viewScheme.brand || '-'} />
                <DrawerField label="Applicable To" value={<span className="font-medium text-slate-800">{viewScheme.applicableTo}</span>} />
              </div>
            </div>

            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">Benefit Details</h3>
              <div className="bg-violet-50 rounded-xl p-4 border border-violet-100 text-center py-6">
                <div className="text-sm text-violet-600 font-medium mb-1">Benefit</div>
                <div className="text-xl text-violet-900 font-bold">{viewScheme.benefit}</div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">Validity</h3>
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <DrawerField label="Valid From" value={viewScheme.validFrom} />
                <DrawerField label="Valid To" value={viewScheme.validTo} />
                <DrawerField label="Status" value={<Badge variant={getStatusVariant(viewScheme.status) as any}>{viewScheme.status}</Badge>} />
              </div>
            </div>

            {viewScheme.remarks && (
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">Remarks</h3>
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                  <p className="text-sm text-slate-700">{viewScheme.remarks}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </Drawer>
    </div>
  );
}