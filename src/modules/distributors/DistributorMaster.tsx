import { useState, useEffect, useMemo } from 'react';
import { Plus, Download, X, Eye, EyeOff } from 'lucide-react';
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
import { distributorMasterService } from '../../services/distributorMasterService';
import type { DistributorMasterRecord } from '../../services/distributorMasterService';
import authService from '../../services/authService';
import activityLogService from '../../services/activityLogService';
import { INDIAN_STATES } from '../../constants/indianStates';
import * as XLSX from 'xlsx';

export default function DistributorMaster() {
  const [distributors, setDistributors] = useState<DistributorMasterRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  const [selectedDistributor, setSelectedDistributor] = useState<DistributorMasterRecord | null>(null);
  const [isViewDrawerOpen, setIsViewDrawerOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const [showFormModal, setShowFormModal] = useState(false);
  const [isEditingModal, setIsEditingModal] = useState(false);
  
  const currentUser = authService.getCurrentUser();

  const defaultNewDistributor = {
    name: '',
    contactPerson: '',
    mobileNumber: '',
    emailAddress: '',
    state: '',
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

  const [formData, setFormData] = useState(defaultNewDistributor);

  useEffect(() => {
    loadDistributors();
  }, []);

  const loadDistributors = async () => {
    const data = await distributorMasterService.fetchFromApi();
    setDistributors(data);
  };

  const filteredData = useMemo(() => {
    return distributors.filter(dist => {
      const matchSearch = 
        dist.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dist.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dist.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dist.mobileNumber.includes(searchTerm);
        
      const matchStatus = statusFilter ? dist.status === statusFilter : true;
      
      return matchSearch && matchStatus;
    });
  }, [distributors, searchTerm, statusFilter]);

  const getFormattedDate = () => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${dd}-${mm}-${yyyy}`;
  };

  const handleExport = () => {
    const exportData = filteredData.map((row) => ({
      "Distributor Code": row.code,
      "Distributor Name": row.name,
      "Contact Person": row.contactPerson,
      "Mobile Number": row.mobileNumber,
      "Email Address": row.emailAddress || 'N/A',
      "Status": row.status,
      "Created Date": formatDate(row.createdDate),
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Distributor Master");
    const fileName = `distributor_master_${getFormattedDate()}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      alert('Distributor Name is required');
      return;
    }
    if (!formData.contactPerson.trim()) {
      alert('Contact Person is required');
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

    if (isEditingModal && selectedDistributor) {
      const updatedRec = await distributorMasterService.update(selectedDistributor.id, {
        name: formData.name,
        contactPerson: formData.contactPerson,
        mobileNumber: formData.mobileNumber,
        emailAddress: formData.emailAddress,
        state: formData.state,
        status: formData.status,
        ...(formData.password ? { password: formData.password } : {})
      });
      if (updatedRec) {
        setSelectedDistributor(updatedRec);
      }
      activityLogService.addLog({
        userId: currentUser?.id,
        userName: currentUser?.fullName,
        action: "Distributor Updated",
        module: "Distributor Master",
      });
    } else {
      await distributorMasterService.create({
        name: formData.name,
        contactPerson: formData.contactPerson,
        mobileNumber: formData.mobileNumber,
        emailAddress: formData.emailAddress,
        state: formData.state,
        status: formData.status
      }, formData.password);
      activityLogService.addLog({
        userId: currentUser?.id,
        userName: currentUser?.fullName,
        action: "Distributor Created",
        module: "Distributor Master",
      });
    }

    await loadDistributors();
    setShowFormModal(false);
  };

  const openAddModal = () => {
    setIsEditingModal(false);
    setFormData(defaultNewDistributor);
    setShowFormModal(true);
  };

  const openEditModal = (distributor: DistributorMasterRecord) => {
    setSelectedDistributor(distributor);
    setIsEditingModal(true);
    setFormData({
      name: distributor.name,
      contactPerson: distributor.contactPerson,
      mobileNumber: distributor.mobileNumber,
      emailAddress: distributor.emailAddress || '',
      state: distributor.state || '',
      status: distributor.status,
      password: distributor.password || '',
      confirmPassword: distributor.password || ''
    });
    setShowFormModal(true);
  };

  const toggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';
    await distributorMasterService.updateStatus(id, newStatus as any);
    await loadDistributors();
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
    { key: 'code', label: 'Distributor Code' },
    { 
      key: 'name', 
      label: 'Distributor Name',
      render: (row: DistributorMasterRecord) => (
        <div>
          <p className="font-medium text-slate-900">{row.name}</p>
        </div>
      )
    },
    { key: 'contactPerson', label: 'Contact Person' },
    { key: 'mobileNumber', label: 'Mobile Number' },
    { 
      key: 'status', 
      label: 'Status', 
      render: (row: DistributorMasterRecord) => (
        <Badge variant={row.status === 'Active' ? 'success' : 'neutral'}>
          {row.status}
        </Badge>
      )
    },
    { 
      key: 'id', 
      label: 'Actions', 
      render: (row: DistributorMasterRecord) => (
        <div className="flex gap-3">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setSelectedDistributor(row);
              setShowPassword(false);
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
        title="Distributor Master" 
        subtitle="Manage all distributors across the network"
        actions={
          <div className="flex items-center gap-3">
            <ActionButton variant="secondary" onClick={handleExport} icon={<Download className="w-4 h-4" />}>
              Export
            </ActionButton>
            <ActionButton onClick={openAddModal} icon={<Plus className="w-4 h-4" />}>
              Add Distributor
            </ActionButton>
          </div>
        }
      />

      <FilterBar>
        <SearchInput 
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Search distributors..."
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
          emptyMessage="No distributors found."
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
                {isEditingModal ? "Edit Distributor" : "Add New Distributor"}
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
                      <label className="block text-xs font-medium text-slate-700 mb-1">Distributor Code</label>
                      <input 
                        type="text"
                        value={selectedDistributor?.code || ''} 
                        disabled 
                        className="w-full px-3 py-2 border border-slate-200 bg-slate-50 rounded-lg text-sm"
                      />
                    </div>
                  )}
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Distributor Name *</label>
                    <input 
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Contact Person *</label>
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
                  {isEditingModal ? 'Update Distributor' : 'Save Distributor'}
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
        title="Distributor Details"
      >
        {selectedDistributor && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h2 className="text-xl font-bold text-slate-900">
                {selectedDistributor.name}
              </h2>
              <Badge
                variant={
                  selectedDistributor.status === "Active" ? "success" : "neutral"
                }
              >
                {selectedDistributor.status}
              </Badge>
            </div>

            <section>
              <h3 className="text-sm font-semibold text-slate-900 mb-3 bg-slate-50 px-3 py-2 rounded">
                Distributor Information
              </h3>
              <div className="space-y-1">
                <DrawerField label="Distributor Code" value={selectedDistributor.code} />
                <DrawerField label="Distributor Name" value={selectedDistributor.name} />
                <DrawerField label="State" value={selectedDistributor.state || 'N/A'} />
              </div>
            </section>
            
            <section>
              <h3 className="text-sm font-semibold text-slate-900 mb-3 bg-slate-50 px-3 py-2 rounded">
                Compliance Details
              </h3>
              <div className="space-y-1">
                <DrawerField label="Drug License No" value={selectedDistributor.dlNumber || 'N/A'} />
                <DrawerField label="Company PAN" value={selectedDistributor.companyPan || 'N/A'} />
              </div>
            </section>

            <section>
              <h3 className="text-sm font-semibold text-slate-900 mb-3 bg-slate-50 px-3 py-2 rounded">
                Bank Details
              </h3>
              <div className="space-y-1">
                <DrawerField label="Bank Name" value={selectedDistributor.bankName || 'N/A'} />
                <DrawerField label="Account Name" value={selectedDistributor.accountName || 'N/A'} />
                <DrawerField label="Account Number" value={selectedDistributor.accountNumber || 'N/A'} />
                <DrawerField label="IFSC Code" value={selectedDistributor.ifscCode || 'N/A'} />
              </div>
            </section>

            <section>
              <h3 className="text-sm font-semibold text-slate-900 mb-3 bg-slate-50 px-3 py-2 rounded">
                Contact Information
              </h3>
              <div className="space-y-1">
                <DrawerField label="Contact Person" value={selectedDistributor.contactPerson} />
                <DrawerField label="Mobile Number" value={selectedDistributor.mobileNumber} />
                <DrawerField label="Email Address" value={selectedDistributor.emailAddress || (selectedDistributor as any).email || 'N/A'} />
                <DrawerField label="Password" value={(() => {
                  let pass = selectedDistributor.password || (selectedDistributor as any).pass || '';
                  if (!pass) {
                    try {
                      const users = JSON.parse(localStorage.getItem('pharma_erp_users') || '[]');
                      const user = users.find((u: any) => 
                        u.username === selectedDistributor.code || 
                        u.code === selectedDistributor.code || 
                        u.linkedDistributorCode === selectedDistributor.code ||
                        (u.email && selectedDistributor.emailAddress && u.email.toLowerCase() === selectedDistributor.emailAddress.toLowerCase())
                      );
                      if (user && user.password) pass = user.password;
                    } catch (e) {}
                  }
                  if (!pass) pass = 'Pass@1234';

                  return (
                    <div className="flex items-center gap-2">
                      <span className="font-mono tracking-wider text-slate-800">
                        {showPassword ? pass : '••••••••'}
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="p-1 text-slate-400 hover:text-slate-600 transition-colors rounded hover:bg-slate-100"
                        title={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  );
                })()} />
              </div>
            </section>

            <div className="flex flex-col gap-1 text-xs text-slate-400 mt-8 pt-4 border-t border-slate-100">
              <p>
                Created on {formatDate(selectedDistributor.createdDate)}
              </p>
            </div>

            <div className="pt-6 mt-6 border-t border-slate-100 flex justify-end gap-3">
              <ActionButton 
                className="min-w-[140px]" 
                onClick={() => {
                  const dist = selectedDistributor;
                  setIsViewDrawerOpen(false);
                  setTimeout(() => {
                    if (dist) openEditModal(dist);
                  }, 300);
                }}
              >
                Edit Distributor
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
