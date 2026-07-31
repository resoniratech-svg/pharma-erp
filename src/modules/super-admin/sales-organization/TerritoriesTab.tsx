import { useState } from 'react';
import { Plus, Eye, Edit2, Ban, X } from 'lucide-react';
import { salesOrganizationService } from '../../../services/salesOrganizationService';
import type { Territory } from './types';
import { STATUS_OPTIONS } from './constants';
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

export default function TerritoriesTab() {
  const [territories, setTerritories] = useState<Territory[]>(() =>
    salesOrganizationService.getTerritories()
  );
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [viewTerritory, setViewTerritory] = useState<Territory | null>(null);
  const [editingTerritory, setEditingTerritory] = useState<Territory | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    territoryCode: '',
    zone: '',
    region: '',
    area: '',
    headquarters: '',
    assignedManager: '',
    status: 'Active' as 'Active' | 'Inactive',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const reloadTerritories = () => {
    setTerritories(salesOrganizationService.getTerritories());
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    const code = formData.territoryCode.trim();
    if (!code) {
      newErrors.territoryCode = 'Territory Code is required.';
    } else {
      const duplicateCode = territories.some(
        (t) => t.territoryCode && t.territoryCode.toLowerCase() === code.toLowerCase() && t.id !== editingTerritory?.id
      );
      if (duplicateCode) {
        newErrors.territoryCode = 'Territory Code must be unique. This code already exists.';
      }
    }

    if (!formData.zone.trim()) {
      newErrors.zone = 'Zone is required.';
    }

    if (!formData.region.trim()) {
      newErrors.region = 'Region is required.';
    }

    if (!formData.area.trim()) {
      newErrors.area = 'Area is required.';
    }

    if (!formData.headquarters.trim()) {
      newErrors.headquarters = 'Headquarters is required.';
    }

    if (!formData.assignedManager) {
      newErrors.assignedManager = 'Assigned Manager is required.';
    }

    if (!formData.status) {
      newErrors.status = 'Status is required.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleOpenAddModal = () => {
    setEditingTerritory(null);
    setErrors({});
    const activeManagers = salesOrganizationService
      .getEmployees()
      .filter((e) => e.status === 'Active')
      .map((e) => e.employeeName);

    const nextNum = territories.length + 1;
    const autoCode = `TER-${nextNum.toString().padStart(3, '0')}`;

    setFormData({
      territoryCode: autoCode,
      zone: 'North-East Zone',
      region: 'North Region',
      area: '',
      headquarters: '',
      assignedManager: activeManagers[0] || 'Unassigned',
      status: 'Active',
    });
    setShowModal(true);
  };

  const handleOpenEditModal = (ter: Territory) => {
    setEditingTerritory(ter);
    setErrors({});
    setFormData({
      territoryCode: ter.territoryCode || `TER-${Math.floor(100 + Math.random() * 900)}`,
      zone: ter.zone,
      region: ter.region,
      area: ter.area,
      headquarters: ter.headquarters,
      assignedManager: ter.assignedManager,
      status: ter.status,
    });
    setShowModal(true);
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }

    const payload = {
      territoryCode: formData.territoryCode.trim(),
      zone: formData.zone.trim(),
      region: formData.region.trim(),
      area: formData.area.trim(),
      headquarters: formData.headquarters.trim(),
      assignedManager: formData.assignedManager,
      status: formData.status,
    };

    try {
      if (editingTerritory) {
        salesOrganizationService.updateTerritory(editingTerritory.id, payload);
      } else {
        salesOrganizationService.addTerritory(payload);
      }
      reloadTerritories();
      setShowModal(false);
    } catch (err: any) {
      setErrors({ ...errors, form: err.message || 'An error occurred while saving.' });
    }
  };

  const handleDeactivate = (ter: Territory) => {
    if (window.confirm(`Are you sure you want to deactivate territory "${ter.area}"?`)) {
      try {
        salesOrganizationService.deactivateTerritory(ter.id);
        reloadTerritories();
      } catch (err: any) {
        alert(err.message || 'An error occurred while deactivating.');
      }
    }
  };

  // Filter Logic
  const filteredTerritories = territories.filter((ter) => {
    const matchesSearch =
      search === '' ||
      (ter.territoryCode && ter.territoryCode.toLowerCase().includes(search.toLowerCase())) ||
      ter.area.toLowerCase().includes(search.toLowerCase()) ||
      ter.headquarters.toLowerCase().includes(search.toLowerCase()) ||
      ter.assignedManager.toLowerCase().includes(search.toLowerCase()) ||
      ter.region.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === '' || ter.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const columns: Column<Territory>[] = [
    {
      key: 'territoryCode',
      label: 'Territory Code',
      render: (ter) => <span className="font-mono text-slate-700 font-semibold">{ter.territoryCode || '—'}</span>,
    },
    {
      key: 'area',
      label: 'Territory / Area',
      render: (ter) => <span className="font-bold text-slate-900">{ter.area}</span>,
    },
    {
      key: 'headquarters',
      label: 'Headquarters (HQ)',
      render: (ter) => <span className="font-semibold text-slate-700">{ter.headquarters}</span>,
    },
    {
      key: 'regionZone',
      label: 'Region & Zone',
      render: (ter) => (
        <span className="text-slate-500 text-xs">
          {ter.region} | <span className="font-medium text-slate-700">{ter.zone}</span>
        </span>
      ),
    },
    {
      key: 'assignedManager',
      label: 'Assigned Manager',
      render: (ter) => (
        <span className="inline-flex items-center gap-1.5 font-medium text-[#163c78]">
          {ter.assignedManager || 'Unassigned'}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (ter) => (
        <Badge variant={ter.status === 'Active' ? 'success' : 'neutral'}>{ter.status}</Badge>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (ter) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewTerritory(ter)}
            title="View Details"
            className="p-1.5 text-slate-500 hover:text-[#163c78] hover:bg-slate-100 rounded-lg transition-colors"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleOpenEditModal(ter)}
            title="Edit Territory"
            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          {ter.status === 'Active' && (
            <button
              onClick={() => handleDeactivate(ter)}
              title="Deactivate Territory"
              className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
            >
              <Ban className="w-4 h-4" />
            </button>
          )}
        </div>
      ),
    },
  ];

  const activeManagersList = salesOrganizationService
    .getEmployees()
    .filter((e) => e.status === 'Active')
    .map((e) => e.employeeName);

  return (
    <div>
      {/* Filter Bar */}
      <FilterBar>
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search Code, Area, HQ, Manager..."
        />
        <SelectFilter
          value={statusFilter}
          onChange={setStatusFilter}
          options={STATUS_OPTIONS.map((s) => ({ label: s, value: s }))}
          placeholder="All Statuses"
        />
        <div className="ml-auto">
          <ActionButton onClick={handleOpenAddModal} icon={<Plus className="w-4 h-4" />}>
            Add Territory
          </ActionButton>
        </div>
      </FilterBar>

      {/* Table */}
      <TableCard>
        <DataTable columns={columns} data={filteredTerritories} emptyMessage="No territories found." />
      </TableCard>

      {/* Create / Edit Modal Form */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm bg-slate-900/40"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl flex flex-col w-full max-w-xl animate-in zoom-in-95 duration-200 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h2 className="text-xl font-bold text-slate-900">
                {editingTerritory ? 'Edit Territory' : 'Add New Territory'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
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
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium text-slate-800">
                    Territory Code *
                  </label>
                  <span className="text-[11px] font-semibold text-violet-600 bg-violet-50 px-2 py-0.5 rounded-full border border-violet-100">
                    Auto-generated
                  </span>
                </div>
                <input
                  type="text"
                  readOnly
                  value={formData.territoryCode}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-slate-100 text-slate-600 font-mono font-semibold cursor-not-allowed focus:outline-none"
                />
                {errors.territoryCode && (
                  <p className="text-xs text-rose-600 font-medium mt-1">{errors.territoryCode}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
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
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-800">
                    Area / Territory Name *
                  </label>
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
                    Headquarters (HQ) *
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-800">
                    Assigned Manager *
                  </label>
                  <select
                    value={formData.assignedManager}
                    onChange={(e) => setFormData({ ...formData, assignedManager: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 bg-white"
                  >
                    <option value="">-- Select Manager --</option>
                    <option value="Unassigned">Unassigned</option>
                    {activeManagersList.map((mgr) => (
                      <option key={mgr} value={mgr}>
                        {mgr}
                      </option>
                    ))}
                  </select>
                  {errors.assignedManager && (
                    <p className="text-xs text-rose-600 font-medium mt-1">{errors.assignedManager}</p>
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

              <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-100">
                <ActionButton variant="secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </ActionButton>
                <ActionButton type="submit">
                  {editingTerritory ? 'Save Changes' : 'Create Territory'}
                </ActionButton>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Standardized View Detail Drawer Panel */}
      <Drawer
        open={!!viewTerritory}
        onClose={() => setViewTerritory(null)}
        title="Territory Details"
      >
        {viewTerritory && (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-slate-700 border-b pb-2 mb-3">
                Territory Information
              </h3>
              <div>
                <DrawerField label="TERRITORY CODE" value={viewTerritory.territoryCode || '—'} />
                <DrawerField label="ZONE" value={viewTerritory.zone} />
                <DrawerField label="REGION" value={viewTerritory.region} />
                <DrawerField label="AREA" value={viewTerritory.area} />
                <DrawerField label="HEADQUARTERS" value={viewTerritory.headquarters} />
                <DrawerField
                  label="ASSIGNED MANAGER"
                  value={viewTerritory.assignedManager || 'Unassigned'}
                />
                <DrawerField
                  label="STATUS"
                  value={
                    <Badge variant={viewTerritory.status === 'Active' ? 'success' : 'neutral'}>
                      {viewTerritory.status}
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
