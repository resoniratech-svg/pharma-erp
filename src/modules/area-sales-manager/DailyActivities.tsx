import React, { useState, useEffect } from 'react';
import { PageHeader, FilterBar, SearchInput, SelectFilter, SummaryCard, TableCard, DataTable, Badge, ActionButton } from './components/shared';
import { Users, FileText, CheckCircle, Clock, MapPin, Play, Eye, Download, ChevronDown, Table as TableIcon } from 'lucide-react';
import { Drawer } from '../../components/ui/Drawer';
import { DrawerField } from './components/shared';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { asmService } from '../../services/asmService';

export default function DailyActivities() {
  const [activities, setActivities] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('Today');
  const [activityTypeFilter, setActivityTypeFilter] = useState('All Activities');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<any | null>(null);
  const [isExportOpen, setIsExportOpen] = useState(false);

  useEffect(() => {
    const loadActivities = async () => {
      try {
        const rawData = await asmService.getMRDailyActivities();
        const mappedData = rawData.map((d: any) => ({
          id: d.id?.toString(),
          date: new Date(d.reportDate).toLocaleDateString(),
          mrName: d.mr?.employee?.employeeName || 'Unknown',
          type: 'Daily Report',
          customer: `Doc: ${d.doctorVisits || 0}, Chem: ${d.chemistVisits || 0}`,
          territory: d.mr?.employee?.territory || '-',
          status: d.status,
          details: `Orders: ${d.ordersCollected || 0} | Remarks: ${d.remarks || '-'}`
        }));
        setActivities(mappedData);
      } catch (e) {
        console.warn("Failed to load activities", e);
      }
    };
    loadActivities();
  }, []);

  const filteredData = activities.filter(row => {
    const matchesSearch = row.mrName.toLowerCase().includes(search.toLowerCase()) || 
                          row.customer.toLowerCase().includes(search.toLowerCase());
    const matchesType = activityTypeFilter === 'All Activities' || row.type === activityTypeFilter;
    return matchesSearch && matchesType;
  });

  const doctorVisitsCount = filteredData.filter(d => d.type === 'Doctor Visit').length;
  const chemistVisitsCount = filteredData.filter(d => d.type === 'Chemist Visit').length;
  const ordersCount = filteredData.filter(d => d.type === 'Order Booking').length;

  const handleView = (row: any) => {
    setSelectedActivity(row);
    setDrawerOpen(true);
  };

  const handleExportExcel = () => {
    if (filteredData.length === 0) return;
    
    const exportData = filteredData.map(row => ({
      'Date': row.date,
      'MR Name': row.mrName,
      'Activity Type': row.type,
      'Customer': row.customer,
      'Territory': row.territory,
      'Status': row.status,
      'Details': row.details
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Daily Activities");
    XLSX.writeFile(workbook, "Daily_Activities.xlsx");
    setIsExportOpen(false);
  };

  const handleExportPDF = () => {
    if (filteredData.length === 0) return;
    
    const doc = new jsPDF('landscape');
    
    doc.setFontSize(16);
    doc.text("Daily Activities Report", 14, 20);
    
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);
    
    const tableColumn = ["Date", "MR Name", "Activity Type", "Customer", "Territory", "Status"];
    const tableRows = filteredData.map(row => [
      row.date,
      row.mrName,
      row.type,
      row.customer,
      row.territory,
      row.status
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 35,
      theme: 'grid',
      styles: { fontSize: 10 },
      headStyles: { fillColor: [22, 60, 120] } // #163c78
    });

    doc.save("Daily_Activities.pdf");
    setIsExportOpen(false);
  };

  const columns = [
    { key: 'date', label: 'Date', render: (row: any) => <span className="text-slate-600">{row.date}</span> },
    { key: 'mrName', label: 'MR Name', render: (row: any) => <span className="font-semibold text-slate-800">{row.mrName}</span> },
    { key: 'type', label: 'Activity Type', render: (row: any) => <Badge variant="neutral">{row.type}</Badge> },
    { key: 'customer', label: 'Customer', render: (row: any) => <span className="font-medium text-[#163c78]">{row.customer}</span> },
    { key: 'territory', label: 'Territory' },
    { key: 'status', label: 'Status', render: (row: any) => <Badge variant={row.status === 'Completed' ? 'success' : 'warning'}>{row.status}</Badge> },
    {
      key: 'actions',
      label: 'Action',
      render: (row: any) => (
        <button onClick={() => handleView(row)} className="p-1.5 text-slate-400 hover:text-[#163c78] hover:bg-blue-50 rounded transition-colors" title="View Details">
          <Eye className="w-4 h-4" />
        </button>
      )
    }
  ];

  return (
    <div className="p-6">
      <PageHeader 
        title="Daily Activities" 
        subtitle="Monitor daily field activities, doctor visits, chemist visits, and order bookings of your MRs."
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <SummaryCard 
          title="Today's Activities" 
          value={filteredData.length} 
          icon={<CheckCircle className="w-6 h-6" />} 
          colorClass="text-emerald-600" 
          bgClass="bg-emerald-50" 
        />
        <SummaryCard 
          title="Doctor Visits" 
          value={doctorVisitsCount} 
          icon={<Users className="w-6 h-6" />} 
          colorClass="text-indigo-600" 
          bgClass="bg-indigo-50" 
        />
        <SummaryCard 
          title="Chemist Visits" 
          value={chemistVisitsCount} 
          icon={<MapPin className="w-6 h-6" />} 
          colorClass="text-violet-600" 
          bgClass="bg-violet-50" 
        />
        <SummaryCard 
          title="Orders" 
          value={ordersCount} 
          icon={<FileText className="w-6 h-6" />} 
          colorClass="text-blue-600" 
          bgClass="bg-blue-50" 
        />
      </div>

      <FilterBar>
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          <SearchInput value={search} onChange={setSearch} placeholder="Search by MR or Customer..." />
          <SelectFilter
            value={dateFilter}
            onChange={setDateFilter}
            options={[
              { label: 'Today', value: 'Today' },
              { label: 'Yesterday', value: 'Yesterday' },
              { label: 'This Week', value: 'This Week' },
              { label: 'This Month', value: 'This Month' }
            ]}
          />
          <SelectFilter
            value={activityTypeFilter}
            onChange={setActivityTypeFilter}
            options={[
              { label: 'All Activities', value: 'All Activities' },
              { label: 'Doctor Visit', value: 'Doctor Visit' },
              { label: 'Chemist Visit', value: 'Chemist Visit' },
              { label: 'Order Booking', value: 'Order Booking' }
            ]}
          />
        </div>
      </FilterBar>

      <TableCard>
        <DataTable columns={columns} data={filteredData} emptyMessage="No activities found." />
      </TableCard>

      {/* Review Drawer */}
      <Drawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="Activity Details"
      >
        {selectedActivity && (
          <div className="flex flex-col h-full pb-8">
            <div className="space-y-1">
              
              <div className="py-3 border-t border-slate-100 first:border-0">
                <p className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">1. Activity Information</p>
                <div className="space-y-1">
                  <DrawerField label="Activity Date" value={selectedActivity.date} />
                  <DrawerField label="Activity Time" value="10:30 AM" />
                  <DrawerField label="Activity Type" value={selectedActivity.type} />
                </div>
              </div>

              <div className="py-3 border-t border-slate-100">
                <p className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">2. MR Information</p>
                <div className="space-y-1">
                  <DrawerField label="MR Code" value={`EMP-${selectedActivity.id.padStart(3, '0')}`} />
                  <DrawerField label="MR Name" value={selectedActivity.mrName} />
                  <DrawerField label="Headquarters" value="Mumbai" />
                  <DrawerField label="Territory" value={selectedActivity.territory} />
                </div>
              </div>

              <div className="py-3 border-t border-slate-100">
                <p className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">3. Customer Information</p>
                <div className="space-y-1">
                  <DrawerField label="Customer Type" value={selectedActivity.type === 'Doctor Visit' ? 'Doctor' : 'Chemist'} />
                  <DrawerField label="Customer Name" value={selectedActivity.customer} />
                  {selectedActivity.type === 'Doctor Visit' && (
                    <DrawerField label="Specialty" value="General Physician" />
                  )}
                  <DrawerField label={selectedActivity.type === 'Doctor Visit' ? 'Clinic Name' : 'Chemist Name'} value={selectedActivity.customer} />
                </div>
              </div>

              <div className="py-3 border-t border-slate-100">
                <p className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">4. Activity Details</p>
                <div className="space-y-1">
                  <DrawerField label="Products Discussed" value="Cardio Range, Multi-vitamins" />
                  <DrawerField label="Samples Given" value="5 Units" />
                  {selectedActivity.type === 'Order Booking' && (
                    <DrawerField label="Order Value" value="₹ 12,500" />
                  )}
                  <DrawerField label="Remarks" value={selectedActivity.details || '-'} />
                </div>
              </div>

              <div className="py-3 border-t border-slate-100">
                <p className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">5. Visit Information</p>
                <div className="space-y-1">
                  <DrawerField label="GPS Location" value="Verified" />
                  <DrawerField label="Visit Status" value={
                    <Badge variant={selectedActivity.status === 'Completed' ? 'success' : 'warning'}>
                      {selectedActivity.status}
                    </Badge>
                  } />
                  <DrawerField label="Check-in Time" value="10:30 AM" />
                  <DrawerField label="Check-out Time" value="10:45 AM" />
                </div>
              </div>

            </div>
            
            <div className="mt-auto pt-6 border-t border-slate-100">
              <button
                onClick={() => setDrawerOpen(false)}
                className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition-colors"
              >
                Close Activity Details
              </button>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
