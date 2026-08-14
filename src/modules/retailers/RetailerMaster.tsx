import { useState, useEffect, useMemo } from 'react';
import { Plus, Download, X } from 'lucide-react';
import {
  PageHeader,
  FilterBar,
  SearchInput,
  SelectFilter,
  ActionButton,
  TableCard,
  DataTable,
  Drawer,
  DrawerField,
  Badge,
} from '../products/components/shared';
import { retailerMasterService } from '../../services/retailerMasterService';
import type { RetailerMasterRecord } from '../../services/retailerMasterService';
import { distributorMasterService } from '../../services/distributorMasterService';
import authService from '../../services/authService';
import activityLogService from '../../services/activityLogService';
import { INDIAN_STATES } from '../../constants/indianStates';
import * as XLSX from 'xlsx';

export default function RetailerMaster() {
  const [retailers, setRetailers] = useState<RetailerMasterRecord[]>([]);
  const [distributors, setDistributors] = useState<{code: string, name: string}[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  const [selectedRetailer, setSelectedRetailer] = useState<RetailerMasterRecord | null>(null);
  const [isViewDrawerOpen, setIsViewDrawerOpen] = useState(false);
  
  const [showFormModal, setShowFormModal] = useState(false);
  const [isEditingModal, setIsEditingModal] = useState(false);
  
  const currentUser = authService.getCurrentUser();

  const defaultNewRetailer = {
    name: '',
    contactPerson: '',
    mobileNumber: '',
    emailAddress: '',
    state: '',
    assignedDistributors: [] as {code: string, name: string}[],
    status: 'Active' as 'Active' | 'Inactive',
    password: '',
    confirmPassword: '',
    dlNumber: '',
    companyPan: '',
    bankName: '',
    accountName: '',
    accountNumber: '',
    ifscCode: ''
  };

  const [distributorSearch, setDistributorSearch] = useState('');

  const [formData, setFormData] = useState(defaultNewRetailer);

  useEffect(() => {
    loadRetailers();
    loadActiveDistributors();
  }, []);

  const loadRetailers = async () => {
    const data = await retailerMasterService.fetchFromApi();
    setRetailers(data);
  };
  
  const loadActiveDistributors = async () => {
    const allDistributors = await distributorMasterService.fetchFromApi();
    const activeDistributors = allDistributors
      .filter(d => d.status === 'Active')
      .map(d => ({ code: d.code, name: d.name }));
    setDistributors(activeDistributors);
  };

  const filteredData = useMemo(() => {
    return retailers.filter(ret => {
      const matchSearch = 
        ret.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ret.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ret.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ret.mobileNumber.includes(searchTerm) ||
        (ret.assignedDistributors || []).some(d => d.name.toLowerCase().includes(searchTerm.toLowerCase()));
        
      const matchStatus = statusFilter ? ret.status === statusFilter : true;
      
      return matchSearch && matchStatus;
    });
  }, [retailers, searchTerm, statusFilter]);

  const getFormattedDate = () => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${dd}-${mm}-${yyyy}`;
  };

  const handleExport = () => {
    const exportData = filteredData.map((row) => ({
      "Retailer Code": row.code,
      "Retailer Name": row.name,
      "Assigned Distributors": row.assignedDistributors?.map(d => d.name).join(', ') || 'N/A',
      "Contact Person": row.contactPerson,
      "Mobile Number": row.mobileNumber,
      "Email Address": row.emailAddress || 'N/A',
      "Status": row.status,
      "Created Date": formatDate(row.createdDate),
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Retailer Master");
    const fileName = `retailer_master_${getFormattedDate()}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      alert('Retailer Name is required');
      return;
    }
    if (formData.assignedDistributors.length === 0) {
      alert('At least one Distributor must be assigned');
      return;
    }
    if (!formData.mobileNumber.trim()) {
      alert('Mobile Number is required');
      return;
    } else if (!/^\d{10}$/.test(formData.mobileNumber.trim())) {
      alert('Enter a valid 10-digit mobile number');
      return;
    }
    
    if (formData.emailAddress && !/^\S+@\S+\.\S+$/.test(formData.emailAddress)) {
      alert('Enter a valid email address');
      return;
    }

    if (!formData.dlNumber?.trim()) {
      alert('Drug License Number is required');
      return;
    }
    if (!formData.companyPan?.trim()) {
      alert('Company PAN Number is required');
      return;
    }
    if (!formData.bankName?.trim()) {
      alert('Bank Name is required');
      return;
    }
    if (!formData.accountName?.trim()) {
      alert('Account Name is required');
      return;
    }
    if (!formData.accountNumber?.trim()) {
      alert('Account Number is required');
      return;
    }
    if (!formData.ifscCode?.trim()) {
      alert('IFSC Code is required');
      return;
    }
    
    if (!isEditingModal) {
      if (!formData.password) {
        alert('Password is required');
        return;
      }
      if (!formData.confirmPassword) {
        alert('Confirm Password is required');
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        alert('Passwords do not match');
        return;
      }
    }

    if (isEditingModal && selectedRetailer) {
      await retailerMasterService.update(selectedRetailer.id, {
        name: formData.name,
        contactPerson: formData.contactPerson,
        mobileNumber: formData.mobileNumber,
        emailAddress: formData.emailAddress,
        assignedDistributors: formData.assignedDistributors,
        status: formData.status
      });
      activityLogService.addLog({
        userId: currentUser?.id,
        userName: currentUser?.fullName,
        action: "Retailer Updated",
        module: "Retailer Master",
      });
    } else {
      await retailerMasterService.create({
        name: formData.name,
        contactPerson: formData.contactPerson,
        mobileNumber: formData.mobileNumber,
        emailAddress: formData.emailAddress,
        assignedDistributors: formData.assignedDistributors,
        status: formData.status
      }, formData.password);
      activityLogService.addLog({
        userId: currentUser?.id,
        userName: currentUser?.fullName,
        action: "Retailer Created",
        module: "Retailer Master",
      });
    }

    await loadRetailers();
    setShowFormModal(false);
  };

  const openAddModal = () => {
    setIsEditingModal(false);
    setFormData(defaultNewRetailer);
    setDistributorSearch('');
    setShowFormModal(true);
  };

  const openEditModal = (retailer: RetailerMasterRecord) => {
    setSelectedRetailer(retailer);
    setIsEditingModal(true);
    setFormData({
      name: retailer.name,
      contactPerson: retailer.contactPerson,
      mobileNumber: retailer.mobileNumber,
      emailAddress: retailer.emailAddress || '',
      assignedDistributors: retailer.assignedDistributors || [],
      status: retailer.status,
      password: '',
      confirmPassword: ''
    });
    setDistributorSearch('');
    setShowFormModal(true);
  };

  const toggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';
    await retailerMasterService.updateStatus(id, newStatus as any);
    await loadRetailers();
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-";
    if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const [year, month, day] = dateStr.split('-');
      return `${day}-${month}-${year}`;
    }
    return dateStr;
  };

  const columns = [
    { key: 'code', label: 'Retailer Code' },
    { 
      key: 'name', 
      label: 'Retailer Name',
      render: (row: RetailerMasterRecord) => (
        <div>
          <p className="font-medium text-slate-900">{row.name}</p>
        </div>
      )
    },
    { 
      key: 'assignedDistributors', 
      label: 'Assigned Distributors',
      render: (row: RetailerMasterRecord) => {
        const dists = row.assignedDistributors || [];
        if (dists.length === 0) return <span className="text-slate-400">None</span>;
        return (
          <div className="flex items-center gap-2">
            <span>{dists[0].name}</span>
            {dists.length > 1 && (
              <Badge variant="neutral">+{dists.length - 1}</Badge>
            )}
          </div>
        );
      }
    },
    { key: 'contactPerson', label: 'Contact Person' },
    { key: 'mobileNumber', label: 'Mobile Number' },
    { 
      key: 'status', 
      label: 'Status', 
      render: (row: RetailerMasterRecord) => (
        <Badge variant={row.status === 'Active' ? 'success' : 'neutral'}>
          {row.status}
        </Badge>
      )
    },
    { 
      key: 'id', 
      label: 'Actions', 
      render: (row: RetailerMasterRecord) => (
        <div className="flex gap-3">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setSelectedRetailer(row);
              setIsViewDrawerOpen(true);
            }}
            className="text-[#163c78] font-medium hover:text-[#0c1f3d]"
          >
            View
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleStatus(row.id, row.status);
            }}
            className={`font-medium ${row.status === 'Active' ? 'text-rose-600 hover:text-rose-800' : 'text-emerald-600 hover:text-emerald-800'}`}
            title={row.status === 'Active' ? 'Deactivate' : 'Activate'}
          >
            {row.status === 'Active' ? 'Deactivate' : 'Activate'}
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Retailer Master" 
        subtitle="Manage all retailers across the network"
        actions={
          <div className="flex items-center gap-3">
            <ActionButton variant="secondary" onClick={handleExport} icon={<Download className="w-4 h-4" />}>
              Export
            </ActionButton>
            <ActionButton onClick={openAddModal} icon={<Plus className="w-4 h-4" />}>
              Add Retailer
            </ActionButton>
          </div>
        }
      />

      <FilterBar>
        <SearchInput 
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Search retailers..."
        />
        <SelectFilter 
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { label: 'Active', value: 'Active' },
            { label: 'Inactive', value: 'Inactive' }
          ]}
          placeholder="All Status"
        />
      </FilterBar>

      <TableCard>
        <DataTable 
          columns={columns as any} 
          data={filteredData as any}
          emptyMessage="No retailers found."
        />
      </TableCard>

      {/* Form Modal */}
      {showFormModal && (
        <div 
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          onClick={() => setShowFormModal(false)}
        >
          <div 
            className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white z-10 px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">
                {isEditingModal ? "Edit Retailer" : "Add New Retailer"}
              </h2>
              <button
                onClick={() => setShowFormModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors outline-none"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              <section className="mb-8">
                <h3 className="text-sm font-semibold text-slate-900 mb-4 bg-slate-50 px-3 py-2 rounded">
                  Basic Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {isEditingModal && (
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Retailer Code</label>
                      <input 
                        type="text"
                        value={selectedRetailer?.code || ''} 
                        disabled 
                        className="w-full px-3 py-2 border border-slate-200 bg-slate-50 rounded-lg text-sm"
                      />
                    </div>
                  )}
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Retailer Name *</label>
                    <input 
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Contact Person</label>
                    <input 
                      type="text"
                      value={formData.contactPerson}
                      onChange={(e) => setFormData({...formData, contactPerson: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Mobile Number *</label>
                    <input 
                      type="text"
                      maxLength={10}
                      value={formData.mobileNumber}
                      onChange={(e) => setFormData({...formData, mobileNumber: e.target.value.replace(/\\D/g, '').slice(0, 10)})}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Email Address</label>
                    <input 
                      type="email"
                      value={formData.emailAddress}
                      onChange={(e) => setFormData({...formData, emailAddress: e.target.value})}
                      autoComplete="no-autofill"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">State</label>
                    <select
                      value={formData.state}
                      onChange={(e) => setFormData({...formData, state: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 text-sm bg-white"
                    >
                      <option value="">Select State</option>
                      {INDIAN_STATES.map((s) => (
                        <option key={s.value} value={s.value}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({...formData, status: e.target.value as any})}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 text-sm bg-white"
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                </div>
              </section>

              <section className="mb-8">
                <h3 className="text-sm font-semibold text-slate-900 mb-4 bg-slate-50 px-3 py-2 rounded">
                  Distributor Assignment
                </h3>
                <div className="space-y-4">
                  <div>
                    <input 
                      type="text" 
                      placeholder="Search distributors..." 
                      value={distributorSearch}
                      onChange={(e) => setDistributorSearch(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 text-sm"
                    />
                  </div>
                  <div className="border border-slate-200 rounded-lg max-h-48 overflow-y-auto p-2">
                    {distributors.filter(d => d.name.toLowerCase().includes(distributorSearch.toLowerCase()) || d.code.toLowerCase().includes(distributorSearch.toLowerCase())).map(d => {
                      const isSelected = formData.assignedDistributors.some(ad => ad.code === d.code);
                      return (
                        <label key={d.code} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={isSelected}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFormData({ ...formData, assignedDistributors: [...formData.assignedDistributors, d] });
                              } else {
                                setFormData({ ...formData, assignedDistributors: formData.assignedDistributors.filter(ad => ad.code !== d.code) });
                              }
                            }}
                            className="w-4 h-4 text-[#163c78] rounded border-slate-300 focus:ring-violet-500"
                          />
                          <div>
                            <p className="text-sm font-medium text-slate-900">{d.name}</p>
                            <p className="text-xs text-slate-500">{d.code}</p>
                          </div>
                        </label>
                      );
                    })}
                    {distributors.filter(d => d.name.toLowerCase().includes(distributorSearch.toLowerCase()) || d.code.toLowerCase().includes(distributorSearch.toLowerCase())).length === 0 && (
                      <p className="text-center text-sm text-slate-500 py-4">No distributors found</p>
                    )}
                  </div>
                  {formData.assignedDistributors.length > 0 && (
                    <div className="bg-slate-50 p-3 rounded-lg">
                      <p className="text-xs font-semibold text-slate-700 mb-2">Selected Distributors ({formData.assignedDistributors.length})</p>
                      <div className="flex flex-wrap gap-2">
                        {formData.assignedDistributors.map(d => (
                          <div key={d.code} className="flex items-center gap-1">
                            <Badge variant="neutral">
                              <div className="flex items-center gap-1">
                                {d.name}
                                <button 
                                  onClick={() => setFormData({ ...formData, assignedDistributors: formData.assignedDistributors.filter(ad => ad.code !== d.code) })}
                                  className="hover:text-slate-900 ml-1 outline-none"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </section>

              <section>
                <h3 className="text-sm font-semibold text-slate-900 mb-4 bg-slate-50 px-3 py-2 rounded">
                  Compliance Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Drug License Number (DL No) *</label>
                    <input 
                      type="text"
                      value={formData.dlNumber || ''}
                      onChange={(e) => setFormData({...formData, dlNumber: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Company PAN Number *</label>
                    <input 
                      type="text"
                      value={formData.companyPan || ''}
                      onChange={(e) => setFormData({...formData, companyPan: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 text-sm"
                    />
                  </div>
                </div>
              </section>

              <section>
                <h3 className="text-sm font-semibold text-slate-900 mb-4 bg-slate-50 px-3 py-2 rounded">
                  Bank Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Bank Name *</label>
                    <input 
                      type="text"
                      value={formData.bankName || ''}
                      onChange={(e) => setFormData({...formData, bankName: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Account Name *</label>
                    <input 
                      type="text"
                      value={formData.accountName || ''}
                      onChange={(e) => setFormData({...formData, accountName: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Account Number *</label>
                    <input 
                      type="text"
                      value={formData.accountNumber || ''}
                      onChange={(e) => setFormData({...formData, accountNumber: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">IFSC Code *</label>
                    <input 
                      type="text"
                      value={formData.ifscCode || ''}
                      onChange={(e) => setFormData({...formData, ifscCode: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 text-sm"
                    />
                  </div>
                </div>
              </section>

              {!isEditingModal && (
                <section>
                  <h3 className="text-sm font-semibold text-slate-900 mb-4 bg-slate-50 px-3 py-2 rounded">
                    Authentication
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Temporary Password *</label>
                      <input 
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                        autoComplete="new-password"
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Confirm Password *</label>
                      <input 
                        type="password"
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                        autoComplete="new-password"
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 text-sm"
                      />
                    </div>
                  </div>
                </section>
              )}

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
                <ActionButton variant="secondary" onClick={() => setShowFormModal(false)}>
                  Cancel
                </ActionButton>
                <ActionButton onClick={handleSave}>
                  {isEditingModal ? 'Update Retailer' : 'Save Retailer'}
                </ActionButton>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Drawer */}
      <Drawer
        open={isViewDrawerOpen}
        onClose={() => setIsViewDrawerOpen(false)}
        title="Retailer Details"
      >
        {selectedRetailer && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h2 className="text-xl font-bold text-slate-900">
                {selectedRetailer.name}
              </h2>
              <Badge
                variant={
                  selectedRetailer.status === "Active" ? "success" : "neutral"
                }
              >
                {selectedRetailer.status}
              </Badge>
            </div>

            <section>
              <h3 className="text-sm font-semibold text-slate-900 mb-3 bg-slate-50 px-3 py-2 rounded">
                Retailer Information
              </h3>
              <div className="space-y-1">
                <DrawerField label="Retailer Code" value={selectedRetailer.code} />
                <DrawerField label="Retailer Name" value={selectedRetailer.name} />
              </div>
            </section>

            <section>
              <h3 className="text-sm font-semibold text-slate-900 mb-3 bg-slate-50 px-3 py-2 rounded">
                Assigned Distributors
              </h3>
              <div className="space-y-2">
                {selectedRetailer.assignedDistributors && selectedRetailer.assignedDistributors.length > 0 ? (
                  selectedRetailer.assignedDistributors.map(d => (
                    <div key={d.code} className="flex justify-between items-center p-2 bg-white border border-slate-100 rounded">
                      <span className="text-sm font-medium text-slate-900">{d.name}</span>
                      <span className="text-xs text-slate-500">{d.code}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500 italic">No distributors assigned</p>
                )}
              </div>
            </section>

            <section>
              <h3 className="text-sm font-semibold text-slate-900 mb-3 bg-slate-50 px-3 py-2 rounded">
                Compliance Details
              </h3>
              <div className="space-y-1">
                <DrawerField label="Drug License No" value={selectedRetailer.dlNumber || 'N/A'} />
                <DrawerField label="Company PAN" value={selectedRetailer.companyPan || 'N/A'} />
              </div>
            </section>

            <section>
              <h3 className="text-sm font-semibold text-slate-900 mb-3 bg-slate-50 px-3 py-2 rounded">
                Bank Details
              </h3>
              <div className="space-y-1">
                <DrawerField label="Bank Name" value={selectedRetailer.bankName || 'N/A'} />
                <DrawerField label="Account Name" value={selectedRetailer.accountName || 'N/A'} />
                <DrawerField label="Account Number" value={selectedRetailer.accountNumber || 'N/A'} />
                <DrawerField label="IFSC Code" value={selectedRetailer.ifscCode || 'N/A'} />
              </div>
            </section>

            <section>
              <h3 className="text-sm font-semibold text-slate-900 mb-3 bg-slate-50 px-3 py-2 rounded">
                Contact Information
              </h3>
              <div className="space-y-1">
                <DrawerField label="Contact Person" value={selectedRetailer.contactPerson} />
                <DrawerField label="Mobile Number" value={selectedRetailer.mobileNumber} />
                <DrawerField label="Email Address" value={selectedRetailer.emailAddress || 'N/A'} />
                <DrawerField label="Password" value={(() => {
                  const users = JSON.parse(localStorage.getItem('pharma_erp_users') || '[]');
                  const user = users.find((u: any) => u.username === selectedRetailer.code);
                  return user ? user.password : 'N/A';
                })()} />
              </div>
            </section>

            <div className="flex flex-col gap-1 text-xs text-slate-400 mt-8 pt-4 border-t border-slate-100">
              <p>
                Created on {formatDate(selectedRetailer.createdDate)}
              </p>
            </div>

            <div className="pt-6 mt-6 border-t border-slate-100 flex justify-end gap-3">
              <ActionButton 
                className="min-w-[140px]" 
                onClick={() => {
                  const ret = selectedRetailer;
                  setIsViewDrawerOpen(false);
                  setTimeout(() => {
                    if (ret) openEditModal(ret);
                  }, 300);
                }}
              >
                Edit Retailer
              </ActionButton>
              <ActionButton variant="secondary" onClick={() => setIsViewDrawerOpen(false)}>
                Close
              </ActionButton>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
