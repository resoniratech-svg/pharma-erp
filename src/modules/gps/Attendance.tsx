// import { useState } from 'react';
// import { Download, Filter, MapPin } from 'lucide-react';
// import {
//   PageHeader,
//   FilterBar,
//   SearchInput,
//   SelectFilter,
//   ActionButton,
//   TableCard,
//   DataTable,
//   Badge,
// } from './components/shared';
// import { type Column } from './components/shared';

// interface AttendanceRecord {
//   id: string;
//   date: string;
//   repName: string;
//   checkInTime: string;
//   checkOutTime: string;
//   status: 'Present' | 'Absent' | 'Half Day' | 'Leave';
//   location: string;
// }

// const mockData: AttendanceRecord[] = [
//   { id: '1', date: '15-Oct-2026', repName: 'Rahul Verma', checkInTime: '09:05 AM', checkOutTime: '06:30 PM', status: 'Present', location: 'Andheri West' },
//   { id: '2', date: '15-Oct-2026', repName: 'Amit Singh', checkInTime: '09:45 AM', checkOutTime: '02:15 PM', status: 'Half Day', location: 'Bandra' },
//   { id: '3', date: '15-Oct-2026', repName: 'Sneha Patel', checkInTime: '-', checkOutTime: '-', status: 'Absent', location: '-' },
// ];

// export default function Attendance() {
//   const [search, setSearch] = useState('');
//   const [statusFilter, setStatusFilter] = useState('');

//   const columns: Column<AttendanceRecord>[] = [
//     { key: 'date', label: 'Date', render: (row) => <span className="font-semibold text-slate-900">{row.date}</span> },
//     { key: 'repName', label: 'Rep Name' },
//     { key: 'checkInTime', label: 'Check In', render: (row) => <span className="text-emerald-600 font-medium">{row.checkInTime}</span> },
//     { key: 'checkOutTime', label: 'Check Out', render: (row) => <span className="text-rose-600 font-medium">{row.checkOutTime}</span> },
//     { key: 'location', label: 'Start Location' },
//     {
//       key: 'status',
//       label: 'Status',
//       render: (row) => {
//         const variant = row.status === 'Present' ? 'success' : row.status === 'Absent' ? 'danger' : row.status === 'Half Day' ? 'warning' : 'neutral';
//         return <Badge variant={variant}>{row.status}</Badge>;
//       },
//     },
//     {
//       key: 'action',
//       label: '',
//       render: (row) => row.location !== '-' ? <button className="text-violet-600 hover:text-violet-700 p-1"><MapPin className="w-4 h-4" /></button> : null
//     }
//   ];

//   const filteredData = mockData.filter((item) => {
//     const matchSearch = item.repName.toLowerCase().includes(search.toLowerCase());
//     const matchStatus = statusFilter ? item.status === statusFilter : true;
//     return matchSearch && matchStatus;
//   });

//   return (
//     <div className="animate-in fade-in duration-500">
//       <PageHeader
//         title="GPS Attendance"
//         subtitle="Track daily attendance based on GPS check-in/out data."
//         actions={
//           <ActionButton variant="secondary" icon={<Download className="w-4 h-4" />}>Export Register</ActionButton>
//         }
//       />

//       <FilterBar>
//         <SearchInput value={search} onChange={setSearch} placeholder="Search rep name..." />
//         <div className="w-px h-6 bg-slate-200 mx-2 hidden sm:block" />
//         <div className="flex items-center gap-2">
//           <Filter className="w-4 h-4 text-slate-400" />
//           <span className="text-sm font-medium text-slate-600">Filters:</span>
//         </div>
//         <SelectFilter
//           value={statusFilter}
//           onChange={setStatusFilter}
//           options={[
//             { label: 'Present', value: 'Present' },
//             { label: 'Absent', value: 'Absent' },
//             { label: 'Half Day', value: 'Half Day' },
//             { label: 'Leave', value: 'Leave' },
//           ]}
//           placeholder="All Status"
//         />
//       </FilterBar>

//       <TableCard>
//         <DataTable
//           columns={columns}
//           data={filteredData}
//           emptyMessage="No attendance records found."
//         />
//       </TableCard>
//     </div>
//   );
// }

/////////////////////////////////////////////////////////////////////////
import { useState, useEffect } from 'react';
import { Download, Filter, MapPin } from 'lucide-react';
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
interface AttendanceRecord {
  id: string;
  date: string;
  repName: string;
  checkInTime: string;
  checkOutTime: string;
  status: 'Present' | 'Absent' | 'Half Day' | 'Leave';
  location: string;
  latitude?: number;  // NEW
  longitude?: number; // NEW
  createdAt?: string; // NEW
}
export default function Attendance() {
  // Added state to hold the real data instead of mockData
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Fetch from localStorage when the screen loads
    const [isExportOpen, setIsExportOpen] = useState(false);

  useEffect(() => {
    const storedData = localStorage.getItem('web_attendance_records');
    if (storedData) {
      setRecords(JSON.parse(storedData));
    }
  }, []);

  const columns: Column<AttendanceRecord>[] = [
    { key: 'date', label: 'Date', render: (row) => <span className="font-semibold text-slate-900">{row.date}</span> },
    { key: 'repName', label: 'Rep Name' },
    { key: 'checkInTime', label: 'Check In', render: (row) => <span className="text-emerald-600 font-medium">{row.checkInTime}</span> },
    { key: 'checkOutTime', label: 'Check Out', render: (row) => <span className="text-rose-600 font-medium">{row.checkOutTime}</span> },
    { key: 'location', label: 'Start Location' },
    {
      key: 'status',
      label: 'Status',
      render: (row) => {
        const variant = row.status === 'Present' ? 'success' : row.status === 'Absent' ? 'danger' : row.status === 'Half Day' ? 'warning' : 'neutral';
        return <Badge variant={variant}>{row.status}</Badge>;
      },
    },
    {
      key: 'action',
      label: '',
      render: (row) => row.location !== '-' ? <button className="text-violet-600 hover:text-violet-700 p-1"><MapPin className="w-4 h-4" /></button> : null
    }
  ];

  // Updated filter logic to search 'records' state instead of 'mockData'
  const filteredData = records.filter((item) => {
    const matchSearch = item.repName.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter ? item.status === statusFilter : true;
    return matchSearch && matchStatus;
  });
  // --- START OF EXPORT LOGIC ---
  const exportColumns = [
    { header: 'Date', dataKey: 'date' },
    { header: 'Rep Name', dataKey: 'repName' },
    { header: 'Check In', dataKey: 'checkInTime' },
    { header: 'Check Out', dataKey: 'checkOutTime' },
    { header: 'Location', dataKey: 'location' },
    { header: 'Status', dataKey: 'status' }
  ];

  const handleExportPDF = () => {
    if (filteredData.length === 0) return alert("No attendance records to export.");
    ExportService.exportToPDF({
      title: 'GPS Attendance Register',
      filename: `Attendance_Report_${new Date().toISOString().split('T')[0]}`,
      data: filteredData,
      columns: exportColumns
    });
  };

  const handleExportExcel = () => {
    if (filteredData.length === 0) return alert("No attendance records to export.");
    ExportService.exportToExcel({
      title: 'GPS Attendance Register',
      filename: `Attendance_Report_${new Date().toISOString().split('T')[0]}`,
      data: filteredData,
      columns: exportColumns
    });
  };
  // --- END OF EXPORT LOGIC ---
  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader
        title="GPS Attendance"
        subtitle="Track daily attendance based on GPS check-in/out data."
        // actions={
        //   <ActionButton variant="secondary" icon={<Download className="w-4 h-4" />}>Export Register</ActionButton>
        // }
                actions={
          <div className="relative">
            <ActionButton 
              variant="secondary" 
              onClick={() => setIsExportOpen(!isExportOpen)} 
              icon={<Download className="w-4 h-4" />}
            >
              Export Register
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
        }
      />

      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search rep name..." />
        <div className="w-px h-6 bg-slate-200 mx-2 hidden sm:block" />
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-medium text-slate-600">Filters:</span>
        </div>
        <SelectFilter
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { label: 'Present', value: 'Present' },
            { label: 'Absent', value: 'Absent' },
            { label: 'Half Day', value: 'Half Day' },
            { label: 'Leave', value: 'Leave' },
          ]}
          placeholder="All Status"
        />
      </FilterBar>

      <TableCard>
        <DataTable
          columns={columns}
          data={filteredData} // Passes dynamic data to the table
          emptyMessage="No attendance records found. Click Check-In to create one."
        />
      </TableCard>
    </div>
  );
}