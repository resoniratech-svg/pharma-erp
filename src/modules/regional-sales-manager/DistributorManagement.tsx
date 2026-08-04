import React, { useState } from 'react';
import { PageHeader, FilterBar, SearchInput, TableCard, DataTable, Badge, ActionButton, SummaryCard } from './components/shared';
import { Drawer } from '../../components/ui/Drawer';
import { Eye, Users, CheckCircle, AlertTriangle, IndianRupee, Clock, MapPin, Building2, Phone, Mail, ShoppingCart, CreditCard, Activity, Download, ChevronDown, Table as TableIcon, FileText } from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function DistributorManagement() {
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({
    status: 'All',
    dateRange: 'This Month'
  });

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [viewingDistributor, setViewingDistributor] = useState<any | null>(null);
  const [isExportOpen, setIsExportOpen] = useState(false);

  const distributors = [
    { 
      id: 'DIST001', 
      name: 'Apollo Pharma', 
      state: 'Maharashtra', 
      asm: 'Vikas Sharma', 
      outstanding: 450000, 
      lastOrder: '2025-06-12', 
      status: 'Active',
      contactPerson: 'Rahul Desai',
      phone: '9876543210',
      email: 'rahul@apollopharma.com',
      address: 'Andheri West, Mumbai, Maharashtra 400053',
      ytdSales: 2400000,
      creditLimit: 500000,
      recentOrders: [
         { orderId: 'ORD-1234', date: '2025-06-12', amount: 125000, status: 'Delivered' },
         { orderId: 'ORD-1230', date: '2025-06-01', amount: 95000, status: 'Delivered' }
      ],
      payments: [
         { date: '2025-06-10', amount: 100000, mode: 'NEFT', ref: 'N123456789' }
      ],
      visits: [
         { date: '2025-06-05', by: 'Vikas Sharma (ASM)', purpose: 'Business Review', outcome: 'Positive - New line added' }
      ]
    },
    { 
      id: 'DIST002', 
      name: 'Gujarat Medicals', 
      state: 'Gujarat', 
      asm: 'Amit Desai', 
      outstanding: 850000, 
      lastOrder: '2025-05-28', 
      status: 'At Risk',
      contactPerson: 'Sanjay Patel',
      phone: '9876543211',
      email: 'sanjay@gujmed.com',
      address: 'Navrangpura, Ahmedabad, Gujarat 380009',
      ytdSales: 1800000,
      creditLimit: 800000,
      recentOrders: [
         { orderId: 'ORD-1201', date: '2025-05-28', amount: 150000, status: 'Delivered' }
      ],
      payments: [
         { date: '2025-05-15', amount: 50000, mode: 'Cheque', ref: 'CHQ-98765' }
      ],
      visits: [
         { date: '2025-06-02', by: 'Amit Desai (ASM)', purpose: 'Payment Collection', outcome: 'Follow up needed' }
      ]
    },
    { 
      id: 'DIST003', 
      name: 'Pune Distributors', 
      state: 'Maharashtra', 
      asm: 'Vikas Sharma', 
      outstanding: 120000, 
      lastOrder: '2025-06-15', 
      status: 'Active',
      contactPerson: 'Kedar Joshi',
      phone: '9876543212',
      email: 'kedar@punedist.com',
      address: 'Shivajinagar, Pune, Maharashtra 411005',
      ytdSales: 1500000,
      creditLimit: 300000,
      recentOrders: [
         { orderId: 'ORD-1245', date: '2025-06-15', amount: 80000, status: 'In Transit' }
      ],
      payments: [
         { date: '2025-06-14', amount: 120000, mode: 'NEFT', ref: 'N987654321' }
      ],
      visits: [
         { date: '2025-06-10', by: 'Vikas Sharma (ASM)', purpose: 'Stock Check', outcome: 'Healthy Inventory' }
      ]
    },
    { 
      id: 'DIST004', 
      name: 'Surat Pharma', 
      state: 'Gujarat', 
      asm: 'Amit Desai', 
      outstanding: 50000, 
      lastOrder: '2025-06-14', 
      status: 'Active',
      contactPerson: 'Ramesh Shah',
      phone: '9876543213',
      email: 'ramesh@suratpharma.com',
      address: 'Ring Road, Surat, Gujarat 395002',
      ytdSales: 1100000,
      creditLimit: 200000,
      recentOrders: [
         { orderId: 'ORD-1240', date: '2025-06-14', amount: 50000, status: 'Processing' }
      ],
      payments: [
         { date: '2025-06-05', amount: 40000, mode: 'UPI', ref: 'UPI-12345' }
      ],
      visits: [
         { date: '2025-06-08', by: 'Amit Desai (ASM)', purpose: 'Routine Visit', outcome: 'Normal' }
      ]
    }
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const filteredData = distributors.filter(row => {
    const s = search.toLowerCase();
    const matchesSearch = search === '' || 
      row.id.toLowerCase().includes(s) ||
      row.name.toLowerCase().includes(s) ||
      row.state.toLowerCase().includes(s) ||
      row.asm.toLowerCase().includes(s);

    const matchesStatus = filters.status === 'All' || row.status === filters.status;
    
    return matchesSearch && matchesStatus;
  });

  const totalDistributors = distributors.length;
  const activeDistributors = distributors.filter(d => d.status === 'Active').length;
  const totalOutstanding = distributors.reduce((sum, d) => sum + d.outstanding, 0);
  const atRiskDistributors = distributors.filter(d => d.status === 'At Risk').length;

  const openDrawer = (distributor: any) => {
    setViewingDistributor(distributor);
    setIsDrawerOpen(true);
  };

  const handleExportExcel = () => {
    if (filteredData.length === 0) return;
    
    const exportData = filteredData.map(row => ({
      'Distributor Code': row.id,
      'Distributor Name': row.name,
      'State': row.state,
      'Mapped ASM': row.asm,
      'Outstanding (₹)': row.outstanding,
      'Credit Limit (₹)': row.creditLimit,
      'Last Order Date': row.lastOrder,
      'Status': row.status
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Distributors");
    
    const dateStr = new Date().toISOString().split('T')[0];
    XLSX.writeFile(workbook, `Distributor_Management_${dateStr}.xlsx`);
    setIsExportOpen(false);
  };

  const handleExportPDF = () => {
    if (filteredData.length === 0) return;
    
    const doc = new jsPDF();
    
    doc.setFontSize(16);
    doc.text("Distributor Management Report", 14, 20);
    
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);
    
    const tableColumn = ["Code", "Name", "State", "Mapped ASM", "Outstanding", "Last Order", "Status"];
    const tableRows = filteredData.map(row => [
      row.id,
      row.name,
      row.state,
      row.asm,
      `Rs. ${row.outstanding.toLocaleString('en-IN')}`,
      row.lastOrder,
      row.status
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 35,
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [22, 60, 120] } // #163c78
    });

    const dateStr = new Date().toISOString().split('T')[0];
    doc.save(`Distributor_Management_${dateStr}.pdf`);
    setIsExportOpen(false);
  };

  const columns = [
    { key: 'id', label: 'Distributor Code' },
    { key: 'name', label: 'Distributor Name', render: (row: any) => <span className="font-medium text-slate-800">{row.name}</span> },
    { key: 'state', label: 'State' },
    { key: 'asm', label: 'Mapped ASM' },
    { key: 'outstanding', label: 'Outstanding', render: (row: any) => <span className={row.outstanding > row.creditLimit ? 'text-red-600 font-medium' : 'text-slate-700'}>{formatCurrency(row.outstanding)}</span> },
    { key: 'lastOrder', label: 'Last Order Date' },
    {
      key: 'status',
      label: 'Status',
      render: (row: any) => (
        <Badge variant={row.status === 'Active' ? 'success' : row.status === 'At Risk' ? 'error' : 'neutral'}>
          {row.status}
        </Badge>
      )
    },
    {
      key: 'actions',
      label: 'Action',
      render: (row: any) => (
        <button 
          onClick={() => openDrawer(row)} 
          className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors" 
          title="View Details"
        >
          <Eye className="w-4 h-4" />
        </button>
      )
    }
  ];

  return (
    <div className="p-6">
      <PageHeader 
        title="Distributor Management" 
        subtitle="Monitor distributor relationships, business performance, and outstanding payments."
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <SummaryCard 
          title="Total Distributors" 
          value={totalDistributors.toString()} 
          icon={<Users className="w-6 h-6" />} 
          subtitle="+2 vs last month"
          colorClass="text-[#163c78]"
          bgClass="bg-blue-50"
        />
        <SummaryCard 
          title="Active Distributors" 
          value={activeDistributors.toString()} 
          icon={<CheckCircle className="w-6 h-6" />} 
          colorClass="text-emerald-600"
          bgClass="bg-emerald-100"
        />
        <SummaryCard 
          title="Total Outstanding" 
          value={formatCurrency(totalOutstanding)} 
          icon={<IndianRupee className="w-6 h-6" />} 
          colorClass="text-amber-600"
          bgClass="bg-amber-100"
        />
        <SummaryCard 
          title="At Risk" 
          value={atRiskDistributors.toString()} 
          icon={<AlertTriangle className="w-6 h-6" />} 
          subtitle="-1 vs last month"
          colorClass="text-red-600"
          bgClass="bg-red-100"
        />
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6 space-y-4">
        <div className="flex flex-wrap gap-4 items-center">
          <select 
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-[#163c78] bg-white flex-1 min-w-[150px]"
            value={filters.dateRange}
            onChange={(e) => setFilters({...filters, dateRange: e.target.value})}
          >
            <option value="This Month">This Month</option>
            <option value="Last Month">Last Month</option>
            <option value="Quarter">This Quarter</option>
            <option value="Year">This Year</option>
          </select>
          <select 
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-[#163c78] bg-white flex-1 min-w-[150px]"
            value={filters.status}
            onChange={(e) => setFilters({...filters, status: e.target.value})}
          >
            <option value="All">All Status</option>
            <option value="Active">Active</option>
            <option value="At Risk">At Risk</option>
          </select>
          <div className="flex-[3] min-w-[300px]">
            <SearchInput value={search} onChange={setSearch} placeholder="Search by code, name, state, or ASM..." />
          </div>
          
          <div className="relative">
            <button 
              onClick={() => setIsExportOpen(!isExportOpen)}
              disabled={filteredData.length === 0}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors shadow-sm border ${
                filteredData.length === 0 
                  ? 'bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed' 
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
              }`}
              title={filteredData.length === 0 ? "No data available to export" : "Export options"}
            >
              <Download className="w-4 h-4" /> Export <ChevronDown className="w-4 h-4 text-slate-400" />
            </button>
            
            {isExportOpen && filteredData.length > 0 && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setIsExportOpen(false)}
                ></div>
                <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-lg shadow-lg z-20 py-1 overflow-hidden">
                  <button 
                    onClick={handleExportExcel}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors text-left"
                  >
                    <TableIcon className="w-4 h-4 text-emerald-600" /> Export as Excel (.xlsx)
                  </button>
                  <button 
                    onClick={handleExportPDF}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors text-left"
                  >
                    <FileText className="w-4 h-4 text-rose-600" /> Export as PDF (.pdf)
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <TableCard>
        <DataTable columns={columns} data={filteredData} emptyMessage="No distributors found." />
      </TableCard>

      {/* View Drawer */}
      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title="Distributor Profile"
        position="right"
        className="w-[40vw] min-w-[400px]"
      >
        {viewingDistributor && (
          <div className="space-y-6">
            {/* Header / Name */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h2 className="text-xl font-bold text-slate-800">{viewingDistributor.name}</h2>
                  <Badge variant={viewingDistributor.status === 'Active' ? 'success' : 'error'}>{viewingDistributor.status}</Badge>
                </div>
                <div className="text-sm text-slate-500">Code: {viewingDistributor.id}</div>
              </div>
            </div>

            {/* 1. Distributor Info */}
            <div>
              <h3 className="text-sm font-bold text-slate-800 mb-3 uppercase tracking-wider flex items-center gap-2"><Building2 className="w-4 h-4 text-[#163c78]" /> Distributor Information</h3>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><span className="block text-xs text-slate-500 font-semibold mb-1">Contact Person</span><span className="text-sm font-medium">{viewingDistributor.contactPerson}</span></div>
                <div><span className="block text-xs text-slate-500 font-semibold mb-1 flex items-center gap-1"><Phone className="w-3 h-3"/> Phone</span><span className="text-sm font-medium">{viewingDistributor.phone}</span></div>
                <div><span className="block text-xs text-slate-500 font-semibold mb-1 flex items-center gap-1"><Mail className="w-3 h-3"/> Email</span><span className="text-sm font-medium">{viewingDistributor.email}</span></div>
                <div><span className="block text-xs text-slate-500 font-semibold mb-1 flex items-center gap-1"><MapPin className="w-3 h-3"/> Address</span><span className="text-sm font-medium">{viewingDistributor.address}</span></div>
                <div><span className="block text-xs text-slate-500 font-semibold mb-1">State</span><span className="text-sm font-medium">{viewingDistributor.state}</span></div>
                <div><span className="block text-xs text-slate-500 font-semibold mb-1">Mapped ASM</span><span className="text-sm font-medium text-[#163c78]">{viewingDistributor.asm}</span></div>
              </div>
            </div>

            {/* 2. Business Summary */}
            <div>
              <h3 className="text-sm font-bold text-slate-800 mb-3 uppercase tracking-wider flex items-center gap-2"><Activity className="w-4 h-4 text-[#163c78]" /> Business Summary</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
                  <div className="text-xs text-slate-500 font-semibold mb-1">YTD Sales</div>
                  <div className="text-lg font-bold text-emerald-600">{formatCurrency(viewingDistributor.ytdSales)}</div>
                </div>
                <div className={`bg-white border ${viewingDistributor.outstanding > viewingDistributor.creditLimit ? 'border-red-300 bg-red-50' : 'border-slate-200'} p-4 rounded-xl shadow-sm`}>
                  <div className="text-xs text-slate-500 font-semibold mb-1">Current Outstanding</div>
                  <div className={`text-lg font-bold ${viewingDistributor.outstanding > viewingDistributor.creditLimit ? 'text-red-600' : 'text-slate-800'}`}>
                    {formatCurrency(viewingDistributor.outstanding)}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">Credit Limit: {formatCurrency(viewingDistributor.creditLimit)}</div>
                </div>
              </div>
            </div>

            {/* 3. Recent Orders */}
            <div>
              <h3 className="text-sm font-bold text-slate-800 mb-3 uppercase tracking-wider flex items-center gap-2"><ShoppingCart className="w-4 h-4 text-[#163c78]" /> Recent Orders</h3>
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-600">
                    <tr>
                      <th className="px-4 py-2 font-semibold">Order ID</th>
                      <th className="px-4 py-2 font-semibold">Date</th>
                      <th className="px-4 py-2 font-semibold text-right">Amount</th>
                      <th className="px-4 py-2 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {viewingDistributor.recentOrders.map((order: any, idx: number) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="px-4 py-2 text-[#163c78] font-medium">{order.orderId}</td>
                        <td className="px-4 py-2">{order.date}</td>
                        <td className="px-4 py-2 text-right font-medium">{formatCurrency(order.amount)}</td>
                        <td className="px-4 py-2">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${order.status === 'Delivered' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                            {order.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 4. Payments */}
            <div>
              <h3 className="text-sm font-bold text-slate-800 mb-3 uppercase tracking-wider flex items-center gap-2"><CreditCard className="w-4 h-4 text-[#163c78]" /> Recent Payments</h3>
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-600">
                    <tr>
                      <th className="px-4 py-2 font-semibold">Date</th>
                      <th className="px-4 py-2 font-semibold">Mode</th>
                      <th className="px-4 py-2 font-semibold">Reference</th>
                      <th className="px-4 py-2 font-semibold text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {viewingDistributor.payments.map((payment: any, idx: number) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="px-4 py-2">{payment.date}</td>
                        <td className="px-4 py-2">{payment.mode}</td>
                        <td className="px-4 py-2 text-slate-500">{payment.ref}</td>
                        <td className="px-4 py-2 text-right font-medium text-emerald-600">{formatCurrency(payment.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 5. Visits */}
            <div>
              <h3 className="text-sm font-bold text-slate-800 mb-3 uppercase tracking-wider flex items-center gap-2"><Users className="w-4 h-4 text-[#163c78]" /> Recent Visits</h3>
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-600">
                    <tr>
                      <th className="px-4 py-2 font-semibold whitespace-nowrap">Visit Date</th>
                      <th className="px-4 py-2 font-semibold">Employee Name</th>
                      <th className="px-4 py-2 font-semibold">Visit Type</th>
                      <th className="px-4 py-2 font-semibold">Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {viewingDistributor.visits.slice(0, 5).map((visit: any, idx: number) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="px-4 py-2 whitespace-nowrap text-slate-600">{visit.date}</td>
                        <td className="px-4 py-2 font-medium text-slate-800">{visit.by}</td>
                        <td className="px-4 py-2 text-slate-700">{visit.purpose}</td>
                        <td className="px-4 py-2 text-slate-600">{visit.outcome}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}
      </Drawer>
    </div>
  );
}
