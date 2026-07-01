// import { useState } from 'react';
// import { Download, Filter, MapPin, UserCheck, UserX, Users, Navigation } from 'lucide-react';
// import {
//   PageHeader,
//   FilterBar,
//   SearchInput,
//   SelectFilter,
//   ActionButton,
//   TableCard,
//   DataTable,
//   Badge,
//   SummaryCard,
// } from './components/shared';
// import { type Column } from './components/shared';

// interface GeoDocVisit {
//   id: string;
//   visitId: string;
//   doctorName: string;
//   mrName: string;
//   territory: string;
//   checkIn: string;
//   checkOut: string;
//   latitude: string;
//   longitude: string;
//   distanceVerified: string;
//   status: 'Verified' | 'Pending' | 'Rejected';
// }

// const mockData: GeoDocVisit[] = [
//   { id: '1', visitId: 'VD-2024-001', doctorName: 'Dr. A.K. Singh', mrName: 'Rahul Sharma', territory: 'South Mumbai', checkIn: '10:00 AM', checkOut: '10:30 AM', latitude: '18.9220° N', longitude: '72.8277° E', distanceVerified: 'Yes (< 50m)', status: 'Verified' },
//   { id: '2', visitId: 'VD-2024-002', doctorName: 'Dr. Neha Gupta', mrName: 'Amit Kumar', territory: 'Andheri West', checkIn: '11:15 AM', checkOut: '11:45 AM', latitude: '19.1136° N', longitude: '72.8697° E', distanceVerified: 'No (> 500m)', status: 'Rejected' },
//   { id: '3', visitId: 'VD-2024-003', doctorName: 'Dr. Verma', mrName: 'Rahul Sharma', territory: 'South Mumbai', checkIn: '12:00 PM', checkOut: '-', latitude: '18.9322° N', longitude: '72.8264° E', distanceVerified: 'Yes (< 50m)', status: 'Pending' },
//   { id: '4', visitId: 'VD-2024-004', doctorName: 'Dr. Batra', mrName: 'Sanjay Patel', territory: 'Thane', checkIn: '09:30 AM', checkOut: '09:45 AM', latitude: '19.2183° N', longitude: '72.9781° E', distanceVerified: 'Yes (< 50m)', status: 'Verified' },
// ];

// export default function GeoTaggedDoctorVisits() {
//   const [search, setSearch] = useState('');
//   const [statusFilter, setStatusFilter] = useState('');

//   const columns: Column<GeoDocVisit>[] = [
//     { key: 'visitId', label: 'Visit ID', render: (row) => <span className="font-semibold text-slate-900">{row.visitId}</span> },
//     { key: 'doctorName', label: 'Doctor Name', render: (row) => <span className="font-medium text-slate-800">{row.doctorName}</span> },
//     { key: 'mrName', label: 'MR Name' },
//     { key: 'territory', label: 'Territory' },
//     { key: 'checkIn', label: 'Check-In' },
//     { key: 'checkOut', label: 'Check-Out' },
//     { key: 'latitude', label: 'Latitude', render: (row) => <span className="font-mono text-xs text-slate-500">{row.latitude}</span> },
//     { key: 'longitude', label: 'Longitude', render: (row) => <span className="font-mono text-xs text-slate-500">{row.longitude}</span> },
//     { key: 'distanceVerified', label: 'Distance Verified', render: (row) => <span className={`font-semibold ${row.distanceVerified.includes('Yes') ? 'text-emerald-600' : 'text-danger-600'}`}>{row.distanceVerified}</span> },
//     {
//       key: 'status',
//       label: 'Status',
//       render: (row) => {
//         let variant: any = 'default';
//         if (row.status === 'Verified') variant = 'success';
//         else if (row.status === 'Pending') variant = 'warning';
//         else if (row.status === 'Rejected') variant = 'danger';
//         return <Badge variant={variant}>{row.status}</Badge>;
//       },
//     },
//   ];

//   const filteredData = mockData.filter((item) => {
//     const matchSearch = item.doctorName.toLowerCase().includes(search.toLowerCase()) || 
//                         item.mrName.toLowerCase().includes(search.toLowerCase()) ||
//                         item.visitId.toLowerCase().includes(search.toLowerCase());
//     const matchStatus = statusFilter ? item.status === statusFilter : true;
//     return matchSearch && matchStatus;
//   });

//   return (
//     <div className="animate-in fade-in duration-500">
//       <PageHeader
//         title="Geo Tagged Doctor Visits"
//         subtitle="Monitor doctor visits with GPS verification, location coordinates, visit duration, and field activity tracking."
//         actions={
//           <ActionButton variant="secondary" icon={<Download className="w-4 h-4" />}>Export Data</ActionButton>
//         }
//       />

//       {/* KPI Cards */}
//       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
//         <SummaryCard
//           title="Total Doctor Visits"
//           value="1,245"
//           subtitle="All territories"
//           icon={<Users className="w-6 h-6" />}
//           colorClass="text-violet-600"
//           bgClass="bg-violet-50"
//         />
//         <SummaryCard
//           title="Verified Visits"
//           value="1,120"
//           subtitle="Location matched"
//           icon={<UserCheck className="w-6 h-6" />}
//           colorClass="text-emerald-600"
//           bgClass="bg-emerald-50"
//         />
//         <SummaryCard
//           title="Unverified Visits"
//           value="45"
//           subtitle="Location mismatch"
//           icon={<UserX className="w-6 h-6" />}
//           colorClass="text-danger-600"
//           bgClass="bg-danger-50"
//         />
//         <SummaryCard
//           title="Today's Visits"
//           value="182"
//           subtitle="Currently active"
//           icon={<Navigation className="w-6 h-6" />}
//           colorClass="text-blue-600"
//           bgClass="bg-blue-50"
//         />
//       </div>

//       <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mb-8">
//         {/* Main Content Area */}
//         <div className="xl:col-span-2 flex flex-col gap-4">
//           <FilterBar>
//             <SearchInput value={search} onChange={setSearch} placeholder="Search doctor or MR name..." />
//             <div className="w-px h-6 bg-slate-200 mx-2 hidden sm:block" />
//             <div className="flex items-center gap-2">
//               <Filter className="w-4 h-4 text-slate-400" />
//               <span className="text-sm font-medium text-slate-600">Filters:</span>
//             </div>
//             <SelectFilter
//               value={statusFilter}
//               onChange={setStatusFilter}
//               options={[
//                 { label: 'Verified', value: 'Verified' },
//                 { label: 'Pending', value: 'Pending' },
//                 { label: 'Rejected', value: 'Rejected' },
//               ]}
//               placeholder="Visit Status"
//             />
//           </FilterBar>

//           <TableCard>
//             <DataTable
//               columns={columns}
//               data={filteredData}
//               emptyMessage="No geo-tagged visits found."
//             />
//           </TableCard>
//         </div>

//         {/* Map Section */}
//         <div className="xl:col-span-1">
//           <h2 className="text-lg font-semibold text-slate-900 mb-4">Live Visit Map</h2>
//           <div className="bg-slate-100 rounded-xl border border-slate-200 overflow-hidden relative min-h-[400px] flex flex-col items-center justify-center shadow-inner">
//             <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-900 via-transparent to-transparent bg-[length:20px_20px]" />
//             <MapPin className="w-12 h-12 text-primary mb-3 relative z-10 animate-bounce" />
//             <h3 className="text-md font-semibold text-slate-700 relative z-10">Map View Placeholder</h3>
//             <p className="text-sm text-slate-500 text-center px-6 mt-2 relative z-10">Integration with Google Maps or Mapbox required to display actual pins and routes.</p>
            
//             {/* Demo Pins */}
//             <div className="absolute top-1/4 left-1/4">
//               <MapPin className="w-6 h-6 text-emerald-500" />
//             </div>
//             <div className="absolute top-1/3 right-1/3">
//               <MapPin className="w-6 h-6 text-emerald-500" />
//             </div>
//             <div className="absolute bottom-1/4 left-1/2">
//               <MapPin className="w-6 h-6 text-danger-500" />
//             </div>
            
//             <div className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur p-3 rounded-lg border border-slate-200 text-xs text-slate-600 flex justify-between">
//               <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500 block"></span> Verified Location</div>
//               <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-danger-500 block"></span> Distance Mismatch</div>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }
//////////////////////////////////////////////////////////////////////////////////////////



import { useState, useEffect } from 'react';
import { Download, Filter, MapPin, UserCheck, UserX, Users, Navigation } from 'lucide-react';
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
import { ExportService } from '../../services/exportService';

interface GeoDocVisit {
  id: string;
  visitId: string;
  doctorName: string;
  mrName: string;
  territory: string;
  checkIn: string;
  checkOut: string;
  latitude: string;
  longitude: string;
  distanceVerified: string;
 visitDate: string;
  status: 'Verified' | 'Pending' | 'Rejected';
}

export default function GeoTaggedDoctorVisits() {
  // 1. New State for real data
  const [visits, setVisits] = useState<GeoDocVisit[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

    const [isExportOpen, setIsExportOpen] = useState(false);

  // 2. Fetch data from localStorage
  useEffect(() => {
    // Get logged in user name
    const authUserString = localStorage.getItem('authUser');
    const authUser = authUserString ? JSON.parse(authUserString) : null;
    const userName = authUser ? authUser.fullName : 'Medical Representative';

    const storedData = localStorage.getItem('doctor_visits');
    if (storedData) {
      const parsedData = JSON.parse(storedData);
      
      // Map the mobile app data to the web table format
      const formattedVisits: GeoDocVisit[] = parsedData.map((visit: any, index: number) => {
        
        // Format coordinates
        const lat = visit.latitude ? `${Number(visit.latitude).toFixed(4)}° N` : 'N/A';
        const lng = visit.longitude ? `${Number(visit.longitude).toFixed(4)}° E` : 'N/A';
        
        // Determine Status based on your Mobile App's distanceVerified logic
        let stat: 'Verified' | 'Pending' | 'Rejected' = 'Pending';
        if (visit.distanceVerified?.includes('Verified') || visit.distanceVerified?.includes('Yes')) {
          stat = 'Verified';
        } else if (visit.distanceVerified?.includes('No') || visit.distanceVerified?.includes('Rejected')) {
          stat = 'Rejected';
        }

        return {
          id: visit.id || String(index),
          visitId: `VD-${new Date(visit.visitDate || new Date()).getFullYear()}-${String(index + 1).padStart(3, '0')}`,
          doctorName: visit.doctorName || 'Unknown Doctor',
          mrName: userName,
          territory: visit.location || 'Unknown Territory',
          checkIn: visit.visitTime || '-',
          checkOut: visit.checkOutTime || '-', // Optional if your app didn't record doctor checkout
          latitude: lat,
          longitude: lng,
          distanceVerified: visit.distanceVerified || 'Pending',
          status: stat,
         visitDate: visit.visitDate || '-',
        };
      });

      setVisits(formattedVisits);
    }
  }, []);

  const columns: Column<GeoDocVisit>[] = [
    { key: 'visitId', label: 'Visit ID', render: (row) => <span className="font-semibold text-slate-900">{row.visitId}</span> },
    { key: 'doctorName', label: 'Doctor Name', render: (row) => <span className="font-medium text-slate-800">{row.doctorName}</span> },
    { key: 'mrName', label: 'MR Name' },
    { key: 'territory', label: 'Territory' },
    { key: 'checkIn', label: 'Check-In' },
    { key: 'checkOut', label: 'Check-Out' },
    { key: 'latitude', label: 'Latitude', render: (row) => <span className="font-mono text-xs text-slate-500">{row.latitude}</span> },
    { key: 'longitude', label: 'Longitude', render: (row) => <span className="font-mono text-xs text-slate-500">{row.longitude}</span> },
    { key: 'distanceVerified', label: 'Distance Verified', render: (row) => <span className={`font-semibold ${row.distanceVerified.includes('Verified') || row.distanceVerified.includes('Yes') ? 'text-emerald-600' : 'text-danger-600'}`}>{row.distanceVerified}</span> },
    {
      key: 'status',
      label: 'Status',
      render: (row) => {
        let variant: any = 'default';
        if (row.status === 'Verified') variant = 'success';
        else if (row.status === 'Pending') variant = 'warning';
        else if (row.status === 'Rejected') variant = 'danger';
        return <Badge variant={variant}>{row.status}</Badge>;
      },
    },
  ];

  // 3. Search real state instead of mockData
  const filteredData = visits.filter((item) => {
    const matchSearch = item.doctorName.toLowerCase().includes(search.toLowerCase()) || 
                        item.mrName.toLowerCase().includes(search.toLowerCase()) ||
                        item.visitId.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter ? item.status === statusFilter : true;
    return matchSearch && matchStatus;
  });

  // 4. Calculate KPI Cards dynamically!
  const totalVisits = visits.length;
  const verifiedVisits = visits.filter(v => v.status === 'Verified').length;
  const unverifiedVisits = visits.filter(v => v.status === 'Rejected').length;
  const todayDateStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-');
  //const todayVisits = visits.filter(v => v.visitId.includes(new Date().getFullYear().toString())).length; // Rough estimation for "today" based on ID, can be improved based on visitDate
  const todayVisits = visits.filter(v => v.visitDate === todayDateStr).length;

    // --- START OF EXPORT LOGIC ---
  const exportColumns = [
    { header: 'Visit ID', dataKey: 'visitId' },
    { header: 'Visit Date', dataKey: 'visitDate' },
    { header: 'Doctor Name', dataKey: 'doctorName' },
    { header: 'MR Name', dataKey: 'mrName' },
    { header: 'Territory', dataKey: 'territory' },
    { header: 'Check In', dataKey: 'checkIn' },
    { header: 'Check Out', dataKey: 'checkOut' },
    { header: 'Latitude', dataKey: 'latitude' },
    { header: 'Longitude', dataKey: 'longitude' },
    { header: 'Distance Verified', dataKey: 'distanceVerified' },
    { header: 'Status', dataKey: 'status' }
  ];

  const handleExportPDF = () => {
    if (filteredData.length === 0) return alert("No visits to export.");
    ExportService.exportToPDF({
      title: 'Geo-Tagged Doctor Visits',
      filename: `Doctor_Visits_${new Date().toISOString().split('T')[0]}`,
      data: filteredData,
      columns: exportColumns
    });
  };

  const handleExportExcel = () => {
    if (filteredData.length === 0) return alert("No visits to export.");
    ExportService.exportToExcel({
      title: 'Geo-Tagged Doctor Visits',
      filename: `Doctor_Visits_${new Date().toISOString().split('T')[0]}`,
      data: filteredData,
      columns: exportColumns
    });
  };
  // --- END OF EXPORT LOGIC ---
  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader
        title="Geo Tagged Doctor Visits"
        subtitle="Monitor doctor visits with GPS verification, location coordinates, visit duration, and field activity tracking."
        // actions={
        //   <ActionButton variant="secondary" icon={<Download className="w-4 h-4" />}>Export Data</ActionButton>
        // }
                actions={
          <div className="relative">
            <ActionButton 
              variant="secondary" 
              onClick={() => setIsExportOpen(!isExportOpen)} 
              icon={<Download className="w-4 h-4" />}
            >
              Export Data
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

      {/* Dynamic KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <SummaryCard
          title="Total Doctor Visits"
          value={totalVisits.toString()}
          subtitle="All territories"
          icon={<Users className="w-6 h-6" />}
          colorClass="text-violet-600"
          bgClass="bg-violet-50"
        />
        <SummaryCard
          title="Verified Visits"
          value={verifiedVisits.toString()}
          subtitle="Location matched"
          icon={<UserCheck className="w-6 h-6" />}
          colorClass="text-emerald-600"
          bgClass="bg-emerald-50"
        />
        <SummaryCard
          title="Unverified Visits"
          value={unverifiedVisits.toString()}
          subtitle="Location mismatch"
          icon={<UserX className="w-6 h-6" />}
          colorClass="text-danger-600"
          bgClass="bg-danger-50"
        />
        <SummaryCard
          title="Today's Visits"
          value={todayVisits.toString()}
          subtitle="Currently active"
          icon={<Navigation className="w-6 h-6" />}
          colorClass="text-blue-600"
          bgClass="bg-blue-50"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mb-8">
        {/* Main Content Area */}
        <div className="xl:col-span-2 flex flex-col gap-4">
          <FilterBar>
            <SearchInput value={search} onChange={setSearch} placeholder="Search doctor or MR name..." />
            <div className="w-px h-6 bg-slate-200 mx-2 hidden sm:block" />
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <span className="text-sm font-medium text-slate-600">Filters:</span>
            </div>
            <SelectFilter
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { label: 'Verified', value: 'Verified' },
                { label: 'Pending', value: 'Pending' },
                { label: 'Rejected', value: 'Rejected' },
              ]}
              placeholder="Visit Status"
            />
          </FilterBar>

          <TableCard>
            <DataTable
              columns={columns}
              data={filteredData}
              emptyMessage="No geo-tagged visits found."
            />
          </TableCard>
        </div>

        {/* Map Section - Untouched */}
        <div className="xl:col-span-1">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Live Visit Map</h2>
          <div className="bg-slate-100 rounded-xl border border-slate-200 overflow-hidden relative min-h-[400px] flex flex-col items-center justify-center shadow-inner">
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-900 via-transparent to-transparent bg-[length:20px_20px]" />
            <MapPin className="w-12 h-12 text-primary mb-3 relative z-10 animate-bounce" />
            <h3 className="text-md font-semibold text-slate-700 relative z-10">Map View Placeholder</h3>
            <p className="text-sm text-slate-500 text-center px-6 mt-2 relative z-10">Integration with Google Maps or Mapbox required to display actual pins and routes.</p>
            
            {/* Demo Pins */}
            <div className="absolute top-1/4 left-1/4">
              <MapPin className="w-6 h-6 text-emerald-500" />
            </div>
            <div className="absolute top-1/3 right-1/3">
              <MapPin className="w-6 h-6 text-emerald-500" />
            </div>
            <div className="absolute bottom-1/4 left-1/2">
              <MapPin className="w-6 h-6 text-danger-500" />
            </div>
            
            <div className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur p-3 rounded-lg border border-slate-200 text-xs text-slate-600 flex justify-between">
              <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500 block"></span> Verified Location</div>
              <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-danger-500 block"></span> Distance Mismatch</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}