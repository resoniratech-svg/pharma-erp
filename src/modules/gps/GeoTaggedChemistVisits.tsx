// import { useState } from 'react';
// import { Download, Filter, MapPin, Store, CheckCircle2, Clock, Navigation } from 'lucide-react';
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

// interface GeoChemistVisit {
//   id: string;
//   visitId: string;
//   chemistName: string;
//   mrName: string;
//   territory: string;
//   visitTime: string;
//   latitude: string;
//   longitude: string;
//   distanceVerified: string;
//   status: 'Verified' | 'Pending' | 'Rejected';
// }

// const mockData: GeoChemistVisit[] = [
//   { id: '1', visitId: 'VC-2024-001', chemistName: 'Apollo Pharmacy', mrName: 'Rahul Sharma', territory: 'South Mumbai', visitTime: '10:45 AM', latitude: '18.9221° N', longitude: '72.8278° E', distanceVerified: 'Yes (< 20m)', status: 'Verified' },
//   { id: '2', visitId: 'VC-2024-002', chemistName: 'Wellness Medical', mrName: 'Amit Kumar', territory: 'Andheri West', visitTime: '12:15 PM', latitude: '19.1130° N', longitude: '72.8690° E', distanceVerified: 'No (> 300m)', status: 'Rejected' },
//   { id: '3', visitId: 'VC-2024-003', chemistName: 'Care Chemists', mrName: 'Rahul Sharma', territory: 'South Mumbai', visitTime: '01:30 PM', latitude: '18.9320° N', longitude: '72.8260° E', distanceVerified: 'Yes (< 40m)', status: 'Pending' },
//   { id: '4', visitId: 'VC-2024-004', chemistName: 'City Medicos', mrName: 'Sanjay Patel', territory: 'Thane', visitTime: '10:30 AM', latitude: '19.2180° N', longitude: '72.9780° E', distanceVerified: 'Yes (< 15m)', status: 'Verified' },
// ];

// export default function GeoTaggedChemistVisits() {
//   const [search, setSearch] = useState('');
//   const [statusFilter, setStatusFilter] = useState('');

//   const columns: Column<GeoChemistVisit>[] = [
//     { key: 'visitId', label: 'Visit ID', render: (row) => <span className="font-semibold text-slate-900">{row.visitId}</span> },
//     { key: 'chemistName', label: 'Chemist Name', render: (row) => <span className="font-medium text-slate-800">{row.chemistName}</span> },
//     { key: 'mrName', label: 'MR Name' },
//     { key: 'territory', label: 'Territory' },
//     { key: 'visitTime', label: 'Visit Time' },
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
//     const matchSearch = item.chemistName.toLowerCase().includes(search.toLowerCase()) || 
//                         item.mrName.toLowerCase().includes(search.toLowerCase()) ||
//                         item.visitId.toLowerCase().includes(search.toLowerCase());
//     const matchStatus = statusFilter ? item.status === statusFilter : true;
//     return matchSearch && matchStatus;
//   });

//   return (
//     <div className="animate-in fade-in duration-500">
//       <PageHeader
//         title="Geo Tagged Chemist Visits"
//         subtitle="Monitor chemist visits with geo-tagging, visit validation, and field activity verification."
//         actions={
//           <ActionButton variant="secondary" icon={<Download className="w-4 h-4" />}>Export Data</ActionButton>
//         }
//       />

//       {/* KPI Cards */}
//       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
//         <SummaryCard
//           title="Total Chemist Visits"
//           value="845"
//           subtitle="Monthly cumulative"
//           icon={<Store className="w-6 h-6" />}
//           colorClass="text-violet-600"
//           bgClass="bg-violet-50"
//         />
//         <SummaryCard
//           title="Verified Visits"
//           value="780"
//           subtitle="Successfully validated"
//           icon={<CheckCircle2 className="w-6 h-6" />}
//           colorClass="text-emerald-600"
//           bgClass="bg-emerald-50"
//         />
//         <SummaryCard
//           title="Pending Visits"
//           value="45"
//           subtitle="Awaiting sync/verify"
//           icon={<Clock className="w-6 h-6" />}
//           colorClass="text-amber-600"
//           bgClass="bg-amber-50"
//         />
//         <SummaryCard
//           title="Coverage %"
//           value="92%"
//           subtitle="Territory completion"
//           icon={<Navigation className="w-6 h-6" />}
//           colorClass="text-blue-600"
//           bgClass="bg-blue-50"
//         />
//       </div>

//       <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mb-8">
//         {/* Main Content Area */}
//         <div className="xl:col-span-2 flex flex-col gap-4">
//           <FilterBar>
//             <SearchInput value={search} onChange={setSearch} placeholder="Search chemist or MR name..." />
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
//               emptyMessage="No geo-tagged chemist visits found."
//             />
//           </TableCard>
//         </div>

//         {/* Map Section */}
//         <div className="xl:col-span-1">
//           <h2 className="text-lg font-semibold text-slate-900 mb-4">Coverage Map</h2>
//           <div className="bg-slate-100 rounded-xl border border-slate-200 overflow-hidden relative min-h-[400px] flex flex-col items-center justify-center shadow-inner">
//             <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-900 via-transparent to-transparent bg-[length:20px_20px]" />
//             <Store className="w-12 h-12 text-primary mb-3 relative z-10 opacity-70" />
//             <h3 className="text-md font-semibold text-slate-700 relative z-10">Coverage Map Placeholder</h3>
//             <p className="text-sm text-slate-500 text-center px-6 mt-2 relative z-10">Visualizing chemist locations, visit pins, and territory mapping.</p>
            
//             {/* Demo Pins */}
//             <div className="absolute top-1/4 left-1/4">
//               <MapPin className="w-6 h-6 text-indigo-500" />
//             </div>
//             <div className="absolute top-1/3 right-1/3">
//               <MapPin className="w-6 h-6 text-indigo-500" />
//             </div>
//             <div className="absolute bottom-1/3 right-1/4">
//               <MapPin className="w-6 h-6 text-indigo-500" />
//             </div>
            
//             <div className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur p-3 rounded-lg border border-slate-200 text-xs text-slate-600 flex justify-between">
//               <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-indigo-500 block"></span> Chemist Location</div>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }
/////////////////////////////////////////////////////////////////////////////


import { useState, useEffect } from 'react';
import { Download, Filter, MapPin, Store, CheckCircle2, Clock, Navigation } from 'lucide-react';
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
// ✅ Uses strict BadgeVariant
import { type Column, type BadgeVariant } from './components/shared';
import { ExportService } from '../../services/exportService';

interface GeoChemistVisit {
  id: string;
  visitId: string;
  chemistName: string;
  mrName: string;
  territory: string;
  visitTime: string;
  latitude: string;
  longitude: string;
  distanceVerified: string;
  status: 'Verified' | 'Pending' | 'Rejected';
  visitDate: string; 
}

export default function GeoTaggedChemistVisits() {
  const [visits, setVisits] = useState<GeoChemistVisit[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
    const [isExportOpen, setIsExportOpen] = useState(false);


  useEffect(() => {
    const authUserString = localStorage.getItem('authUser');
    const authUser = authUserString ? JSON.parse(authUserString) : null;
    const userName = authUser ? authUser.fullName : 'Medical Representative';

    const storedData = localStorage.getItem('chemist_visits');
    if (storedData) {
      const parsedData = JSON.parse(storedData);
      
      const formattedVisits: GeoChemistVisit[] = parsedData.map((visit: any, index: number) => {
        const lat = visit.latitude ? `${Number(visit.latitude).toFixed(4)}° N` : 'N/A';
        const lng = visit.longitude ? `${Number(visit.longitude).toFixed(4)}° E` : 'N/A';
        
        // ✅ Suggestion 3: Robust status calculation handling both booleans and strings
        let stat: 'Verified' | 'Pending' | 'Rejected' = 'Pending';
        if (visit.distanceVerified === true || String(visit.distanceVerified).includes('Verified') || String(visit.distanceVerified).includes('Yes')) {
          stat = 'Verified';
        } else if (visit.distanceVerified === false || String(visit.distanceVerified).includes('No') || String(visit.distanceVerified).includes('Rejected')) {
          stat = 'Rejected';
        }

        // ✅ Suggestion 4: Derive time properly if checkInDateTime exists
        let finalVisitTime = visit.visitTime || '-';
        if (visit.checkInDateTime) {
            finalVisitTime = new Date(visit.checkInDateTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        }

        return {
          id: visit.id || String(index),
          // ✅ Suggestion 1: Safer visitId that doesn't change on deletion
          visitId: visit.visitId ?? `VC-${new Date(visit.visitDate || new Date()).getFullYear()}-${String(index + 1).padStart(3, '0')}`,
          chemistName: visit.chemistName || visit.shopName || 'Unknown Chemist',
          mrName: userName,
          // ✅ Suggestion 2: Use actual territory
          territory: visit.territory || 'Unknown Territory',
          visitTime: finalVisitTime,
          latitude: lat,
          longitude: lng,
          distanceVerified: typeof visit.distanceVerified === 'boolean' ? (visit.distanceVerified ? 'Yes' : 'No') : (visit.distanceVerified || 'Pending'),
          status: stat,
          visitDate: visit.visitDate || '-',
        };
      });

      setVisits(formattedVisits);
    }
  }, []);

  const columns: Column<GeoChemistVisit>[] = [
    { key: 'visitId', label: 'Visit ID', render: (row) => <span className="font-semibold text-slate-900">{row.visitId}</span> },
    { key: 'chemistName', label: 'Chemist Name', render: (row) => <span className="font-medium text-slate-800">{row.chemistName}</span> },
    { key: 'mrName', label: 'MR Name' },
    { key: 'territory', label: 'Territory' },
    { key: 'visitTime', label: 'Visit Time' },
    { key: 'latitude', label: 'Latitude', render: (row) => <span className="font-mono text-xs text-slate-500">{row.latitude}</span> },
    { key: 'longitude', label: 'Longitude', render: (row) => <span className="font-mono text-xs text-slate-500">{row.longitude}</span> },
    { key: 'distanceVerified', label: 'Distance Verified', render: (row) => <span className={`font-semibold ${row.distanceVerified.includes('Yes') || row.distanceVerified.includes('Verified') ? 'text-emerald-600' : 'text-danger-600'}`}>{row.distanceVerified}</span> },
    {
      key: 'status',
      label: 'Status',
      render: (row) => {
        let variant: BadgeVariant = 'neutral';
        if (row.status === 'Verified') variant = 'success';
        else if (row.status === 'Pending') variant = 'warning';
        else if (row.status === 'Rejected') variant = 'danger';
        return <Badge variant={variant}>{row.status}</Badge>;
      },
    },
  ];

  const filteredData = visits.filter((item) => {
    const matchSearch = item.chemistName.toLowerCase().includes(search.toLowerCase()) || 
                        item.mrName.toLowerCase().includes(search.toLowerCase()) ||
                        item.visitId.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter ? item.status === statusFilter : true;
    return matchSearch && matchStatus;
  });

  const totalVisits = visits.length;
  const verifiedVisits = visits.filter(v => v.status === 'Verified').length;
  const pendingVisits = visits.filter(v => v.status === 'Pending' || v.status === 'Rejected').length;
  
  // ✅ Suggestion 5: Coverage percent dynamically calculated
  const coveragePercent = totalVisits === 0 ? '0%' : `${Math.round((verifiedVisits / totalVisits) * 100)}%`;
  // --- START OF EXPORT LOGIC ---
  const exportColumns = [
    { header: 'Visit ID', dataKey: 'visitId' },
    { header: 'Visit Date', dataKey: 'visitDate' },
    { header: 'Chemist Name', dataKey: 'chemistName' },
    { header: 'MR Name', dataKey: 'mrName' },
    { header: 'Territory', dataKey: 'territory' },
    { header: 'Visit Time', dataKey: 'visitTime' },
    { header: 'Latitude', dataKey: 'latitude' },
    { header: 'Longitude', dataKey: 'longitude' },
    { header: 'Distance Verified', dataKey: 'distanceVerified' },
    { header: 'Status', dataKey: 'status' }
  ];

  const handleExportPDF = () => {
    if (filteredData.length === 0) return alert("No visits to export.");
    ExportService.exportToPDF({
      title: 'Geo-Tagged Chemist Visits',
      filename: `Chemist_Visits_${new Date().toISOString().split('T')[0]}`,
      data: filteredData,
      columns: exportColumns
    });
  };

  const handleExportExcel = () => {
    if (filteredData.length === 0) return alert("No visits to export.");
    ExportService.exportToExcel({
      title: 'Geo-Tagged Chemist Visits',
      filename: `Chemist_Visits_${new Date().toISOString().split('T')[0]}`,
      data: filteredData,
      columns: exportColumns
    });
  };
  // --- END OF EXPORT LOGIC ---
  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader
        title="Geo Tagged Chemist Visits"
        subtitle="Monitor chemist visits with geo-tagging, visit validation, and field activity verification."
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <SummaryCard
          title="Total Chemist Visits"
          value={totalVisits.toString()}
          subtitle="Monthly cumulative"
          icon={<Store className="w-6 h-6" />}
          colorClass="text-violet-600"
          bgClass="bg-violet-50"
        />
        <SummaryCard
          title="Verified Visits"
          value={verifiedVisits.toString()}
          subtitle="Successfully validated"
          icon={<CheckCircle2 className="w-6 h-6" />}
          colorClass="text-emerald-600"
          bgClass="bg-emerald-50"
        />
        <SummaryCard
          title="Pending Visits"
          value={pendingVisits.toString()}
          subtitle="Awaiting sync/verify"
          icon={<Clock className="w-6 h-6" />}
          colorClass="text-amber-600"
          bgClass="bg-amber-50"
        />
        <SummaryCard
          title="Coverage %"
          value={coveragePercent}
          subtitle="Territory completion"
          icon={<Navigation className="w-6 h-6" />}
          colorClass="text-blue-600"
          bgClass="bg-blue-50"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mb-8">
        <div className="xl:col-span-2 flex flex-col gap-4">
          <FilterBar>
            <SearchInput value={search} onChange={setSearch} placeholder="Search chemist or MR name..." />
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
              emptyMessage="No geo-tagged chemist visits found."
            />
          </TableCard>
        </div>

        <div className="xl:col-span-1">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Coverage Map</h2>
          <div className="bg-slate-100 rounded-xl border border-slate-200 overflow-hidden relative min-h-[400px] flex flex-col items-center justify-center shadow-inner">
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-900 via-transparent to-transparent bg-[length:20px_20px]" />
            <Store className="w-12 h-12 text-primary mb-3 relative z-10 opacity-70" />
            <h3 className="text-md font-semibold text-slate-700 relative z-10">Coverage Map Placeholder</h3>
            <p className="text-sm text-slate-500 text-center px-6 mt-2 relative z-10">Visualizing chemist locations, visit pins, and territory mapping.</p>
            
            <div className="absolute top-1/4 left-1/4">
              <MapPin className="w-6 h-6 text-indigo-500" />
            </div>
            <div className="absolute top-1/3 right-1/3">
              <MapPin className="w-6 h-6 text-indigo-500" />
            </div>
            <div className="absolute bottom-1/3 right-1/4">
              <MapPin className="w-6 h-6 text-indigo-500" />
            </div>
            
            <div className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur p-3 rounded-lg border border-slate-200 text-xs text-slate-600 flex justify-between">
              <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-indigo-500 block"></span> Chemist Location</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}