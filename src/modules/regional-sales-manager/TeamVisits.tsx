import React, { useState } from 'react';
import { PageHeader, FilterBar, SelectFilter, SearchInput, TableCard, DataTable, Badge, SummaryCard, Drawer, DrawerField } from './components/shared';
import { Download, Eye, Calendar, CheckCircle, Clock, ShieldCheck, FileText, Table as TableIcon, ChevronDown, Image as ImageIcon } from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const MOCK_VISITS_DATA = [
  {
    visitId: 'VST-2026-0801',
    date: '2026-08-01',
    asmName: 'Vikas Sharma',
    mrName: 'Rahul Verma',
    state: 'Maharashtra',
    headquarters: 'Mumbai',
    type: 'Doctor Visit',
    customerName: 'Dr. Suresh Patel',
    specialty: 'Cardiology',
    territory: 'Mumbai Central',
    checkIn: '10:00 AM',
    checkOut: '10:45 AM',
    duration: '45 mins',
    status: 'Completed',
    gpsAddress: '123 Health Clinic, Andheri West, Mumbai',
    gpsCoords: '19.1136° N, 72.8697° E',
    remarks: 'Discussed new cardiology range. Positive response.',
    orderBooked: 'Yes',
    products: 'CardioMax 10mg (50 boxes)',
    followUp: '2026-08-15',
    outcome: 'Successful'
  },
  {
    visitId: 'VST-2026-0802',
    date: '2026-08-01',
    asmName: 'Amit Desai',
    mrName: 'Sneha Patel',
    state: 'Gujarat',
    headquarters: 'Ahmedabad',
    type: 'Chemist Visit',
    customerName: 'Apollo Pharmacy',
    specialty: '-',
    territory: 'Ahmedabad East',
    checkIn: '11:30 AM',
    checkOut: '12:00 PM',
    duration: '30 mins',
    status: 'Completed',
    gpsAddress: '45 MG Road, Ahmedabad',
    gpsCoords: '23.0225° N, 72.5714° E',
    remarks: 'Stock checked. Placed replenishment order.',
    orderBooked: 'Yes',
    products: 'Paracetamol 650mg, Cough Syrup',
    followUp: '2026-08-10',
    outcome: 'Successful'
  },
  {
    visitId: 'VST-2026-0803',
    date: '2026-08-02',
    asmName: 'Kiran Rao',
    mrName: 'Vivek Shetty',
    state: 'Maharashtra',
    headquarters: 'Pune',
    type: 'Joint Field Work',
    customerName: 'Dr. Anil Kumar',
    specialty: 'Pediatrics',
    territory: 'Pune Central',
    checkIn: '-',
    checkOut: '-',
    duration: '-',
    status: 'Planned',
    gpsAddress: '-',
    gpsCoords: '-',
    remarks: 'Scheduled to introduce new pediatric line.',
    orderBooked: 'No',
    products: '-',
    followUp: '-',
    outcome: 'Pending'
  }
];

export default function TeamVisits() {
  const [search, setSearch] = useState('');
  const [period, setPeriod] = useState('This Month');
  const [visitStatus, setVisitStatus] = useState('All');
  
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [viewingRecord, setViewingRecord] = useState<any>(null);
  
  const [isExportOpen, setIsExportOpen] = useState(false);

  const filteredData = MOCK_VISITS_DATA.filter(row => {
    const matchesSearch = search === '' || 
      row.asmName.toLowerCase().includes(search.toLowerCase()) ||
      row.mrName.toLowerCase().includes(search.toLowerCase()) ||
      row.customerName.toLowerCase().includes(search.toLowerCase());
      
    const matchesStatus = visitStatus === 'All' || row.status === visitStatus;

    return matchesSearch && matchesStatus;
  });

  const calculateStatus = (status: string) => {
    switch (status) {
      case 'Completed': return { label: 'Completed', color: 'success' };
      case 'Planned': return { label: 'Planned', color: 'warning' };
      case 'Missed': return { label: 'Missed', color: 'danger' };
      default: return { label: status, color: 'neutral' };
    }
  };

  const totalVisits = filteredData.length;
  const completedVisits = filteredData.filter(v => v.status === 'Completed').length;
  const pendingVisits = filteredData.filter(v => v.status === 'Planned').length;
  const compliancePct = totalVisits > 0 ? ((completedVisits / totalVisits) * 100).toFixed(1) : '0.0';

  const handleExportExcel = () => {
    if (filteredData.length === 0) return;
    
    const exportData = filteredData.map(row => ({
      'Visit Date': row.date,
      'ASM Name': row.asmName,
      'MR Name': row.mrName,
      'State': row.state,
      'Visit Type': row.type,
      'Customer': row.customerName,
      'Check-in': row.checkIn,
      'Check-out': row.checkOut,
      'Duration': row.duration,
      'Visit Status': row.status
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Team Visits");
    XLSX.writeFile(workbook, "Team_Visits.xlsx");
    setIsExportOpen(false);
  };

  const handleExportPDF = () => {
    if (filteredData.length === 0) return;
    
    const doc = new jsPDF('landscape');
    
    doc.setFontSize(16);
    doc.text("Team Visits Report", 14, 20);
    
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);
    
    const tableColumn = ["Date", "ASM Name", "MR Name", "Visit Type", "Customer", "Check-in", "Check-out", "Status"];
    const tableRows = filteredData.map(row => [
      row.date,
      row.asmName,
      row.mrName,
      row.type,
      row.customerName,
      row.checkIn,
      row.checkOut,
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

    doc.save("Team_Visits.pdf");
    setIsExportOpen(false);
  };

  const columns = [
    { key: 'date', label: 'Visit Date', render: (row: any) => <span className="font-medium text-slate-700">{row.date}</span> },
    { key: 'asmName', label: 'ASM Name', render: (row: any) => <span className="font-semibold text-slate-800">{row.asmName}</span> },
    { key: 'mrName', label: 'MR Name', render: (row: any) => <span className="font-medium text-slate-700">{row.mrName}</span> },
    { key: 'type', label: 'Visit Type' },
    {
      key: 'status',
      label: 'Visit Status',
      render: (row: any) => {
        const s = calculateStatus(row.status);
        return <Badge variant={s.color as any}>{s.label}</Badge>;
      }
    },
    {
      key: 'actions',
      label: 'Action',
      render: (row: any) => (
        <button 
          onClick={() => {
            setViewingRecord(row);
            setIsViewOpen(true);
          }}
          className="p-1.5 text-slate-400 hover:text-[#163c78] hover:bg-blue-50 rounded transition-colors" 
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
        title="Team Visits" 
        subtitle="Monitor field activities, joint visits, and check-ins for your ASMs and MRs."
        actions={
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
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <SummaryCard
          title="Total Visits"
          value={totalVisits.toString()}
          icon={<Calendar className="w-6 h-6" />}
          colorClass="text-blue-600"
          bgClass="bg-blue-50"
        />
        <SummaryCard
          title="Completed Visits"
          value={completedVisits.toString()}
          icon={<CheckCircle className="w-6 h-6" />}
          colorClass="text-emerald-600"
          bgClass="bg-emerald-50"
        />
        <SummaryCard
          title="Pending Visits"
          value={pendingVisits.toString()}
          icon={<Clock className="w-6 h-6" />}
          colorClass="text-amber-600"
          bgClass="bg-amber-50"
        />
        <SummaryCard
          title="Visit Compliance %"
          value={`${compliancePct}%`}
          icon={<ShieldCheck className="w-6 h-6" />}
          colorClass="text-purple-600"
          bgClass="bg-purple-50"
        />
      </div>

      <FilterBar>
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          <SelectFilter 
            value={period} 
            onChange={setPeriod} 
            options={[
              { label: 'This Month', value: 'This Month' },
              { label: 'Last Month', value: 'Last Month' },
              { label: 'Quarter', value: 'Quarter' },
              { label: 'Financial Year', value: 'Financial Year' }
            ]} 
          />
          <SelectFilter 
            value={visitStatus} 
            onChange={setVisitStatus} 
            options={[
              { label: 'All', value: 'All' },
              { label: 'Completed', value: 'Completed' },
              { label: 'Planned', value: 'Planned' },
              { label: 'Missed', value: 'Missed' }
            ]} 
            placeholder="All Statuses"
          />
          <div className="flex-1 max-w-md">
            <SearchInput value={search} onChange={setSearch} placeholder="Search ASM, MR, Doctor, Chemist..." />
          </div>
        </div>
      </FilterBar>

      <TableCard>
        <DataTable columns={columns} data={filteredData} emptyMessage="No field visits found matching your criteria." />
      </TableCard>

      {/* View Drawer */}
      <Drawer
        open={isViewOpen}
        onClose={() => setIsViewOpen(false)}
        title="Visit Details"
      >
        {viewingRecord && (
          <div className="flex flex-col h-full">
            <div className="space-y-6">
              
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 border-b border-slate-100 pb-1">Basic Information</h4>
                <div className="space-y-1">
                  <DrawerField label="Visit Date" value={viewingRecord.date} />
                  <DrawerField label="Visit Type" value={viewingRecord.type} />
                  <DrawerField label="Visit Status" value={
                    <Badge variant={calculateStatus(viewingRecord.status).color as any}>{calculateStatus(viewingRecord.status).label}</Badge>
                  } />
                </div>
              </div>
              
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 border-b border-slate-100 pb-1">Employee Information</h4>
                <div className="space-y-1">
                  <DrawerField label="ASM Name" value={viewingRecord.asmName} />
                  <DrawerField label="MR Name" value={viewingRecord.mrName} />
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 border-b border-slate-100 pb-1">Location Information</h4>
                <div className="space-y-1">
                  <DrawerField label="State" value={viewingRecord.state} />
                  <DrawerField label="Territory" value={viewingRecord.territory} />
                  <DrawerField label="Headquarters" value={viewingRecord.headquarters} />
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 border-b border-slate-100 pb-1">Customer Information</h4>
                <div className="space-y-1">
                  <DrawerField label={viewingRecord.type === 'Chemist Visit' ? 'Chemist Name' : 'Doctor Name'} value={viewingRecord.customerName} />
                  {viewingRecord.specialty && viewingRecord.specialty !== '-' && (
                    <DrawerField label="Specialty" value={viewingRecord.specialty} />
                  )}
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 border-b border-slate-100 pb-1">Visit Information</h4>
                <div className="space-y-1">
                  <DrawerField label="Check-in Time" value={viewingRecord.checkIn} />
                  <DrawerField label="Check-out Time" value={viewingRecord.checkOut} />
                  <DrawerField label="Duration" value={viewingRecord.duration} />
                  <DrawerField label="GPS Location" value={
                    <div className="flex flex-col">
                      <span className="text-sm">{viewingRecord.gpsAddress}</span>
                      <span className="text-xs text-slate-400 font-mono mt-1">{viewingRecord.gpsCoords}</span>
                    </div>
                  } />
                  <DrawerField label="Joint Visit" value={viewingRecord.type === 'Joint Field Work' ? 'Yes' : 'No'} />
                  
                  <div className="py-3 border-b border-slate-100 last:border-0">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Visit Remarks</p>
                    <div className="text-sm text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100 mt-2">
                      {viewingRecord.remarks}
                    </div>
                  </div>
                </div>
              </div>

            </div>
            
            <div className="mt-8 pt-4 pb-2 border-t border-slate-100">
              <button
                onClick={() => setIsViewOpen(false)}
                className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
