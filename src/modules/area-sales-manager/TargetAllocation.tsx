import React, { useState, useEffect } from 'react';
import { PageHeader, SummaryCard, ActionButton, DataTable, Badge, FilterBar, SearchInput, SelectFilter, DrawerField } from './components/shared';
import { Target, TrendingUp, AlertCircle, Calendar, CheckCircle, Eye, Search, Save, Send, Download, ChevronDown, FileText, Table as TableIcon } from 'lucide-react';
import { Drawer } from '../../components/ui/Drawer';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function TargetAllocation() {
  const [activeStep, setActiveStep] = useState<'overview' | 'mr'>('overview');
  const [summaries, setSummaries] = useState<any[]>([]);
  const [mrs, setMrs] = useState<any[]>([]);
  
  const [search, setSearch] = useState('');
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedMR, setSelectedMR] = useState<any | null>(null);
  
  const [allocationInputs, setAllocationInputs] = useState<Record<string, string>>({});

  useEffect(() => {
    // Realistic production mock data for MRs
    const mockMRs = [
      { id: '1', employeeCode: 'EMP-001', employeeName: 'Deepak Tyagi', headquarters: 'Mumbai', territory: 'South Mumbai', allocatedTarget: 2500000, assignedTarget: 3000000, status: 'Allocated' },
      { id: '2', employeeCode: 'EMP-002', employeeName: 'Rohit Saxena', headquarters: 'Mumbai', territory: 'Navi Mumbai', allocatedTarget: 2000000, assignedTarget: 2500000, status: 'Allocated' },
      { id: '3', employeeCode: 'EMP-003', employeeName: 'Vikram Singh', headquarters: 'Thane', territory: 'Thane', allocatedTarget: 2800000, assignedTarget: 3000000, status: 'Allocated' },
      { id: '4', employeeCode: 'EMP-004', employeeName: 'Sneha Patel', headquarters: 'Mumbai', territory: 'Andheri', allocatedTarget: 2200000, assignedTarget: 2500000, status: 'Allocated' },
      { id: '5', employeeCode: 'EMP-005', employeeName: 'Amit Kumar', headquarters: 'Pune', territory: 'Pune East', allocatedTarget: 0, assignedTarget: 0, status: 'Pending' },
      { id: '6', employeeCode: 'EMP-006', employeeName: 'Rahul Verma', headquarters: 'Pune', territory: 'Pune West', allocatedTarget: 2500000, assignedTarget: 2500000, status: 'Allocated' },
      { id: '7', employeeCode: 'EMP-007', employeeName: 'Neha Sharma', headquarters: 'Nashik', territory: 'Nashik Central', allocatedTarget: 0, assignedTarget: 0, status: 'Pending' },
      { id: '8', employeeCode: 'EMP-008', employeeName: 'Priya Desai', headquarters: 'Nagpur', territory: 'Nagpur North', allocatedTarget: 0, assignedTarget: 0, status: 'Pending' }
    ];
    setMrs(mockMRs);

    const initialAllocations: Record<string, string> = {};
    mockMRs.forEach(mr => {
      if (mr.allocatedTarget > 0) {
        initialAllocations[mr.id] = mr.allocatedTarget.toString();
      }
    });
    setAllocationInputs(initialAllocations);

    const mockSummaries = [
      {
        parentAllocation: {
          financialYear: 'FY 2026-27',
          allocationPeriod: 'Q2 (Jul - Sep)',
          startDate: '2026-07-01',
          endDate: '2026-09-30',
          targetAmount: 15000000,
        },
        allocatedAmount: 12000000,
        remainingAmount: 3000000,
        allocations: mockMRs.filter(m => m.status === 'Allocated')
      }
    ];
    setSummaries(mockSummaries);
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const activeSummary = summaries.length > 0 ? summaries[0] : null;
  const activeTarget = activeSummary?.parentAllocation;

  const allocatedToMrs = activeSummary ? activeSummary.allocatedAmount : 0;
  const remainingTarget = activeSummary ? activeSummary.remainingAmount : 0;
  const activeMrCount = mrs.length;
  const allocatedMrCount = mrs.filter(m => m.status === 'Allocated').length;
  const pendingAllocationCount = activeMrCount - allocatedMrCount;

  const recentPlansData = summaries.map(s => {
    return {
      ...s.parentAllocation,
      allocatedAmount: s.allocatedAmount,
      remainingAmount: s.remainingAmount,
      status: s.remainingAmount === 0 ? 'Fully Allocated' : (s.allocatedAmount > 0 ? 'Partially Allocated' : 'Pending Allocation')
    };
  });

  const currentTotalInputAllocation = Object.values(allocationInputs).reduce((sum, val) => sum + (Number(val) || 0), 0);
  const remainingAfterInputs = activeTarget ? activeTarget.targetAmount - currentTotalInputAllocation : 0;

  const handleValidateAllocation = () => {
    if (activeTarget && currentTotalInputAllocation > activeTarget.targetAmount) {
      alert(`Total allocated amount (${formatCurrency(currentTotalInputAllocation)}) exceeds Assigned Target (${formatCurrency(activeTarget.targetAmount)})`);
      return false;
    }
    alert("Validation Successful! Amounts are within target limits.");
    return true;
  };

  const handleSubmitFinalPlan = () => {
    if (activeTarget && currentTotalInputAllocation > activeTarget.targetAmount) {
      alert(`Validation Failed: Allocated amount exceeds Assigned Target.`);
      return;
    }
    alert("Final Plan Submitted successfully! Targets allocated to MRs.");
    setActiveStep('overview');
  };

  const handleView = (row: any) => {
    setSelectedMR(row);
    setDrawerOpen(true);
  };

  const handleExportExcel = () => {
    if (mrs.length === 0) return;
    const exportData = mrs.map(row => ({
      'MR Code': row.employeeCode,
      'MR Name': row.employeeName,
      'Headquarters': row.headquarters,
      'Territory': row.territory,
      'Allocated Target': allocationInputs[row.id] || 0,
      'Status': row.status
    }));
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "MR Allocations");
    XLSX.writeFile(workbook, "MR_Target_Allocations.xlsx");
    setIsExportOpen(false);
  };

  const handleExportPDF = () => {
    if (mrs.length === 0) return;
    const doc = new jsPDF('landscape');
    doc.setFontSize(16);
    doc.text("MR Target Allocations", 14, 20);
    const tableColumn = ["MR Code", "MR Name", "Headquarters", "Territory", "Allocated Target", "Status"];
    const tableRows = mrs.map(row => [
      row.employeeCode,
      row.employeeName,
      row.headquarters,
      row.territory,
      allocationInputs[row.id] || '0',
      row.status
    ]);
    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 35,
      theme: 'grid',
      headStyles: { fillColor: [22, 60, 120] }
    });
    doc.save("MR_Target_Allocations.pdf");
    setIsExportOpen(false);
  };

  return (
    <div className="p-6">
      <PageHeader 
        title="Target Allocation Workspace" 
        subtitle="Review targets received from the Regional Sales Manager and allocate them to Medical Representatives."
        actions={
          activeStep === 'mr' ? (
            <div className="relative">
              <button 
                onClick={() => setIsExportOpen(!isExportOpen)}
                disabled={mrs.length === 0}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors shadow-sm border ${
                  mrs.length === 0 
                    ? 'bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed' 
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                }`}
              >
                <Download className="w-4 h-4" /> Export <ChevronDown className="w-4 h-4 text-slate-400" />
              </button>
              
              {isExportOpen && mrs.length > 0 && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setIsExportOpen(false)}></div>
                  <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-lg shadow-lg z-20 py-1 overflow-hidden">
                    <button onClick={handleExportExcel} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors text-left">
                      <TableIcon className="w-4 h-4 text-emerald-600" /> Export as Excel (.xlsx)
                    </button>
                    <button onClick={handleExportPDF} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors text-left">
                      <FileText className="w-4 h-4 text-rose-600" /> Export as PDF (.pdf)
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : undefined
        }
      />

      {/* Tabs */}
      <div className="flex space-x-1 bg-slate-100 p-1 rounded-lg w-max mb-6">
        <button
          onClick={() => setActiveStep('overview')}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            activeStep === 'overview' ? 'bg-white text-[#163c78] shadow-sm' : 'text-slate-600 hover:bg-slate-200'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveStep('mr')}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            activeStep === 'mr' ? 'bg-white text-[#163c78] shadow-sm' : 'text-slate-600 hover:bg-slate-200'
          }`}
          disabled={!activeTarget}
          title={!activeTarget ? "No active assigned targets to allocate" : ""}
        >
          MR Allocation
        </button>
      </div>

      {activeStep === 'overview' && (
        <div className="animate-in fade-in duration-500">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <SummaryCard
              title="Assigned Target"
              value={activeTarget ? formatCurrency(activeTarget.targetAmount) : 'Not Set'}
              subtitle={activeTarget ? `FY ${activeTarget.financialYear}` : 'Awaiting assignment'}
              icon={<Target className="w-6 h-6" />}
              colorClass={activeTarget ? "text-[#163c78]" : "text-slate-400"}
              bgClass={activeTarget ? "bg-blue-50" : "bg-slate-100"}
            />
            <SummaryCard
              title="Total Allocated"
              value={formatCurrency(allocatedToMrs)}
              subtitle={activeTarget ? `${((allocatedToMrs/activeTarget.targetAmount)*100 || 0).toFixed(1)}% Distributed` : ''}
              icon={<TrendingUp className="w-6 h-6" />}
              colorClass="text-emerald-600"
              bgClass="bg-emerald-50"
            />
            <SummaryCard
              title="Remaining Target"
              value={formatCurrency(remainingTarget)}
              subtitle="Available for allocation"
              icon={<AlertCircle className="w-6 h-6" />}
              colorClass={remainingTarget > 0 ? "text-amber-600" : "text-slate-400"}
              bgClass={remainingTarget > 0 ? "bg-amber-50" : "bg-slate-100"}
            />
            <SummaryCard
              title="Planning Period"
              value={activeTarget?.allocationPeriod || 'N/A'}
              subtitle="Current active cycle"
              icon={<Calendar className="w-6 h-6" />}
              colorClass="text-purple-600"
              bgClass="bg-purple-50"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <SummaryCard title="Total Active MRs" value={activeMrCount.toString()} icon={<Target className="w-6 h-6" />} colorClass="text-slate-600" bgClass="bg-slate-50" />
            <SummaryCard title="Allocated MRs" value={allocatedMrCount.toString()} icon={<CheckCircle className="w-6 h-6" />} colorClass="text-emerald-600" bgClass="bg-emerald-50" />
            <SummaryCard title="Pending Allocation" value={pendingAllocationCount.toString()} icon={<AlertCircle className="w-6 h-6" />} colorClass="text-amber-600" bgClass="bg-amber-50" />
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Assigned Targets (from RSM)</h3>
            <DataTable 
              columns={[
                { key: 'financialYear', label: 'Financial Year' },
                { key: 'allocationPeriod', label: 'Planning Period' },
                { key: 'startDate', label: 'Start Date', render: (row: any) => new Date(row.startDate).toLocaleDateString() },
                { 
                  key: 'status', 
                  label: 'Allocation Status', 
                  render: (row: any) => {
                    let variant: any = 'neutral';
                    if (row.status === 'Fully Allocated') variant = 'success';
                    else if (row.status === 'Partially Allocated') variant = 'warning';
                    else variant = 'danger';
                    return <Badge variant={variant}>{row.status}</Badge>;
                  }
                },
                { key: 'targetAmount', label: 'Received Amount', render: (row: any) => <span className="font-bold text-slate-800">{formatCurrency(row.targetAmount)}</span> },
                { key: 'allocatedAmount', label: 'Allocated Down', render: (row: any) => formatCurrency(row.allocatedAmount) },
                { key: 'remainingAmount', label: 'Remaining Balance', render: (row: any) => <span className={row.remainingAmount > 0 ? 'text-amber-600 font-semibold' : 'text-emerald-600 font-semibold'}>{formatCurrency(row.remainingAmount)}</span> }
              ]} 
              data={recentPlansData} 
              emptyMessage="No targets have been assigned to you yet." 
            />
          </div>
        </div>
      )}

      {activeStep === 'mr' && activeTarget && (
        <div className="animate-in fade-in duration-500 space-y-6">
          {/* Section 1 - Planning Summary */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 mb-4 uppercase tracking-wider border-b border-slate-200 pb-2">1. Planning Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
              <div><span className="block text-xs text-slate-500 font-semibold mb-1">Assigned Target</span><span className="text-sm font-medium text-[#163c78]">{formatCurrency(activeTarget.targetAmount)}</span></div>
              <div><span className="block text-xs text-slate-500 font-semibold mb-1">Allocated Amount</span><span className="text-sm font-medium text-emerald-600">{formatCurrency(currentTotalInputAllocation)}</span></div>
              <div><span className="block text-xs text-slate-500 font-semibold mb-1">Remaining Amount</span><span className={`text-sm font-medium ${remainingAfterInputs < 0 ? 'text-red-600' : 'text-amber-600'}`}>{formatCurrency(remainingAfterInputs)}</span></div>
              <div><span className="block text-xs text-slate-500 font-semibold mb-1">Active MR Count</span><span className="text-sm font-medium text-slate-800">{activeMrCount}</span></div>
              <div><span className="block text-xs text-slate-500 font-semibold mb-1">Pending Allocation</span><span className="text-sm font-medium text-slate-800">{pendingAllocationCount}</span></div>
            </div>
          </div>

          {/* Section 2 - Filters */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap gap-4 items-center justify-between">
            <div className="flex gap-4">
              <select className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-[#163c78] bg-white">
                <option>All Territories</option>
              </select>
              <select className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-[#163c78] bg-white">
                <option>All Status</option>
                <option>Pending</option>
                <option>Allocated</option>
              </select>
            </div>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search MR Name or Code..." 
                className="pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm w-64 focus:ring-2 focus:ring-[#163c78]"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {/* Section 3 - Allocation Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50">
               <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">2. MR Target Allocation</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase">
                    <th className="p-4">MR Code</th>
                    <th className="p-4">MR Name</th>
                    <th className="p-4">Headquarters</th>
                    <th className="p-4">Territory</th>
                    <th className="p-4">Allocated Target (₹)</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {mrs.filter(a => a.employeeName.toLowerCase().includes(search.toLowerCase()) || a.employeeCode.toLowerCase().includes(search.toLowerCase())).map((mr) => (
                    <tr key={mr.id} className="hover:bg-slate-50">
                      <td className="p-4 text-sm font-medium text-slate-900">{mr.employeeCode}</td>
                      <td className="p-4 text-sm text-slate-700">{mr.employeeName}</td>
                      <td className="p-4 text-sm text-slate-700">{mr.headquarters || '-'}</td>
                      <td className="p-4 text-sm text-slate-700">{mr.territory || '-'}</td>
                      <td className="p-4">
                        <input 
                          type="number"
                          className="w-32 px-3 py-1.5 border border-slate-300 rounded focus:ring-2 focus:ring-[#163c78] focus:border-[#163c78] text-sm"
                          placeholder="Amount"
                          value={allocationInputs[mr.id] || ''}
                          onChange={(e) => setAllocationInputs({...allocationInputs, [mr.id]: e.target.value})}
                        />
                      </td>
                      <td className="p-4">
                        <Badge variant={allocationInputs[mr.id] ? 'success' : 'warning'}>
                          {allocationInputs[mr.id] ? 'Allocated' : 'Pending'}
                        </Badge>
                      </td>
                      <td className="p-4 text-right">
                        <button onClick={() => handleView(mr)} className="p-1.5 text-slate-400 hover:text-[#163c78] hover:bg-blue-50 rounded transition-colors" title="View Details">
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 4 & 5 - Summary & Action Buttons */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex gap-8">
               <div><span className="block text-xs text-slate-500 font-semibold mb-1">Total Allocated</span><span className="text-lg font-bold text-[#163c78]">{formatCurrency(currentTotalInputAllocation)}</span></div>
               <div><span className="block text-xs text-slate-500 font-semibold mb-1">Remaining Balance</span><span className={`text-lg font-bold ${remainingAfterInputs < 0 ? 'text-red-600' : 'text-emerald-600'}`}>{formatCurrency(remainingAfterInputs)}</span></div>
            </div>
            
            <div className="flex gap-4">
              <button 
                type="button" 
                onClick={() => alert("Draft saved!")}
                className="px-6 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Save Draft
              </button>
              <button 
                type="button"
                onClick={handleValidateAllocation}
                className="px-6 py-2.5 text-sm font-medium text-white bg-amber-500 rounded-lg hover:bg-amber-600 transition-colors"
              >
                Validate Allocation
              </button>
              <button 
                type="button"
                onClick={handleSubmitFinalPlan}
                className="px-6 py-2.5 text-sm font-medium text-white bg-[#163c78] rounded-lg hover:bg-[#122e5c] transition-colors"
              >
                Submit Final Plan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Review Drawer */}
      <Drawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="MR Allocation Details"
      >
        {selectedMR && (
          <div className="flex flex-col h-full pb-8">
            <div className="space-y-1">
              
              <div className="py-3 border-t border-slate-100 first:border-0">
                <p className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">1. MR Information</p>
                <div className="space-y-1">
                  <DrawerField label="MR Code" value={selectedMR.employeeCode} />
                  <DrawerField label="MR Name" value={selectedMR.employeeName} />
                  <DrawerField label="Headquarters" value={selectedMR.headquarters} />
                  <DrawerField label="Territory" value={selectedMR.territory} />
                </div>
              </div>

              <div className="py-3 border-t border-slate-100">
                <p className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">2. Target Details</p>
                <div className="space-y-1">
                  <DrawerField label="Assigned Target (RSM)" value={activeTarget ? formatCurrency(activeTarget.targetAmount) : '-'} />
                  <DrawerField label="Allocated Target" value={formatCurrency(allocationInputs[selectedMR.id] || 0)} />
                  <DrawerField label="Status" value={
                    <Badge variant={allocationInputs[selectedMR.id] ? 'success' : 'warning'}>
                      {allocationInputs[selectedMR.id] ? 'Allocated' : 'Pending'}
                    </Badge>
                  } />
                </div>
              </div>

              <div className="py-3 border-t border-slate-100">
                <p className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">3. Remarks</p>
                <div className="space-y-1">
                  <DrawerField label="Remarks" value="Focus on maximizing new product lines in this territory." />
                </div>
              </div>
            </div>
            
            <div className="mt-auto pt-6 border-t border-slate-100">
              <button
                onClick={() => setDrawerOpen(false)}
                className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition-colors"
              >
                Close Details
              </button>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
