import { useState, useRef, useEffect } from 'react';
import { Percent, TrendingUp, TrendingDown, IndianRupee, Eye, Download, ChevronDown, FileSpreadsheet, FileText } from 'lucide-react';
import * as XLSX from 'xlsx';
import {
  PageHeader,
  SearchInput,
  SelectFilter,
  TableCard,
  DataTable,
  Badge,
  SummaryCard,
  ActionButton
} from './components/shared';
import { type Column } from './components/shared';

interface ProductProfit {
  id: string;
  productCode: string;
  productName: string;
  category: string;
  division: string;
  branch: string;
  quantitySold: number;
  revenue: string;
  avgCogs: string;
  avgSellingPrice: string;
  grossMargin: string;
  profitAmount: string;
  trend: 'Up' | 'Down' | 'Stable';
}

const mockData: ProductProfit[] = [
  { id: '1', productCode: 'PRD-001', productName: 'Paracetamol 500mg (Strip)', category: 'Analgesics', division: 'Pharma', branch: 'Mumbai Central', quantitySold: 125000, revenue: '₹ 15,00,000', avgCogs: '₹ 8.50', avgSellingPrice: '₹ 12.00', grossMargin: '41.1%', profitAmount: '₹ 4,37,500', trend: 'Up' },
  { id: '2', productCode: 'PRD-002', productName: 'Amoxicillin 250mg', category: 'Antibiotics', division: 'Pharma', branch: 'Delhi North', quantitySold: 85000, revenue: '₹ 38,25,000', avgCogs: '₹ 22.00', avgSellingPrice: '₹ 45.00', grossMargin: '51.1%', profitAmount: '₹ 19,55,000', trend: 'Up' },
  { id: '3', productCode: 'PRD-003', productName: 'Cough Syrup 100ml', category: 'Syrups', division: 'OTC', branch: 'Pune East', quantitySold: 42000, revenue: '₹ 18,90,000', avgCogs: '₹ 35.00', avgSellingPrice: '₹ 45.00', grossMargin: '22.2%', profitAmount: '₹ 4,20,000', trend: 'Down' },
  { id: '4', productCode: 'PRD-004', productName: 'Vitamin C Tablets', category: 'Supplements', division: 'OTC', branch: 'Mumbai Central', quantitySold: 65000, revenue: '₹ 16,25,000', avgCogs: '₹ 15.00', avgSellingPrice: '₹ 25.00', grossMargin: '40.0%', profitAmount: '₹ 6,50,000', trend: 'Stable' },
  { id: '5', productCode: 'PRD-005', productName: 'Surgical Masks (Box)', category: 'Consumables', division: 'Surgical', branch: 'Chennai South', quantitySold: 150000, revenue: '₹ 30,00,000', avgCogs: '₹ 18.00', avgSellingPrice: '₹ 20.00', grossMargin: '10.0%', profitAmount: '₹ 3,00,000', trend: 'Down' },
];

export default function ProductProfitability() {
  const [search, setSearch] = useState('');
  
  // Filters
  const [category, setCategory] = useState('');
  const [division, setDivision] = useState('');
  const [branch, setBranch] = useState('');
  const [finYear, setFinYear] = useState('');
  const [period, setPeriod] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const [isExportOpen, setIsExportOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsExportOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const columns: Column<ProductProfit>[] = [
    { key: 'productCode', label: 'Product Code', render: (row) => <span className="font-mono text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">{row.productCode}</span> },
    { key: 'productName', label: 'Product Name', render: (row) => <span className="font-semibold text-slate-900">{row.productName}</span> },
    { key: 'category', label: 'Category' },
    { key: 'quantitySold', label: 'Quantity Sold', render: (row) => <span className="text-slate-700">{row.quantitySold.toLocaleString()}</span> },
    { key: 'revenue', label: 'Revenue', render: (row) => <span className="font-bold text-slate-700">{row.revenue}</span> },
    { key: 'avgCogs', label: 'Avg. COGS' },
    { key: 'avgSellingPrice', label: 'Avg. Selling Price' },
    { key: 'grossMargin', label: 'Gross Margin %', render: (row) => <span className="font-bold text-violet-600">{row.grossMargin}</span> },
    { key: 'profitAmount', label: 'Profit Amount', render: (row) => <span className="font-bold text-emerald-600">{row.profitAmount}</span> },
    {
      key: 'trend',
      label: 'Trend',
      render: (row) => {
        const variant = row.trend === 'Up' ? 'success' : row.trend === 'Down' ? 'danger' : 'warning';
        return <Badge variant={variant}>{row.trend}</Badge>;
      },
    },
    {
      key: 'action',
      label: 'Action',
      render: () => (
        <ActionButton variant="ghost">
          <Eye className="w-4 h-4 text-slate-500" />
          <span className="text-slate-600">View</span>
        </ActionButton>
      )
    }
  ];

  const filteredData = mockData.filter((item) => {
    let match = true;
    if (search) match = match && item.productName.toLowerCase().includes(search.toLowerCase());
    if (category) match = match && item.category === category;
    if (division) match = match && item.division === division;
    if (branch) match = match && item.branch === branch;
    return match;
  });

  const getExportData = () => {
    const timestamp = new Date().toLocaleString();
    const activeFilters = [
      search && `Search: ${search}`,
      category && `Category: ${category}`,
      division && `Division: ${division}`,
      branch && `Branch: ${branch}`,
      finYear && `Financial Year: ${finYear}`,
      period && `Period: ${period}`,
      fromDate && `From: ${fromDate}`,
      toDate && `To: ${toDate}`
    ].filter(Boolean).join(' | ') || 'None';

    const headerRows = [
      ['Product Profitability Report'],
      [`Generated On: ${timestamp}`],
      [`Active Filters: ${activeFilters}`],
      []
    ];

    const tableHeaders = ['Product Code', 'Product Name', 'Category', 'Quantity Sold', 'Revenue', 'Avg. COGS', 'Avg. Selling Price', 'Gross Margin %', 'Profit Amount', 'Trend'];
    const tableRows = filteredData.map(row => [
      row.productCode,
      row.productName,
      row.category,
      row.quantitySold.toString(),
      row.revenue,
      row.avgCogs,
      row.avgSellingPrice,
      row.grossMargin,
      row.profitAmount,
      row.trend
    ]);

    return { headerRows, tableHeaders, tableRows };
  };

  const handleExportCSV = () => {
    if (filteredData.length === 0) {
      alert("No data available for export.");
      return;
    }
    
    const { headerRows, tableHeaders, tableRows } = getExportData();
    const csvContent = [
      ...headerRows.map(row => `"${row.join('","')}"`),
      `"${tableHeaders.join('","')}"`,
      ...tableRows.map(row => `"${row.join('","')}"`)
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    link.href = URL.createObjectURL(blob);
    link.download = `Product_Profitability_Report_${dateStr}.csv`;
    link.click();
    setIsExportOpen(false);
  };

  const handleExportExcel = () => {
    if (filteredData.length === 0) {
      alert("No data available for export.");
      return;
    }

    const { headerRows, tableHeaders, tableRows } = getExportData();
    const wsData = [
      ...headerRows,
      tableHeaders,
      ...tableRows
    ];

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Profitability Report");
    
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    XLSX.writeFile(wb, `Product_Profitability_Report_${dateStr}.xlsx`);
    setIsExportOpen(false);
  };

  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader
        title="Product Profitability Reports"
        subtitle="Analyze margins, cost of goods sold, and product-wise revenue performance."
        breadcrumb={[{ label: 'Super Admin' }, { label: 'Product Profitability' }]}
        actions={
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsExportOpen(!isExportOpen)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-sm font-semibold transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
            >
              <Download className="w-4 h-4" />
              Export
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </button>
            
            {isExportOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 shadow-lg rounded-xl overflow-hidden z-50 animate-in slide-in-from-top-2 duration-200">
                <div className="p-1">
                  <button
                    onClick={handleExportCSV}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-violet-600 rounded-lg transition-colors text-left"
                  >
                    <FileText className="w-4 h-4" />
                    Export CSV
                  </button>
                  <button
                    onClick={handleExportExcel}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-violet-600 rounded-lg transition-colors text-left mt-1"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    Export Excel (.xlsx)
                  </button>
                </div>
              </div>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <SummaryCard title="Total Product Revenue" value="₹ 118.4 Cr" icon={<IndianRupee className="w-6 h-6" />} colorClass="text-blue-600" bgClass="bg-blue-100" />
        <SummaryCard title="Average Gross Margin %" value="38.5%" icon={<Percent className="w-6 h-6" />} colorClass="text-violet-600" bgClass="bg-violet-100" />
        <SummaryCard title="Highest Margin Product" value="Amoxicillin 250mg" subtitle="Margin: 51.1%" icon={<TrendingUp className="w-6 h-6" />} colorClass="text-emerald-600" bgClass="bg-emerald-100" />
        <SummaryCard title="Lowest Margin Product" value="Surgical Masks (Box)" subtitle="Margin: 10.0%" icon={<TrendingDown className="w-6 h-6" />} colorClass="text-rose-600" bgClass="bg-rose-100" />
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6 flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-4">
          <SearchInput value={search} onChange={setSearch} placeholder="Search product name..." />
          <SelectFilter
            value={category} onChange={setCategory}
            options={[
              { label: 'Analgesics', value: 'Analgesics' },
              { label: 'Antibiotics', value: 'Antibiotics' },
              { label: 'Syrups', value: 'Syrups' },
              { label: 'Supplements', value: 'Supplements' },
              { label: 'Consumables', value: 'Consumables' },
            ]}
            placeholder="Category"
          />
          <SelectFilter
            value={division} onChange={setDivision}
            options={[
              { label: 'Pharma', value: 'Pharma' },
              { label: 'OTC', value: 'OTC' },
              { label: 'Surgical', value: 'Surgical' },
            ]}
            placeholder="Division"
          />
          <SelectFilter
            value={branch} onChange={setBranch}
            options={[
              { label: 'Mumbai Central', value: 'Mumbai Central' },
              { label: 'Delhi North', value: 'Delhi North' },
              { label: 'Pune East', value: 'Pune East' },
              { label: 'Chennai South', value: 'Chennai South' },
            ]}
            placeholder="Branch"
          />
          <SelectFilter
            value={finYear} onChange={setFinYear}
            options={[
              { label: '2025-2026', value: '25-26' },
              { label: '2026-2027', value: '26-27' },
            ]}
            placeholder="Financial Year"
          />
          <SelectFilter
            value={period} onChange={setPeriod}
            options={[
              { label: 'Monthly', value: 'Monthly' },
              { label: 'Quarterly', value: 'Quarterly' },
              { label: 'Yearly', value: 'Yearly' },
            ]}
            placeholder="Period"
          />
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-600">From</span>
            <input 
              type="date" 
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-500/30 transition-all"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-600">To</span>
            <input 
              type="date" 
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-500/30 transition-all"
            />
          </div>
        </div>
      </div>

      <div className="mb-6">
        <TableCard>
          <div className="product-profitability-table-container">
            <DataTable columns={columns} data={filteredData} />
          </div>
        </TableCard>
      </div>
      <style>{`
        .product-profitability-table-container .overflow-x-auto {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        .product-profitability-table-container .overflow-x-auto::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}
