import React, { useState, useEffect } from 'react';
import { PageHeader, TableCard, DataTable, ActionButton, SearchInput } from './components/shared';
import { Eye, Edit2, Plus, X } from 'lucide-react';
import { manufacturerService, type Manufacturer } from '../../services/manufacturerService';

import { motion, AnimatePresence } from 'framer-motion';

export default function ManufacturerManagement() {
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [editingManufacturer, setEditingManufacturer] = useState<Manufacturer | null>(null);
  const [viewingManufacturer, setViewingManufacturer] = useState<Manufacturer | null>(null);

  const [formData, setFormData] = useState<Manufacturer>({
    name: '',
    contactPerson: '',
    contactPhone: '',
    contactEmail: '',
    address: '',
    isActive: true
  });

  const fetchManufacturers = async () => {
    try {
      setLoading(true);
      const data = await manufacturerService.getManufacturers();
      setManufacturers(data);
    } catch (error: any) {
      alert(error.message || 'Failed to load manufacturers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchManufacturers();
  }, []);

  const handleOpenAdd = () => {
    setEditingManufacturer(null);
    setFormData({ name: '', contactPerson: '', contactPhone: '', contactEmail: '', address: '', isActive: true });
    setShowModal(true);
  };

  const handleOpenEdit = (m: Manufacturer) => {
    setEditingManufacturer(m);
    setFormData({ ...m });
    setShowModal(true);
    setShowViewModal(false);
  };

  const handleOpenView = (m: Manufacturer) => {
    setViewingManufacturer(m);
    setShowViewModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return alert('Manufacturer name is required');
    try {
      if (editingManufacturer?.id) {
        await manufacturerService.updateManufacturer(editingManufacturer.id, formData);
        alert('Manufacturer updated successfully');
      } else {
        await manufacturerService.createManufacturer(formData);
        alert('Manufacturer created successfully');
      }
      setShowModal(false);
      fetchManufacturers();
    } catch (error: any) {
      alert(error.message || 'Failed to save manufacturer');
    }
  };

  const filtered = manufacturers.filter(m => 
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.contactPerson?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader
        title="Manufacturer Management"
        subtitle="Manage manufacturers and their contact details."
        actions={<ActionButton onClick={handleOpenAdd} icon={<Plus className="w-4 h-4" />}>Add Manufacturer</ActionButton>}
      />

      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row gap-4 justify-between items-center bg-slate-50/50">
          <div className="w-full sm:w-72">
            <SearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search manufacturers..."
            />
          </div>
        </div>

        <TableCard>
          <DataTable
            columns={[
              { key: 'name', label: 'Manufacturer Name' },
              { key: 'contactPerson', label: 'Contact Person' },
              { key: 'status', label: 'Status', render: (row: Manufacturer) => (
                <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ` + (row.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700')}>
                  {row.isActive ? 'Active' : 'Inactive'}
                </span>
              ) },
              { key: 'createdAt', label: 'Created At', render: (row: Manufacturer) => row.createdAt ? new Date(row.createdAt).toLocaleDateString() : 'N/A' },
              { key: 'actions', label: 'Actions', render: (row: Manufacturer) => (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenView(row)}
                    title="View Manufacturer"
                    className="p-1.5 text-slate-500 hover:text-[#163c78] hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleOpenEdit(row)}
                    title="Edit Manufacturer"
                    className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>
              ) }
            ]}
            data={filtered}
            emptyMessage="No manufacturers found."
          />
        </TableCard>
      </div>

      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm" onClick={() => setShowModal(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative bg-white rounded-2xl shadow-xl w-full max-w-xl overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                <h2 className="text-xl font-bold text-slate-900">{editingManufacturer ? 'Edit Manufacturer' : 'Create Manufacturer'}</h2>
                <button type="button" onClick={() => setShowModal(false)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors"><X className="w-5 h-5" /></button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Manufacturer Name *</label>
                  <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#163c78]/20 focus:border-[#163c78] outline-none transition-all" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Contact Person</label>
                    <input type="text" value={formData.contactPerson || ''} onChange={e => setFormData({...formData, contactPerson: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#163c78]/20 focus:border-[#163c78] outline-none transition-all" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Contact Phone</label>
                    <input type="text" value={formData.contactPhone || ''} onChange={e => setFormData({...formData, contactPhone: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#163c78]/20 focus:border-[#163c78] outline-none transition-all" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Contact Email</label>
                    <input type="email" value={formData.contactEmail || ''} onChange={e => setFormData({...formData, contactEmail: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#163c78]/20 focus:border-[#163c78] outline-none transition-all" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Status</label>
                    <select value={formData.isActive ? 'active' : 'inactive'} onChange={e => setFormData({...formData, isActive: e.target.value === 'active'})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#163c78]/20 focus:border-[#163c78] outline-none transition-all">
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Address</label>
                  <textarea rows={3} value={formData.address || ''} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#163c78]/20 focus:border-[#163c78] outline-none transition-all resize-none" />
                </div>
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                  <ActionButton variant="secondary" onClick={() => setShowModal(false)} type="button">Cancel</ActionButton>
                  <ActionButton type="submit">{editingManufacturer ? 'Save Changes' : 'Create Manufacturer'}</ActionButton>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {showViewModal && viewingManufacturer && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm" onClick={() => setShowViewModal(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                <h2 className="text-xl font-bold text-slate-900">Manufacturer Details</h2>
                <button type="button" onClick={() => setShowViewModal(false)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-slate-500">Name</h3>
                  <p className="text-base font-semibold text-slate-900">{viewingManufacturer.name}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-slate-500">Contact Person</h3>
                    <p className="text-slate-900">{viewingManufacturer.contactPerson || 'N/A'}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-slate-500">Contact Phone</h3>
                    <p className="text-slate-900">{viewingManufacturer.contactPhone || 'N/A'}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-slate-500">Contact Email</h3>
                    <p className="text-slate-900">{viewingManufacturer.contactEmail || 'N/A'}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-slate-500">Status</h3>
                    <p className="text-slate-900">{viewingManufacturer.isActive ? 'Active' : 'Inactive'}</p>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-slate-500">Address</h3>
                  <p className="text-slate-900">{viewingManufacturer.address || 'N/A'}</p>
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50">
                <ActionButton variant="secondary" onClick={() => setShowViewModal(false)}>Close</ActionButton>
                <ActionButton onClick={() => handleOpenEdit(viewingManufacturer)} icon={<Edit2 className="w-4 h-4" />}>Edit Manufacturer</ActionButton>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
