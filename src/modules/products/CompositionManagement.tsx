import { useState, useEffect } from 'react';
import { Plus, Filter, Download, Trash2, Package, ExternalLink, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router';
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
} from './components/shared';
import { type Column } from './types';
import { compositionService, type LinkedProductSummary } from "../../services/compositionService";
import { productService } from "../../services/productService";
import activityLogService from "../../services/activityLogService";

interface Composition {
  id: string;
  genericName: string;
  strength: string;
  dosageForm: string;
  therapeuticClass: string;
  schedule: string;
  description: string;
  associatedProducts: number;
  linkedProducts?: LinkedProductSummary[];
  status: 'Active' | 'Inactive';
  createdBy: string;
  createdDate: string;
}

const formatDate = (dateString?: string) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
};

export default function CompositionManagement() {
  const [data, setData] = useState<Composition[]>([]);
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [compositions, products] = await Promise.all([
        compositionService.getAll(),
        productService.loadProducts().catch(() => productService.getProducts()),
      ]);

      // Reconcile and calculate real-time linked products
      const enriched: Composition[] = compositions.map((comp) => {
        const cName = (comp.genericName || '').trim().toLowerCase();

        // Match against active products
        const matchedProducts = products.filter((p: any) => {
          const pComp = (p.composition || '').trim().toLowerCase();
          const pGen = (p.genericName || '').trim().toLowerCase();
          const pName = (p.name || '').trim().toLowerCase();
          return (
            (pComp && pComp === cName) ||
            (pGen && pGen === cName) ||
            (cName.length > 3 && (pComp.includes(cName) || pGen.includes(cName) || pName.includes(cName)))
          );
        });

        const matchedList: LinkedProductSummary[] = matchedProducts.map((p: any) => ({
          id: String(p.id),
          name: p.name,
          code: p.code,
          brandName: p.brandName,
          mrp: p.mrp,
          status: p.status,
        }));

        // Merge with any products returned directly from backend API
        const backendList = comp.linkedProducts || [];
        const combinedMap = new Map<string, LinkedProductSummary>();
        [...backendList, ...matchedList].forEach((p) => {
          if (p && p.name) combinedMap.set(p.name.toLowerCase() + '_' + (p.code || ''), p);
        });
        const finalProducts = Array.from(combinedMap.values());
        const finalCount = Math.max(comp.associatedProducts || 0, finalProducts.length);

        return {
          ...comp,
          associatedProducts: finalCount,
          linkedProducts: finalProducts,
        };
      });

      setData(enriched);
    } catch (err) {
      console.error('Failed to load compositions', err);
    } finally {
      setLoading(false);
    }
  };

  // Initialize data from database
  useEffect(() => {
    loadData();
  }, []);

  const [search, setSearch] = useState('');
  const [scheduleFilter, setScheduleFilter] = useState('');
  
  const [selectedComp, setSelectedComp] = useState<Composition | null>(null);
  const [itemToDelete, setItemToDelete] = useState<Composition | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [isEditingModal, setIsEditingModal] = useState(false);

  const [newComp, setNewComp] = useState({
    id: '',
    genericName: '',
    strength: '',
    dosageForm: 'Tablet',
    therapeuticClass: '',
    schedule: 'OTC',
    description: '',
    status: 'Active' as 'Active' | 'Inactive',
  });

  // Temporary RBAC bypass for client demo
  const canCreate = true;
  const canEdit = true;
  const canDelete = true;

  const columns: Column<Composition>[] = [
    { key: 'genericName', label: 'Generic Name', render: (row) => <span className="font-semibold text-slate-900">{row.genericName}</span> },
    { key: 'strength', label: 'Strength' },
    { key: 'dosageForm', label: 'Dosage Form' },
    { key: 'therapeuticClass', label: 'Therapeutic Class' },
    {
      key: 'schedule',
      label: 'Schedule',
      render: (row) => {
        const variant = row.schedule === 'OTC' ? 'success' : row.schedule === 'Schedule H' || row.schedule === 'Schedule H1' ? 'warning' : 'danger';
        return <Badge variant={variant}>{row.schedule}</Badge>;
      },
    },
    {
      key: 'associatedProducts',
      label: 'Linked Products',
      render: (row) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setSelectedComp(row);
          }}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-all ${
            row.associatedProducts > 0
              ? 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 shadow-xs'
              : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
          }`}
          title="Click to view linked commercial products"
        >
          <Package className="w-3.5 h-3.5" />
          <span>{row.associatedProducts} {row.associatedProducts === 1 ? 'Product' : 'Products'}</span>
        </button>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => {
        const variant = row.status === 'Active' ? 'success' : 'neutral';
        return <Badge variant={variant}>{row.status}</Badge>;
      },
    },
    {
      key: 'id',
      label: 'Actions',
      render: (row) => (
        <div className="flex gap-3">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setSelectedComp(row);
            }}
            className="text-[#163c78] font-medium hover:text-[#0c1f3d]"
          >
            View
          </button>
          {canDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setItemToDelete(row);
              }}
              className="text-rose-600 font-medium hover:text-rose-800"
              title="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      )
    }
  ];

  const filteredData = data.filter((item) => {
    const matchSearch = (item.genericName?.toLowerCase() || '').includes(search.toLowerCase()) || 
                        (item.therapeuticClass?.toLowerCase() || '').includes(search.toLowerCase());
    const matchSchedule = scheduleFilter ? item.schedule === scheduleFilter : true;
    return matchSearch && matchSchedule;
  });

  const handleExport = () => {
    const headers = ['Generic Name', 'Strength', 'Dosage Form', 'Therapeutic Class', 'Schedule', 'Description', 'Linked Products', 'Status', 'Created By', 'Created Date'];
    const csvContent = [
      headers.join(','),
      ...filteredData.map(row => 
        [
          `"${row.genericName}"`, 
          `"${row.strength}"`, 
          `"${row.dosageForm}"`, 
          `"${row.therapeuticClass}"`, 
          `"${row.schedule}"`,
          `"${row.description || ''}"`,
          row.associatedProducts, 
          row.status,
          `"${row.createdBy}"`,
          formatDate(row.createdDate)
        ].join(',')
      )
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'composition_management_export.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const openNewModal = () => {
    setIsEditingModal(false);
    setNewComp({
      id: '',
      genericName: '',
      strength: '',
      dosageForm: 'Tablet',
      therapeuticClass: '',
      schedule: 'OTC',
      description: '',
      status: 'Active'
    });
    setShowModal(true);
  };

  const openEditModal = () => {
    if (!selectedComp) return;
    setIsEditingModal(true);
    setNewComp({
      id: selectedComp.id,
      genericName: selectedComp.genericName,
      strength: selectedComp.strength,
      dosageForm: selectedComp.dosageForm,
      therapeuticClass: selectedComp.therapeuticClass,
      schedule: selectedComp.schedule,
      description: selectedComp.description || '',
      status: selectedComp.status
    });
    setShowModal(true);
  };

  const handleSaveComposition = async () => {
    const trimmedGenericName = newComp.genericName.trim();
    const trimmedStrength = newComp.strength.trim();
    const trimmedTherapeuticClass = newComp.therapeuticClass.trim();
    const trimmedDescription = newComp.description.trim();

    if (!trimmedGenericName || !trimmedStrength || !newComp.dosageForm || !trimmedTherapeuticClass || !newComp.schedule || !newComp.status) {
      alert("Please fill all mandatory fields (*).");
      return;
    }

    // Duplicate Validation
    const isDuplicate = data.some(
      (c) =>
        c.id !== newComp.id &&
        c.status === "Active" &&
        newComp.status === "Active" &&
        c.genericName.trim().toLowerCase() === trimmedGenericName.toLowerCase() &&
        c.strength.trim().toLowerCase() === trimmedStrength.toLowerCase() &&
        c.dosageForm === newComp.dosageForm
    );

    if (isDuplicate) {
      alert("An Active composition with this Generic Name, Strength, and Dosage Form already exists.");
      return;
    }
    
    let updatedData: Composition[] = [];

    if (isEditingModal && newComp.id) {
      try {
        const updated = await compositionService.update(newComp.id, {
          genericName: trimmedGenericName,
          strength: trimmedStrength,
          dosageForm: newComp.dosageForm,
          therapeuticClass: trimmedTherapeuticClass,
          schedule: newComp.schedule,
          description: trimmedDescription,
          status: newComp.status as 'Active' | 'Inactive',
        });
        updatedData = data.map(item => item.id === updated.id ? { ...updated, associatedProducts: selectedComp?.associatedProducts || 0 } : item);
        activityLogService.addLog({ action: "Composition Updated", module: "Composition Management" });
        if (selectedComp && selectedComp.id === updated.id) {
          setSelectedComp({ ...updated, associatedProducts: selectedComp.associatedProducts || 0 });
        }
        setData(updatedData);
      } catch (err: any) {
        alert(err.message || 'Failed to update composition');
        return;
      }
    } else {
      try {
        const created = await compositionService.add({
          genericName: trimmedGenericName,
          strength: trimmedStrength,
          dosageForm: newComp.dosageForm,
          therapeuticClass: trimmedTherapeuticClass,
          schedule: newComp.schedule,
          description: trimmedDescription,
          status: newComp.status as 'Active' | 'Inactive',
          createdBy: 'Admin User',
        });
        updatedData = [created, ...data];
        setData(updatedData);
        activityLogService.addLog({ action: "Composition Created", module: "Composition Management" });
      } catch (err: any) {
        alert(err.message || 'Failed to create composition');
        return;
      }
    }
    setShowModal(false);
  };

  const handleDelete = async () => {
    if (itemToDelete) {
      if (itemToDelete.associatedProducts > 0) {
        alert("This composition is currently in use by one or more products and cannot be deleted. You may change its status to Inactive instead.");
        setItemToDelete(null);
        return;
      }

      try {
        await compositionService.delete(itemToDelete.id);
        const updatedData = data.filter(item => item.id !== itemToDelete.id);
        setData(updatedData);
        activityLogService.addLog({ action: "Composition Deleted", module: "Composition Management" });
      } catch (err: any) {
        alert(err.message || 'Failed to delete composition');
      }
      setItemToDelete(null);
    }
  };

  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader
        title="Composition Management"
        subtitle="Manage generic formulas, strengths, and drug schedules."
        actions={
          <>
            <ActionButton
              variant="secondary"
              icon={<Download className="w-4 h-4" />}
              onClick={handleExport}
            >
              Export
            </ActionButton>
            {canCreate && (
              <ActionButton
                icon={<Plus className="w-4 h-4" />}
                onClick={openNewModal}
              >
                Add Composition
              </ActionButton>
            )}
          </>
        }
      />

      <FilterBar>
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search formula or class..."
        />
        <div className="w-px h-6 bg-slate-200 mx-2 hidden sm:block" />
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-medium text-slate-600">Filters:</span>
        </div>
        <SelectFilter
          value={scheduleFilter}
          onChange={setScheduleFilter}
          options={[
            { label: "OTC", value: "OTC" },
            { label: "Schedule H", value: "Schedule H" },
            { label: "Schedule H1", value: "Schedule H1" },
            { label: "Schedule X", value: "Schedule X" },
          ]}
          placeholder="All Schedules"
        />
      </FilterBar>

      <TableCard>
        <DataTable
          columns={columns}
          data={filteredData}
          onRowClick={(row) => setSelectedComp(row)}
          emptyMessage="No compositions found."
        />
      </TableCard>

      {/* Composition Details Drawer */}
      <Drawer
        open={!!selectedComp}
        onClose={() => setSelectedComp(null)}
        title="Composition Details"
      >
        {selectedComp && (
          <div className="space-y-4">
            <DrawerField label="Generic Name" value={selectedComp.genericName} />
            <DrawerField label="Strength" value={selectedComp.strength} />
            <DrawerField label="Dosage Form" value={selectedComp.dosageForm} />
            <DrawerField label="Therapeutic Class" value={selectedComp.therapeuticClass} />
            <DrawerField
              label="Drug Schedule"
              value={
                <Badge
                  variant={
                    selectedComp.schedule === "OTC"
                      ? "success"
                      : selectedComp.schedule === "Schedule H" || selectedComp.schedule === "Schedule H1"
                        ? "warning"
                        : "danger"
                  }
                >
                  {selectedComp.schedule}
                </Badge>
              }
            />
            <DrawerField label="Description" value={selectedComp.description || "N/A"} />
            
            {/* LINKED PRODUCTS SECTION */}
            <div className="pt-4 border-t border-slate-100 mt-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-indigo-600" />
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Linked Products ({selectedComp.associatedProducts})
                  </h4>
                </div>
                <Link
                  to="/workspace/products/master"
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                >
                  <span>Product Master</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>

              {selectedComp.linkedProducts && selectedComp.linkedProducts.length > 0 ? (
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1 [&::-webkit-scrollbar]:hidden">
                  {selectedComp.linkedProducts.map((prod) => (
                    <div 
                      key={prod.id} 
                      className="p-3 border border-slate-200 rounded-lg bg-slate-50 hover:bg-slate-100/80 transition-colors flex items-center justify-between gap-3 text-xs"
                    >
                      <div>
                        <div className="font-semibold text-slate-900">{prod.name}</div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5 font-mono">
                          <span>{prod.code}</span>
                          {prod.brandName && (
                            <>
                              <span>•</span>
                              <span>Brand: {prod.brandName}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="text-right flex flex-col items-end gap-1">
                        {prod.mrp ? (
                          <span className="font-semibold text-slate-800">₹{prod.mrp}</span>
                        ) : null}
                        <Badge variant={prod.status === 'Active' || !prod.status ? 'success' : 'neutral'}>
                          {prod.status || 'Active'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 border border-dashed border-slate-200 rounded-xl bg-slate-50 text-center text-xs text-slate-500">
                  <p className="font-medium text-slate-700 mb-1">No products linked to this composition yet.</p>
                  <p className="text-[11px] leading-relaxed">
                    To link products, select &quot;{selectedComp.genericName}&quot; in the Composition dropdown when creating or editing in Product Master.
                  </p>
                </div>
              )}
            </div>

            <DrawerField
              label="Status"
              value={
                <Badge variant={selectedComp.status === "Active" ? "success" : "neutral"}>
                  {selectedComp.status}
                </Badge>
              }
            />
            <DrawerField label="Created By" value={selectedComp.createdBy} />
            <DrawerField label="Created Date" value={formatDate(selectedComp.createdDate)} />

            <div className="pt-6 border-t border-slate-100 flex justify-end gap-3 mt-4">
              {canEdit && (
                <ActionButton onClick={openEditModal}>
                  Edit Composition
                </ActionButton>
              )}
              <ActionButton variant="secondary" onClick={() => setSelectedComp(null)}>
                Close
              </ActionButton>
            </div>
          </div>
        )}
      </Drawer>

      {/* Delete Confirmation Modal */}
      {itemToDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setItemToDelete(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-rose-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Delete Composition</h3>
            
            {itemToDelete.associatedProducts > 0 ? (
              <div className="mb-5 p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-left text-xs text-amber-900 flex items-start gap-2.5">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block text-amber-900 mb-0.5">Active Products Linked ({itemToDelete.associatedProducts})</span>
                  This composition is formulated in {itemToDelete.associatedProducts} active commercial product(s). To protect catalog integrity, deletion is prevented. You may edit its status to &quot;Inactive&quot; instead.
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-500 mb-6">
                Are you sure you want to delete <span className="font-semibold text-slate-800">&quot;{itemToDelete.genericName}&quot;</span>? This action cannot be undone.
              </p>
            )}

            <div className="flex justify-center gap-3">
              <button
                onClick={() => setItemToDelete(null)}
                className="flex-1 px-4 py-2 rounded-lg text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                {itemToDelete.associatedProducts > 0 ? "Understood / Close" : "Cancel"}
              </button>
              {itemToDelete.associatedProducts === 0 && (
                <button
                  onClick={handleDelete}
                  className="flex-1 px-4 py-2 rounded-lg text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 transition-colors"
                >
                  Delete
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Composition Modal Form */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900">
                {isEditingModal ? "Edit Composition" : "Add Composition"}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-slate-500 hover:text-slate-800">
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2 mt-2 first:mt-0">
                <h3 className="text-sm font-semibold text-slate-700 border-b pb-2 mb-2">BASIC INFORMATION</h3>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Generic Name *</label>
                <input
                  type="text"
                  maxLength={100}
                  value={newComp.genericName}
                  onChange={(e) => setNewComp({ ...newComp, genericName: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                  placeholder="e.g. Paracetamol"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Strength *</label>
                <input
                  type="text"
                  maxLength={30}
                  value={newComp.strength}
                  onChange={(e) => setNewComp({ ...newComp, strength: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2"
                  placeholder="e.g. 500mg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Dosage Form *</label>
                <select
                  value={newComp.dosageForm}
                  onChange={(e) => setNewComp({ ...newComp, dosageForm: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2"
                >
                  <option value="Tablet">Tablet</option>
                  <option value="Capsule">Capsule</option>
                  <option value="Syrup">Syrup</option>
                  <option value="Injection">Injection</option>
                  <option value="Cream">Cream</option>
                  <option value="Ointment">Ointment</option>
                  <option value="Drops">Drops</option>
                  <option value="Powder">Powder</option>
                </select>
              </div>

              <div className="md:col-span-2 mt-4">
                <h3 className="text-sm font-semibold text-slate-700 border-b pb-2 mb-2">CLASSIFICATION INFORMATION</h3>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Therapeutic Class *</label>
                <input
                  type="text"
                  maxLength={100}
                  value={newComp.therapeuticClass}
                  onChange={(e) => setNewComp({ ...newComp, therapeuticClass: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2"
                  placeholder="e.g. Analgesic"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Drug Schedule *</label>
                <select
                  value={newComp.schedule}
                  onChange={(e) => setNewComp({ ...newComp, schedule: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2"
                >
                  <option value="OTC">OTC</option>
                  <option value="Schedule H">Schedule H</option>
                  <option value="Schedule H1">Schedule H1</option>
                  <option value="Schedule X">Schedule X</option>
                </select>
              </div>

              <div className="md:col-span-2 mt-4">
                <h3 className="text-sm font-semibold text-slate-700 border-b pb-2 mb-2">ADDITIONAL INFORMATION</h3>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  rows={2}
                  maxLength={250}
                  value={newComp.description}
                  onChange={(e) => setNewComp({ ...newComp, description: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2"
                  placeholder="e.g. Used for fever reduction and pain relief."
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Status *</label>
                <select
                  value={newComp.status}
                  onChange={(e) => setNewComp({ ...newComp, status: e.target.value as any })}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <div className="md:col-span-2 mt-4">
                <h3 className="text-sm font-semibold text-slate-700 border-b pb-2 mb-2">AUDIT INFORMATION</h3>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Created By</label>
                <input
                  value={isEditingModal ? selectedComp?.createdBy || "System" : "Admin User"}
                  readOnly
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 text-slate-500 cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Created Date</label>
                <input
                  value={formatDate(isEditingModal ? selectedComp?.createdDate : new Date().toISOString().split("T")[0])}
                  readOnly
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 text-slate-500 cursor-not-allowed"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <ActionButton onClick={handleSaveComposition}>
                {isEditingModal ? "Save Changes" : "Save Composition"}
              </ActionButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}