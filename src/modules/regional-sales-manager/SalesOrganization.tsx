import React, { useState, useEffect } from 'react';
import { PageHeader, FilterBar, SearchInput, SelectFilter, TableCard, DataTable, Badge, ActionButton, DrawerField } from './components/shared';
import { Users, Eye, Map, Share2, Loader2 } from 'lucide-react';
import { rsmService } from '../../services/rsmService';
import { employeeService } from '../../services/employeeService';
import { territoryService } from '../../services/territoryService';
import { targetAllocationService } from '../../services/targetAllocationService';
import { Modal } from '../../components/ui/Modal';
import type { Employee, Territory } from '../super-admin/sales-organization/types';
import type { TargetAllocationRecord } from '../../services/targetAllocationService';

export default function SalesOrganization() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [asms, setAsms] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals state
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  
  const [employeeModalOpen, setEmployeeModalOpen] = useState(false);
  const [employeeAllocations, setEmployeeAllocations] = useState<TargetAllocationRecord[]>([]);

  const [hierarchyModalOpen, setHierarchyModalOpen] = useState(false);
  const [reportingManager, setReportingManager] = useState<Employee | null>(null);
  const [subordinates, setSubordinates] = useState<Employee[]>([]);

  const [territoryModalOpen, setTerritoryModalOpen] = useState(false);
  const [employeeTerritory, setEmployeeTerritory] = useState<Territory | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const reportingAsms = await rsmService.getReportingASMs();
      setAsms(reportingAsms);
    } catch (e: any) {
      console.warn('Failed to load ASMs:', e);
      setError(e.message || 'Failed to load reporting ASMs from database');
    } finally {
      setLoading(false);
    }
  };

  const filteredData = asms.filter(row => 
    ((row.employeeName || '').toLowerCase().includes(search.toLowerCase()) || 
     (row.employeeCode || '').toLowerCase().includes(search.toLowerCase())) &&
    (statusFilter ? row.status === statusFilter : true)
  );

  const handleViewEmployee = async (row: Employee) => {
    setSelectedEmployee(row);
    try {
      const allocs = await targetAllocationService.getAllocationsToEmployee(row.id);
      setEmployeeAllocations(allocs.filter(a => a.status === 'Active' || a.status === 'Allocated'));
    } catch (e) {
      console.error(e);
      setEmployeeAllocations([]);
    }
    setEmployeeModalOpen(true);
  };

  const handleViewHierarchy = async (row: Employee) => {
    setSelectedEmployee(row);
    try {
      const allEmps = await employeeService.getEmployees();
      const manager = allEmps.find(e => String(e.id) === String(row.reportsToId) || e.employeeName === row.reportsTo) || null;
      setReportingManager(manager);

      const subs = allEmps.filter(e => e.status === 'Active' && (String(e.reportsToId) === String(row.id) || e.reportsTo === row.employeeName));
      setSubordinates(subs);
    } catch (e) {
      console.error(e);
      setReportingManager(null);
      setSubordinates([]);
    }
    setHierarchyModalOpen(true);
  };

  const handleViewTerritory = (row: Employee) => {
    setSelectedEmployee(row);
    try {
      const territories = territoryService.getAdminTerritories();
      const territory = territories.find(t => 
        t.status === 'Active' && 
        (t.assignedManager === row.employeeName || (t as any).assignedManagerId === row.id)
      ) || null;
      setEmployeeTerritory(territory);
    } catch (e) {
      console.error(e);
      setEmployeeTerritory(null);
    }
    setTerritoryModalOpen(true);
  };

  const columns = [
    { key: 'employeeCode', label: 'Employee Code', render: (row: Employee) => row.employeeCode || `ASM-${row.id}` },
    { key: 'employeeName', label: 'Employee Name' },
    { key: 'designation', label: 'Designation' },
    { key: 'reportsTo', label: 'Reports To', render: (row: Employee) => row.reportsTo || '-' },
    { 
      key: 'status', 
      label: 'Status',
      render: (row: Employee) => (
        <Badge variant={row.status === 'Active' ? 'success' : 'neutral'}>
          {row.status}
        </Badge>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row: Employee) => (
        <div className="flex gap-2">
          <button 
            onClick={() => handleViewEmployee(row)} 
            className="p-1.5 text-slate-400 hover:text-[#163c78] hover:bg-blue-50 rounded transition-colors" 
            title="View Employee"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button 
            onClick={() => handleViewHierarchy(row)} 
            className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors" 
            title="View Hierarchy"
          >
            <Share2 className="w-4 h-4" />
          </button>
          <button 
            onClick={() => handleViewTerritory(row)} 
            className="p-1.5 text-slate-400 hover:text-violet-600 hover:bg-violet-50 rounded transition-colors" 
            title="View Territory"
          >
            <Map className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="p-6">
      <PageHeader 
        title="Regional Sales Organization" 
        subtitle="Live hierarchy view of Area Sales Managers reporting to you (Database Integrated)."
      />

      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search by name or code..." />
        <SelectFilter 
          value={statusFilter} 
          onChange={setStatusFilter} 
          placeholder="All Statuses"
          options={[
            { label: 'Active', value: 'Active' },
            { label: 'Inactive', value: 'Inactive' }
          ]}
        />
      </FilterBar>

      {error && (
        <div className="mb-4 p-4 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-lg">
          {error}
        </div>
      )}

      <TableCard>
        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center text-slate-500">
            <Loader2 className="w-8 h-8 animate-spin text-[#163c78] mb-2" />
            <p className="text-sm">Loading reporting ASMs from database...</p>
          </div>
        ) : (
          <DataTable columns={columns} data={filteredData} emptyMessage="No reporting ASMs found in database." />
        )}
      </TableCard>

      {/* View Employee Details Modal */}
      <Modal 
        isOpen={employeeModalOpen} 
        onClose={() => setEmployeeModalOpen(false)} 
        title="Employee Details"
        footer={<ActionButton variant="secondary" onClick={() => setEmployeeModalOpen(false)}>Close</ActionButton>}
      >
        {selectedEmployee && (
          <div className="space-y-6">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <h3 className="text-sm font-bold text-slate-800 mb-4">Personal & Professional Info</h3>
              <div className="grid grid-cols-2 gap-4">
                <DrawerField label="Employee Code" value={selectedEmployee.employeeCode || `ASM-${selectedEmployee.id}`} />
                <DrawerField label="Employee Name" value={selectedEmployee.employeeName} />
                <DrawerField label="Designation" value={selectedEmployee.designation} />
                <DrawerField label="Reporting Manager" value={selectedEmployee.reportsTo || '-'} />
                <DrawerField label="Joining Date" value={selectedEmployee.joiningDate || 'N/A'} />
                <DrawerField label="Employment Status" value={<Badge variant={selectedEmployee.status === 'Active' ? 'success' : 'neutral'}>{selectedEmployee.status}</Badge>} />
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <h3 className="text-sm font-bold text-slate-800 mb-4">Location Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <DrawerField label="Zone" value={selectedEmployee.zone || 'N/A'} />
                <DrawerField label="Region" value={selectedEmployee.region || 'N/A'} />
                <DrawerField label="Headquarters" value={selectedEmployee.headquarters || 'N/A'} />
                <DrawerField label="Area" value={selectedEmployee.area || 'N/A'} />
              </div>
            </div>

            {employeeAllocations.length > 0 && (
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <h3 className="text-sm font-bold text-slate-800 mb-4">Active Target Allocations</h3>
                <div className="space-y-3">
                  {employeeAllocations.map(alloc => (
                    <div key={alloc.id} className="flex justify-between items-center p-3 bg-white border border-slate-200 rounded-lg">
                      <div>
                        <p className="text-sm font-semibold text-slate-800">Target #{alloc.id}</p>
                        <p className="text-xs text-slate-500">Financial Year: {alloc.financialYear || '-'}</p>
                      </div>
                      <span className="font-bold text-[#163c78]">₹{(alloc.targetAmount / 100000).toFixed(2)} L</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
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
        {selectedEmployee && (
          <div className="space-y-6">
            {reportingManager && (
              <div className="flex flex-col items-center">
                <div className="bg-blue-50 border border-blue-200 shadow-sm p-3 rounded-xl text-center w-full max-w-sm">
                  <h4 className="font-bold text-slate-800">{reportingManager.employeeName}</h4>
                  <p className="text-xs text-slate-500">{reportingManager.designation}</p>
                  <Badge variant="neutral" className="mt-2 text-[10px]">Reporting Manager</Badge>
                </div>
                <div className="w-px h-6 bg-slate-300"></div>
              </div>
            )}

            <div className="flex flex-col items-center">
              <div className="bg-white border-2 border-[#163c78] shadow-md p-4 rounded-xl text-center w-full max-w-sm">
                <h4 className="font-bold text-[#163c78] text-lg">{selectedEmployee.employeeName}</h4>
                <p className="text-sm text-slate-600">{selectedEmployee.designation}</p>
                <Badge variant="success" className="mt-2">Selected Employee</Badge>
              </div>
            </div>

            {subordinates.length > 0 ? (
              <div className="flex flex-col items-center">
                <div className="w-px h-6 bg-slate-300"></div>
                <div className="w-full max-w-md bg-slate-50 border border-slate-200 rounded-xl p-4">
                  <h4 className="text-sm font-bold text-slate-700 mb-3 text-center">Direct Subordinates ({subordinates.length})</h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                    {subordinates.map(sub => (
                      <div key={sub.id} className="flex justify-between items-center bg-white p-2 border border-slate-200 rounded-lg">
                        <div>
                          <p className="text-sm font-semibold text-slate-800">{sub.employeeName}</p>
                          <p className="text-xs text-slate-500">{sub.designation}</p>
                        </div>
                        <Badge variant="neutral" className="text-[10px]">{sub.employeeCode || `EMP-${sub.id}`}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center mt-4 text-slate-500 text-sm">
                No direct subordinates found in database.
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* View Territory Modal */}
      <Modal
        isOpen={territoryModalOpen}
        onClose={() => setTerritoryModalOpen(false)}
        title="Territory Details"
        footer={<ActionButton variant="secondary" onClick={() => setTerritoryModalOpen(false)}>Close</ActionButton>}
      >
        {selectedEmployee && (
          <div className="space-y-4">
            {employeeTerritory ? (
              <>
                <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600">
                      <Map className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800">{employeeTerritory.territoryName}</h4>
                      <p className="text-sm text-emerald-600 font-medium">Assigned Territory</p>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <DrawerField label="Territory Code" value={employeeTerritory.territoryCode} />
                  <DrawerField label="Zone" value={employeeTerritory.zone} />
                  <DrawerField label="Region" value={employeeTerritory.region} />
                  <DrawerField label="Headquarters" value={employeeTerritory.headquarters} />
                  <DrawerField label="Description" value={employeeTerritory.description || '-'} />
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <Map className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 font-medium">No Territory Assigned</p>
                <p className="text-sm text-slate-400 mt-1">This employee is not currently mapped to an active territory in the master database.</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
