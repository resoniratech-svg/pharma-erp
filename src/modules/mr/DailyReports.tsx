import { useState, useEffect } from 'react';
import { Download, Filter, FileText, Activity } from 'lucide-react';
import {
  PageHeader,
  FilterBar,
  SearchInput,
  SelectFilter,
  ActionButton,
  TableCard,
  DataTable,
  Badge,
} from './components/shared';
import { type Column } from './components/shared';
import { ExportService } from '../../services/exportService';

interface DCR {
  id: string;
  date: string;
  repName: string;
  area: string;
  doctorsVisited: number;
  chemistsVisited: number;
  totalOrders: number;
  orderValue: number;
  gpsAttendance?: string;
  startTime?: string;
  endTime?: string;
  totalKmTravelled?: number;
  remarks?: string;
  status: 'Submitted' | 'Draft' | 'Approved';
}

export default function DailyReports() {
  const [reports, setReports] = useState<DCR[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isCompiling, setIsCompiling] = useState(false);
    const [isExportOpen, setIsExportOpen] = useState(false);


  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = () => {
    try {
      const stored = localStorage.getItem('web_daily_reports');
      if (stored) {
        setReports(JSON.parse(stored));
      } else {
        // Fallback mock data if completely empty so the screen isn't blank
        const initialMock: DCR[] = [
          { id: '1', date: '15-Oct-2026', repName: 'Rahul Verma', area: 'Andheri West', doctorsVisited: 12, chemistsVisited: 8, totalOrders: 5, orderValue: 25000, gpsAttendance: 'Present', startTime: '09:00 AM', endTime: '06:00 PM', totalKmTravelled: 45, status: 'Submitted' },
          { id: '2', date: '14-Oct-2026', repName: 'Rahul Verma', area: 'Bandra', doctorsVisited: 10, chemistsVisited: 5, totalOrders: 3, orderValue: 12500, gpsAttendance: 'Present', startTime: '09:30 AM', endTime: '05:30 PM', totalKmTravelled: 32, status: 'Approved' },
        ];
        setReports(initialMock);
        localStorage.setItem('web_daily_reports', JSON.stringify(initialMock));
      }
    } catch (e) {
      console.error('Failed to load reports', e);
    }
  };

  const compileTodayDCR = () => {
    setIsCompiling(true);
    setTimeout(() => {
      try {
        const today = new Date();
        const todayStr = today.toDateString();
        
        // Date formatting helpers to match records
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        const isoToday = `${yyyy}-${mm}-${dd}`;
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const formattedToday = `${dd}-${months[today.getMonth()]}-${yyyy}`;

        const isToday = (dateStr: string) => {
          if (!dateStr) return false;
          return dateStr.includes(isoToday) || dateStr.includes(formattedToday) || dateStr === todayStr;
        };

        // 1. Load Doctor Visits (Filtered for today)
        const docData = JSON.parse(localStorage.getItem('web_doctor_visits') || '[]');
        const doctorsVisited = docData.filter((v: any) => isToday(v.visitDate || v.date)).length;

        // 2. Load Chemist Visits (Filtered for today)
        const chemData = JSON.parse(localStorage.getItem('web_chemist_visits') || '[]');
        const chemistsVisited = chemData.filter((v: any) => isToday(v.visitDate || v.date)).length;

        // 3. Load Orders (Filtered for today)
        const ordersData = JSON.parse(localStorage.getItem('@orders') || localStorage.getItem('web_orders') || '[]');
        const todayOrdersList = ordersData.filter((o: any) => isToday(o.dateFormatted || o.date));
        const totalOrders = todayOrdersList.length;
        const orderValue = todayOrdersList.reduce((sum: number, order: any) => sum + (parseFloat(order.totalAmount) || 0), 0);

        // Check if report already exists for today
        const existingIndex = reports.findIndex(r => r.date === todayStr);
        
        const newReport: DCR = {
          id: Date.now().toString(),
          date: todayStr,
          repName: 'Rahul Verma', // Logged in user
          area: 'Andheri West', // Assigned territory
          doctorsVisited,
          chemistsVisited,
          totalOrders,
          orderValue,
          gpsAttendance: 'Present', // Mocking attendance data for compile
          startTime: '09:00 AM',
          endTime: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
          totalKmTravelled: Math.floor(Math.random() * 20) + 10, // Mocked KM
          status: 'Submitted',
        };

        let updatedReports;
        if (existingIndex >= 0) {
          updatedReports = [...reports];
          updatedReports[existingIndex] = { ...updatedReports[existingIndex], ...newReport, id: updatedReports[existingIndex].id };
        } else {
          updatedReports = [newReport, ...reports];
        }

        setReports(updatedReports);
        localStorage.setItem('web_daily_reports', JSON.stringify(updatedReports));
        alert('✅ Today\'s DCR has been compiled successfully!');
      } catch (e) {
        console.error('Failed to compile DCR', e);
        alert('Failed to compile DCR');
      } finally {
        setIsCompiling(false);
      }
    }, 800); // Simulate processing time
  };

  const columns: Column<DCR>[] = [
    { key: 'date', label: 'Report Date', render: (row) => <span className="font-semibold text-slate-900">{row.date}</span> },
    { key: 'repName', label: 'Rep Name' },
    { key: 'doctorsVisited', label: 'Doc Calls', render: (row) => <span className="font-medium text-slate-600">{row.doctorsVisited}</span> },
    { key: 'chemistsVisited', label: 'Chemist Calls', render: (row) => <span className="font-medium text-slate-600">{row.chemistsVisited}</span> },
    { key: 'totalOrders', label: 'Orders', render: (row) => <span className="font-medium text-slate-600">{row.totalOrders}</span> },
    { key: 'orderValue', label: 'Sales (₹)', render: (row) => <span className="font-semibold text-emerald-600">₹{row.orderValue?.toLocaleString() || 0}</span> },
    {
      key: 'status',
      label: 'Status',
      render: (row) => {
        const variant = row.status === 'Approved' ? 'success' : row.status === 'Submitted' ? 'info' : 'neutral';
        return <Badge variant={variant}>{row.status}</Badge>;
      },
    },
    {
      key: 'action',
      label: '',
      render: () => <ActionButton variant="ghost" className="text-violet-600 text-xs px-2 py-1"><FileText className="w-4 h-4" /></ActionButton>
    }
  ];

  const filteredData = reports.filter((item) => {
    const matchSearch = item.date.toLowerCase().includes(search.toLowerCase()) || item.repName.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter ? item.status === statusFilter : true;
    return matchSearch && matchStatus;
  });

    // --- START OF EXPORT LOGIC ---
  const exportColumns = [
    { header: 'Date', dataKey: 'date' },
    { header: 'Rep Name', dataKey: 'repName' },
    { header: 'Area', dataKey: 'area' },
    { header: 'Doctor Calls', dataKey: 'doctorsVisited' },
    { header: 'Chemist Calls', dataKey: 'chemistsVisited' },
    { header: 'Total Orders', dataKey: 'totalOrders' },
    //{ header: 'Sales (₹)', dataKey: 'orderValue' },
        { header: 'Sales (Rs.)', dataKey: 'orderValue' },
    { header: 'Start Time', dataKey: 'startTime' },
    { header: 'End Time', dataKey: 'endTime' },
    { header: 'Status', dataKey: 'status' }
  ];

  const handleExportPDF = () => {
    if (filteredData.length === 0) return alert("No reports to export.");
    ExportService.exportToPDF({
      title: 'Daily Call Report (DCR)',
      filename: `DCR_Export_${new Date().toISOString().split('T')[0]}`,
      data: filteredData,
      columns: exportColumns
    });
  };

  const handleExportExcel = () => {
    if (filteredData.length === 0) return alert("No reports to export.");
    ExportService.exportToExcel({
      title: 'Daily Call Report (DCR)',
      filename: `DCR_Export_${new Date().toISOString().split('T')[0]}`,
      data: filteredData,
      columns: exportColumns
    });
  };
  // --- END OF EXPORT LOGIC ---
  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader
        title="Daily Reporting (DCR)"
        subtitle="Submit and review daily field force activities and visit logs."
        // actions={
        //   <>
        //     <ActionButton variant="secondary" icon={<Download className="w-4 h-4" />}>Export Reports</ActionButton>
        //     <ActionButton 
        //       onClick={compileTodayDCR} 
        //       icon={<Activity className="w-4 h-4" />}
        //     >
        //       {isCompiling ? 'Compiling...' : "Compile Today's DCR"}
        //     </ActionButton>
        //   </>
        // }
                actions={
          <div className="flex items-center gap-3">
            {/* START OF EXPORT DROPDOWN */}
            <div className="relative">
              <ActionButton 
                variant="secondary" 
                onClick={() => setIsExportOpen(!isExportOpen)} 
                icon={<Download className="w-4 h-4" />}
              >
                Export Reports
              </ActionButton>
              
              {isExportOpen && (
                <div className="absolute right-0 mt-2 w-40 bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden z-50">
                  <button 
                    onClick={() => { handleExportExcel(); setIsExportOpen(false); }} 
                    className="w-full text-left px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors border-b border-slate-100"
                  >
                    Excel (.xlsx)
                  </button>
                  <button 
                    onClick={() => { handleExportPDF(); setIsExportOpen(false); }} 
                    className="w-full text-left px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    PDF Document
                  </button>
                </div>
              )}
            </div>
            {/* END OF EXPORT DROPDOWN */}

            <ActionButton 
              onClick={compileTodayDCR} 
              icon={<Activity className="w-4 h-4" />}
            >
              {isCompiling ? 'Compiling...' : "Compile Today's DCR"}
            </ActionButton>
          </div>
        }
      />

      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search by date or name..." />
        <div className="w-px h-6 bg-slate-200 mx-2 hidden sm:block" />
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-medium text-slate-600">Filters:</span>
        </div>
        <SelectFilter
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { label: 'Submitted', value: 'Submitted' },
            { label: 'Draft', value: 'Draft' },
            { label: 'Approved', value: 'Approved' },
          ]}
          placeholder="All Status"
        />
      </FilterBar>

      <TableCard>
        <DataTable
          columns={columns}
          data={filteredData}
          emptyMessage="No reports found."
        />
      </TableCard>
    </div>
  );
}
