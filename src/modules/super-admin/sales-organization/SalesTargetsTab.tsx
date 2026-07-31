import { useState } from 'react';
import { Plus, Edit2, Ban, X, Target as TargetIcon } from 'lucide-react';
import { salesOrganizationService } from '../../../services/salesOrganizationService';
import type { SalesTarget } from './types';
import { TARGET_TYPES, FINANCIAL_YEARS, STATUS_OPTIONS } from './constants';
import {
  DataTable,
  TableCard,
  SearchInput,
  SelectFilter,
  ActionButton,
  Badge,
  FilterBar,
} from '../components/shared';
import type { Column } from '../components/shared';

export default function SalesTargetsTab() {
  const [targets, setTargets] = useState<SalesTarget[]>(() =>
    salesOrganizationService.getTargets()
  );
  const [search, setSearch] = useState('');
  const [fyFilter, setFyFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingTarget, setEditingTarget] = useState<SalesTarget | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    financialYear: '2025-2026',
    targetType: 'Annual',
    employeeId: '',
    employeeName: '',
    targetAmount: 1000000,
    startDate: '2025-04-01',
    endDate: '2026-03-31',
    status: 'Active' as 'Active' | 'Inactive',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const reloadTargets = () => {
    setTargets(salesOrganizationService.getTargets());
  };

  const employees = salesOrganizationService.getEmployees().filter(
    (e) => e.status === 'Active' && e.designation === 'National Sales Head'
  );

  const handleOpenAddModal = () => {
    setEditingTarget(null);
    setErrors({});
    const firstEmp = employees[0];
    setFormData({
      financialYear: '2025-2026',
      targetType: 'Annual',
      employeeId: firstEmp ? firstEmp.id : '',
      employeeName: firstEmp ? firstEmp.employeeName : '',
      targetAmount: 1000000,
      startDate: '2025-04-01',
      endDate: '2026-03-31',
      status: 'Active',
    });
    setShowModal(true);
  };

  const handleOpenEditModal = (tgt: SalesTarget) => {
    setEditingTarget(tgt);
    setErrors({});
    setFormData({
      financialYear: tgt.financialYear,
      targetType: tgt.targetType,
      employeeId: tgt.employeeId,
      employeeName: tgt.employeeName,
      targetAmount: tgt.targetAmount,
      startDate: tgt.startDate,
      endDate: tgt.endDate,
      status: tgt.status,
    });
    setShowModal(true);
  };

  const handleEmployeeSelect = (empId: string) => {
    const selected = employees.find((e) => e.id === empId);
    setFormData((prev) => ({
      ...prev,
      employeeId: empId,
      employeeName: selected ? selected.employeeName : '',
    }));
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.employeeName || !formData.targetAmount) {
      setErrors({ form: 'Please fill in Employee and Target Amount.' });
      return;
    }

    try {
      if (editingTarget) {
        salesOrganizationService.updateTarget(editingTarget.id, formData);
      } else {
        salesOrganizationService.addTarget(formData);
      }
      reloadTargets();
      setShowModal(false);
    } catch (err: any) {
      setErrors({ form: err.message || 'An error occurred while saving.' });
    }
  };

  const handleDeactivate = (tgt: SalesTarget) => {
    if (window.confirm(`Are you sure you want to deactivate target for ${tgt.employeeName}?`)) {
      try {
        salesOrganizationService.deactivateTarget(tgt.id);
        reloadTargets();
      } catch (err: any) {
        alert(err.message || 'An error occurred while deactivating.');
      }
    }
  };

  // Filter Logic
  const filteredTargets = targets.filter((tgt) => {
    const matchesSearch =
      search === '' ||
      tgt.employeeName.toLowerCase().includes(search.toLowerCase()) ||
      tgt.targetType.toLowerCase().includes(search.toLowerCase()) ||
      tgt.financialYear.toLowerCase().includes(search.toLowerCase());

    const matchesFY = fyFilter === '' || tgt.financialYear === fyFilter;
    const matchesStatus = statusFilter === '' || tgt.status === statusFilter;

    return matchesSearch && matchesFY && matchesStatus;
  });

  const columns: Column<SalesTarget>[] = [
    {
      key: 'employeeName',
      label: 'Employee Name',
      render: (tgt) => <span className="font-bold text-slate-900">{tgt.employeeName}</span>,
    },
    {
      key: 'financialYear',
      label: 'Financial Year',
      render: (tgt) => (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-semibold bg-slate-100 text-slate-700">
          {tgt.financialYear}
        </span>
      ),
    },
    {
      key: 'targetType',
      label: 'Target Type',
      render: (tgt) => <span className="font-medium text-[#163c78] text-xs">{tgt.targetType}</span>,
    },
    {
      key: 'targetAmount',
      label: 'Target Amount (₹)',
      render: (tgt) => (
        <span className="font-bold text-emerald-700 text-sm">
          ₹{tgt.targetAmount.toLocaleString()}
        </span>
      ),
    },
    {
      key: 'dates',
      label: 'Target Period',
      render: (tgt) => (
        <span className="text-slate-500 text-xs">
          {tgt.startDate} to {tgt.endDate}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (tgt) => (
        <Badge variant={tgt.status === 'Active' ? 'success' : 'neutral'}>{tgt.status}</Badge>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (tgt) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleOpenEditModal(tgt)}
            title="Edit Target"
            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          {tgt.status === 'Active' && (
            <button
              onClick={() => handleDeactivate(tgt)}
              title="Deactivate Target"
              className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
            >
              <Ban className="w-4 h-4" />
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
          placeholder="Search Employee, Type, Year..."
        />
        <SelectFilter
          value={fyFilter}
          onChange={setFyFilter}
          options={FINANCIAL_YEARS.map((y) => ({ label: y, value: y }))}
          placeholder="All Financial Years"
        />
        <SelectFilter
          value={statusFilter}
          onChange={setStatusFilter}
          options={STATUS_OPTIONS.map((s) => ({ label: s, value: s }))}
          placeholder="All Statuses"
        />
        <div className="ml-auto">
          <ActionButton onClick={handleOpenAddModal} icon={<Plus className="w-4 h-4" />}>
            Assign Target
          </ActionButton>
        </div>
      </FilterBar>

      {/* Table */}
      <TableCard>
        <DataTable columns={columns} data={filteredTargets} emptyMessage="No sales targets found." />
      </TableCard>

      {/* Create / Edit Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-[2px] bg-slate-900/40"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl flex flex-col w-full max-w-lg animate-in zoom-in-95 duration-200 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h2 className="text-lg font-bold text-slate-900">
                {editingTarget ? 'Edit Sales Target' : 'Assign Sales Target'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="p-6 space-y-4">
              {errors.form && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-lg text-sm font-medium">
                  {errors.form}
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Select Employee *
                </label>
                <select
                  required
                  value={formData.employeeId}
                  onChange={(e) => handleEmployeeSelect(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/30"
                >
                  <option value="">-- Select Employee --</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.employeeName} ({emp.designation})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Financial Year *
                  </label>
                  <select
                    value={formData.financialYear}
                    onChange={(e) => setFormData({ ...formData, financialYear: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/30"
                  >
                    {FINANCIAL_YEARS.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Target Type *
                  </label>
                  <select
                    value={formData.targetType}
                    onChange={(e) => setFormData({ ...formData, targetType: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/30"
                  >
                    {TARGET_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Target Amount (₹) *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  value={formData.targetAmount}
                  onChange={(e) => setFormData({ ...formData, targetAmount: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/30"
                  placeholder="e.g. 500000"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/30"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    End Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/30"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value as 'Active' | 'Inactive' })
                  }
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/30"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <ActionButton variant="secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </ActionButton>
                <ActionButton type="submit">
                  {editingTarget ? 'Save Changes' : 'Assign Target'}
                </ActionButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
