import React, { useState, useEffect } from 'react';
import { PageHeader, FilterBar, SearchInput, SelectFilter, TableCard, DataTable, Badge, ActionButton } from './components/shared';
import { Users, Eye, Network } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { asmService } from '../../services/asmService';
import type { Employee } from '../super-admin/sales-organization/types';

export default function SalesOrganization() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [search, setSearch] = useState('');
  
  const [employeeModalOpen, setEmployeeModalOpen] = useState(false);
  const [hierarchyModalOpen, setHierarchyModalOpen] = useState(false);
  const [selectedEmp, setSelectedEmp] = useState<Employee | null>(null);

  useEffect(() => {
    try {
      setEmployees(asmService.getReportingMRs());
    } catch (e) {
      console.warn("Failed to load reporting MRs", e);
    }
  }, []);

  const filteredData = employees.filter(row => 
    (row.employeeName.toLowerCase().includes(search.toLowerCase()) || row.employeeCode?.toLowerCase().includes(search.toLowerCase()))
  );

  const handleViewEmployee = (row: Employee) => {
    setSelectedEmp(row);
    setEmployeeModalOpen(true);
  };

  const handleViewHierarchy = (row: Employee) => {
    setSelectedEmp(row);
    setHierarchyModalOpen(true);
  };

  const columns = [
    { key: 'employeeCode', label: 'Emp Code', render: (row: any) => <span className="font-medium text-[#163c78]">{row.employeeCode || row.id}</span> },
    { key: 'employeeName', label: 'Employee Name', render: (row: any) => <span className="font-semibold text-slate-800">{row.employeeName}</span> },
    { key: 'designation', label: 'Designation', render: (row: any) => <Badge variant="neutral">{row.designation}</Badge> },
    { key: 'reportsTo', label: 'Reports To' },
    { key: 'territory', label: 'Territory', render: (row: any) => row.territory || '-' },
    { key: 'headquarters', label: 'Headquarters', render: (row: any) => row.headquarters || '-' },
    { key: 'status', label: 'Status', render: (row: any) => <Badge variant={row.status === 'Active' ? 'success' : 'error'}>{row.status}</Badge> },
    {
      key: 'actions',
      label: 'Actions',
      render: (row: any) => (
        <div className="flex gap-2">
          <button onClick={() => handleViewEmployee(row)} className="p-1.5 text-slate-400 hover:text-[#163c78] hover:bg-blue-50 rounded transition-colors" title="View Employee">
            <Eye className="w-4 h-4" />
          </button>
          <button onClick={() => handleViewHierarchy(row)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors" title="View Hierarchy">
            <Network className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="p-6">
      <PageHeader 
        title="Area Sales Organization" 
        subtitle="Read-only view of Medical Representatives in your area."
      />

      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search by name or ID..." />
      </FilterBar>

      <TableCard>
        <DataTable columns={columns} data={filteredData} emptyMessage="No Medical Representatives found." />
      </TableCard>

      {/* View Employee Modal */}
      <Modal
        isOpen={employeeModalOpen}
        onClose={() => setEmployeeModalOpen(false)}
        title="Employee Details"
        footer={<ActionButton variant="secondary" onClick={() => setEmployeeModalOpen(false)}>Close</ActionButton>}
      >
        {selectedEmp && (
          <div className="space-y-6">
            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
              <div className="w-16 h-16 bg-blue-100 text-blue-700 flex items-center justify-center rounded-full text-2xl font-bold">
                {selectedEmp.employeeName.charAt(0)}
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">{selectedEmp.employeeName}</h3>
                <p className="text-sm text-slate-500">{selectedEmp.employeeCode || selectedEmp.id} • {selectedEmp.designation}</p>
                <div className="mt-2">
                  <Badge variant={selectedEmp.status === 'Active' ? 'success' : 'error'}>{selectedEmp.status}</Badge>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-white border border-slate-100 rounded-xl shadow-sm">
                <p className="text-xs font-semibold text-slate-500 uppercase">Reports To</p>
                <p className="text-sm font-medium text-slate-800 mt-1">{selectedEmp.reportsTo}</p>
              </div>
              <div className="p-4 bg-white border border-slate-100 rounded-xl shadow-sm">
                <p className="text-xs font-semibold text-slate-500 uppercase">Headquarters</p>
                <p className="text-sm font-medium text-slate-800 mt-1">{selectedEmp.headquarters || '-'}</p>
              </div>
              <div className="p-4 bg-white border border-slate-100 rounded-xl shadow-sm col-span-2">
                <p className="text-xs font-semibold text-slate-500 uppercase">Territory</p>
                <p className="text-sm font-medium text-slate-800 mt-1">{selectedEmp.territory || '-'}</p>
              </div>
            </div>
            
            <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100 text-sm text-blue-700 text-center">
              This is a read-only profile view. Edits must be requested from the Super Admin.
            </div>
          </div>
        )}
      </Modal>

      {/* View Hierarchy Modal */}
      <Modal
        isOpen={hierarchyModalOpen}
        onClose={() => setHierarchyModalOpen(false)}
        title="Reporting Hierarchy"
        footer={<ActionButton variant="secondary" onClick={() => setHierarchyModalOpen(false)}>Close</ActionButton>}
      >
        {selectedEmp && (
          <div className="space-y-6">
            <div className="flex flex-col items-center">
               <div className="bg-white border border-slate-200 shadow-sm p-4 rounded-xl text-center w-full max-w-sm opacity-60">
                  <h4 className="font-bold text-slate-800">{selectedEmp.reportsTo}</h4>
                  <p className="text-xs text-slate-500">Manager</p>
               </div>
               <div className="w-px h-6 bg-slate-300"></div>
               <div className="bg-blue-50 border border-blue-200 shadow-sm p-4 rounded-xl text-center w-full max-w-sm">
                  <h4 className="font-bold text-[#163c78]">{selectedEmp.employeeName}</h4>
                  <p className="text-xs text-blue-600">{selectedEmp.designation}</p>
               </div>
               <div className="w-px h-6 bg-slate-300"></div>
               <div className="bg-white border border-slate-200 shadow-sm p-4 rounded-xl text-center w-full max-w-sm opacity-60">
                  <h4 className="font-bold text-slate-800">Direct Reports</h4>
                  <p className="text-xs text-slate-500">No downstream reports</p>
               </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
