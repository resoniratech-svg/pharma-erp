import { useState } from 'react';
import { Download, Filter, Gift, Clock, PackageCheck, IndianRupee, PieChart, TrendingUp, BarChart3, AlertCircle } from 'lucide-react';
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
} from './components/shared';
import { type Column } from './components/shared';

interface SchemeItem {
  id: string;
  schemeCode: string;
  schemeName: string;
  company: string;
  productCategory: string;
  schemeType: string;
  discountPct: string;
  freeQuantity: string;
  startDate: string;
  endDate: string;
  status: 'Active' | 'Upcoming' | 'Expiring Soon' | 'Expired';
}

const mockSchemes: SchemeItem[] = [
  { id: '1', schemeCode: 'SCH-Diwali-01', schemeName: 'Diwali Bonanza', company: 'PharmaCorp', productCategory: 'Antibiotics', schemeType: 'Buy X Get Y', discountPct: '-', freeQuantity: '10+1', startDate: '01-Nov-2024', endDate: '30-Nov-2024', status: 'Active' },
  { id: '2', schemeCode: 'SCH-Q4-002', schemeName: 'Q4 Volume Discount', company: 'HealthPlus', productCategory: 'Analgesics', schemeType: 'Percentage Discount', discountPct: '15%', freeQuantity: '-', startDate: '15-Oct-2024', endDate: '31-Dec-2024', status: 'Active' },
  { id: '3', schemeCode: 'SCH-WIN-003', schemeName: 'Winter Special', company: 'MediCare', productCategory: 'Respiratory', schemeType: 'Quantity Bonus', discountPct: '5%', freeQuantity: '50+5', startDate: '01-Nov-2024', endDate: '10-Nov-2024', status: 'Expiring Soon' },
  { id: '4', schemeCode: 'SCH-NY-004', schemeName: 'New Year Early Bird', company: 'VitaLife', productCategory: 'Vitamins', schemeType: 'Festival Offer', discountPct: '12%', freeQuantity: '20+2', startDate: '01-Jan-2025', endDate: '31-Jan-2025', status: 'Upcoming' },
  { id: '5', schemeCode: 'SCH-SUM-005', schemeName: 'Summer Clearance', company: 'PharmaCorp', productCategory: 'Dermatology', schemeType: 'Cash Discount', discountPct: '20%', freeQuantity: '-', startDate: '01-May-2024', endDate: '31-Jul-2024', status: 'Expired' },
];

export default function SchemeVisibility() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedScheme, setSelectedScheme] = useState<SchemeItem | null>(mockSchemes[0]);

  const columns: Column<SchemeItem>[] = [
    { key: 'schemeCode', label: 'Scheme Code', render: (row) => <span className="font-semibold text-slate-900 cursor-pointer hover:text-primary" onClick={() => setSelectedScheme(row)}>{row.schemeCode}</span> },
    { key: 'schemeName', label: 'Scheme Name' },
    { key: 'company', label: 'Company' },
    { key: 'productCategory', label: 'Product Category' },
    { key: 'schemeType', label: 'Scheme Type', render: (row) => <span className="text-slate-600">{row.schemeType}</span> },
    { key: 'discountPct', label: 'Discount %', render: (row) => <span className="font-bold text-emerald-600">{row.discountPct}</span> },
    { key: 'freeQuantity', label: 'Free Qty', render: (row) => <span className="font-mono text-indigo-600">{row.freeQuantity}</span> },
    { key: 'startDate', label: 'Start Date' },
    { key: 'endDate', label: 'End Date' },
    {
      key: 'status',
      label: 'Status',
      render: (row) => {
        let variant: any = 'default';
        switch (row.status) {
          case 'Active':
            variant = 'success';
            break;
          case 'Upcoming':
            variant = 'info';
            break;
          case 'Expiring Soon':
            variant = 'warning';
            break;
          case 'Expired':
            variant = 'danger';
            break;
        }
        return <Badge variant={variant}>{row.status}</Badge>;
      },
    },
  ];

  const filteredSchemes = mockSchemes.filter((item) => {
    const matchSearch = item.schemeName.toLowerCase().includes(search.toLowerCase()) || 
                        item.schemeCode.toLowerCase().includes(search.toLowerCase()) ||
                        item.company.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter ? item.status === statusFilter : true;
    return matchSearch && matchStatus;
  });

  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader
        title="Scheme Visibility"
        subtitle="View all active schemes, promotional offers, free quantity benefits, and discount programs available for ordering."
        actions={
          <ActionButton variant="secondary" icon={<Download className="w-4 h-4" />}>Export Schemes</ActionButton>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <SummaryCard
          title="Active Schemes"
          value="42"
          subtitle="Currently running"
          icon={<Gift className="w-6 h-6" />}
          colorClass="text-emerald-600"
          bgClass="bg-emerald-50"
        />
        <SummaryCard
          title="Expiring Soon"
          value="8"
          subtitle="Ends in next 7 days"
          icon={<Clock className="w-6 h-6" />}
          colorClass="text-amber-600"
          bgClass="bg-amber-50"
        />
        <SummaryCard
          title="Total Eligible Products"
          value="1,245"
          subtitle="Across all companies"
          icon={<PackageCheck className="w-6 h-6" />}
          colorClass="text-blue-600"
          bgClass="bg-blue-50"
        />
        <SummaryCard
          title="Total Savings Available"
          value="₹ 2.4 L"
          subtitle="Potential discount value"
          icon={<IndianRupee className="w-6 h-6" />}
          colorClass="text-indigo-600"
          bgClass="bg-indigo-50"
        />
      </div>

      {/* Analytics Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center justify-center min-h-[160px]">
          <PieChart className="w-8 h-8 text-primary mb-3 opacity-80" />
          <h3 className="text-sm font-semibold text-slate-800 mb-1">Active Schemes by Company</h3>
          <p className="text-xs text-slate-500 text-center">Visual breakdown of schemes from top 5 companies</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center justify-center min-h-[160px]">
          <TrendingUp className="w-8 h-8 text-emerald-500 mb-3 opacity-80" />
          <h3 className="text-sm font-semibold text-slate-800 mb-1">Savings by Scheme Type</h3>
          <p className="text-xs text-slate-500 text-center">Cash Discount vs Free Quantity vs Percentage</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center justify-center min-h-[160px]">
          <BarChart3 className="w-8 h-8 text-indigo-500 mb-3 opacity-80" />
          <h3 className="text-sm font-semibold text-slate-800 mb-1">Monthly Scheme Utilization</h3>
          <p className="text-xs text-slate-500 text-center">Trend of availed scheme benefits over 6 months</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8 mb-8">
        {/* Main Scheme Table */}
        <div className="xl:col-span-3 flex flex-col gap-4">
          <FilterBar>
            <SearchInput value={search} onChange={setSearch} placeholder="Search by scheme name, code or company..." />
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
                { label: 'Expiring Soon', value: 'Expiring Soon' },
                { label: 'Expired', value: 'Expired' },
              ]}
              placeholder="Status"
            />
          </FilterBar>

          <TableCard>
            <DataTable
              columns={columns}
              data={filteredSchemes}
              emptyMessage="No schemes found."
            />
          </TableCard>
        </div>

        {/* Active Scheme Details Panel */}
        <div className="xl:col-span-1">
          {selectedScheme ? (
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm sticky top-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">{selectedScheme.schemeCode}</h3>
                  <p className="text-sm text-slate-500">{selectedScheme.schemeName}</p>
                </div>
                <Badge variant={selectedScheme.status === 'Active' ? 'success' : selectedScheme.status === 'Expiring Soon' ? 'warning' : selectedScheme.status === 'Upcoming' ? 'info' : 'danger'}>
                  {selectedScheme.status}
                </Badge>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Scheme Description</p>
                  <p className="text-sm text-slate-800">Special promotional pricing and bonus units for {selectedScheme.company} products during the validity period.</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Eligible Products</p>
                    <p className="text-sm font-semibold text-slate-800">{selectedScheme.productCategory} Line</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Min. Order Qty</p>
                    <p className="text-sm font-semibold text-slate-800">10 Units</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Free Quantity</p>
                    <p className="text-sm font-mono font-bold text-indigo-600">{selectedScheme.freeQuantity}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Discount %</p>
                    <p className="text-sm font-mono font-bold text-emerald-600">{selectedScheme.discountPct}</p>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Validity Period</p>
                  <div className="flex items-center gap-2 text-sm text-slate-800">
                    <Clock className="w-4 h-4 text-slate-400" />
                    <span>{selectedScheme.startDate}</span>
                    <span className="text-slate-400">to</span>
                    <span>{selectedScheme.endDate}</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <div className="bg-emerald-50 text-emerald-800 p-3 rounded-lg flex items-center justify-between">
                    <span className="text-sm font-medium">Estimated Savings</span>
                    <span className="text-lg font-bold">~ 15%</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 border-dashed flex flex-col items-center justify-center text-center h-full min-h-[300px]">
              <AlertCircle className="w-8 h-8 text-slate-400 mb-2" />
              <p className="text-sm font-medium text-slate-600">Select a scheme from the table to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
