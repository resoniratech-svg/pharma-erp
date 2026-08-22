import React, { useState, useEffect } from 'react';
import { PageHeader, TableCard, DataTable, ActionButton, SearchInput } from './components/shared';
import { Eye, Edit2, Plus, X } from 'lucide-react';
import { brandService, type Brand } from '../../services/brandService';
import { motion, AnimatePresence } from 'framer-motion';

export default function BrandManagement() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [viewingBrand, setViewingBrand] = useState<Brand | null>(null);

  const [formData, setFormData] = useState<Brand>({
    brandName: '',
    shortName: '',
    description: '',
    isActive: true
  });

  const fetchBrands = async () => {
    try {
      setLoading(true);
      const data = await brandService.getBrands();
      setBrands(data);
    } catch (error: any) {
      alert(error.message || 'Failed to load brands');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBrands();
  }, []);

  const handleOpenAdd = () => {
    setEditingBrand(null);
    setFormData({ brandName: '', shortName: '', description: '', isActive: true });
    setShowModal(true);
  };

  const handleOpenEdit = (b: Brand) => {
    setEditingBrand(b);
    setFormData({ ...b });
    setShowModal(true);
    setShowViewModal(false);
  };

  const handleOpenView = (b: Brand) => {
    setViewingBrand(b);
    setShowViewModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingBrand?.id) {
        await brandService.updateBrand(editingBrand.id, formData);
        alert('Brand updated successfully');
      } else {
        await brandService.createBrand(formData);
        alert('Brand created successfully');
      }
      setShowModal(false);
      fetchBrands();
    } catch (error: any) {
      alert(error.message || 'Failed to save brand');
    }
  };

  const filtered = brands.filter(b => 
    b.brandName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.shortName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader
        title="Brand Management"
        subtitle="Manage product brands."
        actions={<ActionButton onClick={handleOpenAdd} icon={<Plus className="w-4 h-4" />}>Add Brand</ActionButton>}
      />

      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row gap-4 justify-between items-center bg-slate-50/50">
          <div className="w-full sm:w-72">
            <SearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search brands..."
            />
          </div>
        </div>

        <TableCard>
          <DataTable
            columns={[
              { key: 'brandName', label: 'Brand Name' },
              { key: 'shortName', label: 'Short Name' },
              { key: 'description', label: 'Description', render: (row: Brand) => row.description || '-' },
              { key: 'status', label: 'Status', render: (row: Brand) => (
                <span className={+"inline-flex px-2.5 py-1 rounded-full text-xs font-medium "+ + (row.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700')}>
                  {row.isActive ? 'Active' : 'Inactive'}
                </span>
              ) },
              { key: 'createdAt', label: 'Created At', render: (row: Brand) => row.createdAt ? new Date(row.createdAt).toLocaleDateString() : 'N/A' },
              { key: 'actions', label: 'Actions', render: (row: Brand) => (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenView(row)}
                    title="View Brand"
                    className="p-1.5 text-slate-500 hover:text-[#163c78] hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleOpenEdit(row)}
                    title="Edit Brand"
                    className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>
              ) }
            ]}
            data={filtered}
            emptyMessage="No brands found."
          />
        </TableCard>
      </div>

      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden"
            >
              <div className="flex items-center justify-between p-6 border-b border-slate-100">
                <h2 className="text-xl font-semibold text-slate-800">
                  {editingBrand ? 'Edit Brand' : 'Create New Brand'}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1 text-slate-700">Brand Name *</label>
                    <input
                      type="text"
                      value={formData.brandName}
                      onChange={(e) => setFormData({ ...formData, brandName: e.target.value })}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 text-slate-900 focus:outline-none focus:border-[#163c78] focus:bg-white transition-colors"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1 text-slate-700">Short Name</label>
                      <input
                        type="text"
                        value={formData.shortName || ''}
                        onChange={(e) => setFormData({ ...formData, shortName: e.target.value })}
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 text-slate-900 focus:outline-none focus:border-[#163c78] focus:bg-white transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1 text-slate-700">Status</label>
                      <select
                        value={formData.isActive ? 'true' : 'false'}
                        onChange={(e) => setFormData({ ...formData, isActive: e.target.value === 'true' })}
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 text-slate-900 focus:outline-none focus:border-[#163c78] focus:bg-white transition-colors"
                      >
                        <option value="true">Active</option>
                        <option value="false">Inactive</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1 text-slate-700">Description</label>
                    <textarea
                      value={formData.description || ''}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 text-slate-900 focus:outline-none focus:border-[#163c78] focus:bg-white transition-colors"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-8">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-[#163c78] rounded-lg hover:bg-[#112d59] transition-colors"
                  >
                    {editingBrand ? 'Update Brand' : 'Create Brand'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {showViewModal && viewingBrand && (
          <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/50 backdrop-blur-sm">
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col"
            >
              <div className="flex items-center justify-between p-6 border-b border-slate-100">
                <h2 className="text-xl font-semibold text-slate-800">Brand Details</h2>
                <button onClick={() => setShowViewModal(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-6">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-medium text-slate-500 mb-1">Brand Name</h3>
                    <p className="text-base text-slate-900">{viewingBrand.brandName}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-slate-500 mb-1">Short Name</h3>
                    <p className="text-base text-slate-900">{viewingBrand.shortName || 'N/A'}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-slate-500 mb-1">Description</h3>
                    <p className="text-base text-slate-900 whitespace-pre-wrap">{viewingBrand.description || 'N/A'}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-slate-500 mb-1">Status</h3>
                    <span className={+"inline-flex px-2.5 py-1 rounded-full text-xs font-medium "+ + (viewingBrand.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700')}>
                      {viewingBrand.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-slate-500 mb-1">Created At</h3>
                    <p className="text-base text-slate-900">{viewingBrand.createdAt ? new Date(viewingBrand.createdAt).toLocaleString() : 'N/A'}</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50">
                <ActionButton variant="secondary" onClick={() => setShowViewModal(false)}>Close</ActionButton>
                <ActionButton onClick={() => handleOpenEdit(viewingBrand)} icon={<Edit2 className="w-4 h-4" />}>Edit Brand</ActionButton>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
