import { useState, useEffect } from 'react';
import { Plus, Eye, Edit2, UserX, X, ChevronDown } from 'lucide-react';
import { salesOrganizationService } from '../../../services/salesOrganizationService';
import type { Employee, Designation } from './types';
import { DESIGNATIONS, STATUS_OPTIONS } from './constants';
import { StateSelector } from '../components/StateSelector';
import {
  DataTable,
  TableCard,
  SearchInput,
  SelectFilter,
  ActionButton,
  Badge,
  FilterBar,
  Drawer,
  DrawerField,
} from '../components/shared';
import type { Column } from '../components/shared';

export default function EmployeesTab() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    reloadEmployees();
  }, []);
  const [search, setSearch] = useState('');
  const [designationFilter, setDesignationFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [viewEmployee, setViewEmployee] = useState<Employee | null>(null);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  // Form State
  const [showReportsToDropdown, setShowReportsToDropdown] = useState(false);
  const [formData, setFormData] = useState({
    employeeCode: '',
    employeeName: '',
    designation: 'Medical Representative' as Designation,
    reportsTo: '',
    zone: '',
    region: '',
    state: '',
    territory: '',
    area: '',
    headquarters: '',
    joiningDate: new Date().toISOString().split('T')[0],
    status: 'Active' as 'Active' | 'Inactive',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const reloadEmployees = async () => {
    setLoading(true);
    try {
      const data = await salesOrganizationService.getEmployees();
      setEmployees(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Dynamically compute Reports To options based on chosen designation
  const getReportsToOptions = (designation: Designation): string[] => {
    const allEmps = employees;
    let options: string[] = [];
    switch (designation) {
      case 'Medical Representative':
        options = allEmps
          .filter((e) => e.designation === 'Area Sales Manager' && e.status === 'Active')
          .map((e) => e.employeeName);
        break;
      case 'Area Sales Manager':
        options = allEmps
          .filter((e) => e.designation === 'Regional Sales Manager' && e.status === 'Active')
          .map((e) => e.employeeName);
        break;
      case 'Regional Sales Manager':
        options = allEmps
          .filter((e) => e.designation === 'National Sales Head' && e.status === 'Active')
          .map((e) => e.employeeName);
        break;
      case 'National Sales Head':
        options = ['Owner / Super Admin'];
        break;
      default:
        options = ['Owner / Super Admin'];
    }

    try {
      const customManagersStr = localStorage.getItem('customReportingManagers');
      if (customManagersStr) {
        const customManagers = JSON.parse(customManagersStr);
        if (customManagers[designation]) {
          options = [...options, ...customManagers[designation]];
        }
      }
    } catch (e) {
      console.error('Failed to parse custom managers', e);
    }

    return Array.from(new Set(options));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    const code = formData.employeeCode.trim();
    if (!code) {
      newErrors.employeeCode = 'Employee Code is required.';
    } else if (code.length > 20) {
      newErrors.employeeCode = 'Employee Code cannot exceed 20 characters.';
    } else {
      const duplicateCode = employees.some(
        (e) => e.employeeCode.toLowerCase() === code.toLowerCase() && e.id !== editingEmployee?.id
      );
      if (duplicateCode) {
        newErrors.employeeCode = 'Employee Code must be unique. This code already exists.';
      }
    }

    const name = formData.employeeName.trim();
    if (!name) {
      newErrors.employeeName = 'Employee Name is required.';
    }

    if (!formData.designation) {
      newErrors.designation = 'Designation is required.';
    }

    if (formData.designation !== 'National Sales Head' && !formData.reportsTo) {
      newErrors.reportsTo = 'Reports To manager is required.';
    }

    if (!formData.zone.trim()) {
      newErrors.zone = 'Zone is required.';
    }

    if (!formData.region.trim()) {
      newErrors.region = 'Region is required.';
    }

    if (!formData.state.trim()) {
      newErrors.state = 'State is required.';
    }

    if (!formData.territory.trim()) {
      newErrors.territory = 'Territory is required.';
    }

    if (!formData.area.trim()) {
      newErrors.area = 'Area is required.';
    }

    if (!formData.headquarters.trim()) {
      newErrors.headquarters = 'Headquarters is required.';
    }

    if (!formData.joiningDate) {
      newErrors.joiningDate = 'Joining Date is required.';
    } else if (isNaN(new Date(formData.joiningDate).getTime())) {
      newErrors.joiningDate = 'Please select a valid Joining Date.';
    }

    if (!formData.status) {
      newErrors.status = 'Status is required.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Designation Prefix Map
  const DESIGNATION_PREFIX: Record<Designation, string> = {
    'National Sales Head': 'EMP-NSM-',
    'Regional Sales Manager': 'EMP-RSM-',
    'Area Sales Manager': 'EMP-ASM-',
    'Medical Representative': 'EMP-MR-',
  };

  // Helper to generate the next unique Employee Code based on Designation
  const generateNextEmployeeCode = (designation: Designation): string => {
    const prefix = DESIGNATION_PREFIX[designation] || 'EMP-MR-';
    const allEmps = employees;

    let maxSeq = 0;
    allEmps.forEach((emp) => {
      if (emp.employeeCode && emp.employeeCode.startsWith(prefix)) {
        const numPart = emp.employeeCode.replace(prefix, '');
        const num = parseInt(numPart, 10);
        if (!isNaN(num) && num > maxSeq) {
          maxSeq = num;
        }
      }
    });

    const nextSeq = maxSeq + 1;
    return `${prefix}${nextSeq.toString().padStart(3, '0')}`;
  };

  const handleOpenAddModal = () => {
    setEditingEmployee(null);
    setErrors({});
    const initialDesignation: Designation = 'Medical Representative';
    const reportsOptions = getReportsToOptions(initialDesignation);
    const autoCode = generateNextEmployeeCode(initialDesignation);
    
    const defaultManagerName = reportsOptions[0] || 'Owner / Super Admin';
    const allEmps = salesOrganizationService.getEmployees();
    const defaultManager = allEmps.find(e => e.employeeName === defaultManagerName);

    setFormData({
      employeeCode: autoCode,
      employeeName: '',
      designation: initialDesignation,
      reportsTo: defaultManagerName,
      zone: defaultManager?.zone || '',
      region: defaultManager?.region || '',
      state: defaultManager?.state || '',
      territory: '',
      area: '',
      headquarters: '',
      joiningDate: new Date().toISOString().split('T')[0],
      status: 'Active',
    });
    setShowModal(true);
  };

  const handleOpenEditModal = (emp: Employee) => {
    setEditingEmployee(emp);
    setErrors({});
    setFormData({
      employeeCode: emp.employeeCode,
      employeeName: emp.employeeName,
      designation: emp.designation,
      reportsTo: emp.reportsTo,
      zone: emp.zone,
      region: emp.region,
      state: emp.state,
      territory: emp.territory,
      area: emp.area,
      headquarters: emp.headquarters || '',
      joiningDate: emp.joiningDate,
      status: emp.status,
    });
    setShowModal(true);
  };

  const handleDesignationChange = (newDesignation: Designation) => {
    const options = getReportsToOptions(newDesignation);
    const defaultManagerName = options[0] || 'Owner / Super Admin';
    const allEmps = salesOrganizationService.getEmployees();
    const defaultManager = allEmps.find(e => e.employeeName === defaultManagerName);

    setFormData((prev) => {
      const nextCode = editingEmployee
        ? prev.employeeCode
        : generateNextEmployeeCode(newDesignation);
      return {
        ...prev,
        designation: newDesignation,
        employeeCode: nextCode,
        reportsTo: defaultManagerName,
        zone: editingEmployee ? prev.zone : (defaultManager?.zone || ''),
        region: editingEmployee ? prev.region : (defaultManager?.region || ''),
        state: editingEmployee ? prev.state : (defaultManager?.state || '')
      };
    });
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }

    const payload = {
      employeeCode: formData.employeeCode.trim(),
      employeeName: formData.employeeName.trim(),
      designation: formData.designation,
      reportsTo: formData.reportsTo,
      zone: formData.zone.trim(),
      region: formData.region.trim(),
      state: formData.state.trim(),
      territory: formData.territory.trim(),
      area: formData.area.trim(),
      headquarters: formData.headquarters.trim(),
      joiningDate: formData.joiningDate,
      status: formData.status,
    };

    try {
      if (editingEmployee) {
        await salesOrganizationService.updateEmployee(editingEmployee.id, payload);
      } else {
        await salesOrganizationService.addEmployee(payload);
      }

      // Persist custom reporting manager if it's new
      const currentOptions = getReportsToOptions(formData.designation);
      if (formData.reportsTo && !currentOptions.includes(formData.reportsTo)) {
        try {
          const customManagersStr = localStorage.getItem('customReportingManagers');
          const customManagers = customManagersStr ? JSON.parse(customManagersStr) : {};
          if (!customManagers[formData.designation]) {
            customManagers[formData.designation] = [];
          }
          if (!customManagers[formData.designation].includes(formData.reportsTo)) {
            customManagers[formData.designation].push(formData.reportsTo);
            localStorage.setItem('customReportingManagers', JSON.stringify(customManagers));
          }
        } catch (e) {
          console.error('Failed to save custom manager', e);
        }
      }

      reloadEmployees();
      setShowModal(false);
    } catch (err: any) {
      setErrors({ ...errors, form: err.message || 'An error occurred while saving.' });
    }
  };

  const handleDeactivate = async (emp: Employee) => {
    if (window.confirm(`Are you sure you want to deactivate ${emp.employeeName}?`)) {
      try {
        await salesOrganizationService.deactivateEmployee(emp.id);
        reloadEmployees();
      } catch (err: any) {
        alert(err.message || 'An error occurred while deactivating.');
      }
    }
  };

  // Filter Logic
  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch =
      search === '' ||
      emp.employeeName.toLowerCase().includes(search.toLowerCase()) ||
      emp.employeeCode.toLowerCase().includes(search.toLowerCase()) ||
      emp.area.toLowerCase().includes(search.toLowerCase()) ||
      (emp.headquarters && emp.headquarters.toLowerCase().includes(search.toLowerCase()));

    const matchesDesignation = designationFilter === '' || emp.designation === designationFilter;
    const matchesStatus = statusFilter === '' || emp.status === statusFilter;

    return matchesSearch && matchesDesignation && matchesStatus;
  });

  const columns: Column<Employee>[] = [
    {
      key: 'employeeCode',
      label: 'Employee Code',
      render: (emp) => <span className="font-mono text-slate-700 font-semibold">{emp.employeeCode}</span>,
    },
    {
      key: 'employeeName',
      label: 'Employee Name',
      render: (emp) => <span className="font-bold text-slate-900">{emp.employeeName}</span>,
    },
    {
      key: 'designation',
      label: 'Designation',
      render: (emp) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-violet-50 text-[#163c78] border border-violet-100">
          {emp.designation}
        </span>
      ),
    },
    {
      key: 'reportsTo',
      label: 'Reports To',
      render: (emp) => <span className="text-slate-600 font-medium">{emp.reportsTo || '—'}</span>,
    },
    {
      key: 'area',
      label: 'HQ / Area',
      render: (emp) => (
        <div className="flex flex-col">
          <span className="text-slate-900 text-xs font-semibold">{emp.headquarters || emp.area || 'N/A'}</span>
          <span className="text-slate-500 text-[11px]">{emp.area} | {emp.region}</span>
        </div>
      ),
    },
    {
      key: 'joiningDate',
      label: 'Joining Date',
      render: (emp) => <span className="text-slate-500 text-xs">{emp.joiningDate}</span>,
    },
    {
      key: 'status',
      label: 'Status',
      render: (emp) => (
        <Badge variant={emp.status === 'Active' ? 'success' : 'neutral'}>{emp.status}</Badge>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (emp) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewEmployee(emp)}
            title="View Details"
            className="p-1.5 text-slate-500 hover:text-[#163c78] hover:bg-slate-100 rounded-lg transition-colors"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleOpenEditModal(emp)}
            title="Edit Employee"
            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          {emp.status === 'Active' && (
            <button
              onClick={() => handleDeactivate(emp)}
              title="Deactivate Employee"
              className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
            >
              <UserX className="w-4 h-4" />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      {/* Filter Bar */}
      <FilterBar>
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search by Code, Name, HQ, Area..."
        />
        <SelectFilter
          value={designationFilter}
          onChange={setDesignationFilter}
          options={DESIGNATIONS.map((d) => ({ label: d, value: d }))}
          placeholder="All Designations"
        />
        <SelectFilter
          value={statusFilter}
          onChange={setStatusFilter}
          options={STATUS_OPTIONS.map((s) => ({ label: s, value: s }))}
          placeholder="All Statuses"
        />
        <div className="ml-auto">
          <ActionButton onClick={handleOpenAddModal} icon={<Plus className="w-4 h-4" />}>
            Add Employee
          </ActionButton>
        </div>
      </FilterBar>

      {/* Table */}
      <TableCard>
        {loading ? (
          <div className="p-8 text-center text-slate-500 font-medium">Loading employees...</div>
        ) : (
          <DataTable columns={columns} data={filteredEmployees} emptyMessage="No employees found." />
        )}
      </TableCard>

      {/* Create / Edit Modal Form */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm bg-slate-900/40"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl flex flex-col w-full max-w-2xl max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h2 className="text-xl font-bold text-slate-900">
                {editingEmployee ? 'Edit Sales Employee' : 'Add Sales Employee'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="p-6 space-y-5 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              {errors.form && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-lg text-sm font-medium">
                  {errors.form}
                </div>
              )}
              {/* SECTION 1: BASIC INFORMATION */}
              <div>
                <h3 className="text-sm font-semibold text-slate-700 border-b pb-2 mb-3">
                  BASIC INFORMATION
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-sm font-medium text-slate-800">
                        Employee Code *
                      </label>
                      <span className="text-[11px] font-semibold text-violet-600 bg-violet-50 px-2 py-0.5 rounded-full border border-violet-100">
                        Auto-generated
                      </span>
                    </div>
                    <input
                      type="text"
                      readOnly
                      value={formData.employeeCode}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-slate-100 text-slate-600 font-mono font-semibold cursor-not-allowed focus:outline-none"
                    />
                    {errors.employeeCode && (
                      <p className="text-xs text-rose-600 font-medium mt-1">{errors.employeeCode}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1 text-slate-800">
                      Employee Name *
                    </label>
                    <input
                      type="text"
                      maxLength={80}
                      value={formData.employeeName}
                      onChange={(e) => setFormData({ ...formData, employeeName: e.target.value })}
                      className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
                        errors.employeeName
                          ? 'border-rose-400 focus:ring-rose-500/30'
                          : 'border-slate-200 focus:ring-violet-500/30 focus:border-violet-500'
                      }`}
                      placeholder="e.g. Ramesh Verma"
                    />
                    {errors.employeeName && (
                      <p className="text-xs text-rose-600 font-medium mt-1">{errors.employeeName}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1 text-slate-800">
                      Designation *
                    </label>
                    <select
                      value={formData.designation}
                      onChange={(e) => handleDesignationChange(e.target.value as Designation)}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 bg-white"
                    >
                      {DESIGNATIONS.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                    {errors.designation && (
                      <p className="text-xs text-rose-600 font-medium mt-1">{errors.designation}</p>
                    )}
                  </div>

                  <div className="relative">
                    <label className="block text-sm font-medium mb-1 text-slate-800">
                      Reports To *
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={formData.reportsTo}
                        onChange={(e) => {
                          setFormData({ ...formData, reportsTo: e.target.value });
                          setShowReportsToDropdown(true);
                        }}
                        onFocus={() => setShowReportsToDropdown(true)}
                        placeholder="Search or enter manager name..."
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 bg-white text-slate-900"
                      />
                      <ChevronDown
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 cursor-pointer"
                        onClick={() => setShowReportsToDropdown(!showReportsToDropdown)}
                      />
                    </div>
                    {showReportsToDropdown && (
                      <>
                        <div
                          className="fixed inset-0 z-10"
                          onClick={() => setShowReportsToDropdown(false)}
                        />
                        <div className="absolute z-20 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 flex flex-col overflow-y-auto p-1">
                          {getReportsToOptions(formData.designation)
                            .filter((rep) =>
                              rep.toLowerCase().includes((formData.reportsTo || '').toLowerCase())
                            )
                            .map((rep) => (
                              <div
                                key={rep}
                                className="px-3 py-2 text-sm hover:bg-slate-50 cursor-pointer rounded text-slate-700"
                                onClick={() => {
                                  const allEmps = salesOrganizationService.getEmployees();
                                  const manager = allEmps.find(e => e.employeeName === rep);
                                  setFormData({ 
                                    ...formData, 
                                    reportsTo: rep,
                                    zone: !editingEmployee ? (manager?.zone || formData.zone) : formData.zone,
                                    region: !editingEmployee ? (manager?.region || formData.region) : formData.region,
                                    state: !editingEmployee ? (manager?.state || formData.state) : formData.state
                                  });
                                  setShowReportsToDropdown(false);
                                }}
                              >
                                {rep}
                              </div>
                            ))}
                          {(formData.reportsTo || '').trim() !== '' &&
                            !getReportsToOptions(formData.designation).some(
                              (rep) =>
                                rep.trim().toLowerCase() ===
                                (formData.reportsTo || '').trim().toLowerCase()
                            ) && (
                              <div
                                className="px-3 py-2 text-sm text-[#163c78] font-medium hover:bg-[#163c78]/10 cursor-pointer rounded flex items-center gap-2"
                                onClick={() => {
                                  const newManager = (formData.reportsTo || '').trim();
                                  setFormData({ ...formData, reportsTo: newManager });
                                  setShowReportsToDropdown(false);
                                }}
                              >
                                <Plus className="w-4 h-4" /> Add "{formData.reportsTo.trim()}"
                              </div>
                            )}
                        </div>
                      </>
                    )}
                    {errors.reportsTo && (
                      <p className="text-xs text-rose-600 font-medium mt-1">{errors.reportsTo}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* SECTION 2: TERRITORY INFORMATION */}
              <div>
                <h3 className="text-sm font-semibold text-slate-700 border-b pb-2 mb-3">
                  TERRITORY INFORMATION
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1 text-slate-800">Zone *</label>
                    <input
                      type="text"
                      value={formData.zone}
                      onChange={(e) => setFormData({ ...formData, zone: e.target.value })}
                      className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
                        errors.zone
                          ? 'border-rose-400 focus:ring-rose-500/30'
                          : 'border-slate-200 focus:ring-violet-500/30 focus:border-violet-500'
                      }`}
                      placeholder="e.g. North-East Zone"
                    />
                    {errors.zone && (
                      <p className="text-xs text-rose-600 font-medium mt-1">{errors.zone}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1 text-slate-800">Region *</label>
                    <input
                      type="text"
                      value={formData.region}
                      onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                      className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
                        errors.region
                          ? 'border-rose-400 focus:ring-rose-500/30'
                          : 'border-slate-200 focus:ring-violet-500/30 focus:border-violet-500'
                      }`}
                      placeholder="e.g. North Region"
                    />
                    {errors.region && (
                      <p className="text-xs text-rose-600 font-medium mt-1">{errors.region}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1 text-slate-800">State *</label>
                    <StateSelector 
                      value={formData.state} 
                      onChange={(val) => setFormData({ ...formData, state: val })} 
                    />
                    {errors.state && (
                      <p className="mt-1 text-xs text-rose-600 font-medium">{errors.state}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1 text-slate-800">Territory *</label>
                    <input
                      type="text"
                      className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
                        errors.territory
                          ? 'border-rose-400 focus:ring-rose-500/30'
                          : 'border-slate-200 focus:ring-violet-500/30 focus:border-violet-500'
                      }`}
                      placeholder="e.g. West Delhi"
                      value={formData.territory}
                      onChange={(e) => setFormData({ ...formData, territory: e.target.value })}
                    />
                    {errors.territory && (
                      <p className="text-xs text-rose-600 font-medium mt-1">{errors.territory}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1 text-slate-800">Area *</label>
                    <input
                      type="text"
                      value={formData.area}
                      onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                      className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
                        errors.area
                          ? 'border-rose-400 focus:ring-rose-500/30'
                          : 'border-slate-200 focus:ring-violet-500/30 focus:border-violet-500'
                      }`}
                      placeholder="e.g. South Delhi & Gurugram"
                    />
                    {errors.area && (
                      <p className="text-xs text-rose-600 font-medium mt-1">{errors.area}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1 text-slate-800">
                      Headquarters *
                    </label>
                    <input
                      type="text"
                      value={formData.headquarters}
                      onChange={(e) => setFormData({ ...formData, headquarters: e.target.value })}
                      className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
                        errors.headquarters
                          ? 'border-rose-400 focus:ring-rose-500/30'
                          : 'border-slate-200 focus:ring-violet-500/30 focus:border-violet-500'
                      }`}
                      placeholder="e.g. Gurugram HQ"
                    />
                    {errors.headquarters && (
                      <p className="text-xs text-rose-600 font-medium mt-1">{errors.headquarters}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* SECTION 3: EMPLOYMENT INFORMATION */}
              <div>
                <h3 className="text-sm font-semibold text-slate-700 border-b pb-2 mb-3">
                  EMPLOYMENT INFORMATION
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1 text-slate-800">
                      Joining Date *
                    </label>
                    <input
                      type="date"
                      value={formData.joiningDate}
                      onChange={(e) => setFormData({ ...formData, joiningDate: e.target.value })}
                      className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
                        errors.joiningDate
                          ? 'border-rose-400 focus:ring-rose-500/30'
                          : 'border-slate-200 focus:ring-violet-500/30 focus:border-violet-500'
                      }`}
                    />
                    {errors.joiningDate && (
                      <p className="text-xs text-rose-600 font-medium mt-1">{errors.joiningDate}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1 text-slate-800">Status *</label>
                    <select
                      value={formData.status}
                      onChange={(e) =>
                        setFormData({ ...formData, status: e.target.value as 'Active' | 'Inactive' })
                      }
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 bg-white"
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                    {errors.status && (
                      <p className="text-xs text-rose-600 font-medium mt-1">{errors.status}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-100">
                <ActionButton variant="secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </ActionButton>
                <ActionButton type="submit">
                  {editingEmployee ? 'Save Changes' : 'Create Employee'}
                </ActionButton>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Standardized View Detail Drawer Panel */}
      <Drawer
        open={!!viewEmployee}
        onClose={() => setViewEmployee(null)}
        title="Employee Details"
      >
        {viewEmployee && (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-slate-700 border-b pb-2 mb-3">
                Basic Information
              </h3>
              <div>
                <DrawerField label="EMPLOYEE CODE" value={viewEmployee.employeeCode} />
                <DrawerField label="EMPLOYEE NAME" value={viewEmployee.employeeName} />
                <DrawerField
                  label="DESIGNATION"
                  value={
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-violet-50 text-[#163c78] border border-violet-100">
                      {viewEmployee.designation}
                    </span>
                  }
                />
                <DrawerField label="REPORTS TO" value={viewEmployee.reportsTo} />
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-700 border-b pb-2 mb-3">
                Territory Information
              </h3>
              <div>
                <DrawerField label="ZONE" value={viewEmployee.zone} />
                <DrawerField label="REGION" value={viewEmployee.region} />
                <DrawerField label="AREA" value={viewEmployee.area} />
                <DrawerField label="HEADQUARTERS" value={viewEmployee.headquarters || 'N/A'} />
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-700 border-b pb-2 mb-3">
                Employment Information
              </h3>
              <div>
                <DrawerField label="JOINING DATE" value={viewEmployee.joiningDate} />
                <DrawerField
                  label="STATUS"
                  value={
                    <Badge variant={viewEmployee.status === 'Active' ? 'success' : 'neutral'}>
                      {viewEmployee.status}
                    </Badge>
                  }
                />
              </div>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
