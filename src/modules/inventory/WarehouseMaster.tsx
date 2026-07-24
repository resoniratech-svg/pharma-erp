import { useState, useEffect } from 'react';
import { Plus, Filter, Download, Trash2 } from 'lucide-react';
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
import { warehouseService } from '../../services/warehouseService';
import authService from "../../services/authService";
import activityLogService from "../../services/activityLogService";
import { permissionService } from '../../services/permissionService';
import * as XLSX from "xlsx";
import { INDIAN_STATES } from '../../constants/indianStates';

interface Warehouse {
  id: string;
  code: string;
  name: string;
  type: string;
  branch: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  country: string;
  pinCode: string;
  gstNumber: string;
  licenseNumber: string;
  remarks: string;
  status: "Active" | "Inactive";
  createdAt: string;
  createdBy: string;
  lastModified: string;
}

const WAREHOUSE_TYPES = [
  "Main Warehouse",
  "Regional Warehouse",
  "Distribution Warehouse",
  "Cold Storage",
  "Returns Warehouse",
];

const formatDate = (dateString: string | undefined) => {
  if (!dateString) return "-";
  if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
    const [year, month, day] = dateString.split('-');
    return `${day}-${month}-${year}`;
  }
  const date = new Date(dateString);
  if (!isNaN(date.getTime())) {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  }
  return dateString;
};

export default function WarehouseMaster() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  useEffect(() => {
    async function loadData() {
      const saved = await warehouseService.loadWarehouses();
      setWarehouses(saved);
    }
    loadData();
  }, []);
 
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  const [selectedWarehouse, setSelectedWarehouse] = useState<Warehouse | null>(null);
  const [warehouseToDelete, setWarehouseToDelete] = useState<Warehouse | null>(null);
  
  const [showFormModal, setShowFormModal] = useState(false);
  const [isEditingModal, setIsEditingModal] = useState(false);

  const currentUser = authService.getCurrentUser();

  const defaultNewWarehouse: Partial<Warehouse> = {
    code: "",
    name: "",
    type: "Main Warehouse",
    status: "Active",
    branch: "",
    contactPerson: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    state: "",
    country: "",
    pinCode: "",
    gstNumber: "",
    licenseNumber: "",
    remarks: "",
  };

  const [newWarehouse, setNewWarehouse] = useState<Partial<Warehouse>>(defaultNewWarehouse);

  const autoGenerateWarehouseCode = () => {
    const maxCodeNumber = warehouses.reduce((max, w) => {
      const match = w.code.match(/WH-(\d+)/);
      if (match) {
        const num = parseInt(match[1], 10);
        return num > max ? num : max;
      }
      return max;
    }, 0);
    return `WH-${String(maxCodeNumber + 1).padStart(6, "0")}`;
  };

  const handleSave = () => {
    const code = (newWarehouse.code || "").trim();
    const name = (newWarehouse.name || "").trim();
    const contactPerson = (newWarehouse.contactPerson || "").trim();
    const phone = (newWarehouse.phone || "").trim();
    const email = (newWarehouse.email || "").trim();
    const gstNumber = (newWarehouse.gstNumber || "").trim();
    const licenseNumber = (newWarehouse.licenseNumber || "").trim();
    const pinCode = (newWarehouse.pinCode || "").trim();
    const address = (newWarehouse.address || "").trim();
    const remarks = (newWarehouse.remarks || "").trim();
    const city = (newWarehouse.city || "").trim();
    const state = (newWarehouse.state || "").trim();
    const country = (newWarehouse.country || "").trim();
    const branch = (newWarehouse.branch || "").trim();

    if (!code || !name) {
      alert("Warehouse Code and Warehouse Name are required and cannot be empty.");
      return;
    }

    if (code.length > 20) {
      alert("Warehouse Code cannot exceed 20 characters.");
      return;
    }

    if (name.length > 100) {
      alert("Warehouse Name cannot exceed 100 characters.");
      return;
    }

    const duplicate = warehouses.find(
      (w) =>
        w.code.trim().toLowerCase() === code.toLowerCase() && w.id !== newWarehouse.id,
    );

    if (duplicate) {
      alert("Warehouse Code already exists.");
      return;
    }

    if (contactPerson.length > 100) {
      alert("Contact Person cannot exceed 100 characters.");
      return;
    }

    if (phone) {
      if (!/^\d+$/.test(phone)) {
        alert("Phone Number must contain only digits.");
        return;
      }
      if (phone.length > 10) {
        alert("Phone Number cannot exceed 10 digits.");
        return;
      }
    }

    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        alert("Please enter a valid email address.");
        return;
      }
    }

    if (gstNumber.length > 15) {
      alert("GST Number cannot exceed 15 characters.");
      return;
    }

    if (!licenseNumber) {
      alert("License Number is required and cannot be empty.");
      return;
    }

    if (licenseNumber.length > 50) {
      alert("License Number cannot exceed 50 characters.");
      return;
    }

    if (pinCode) {
      if (!/^\d+$/.test(pinCode)) {
        alert("PIN Code must contain only digits.");
        return;
      }
      if (pinCode.length > 6) {
        alert("PIN Code cannot exceed 6 digits.");
        return;
      }
    }

    if (address.length > 250) {
      alert("Address cannot exceed 250 characters.");
      return;
    }

    if (remarks.length > 250) {
      alert("Remarks cannot exceed 250 characters.");
      return;
    }

    const cleanWarehouse = {
      ...newWarehouse,
      code,
      name,
      contactPerson,
      phone,
      email,
      gstNumber,
      licenseNumber,
      pinCode,
      address,
      remarks,
      city,
      state,
      country,
      branch
    };

    if (isEditingModal) {
      const updatedWarehouse = {
        ...cleanWarehouse,
        lastModified: new Date().toISOString(),
      } as Warehouse;

      setWarehouses(
        warehouses.map((w) =>
          w.id === updatedWarehouse.id ? updatedWarehouse : w,
        ),
      );

      warehouseService.updateWarehouse(updatedWarehouse.id, updatedWarehouse);
      activityLogService.addLog({
        userId: currentUser?.id,
        userName: currentUser?.fullName,
        action: "Warehouse Updated",
        module: "Warehouse Master",
      });
    } else {
      const createdData: Warehouse = {
        ...(cleanWarehouse as Warehouse),
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        createdBy: currentUser?.fullName ?? "System Admin",
        lastModified: new Date().toISOString(),
      };

      setWarehouses([...warehouses, createdData]);

      warehouseService.addWarehouse(createdData);
      activityLogService.addLog({
        userId: currentUser?.id,
        userName: currentUser?.fullName,
        action: "Warehouse Created",
        module: "Warehouse Master",
      });
    }
    setShowFormModal(false);
  };

  const handleDelete = () => {
    if (!warehouseToDelete) return;

    setWarehouses(warehouses.filter((w) => w.id !== warehouseToDelete.id));

    warehouseService.deleteWarehouse(warehouseToDelete.id);
    activityLogService.addLog({
      userId: currentUser?.id,
      userName: currentUser?.fullName,
      action: "Warehouse Deleted",
      module: "Warehouse Master",
    });

    setWarehouseToDelete(null);
  };

  const columns = [
    { key: "code", label: "Warehouse Code" },
    {
      key: "name",
      label: "Warehouse Name",
      render: (row: Warehouse) => (
        <div>
          <p className="font-medium text-slate-900">{row.name}</p>
        </div>
      ),
    },
    { key: "type", label: "Warehouse Type" },
    // { key: "branch", label: "Branch" },
    { key: "contactPerson", label: "Contact Person" },
    { key: "phone", label: "Phone Number" },
    {
      key: "status",
      label: "Status",
      render: (row: Warehouse) => (
        <Badge variant={row.status === "Active" ? "success" : "neutral"}>
          {row.status}
        </Badge>
      ),
    },
    {
      key: "id",
      label: "Actions",
      render: (row: Warehouse) => (
        <div className="flex gap-3">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setSelectedWarehouse(row);
            }}
            className="text-[#163c78] font-medium hover:text-[#0c1f3d]"
          >
            View
          </button>
          {canEdit && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setNewWarehouse(row);
                setIsEditingModal(true);
                setShowFormModal(true);
              }}
              className="text-emerald-600 font-medium hover:text-emerald-800"
              title="Edit"
            >
              Edit
            </button>
          )}
          {canDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setWarehouseToDelete(row);
              }}
              className="text-rose-600 font-medium hover:text-rose-800"
              title="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      ),
    },
  ];

  const sortedWarehouses = [...warehouses].sort((a, b) => {
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const filteredData = sortedWarehouses.filter((item) => {
    const matchSearch = item.code.toLowerCase().includes(search.toLowerCase()) || item.name.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter ? item.status === statusFilter : true;
    return matchSearch && matchStatus;
  });

  const getFormattedDate = () => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${dd}-${mm}-${yyyy}`;
  };

  const handleExport = () => {
    const exportData = filteredData.map((row) => ({
      "Warehouse Code": row.code,
      "Warehouse Name": row.name,
      "Warehouse Type": row.type,
      Branch: row.branch,
      "Contact Person": row.contactPerson,
      Phone: row.phone,
      Email: row.email,
      City: row.city,
      State: row.state,
      Country: row.country,
      Status: row.status,
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);

    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, "Warehouse Master");

  const fileName = `warehouse_master_${getFormattedDate()}.xlsx`;

    XLSX.writeFile(workbook, fileName);
  };

  const activeRole = localStorage.getItem('activeRole') || 'SUPER_ADMIN';
  const canCreate = permissionService.canCreate(activeRole, 'Inventory & Warehouse Management');
  const canEdit = permissionService.canEdit(activeRole, 'Inventory & Warehouse Management');
  const canDelete = permissionService.canDelete(activeRole, 'Inventory & Warehouse Management');

  const openNewWarehouseModal = () => {
    if (!canCreate) {
      alert("Creation permission is disabled for Inventory & Warehouse Management in Roles & Permissions.");
      return;
    }
    const autoCode = autoGenerateWarehouseCode();
    setNewWarehouse({ ...defaultNewWarehouse, code: autoCode });
    setIsEditingModal(false);
    setShowFormModal(true);
  };

  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader
        title="Warehouse Master"
        subtitle="Manage all warehouses used for inventory storage and stock movement."
        actions={
          <>
            <ActionButton
              variant="secondary"
              icon={<Download className="w-4 h-4" />}
              onClick={handleExport}
            >
              Export
            </ActionButton>
            <ActionButton
              icon={<Plus className="w-4 h-4" />}
              onClick={openNewWarehouseModal}
            >
              Add Warehouse
            </ActionButton>
          </>
        }
      />

      <FilterBar>
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search by Warehouse Name, Warehouse Code"
        />
        <div className="w-px h-6 bg-slate-200 mx-2 hidden sm:block" />
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-medium text-slate-600">Filters:</span>
        </div>
        <SelectFilter
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { label: "Active", value: "Active" },
            { label: "Inactive", value: "Inactive" },
          ]}
          placeholder="All Status"
        />
      </FilterBar>

      <TableCard>
        <DataTable
          columns={columns}
          data={filteredData}
          onRowClick={(row) => setSelectedWarehouse(row)}
          emptyMessage="No warehouses found matching your criteria."
        />
      </TableCard>

      {/* Shared Create / Edit Form Modal */}
      {showFormModal && (
        <div 
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={() => setShowFormModal(false)}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900">
                {isEditingModal ? "Edit Warehouse" : "Add Warehouse"}
              </h2>
              <button
                onClick={() => setShowFormModal(false)}
                className="text-slate-500 hover:text-slate-800"
              >
                ✕
              </button>
            </div>

            <div className="space-y-6">
              {/* Section 1: Warehouse Information */}
              <section>
                <h3 className="text-sm font-semibold text-slate-900 mb-3 border-b pb-1">
                  Warehouse Information
                </h3>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Warehouse Code *
                    </label>
                    <input
                      value={newWarehouse.code}
                      readOnly
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-500 cursor-not-allowed text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Warehouse Name *
                    </label>
                    <input
                      maxLength={100}
                      value={newWarehouse.name}
                      onChange={(e) =>
                        setNewWarehouse({
                          ...newWarehouse,
                          name: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Warehouse Type *
                    </label>
                    <select
                      value={newWarehouse.type}
                      onChange={(e) =>
                        setNewWarehouse({
                          ...newWarehouse,
                          type: e.target.value as any,
                        })
                      }
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 bg-white text-sm"
                    >
                      <option value="">Select Type</option>
                      {WAREHOUSE_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Status *
                    </label>
                    <select
                      value={newWarehouse.status}
                      onChange={(e) =>
                        setNewWarehouse({
                          ...newWarehouse,
                          status: e.target.value as any,
                        })
                      }
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 bg-white text-sm"
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                </div>
              </section>

              {/* Section 2: Location Information */}
              <section>
                <h3 className="text-sm font-semibold text-slate-900 mb-3 border-b pb-1">
                  Location Information
                </h3>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Address
                    </label>
                    <input
                      maxLength={250}
                      value={newWarehouse.address}
                      onChange={(e) =>
                        setNewWarehouse({
                          ...newWarehouse,
                          address: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      City
                    </label>
                    <input
                      value={newWarehouse.city}
                      onChange={(e) =>
                        setNewWarehouse({
                          ...newWarehouse,
                          city: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      State
                    </label>
                    <select
                      value={newWarehouse.state}
                      onChange={(e) =>
                        setNewWarehouse({
                          ...newWarehouse,
                          state: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 bg-white text-sm"
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
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Country
                    </label>
                    <input
                      value={newWarehouse.country}
                      onChange={(e) =>
                        setNewWarehouse({
                          ...newWarehouse,
                          country: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Pincode
                    </label>
                    <input
                      maxLength={6}
                      value={newWarehouse.pinCode}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                        setNewWarehouse({
                          ...newWarehouse,
                          pinCode: val,
                        });
                      }}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 text-sm"
                    />
                  </div>
                </div>
              </section>

              {/* Section 3: Contact Information */}
              <section>
                <h3 className="text-sm font-semibold text-slate-900 mb-3 border-b pb-1">
                  Contact Information
                </h3>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Contact Person
                    </label>
                    <input
                      maxLength={100}
                      value={newWarehouse.contactPerson}
                      onChange={(e) =>
                        setNewWarehouse({
                          ...newWarehouse,
                          contactPerson: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Mobile Number
                    </label>
                    <input
                      maxLength={10}
                      value={newWarehouse.phone}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                        setNewWarehouse({
                          ...newWarehouse,
                          phone: val,
                        });
                      }}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Email
                    </label>
                    <input
                      value={newWarehouse.email}
                      onChange={(e) =>
                        setNewWarehouse({
                          ...newWarehouse,
                          email: e.target.value,
                        })
                      }
                      type="email"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 text-sm"
                    />
                  </div>
                </div>
              </section>

              {/* Section 4: Additional Information */}
              <section>
                <h3 className="text-sm font-semibold text-slate-900 mb-3 border-b pb-1">
                  Additional Information
                </h3>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      GST Number
                    </label>
                    <input
                      maxLength={15}
                      value={newWarehouse.gstNumber}
                      onChange={(e) =>
                        setNewWarehouse({
                          ...newWarehouse,
                          gstNumber: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      License Number *
                    </label>
                    <input
                      maxLength={50}
                      value={newWarehouse.licenseNumber}
                      onChange={(e) =>
                        setNewWarehouse({
                          ...newWarehouse,
                          licenseNumber: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Remarks
                    </label>
                    <textarea
                      maxLength={250}
                      value={newWarehouse.remarks}
                      onChange={(e) =>
                        setNewWarehouse({
                          ...newWarehouse,
                          remarks: e.target.value,
                        })
                      }
                      rows={3}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 text-sm resize-none"
                    />
                  </div>
                </div>
              </section>

              {/* Footer Buttons */}
              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
                <ActionButton
                  variant="secondary"
                  onClick={() => setShowFormModal(false)}
                >
                  Cancel
                </ActionButton>
                <ActionButton onClick={handleSave}>Save Warehouse</ActionButton>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Drawer */}
      <Drawer
        open={!!selectedWarehouse}
        onClose={() => setSelectedWarehouse(null)}
        title="Warehouse Details"
      >
        {selectedWarehouse && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h2 className="text-xl font-bold text-slate-900">
                {selectedWarehouse.name}
              </h2>
              <Badge
                variant={
                  selectedWarehouse.status === "Active" ? "success" : "neutral"
                }
              >
                {selectedWarehouse.status}
              </Badge>
            </div>

            {/* Warehouse Information */}
            <section>
              <h3 className="text-sm font-semibold text-slate-900 mb-3 bg-slate-50 px-3 py-2 rounded">
                Warehouse Information
              </h3>
              <div className="space-y-1">
                <DrawerField
                  label="Warehouse Code"
                  value={selectedWarehouse.code}
                />
                <DrawerField
                  label="Warehouse Type"
                  value={selectedWarehouse.type}
                />
              </div>
            </section>

            {/* Location Information */}
            <section>
              <h3 className="text-sm font-semibold text-slate-900 mb-3 bg-slate-50 px-3 py-2 rounded">
                Location Information
              </h3>
              <div className="space-y-1">
                <DrawerField
                  label="Address"
                  value={selectedWarehouse.address}
                />
                <DrawerField label="City" value={selectedWarehouse.city} />
                <DrawerField label="State" value={selectedWarehouse.state} />
                <DrawerField
                  label="Country"
                  value={selectedWarehouse.country}
                />
                <DrawerField
                  label="Pincode"
                  value={selectedWarehouse.pinCode}
                />
              </div>
            </section>

            {/* Contact Information */}
            <section>
              <h3 className="text-sm font-semibold text-slate-900 mb-3 bg-slate-50 px-3 py-2 rounded">
                Contact Information
              </h3>
              <div className="space-y-1">
                <DrawerField
                  label="Contact Person"
                  value={selectedWarehouse.contactPerson}
                />
                <DrawerField
                  label="Mobile Number"
                  value={selectedWarehouse.phone}
                />
                <DrawerField label="Email" value={selectedWarehouse.email} />
              </div>
            </section>

            {/* Additional Information */}
            <section>
              <h3 className="text-sm font-semibold text-slate-900 mb-3 bg-slate-50 px-3 py-2 rounded">
                Additional Information
              </h3>
              <div className="space-y-1">
                <DrawerField
                  label="GST Number"
                  value={selectedWarehouse.gstNumber}
                />
                <DrawerField
                  label="License Number"
                  value={selectedWarehouse.licenseNumber}
                />
                <DrawerField
                  label="Remarks"
                  value={selectedWarehouse.remarks}
                />
              </div>
            </section>

            {/* Metadata Footer */}
            <div className="flex flex-col gap-1 text-xs text-slate-400 mt-8 pt-4 border-t border-slate-100">
              <p>
                Created by:{" "}
                <span className="font-medium text-slate-500">
                  {selectedWarehouse.createdBy}
                </span>{" "}
                on {formatDate(selectedWarehouse.createdAt)}
              </p>
              <p>
                Last modified:{" "}
                <span className="font-medium text-slate-500">
                  {formatDate(selectedWarehouse.lastModified)}
                </span>
              </p>
            </div>
          </div>
        )}
      </Drawer>

      {/* Delete Confirmation Modal */}
      {warehouseToDelete && (
        <div 
          className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/30 backdrop-blur-[2px]"
          onClick={() => setWarehouseToDelete(null)}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-slate-900 mb-2">
              Delete Warehouse
            </h3>
            <p className="text-slate-600 mb-6 text-sm">
              Are you sure you want to delete{" "}
              <span className="font-semibold text-slate-900">
                {warehouseToDelete.name}
              </span>
              ? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <ActionButton
                variant="secondary"
                onClick={() => setWarehouseToDelete(null)}
              >
                Cancel
              </ActionButton>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-rose-600 text-white text-sm rounded-lg font-semibold hover:bg-rose-700 transition-colors shadow-sm shadow-rose-600/20"
              >
                Delete Warehouse
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}