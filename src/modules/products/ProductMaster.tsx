import { useState } from 'react';
import { Plus, Filter, Download } from 'lucide-react';
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

interface Product {
  id: string;
  code: string;
  name: string;
  genericName: string;
  brandName: string;
  category: string;
  type: string;
  manufacturer: string;

  packingType: string;
  unitsPerPack: string;

  mrp: string;
  ptr: string;
  pts: string;

  gst: string;
  hsnCode: string;

  status: "Active" | "Inactive" | 'Discontinued';
}

const initialProducts: Product[] = [
  {
    id: "1",
    code: "PRD-001",
    name: "Amoxicillin 500mg",
    genericName: "Amoxicillin",
    brandName: "AmoxiCare",
    category: "Antibiotics",
    type: "Capsule",
    manufacturer: "PharmaCorp",
    packingType: "Blister Pack",
    unitsPerPack: "10",
    mrp: "120",
    ptr: "105",
    pts: "95",
    gst: "12",
    hsnCode: "30041000",
    status: "Active",
  },

  {
    id: "2",
    code: "PRD-002",
    name: "Paracetamol 650mg",
    genericName: "Paracetamol",
    brandName: "ParaFast",
    category: "Analgesics",
    type: "Tablet",
    manufacturer: "HealthPlus",
    packingType: "Strip",
    unitsPerPack: "15",
    mrp: "45",
    ptr: "38",
    pts: "35",
    gst: "12",
    hsnCode: "30049011",
    status: "Active",
  },

  {
    id: "3",
    code: "PRD-003",
    name: "Cough Syrup 100ml",
    genericName: "Dextromethorphan",
    brandName: "CoughEase",
    category: "Respiratory",
    type: "Syrup",
    manufacturer: "MediCare",
    packingType: "Bottle",
    unitsPerPack: "1",
    mrp: "95",
    ptr: "80",
    pts: "75",
    gst: "12",
    hsnCode: "30049099",
    status: "Inactive",
  },

  {
    id: "4",
    code: "PRD-004",
    name: "Vitamin C 1000mg",
    genericName: "Ascorbic Acid",
    brandName: "VitaBoost",
    category: "Vitamins",
    type: "Tablet",
    manufacturer: "VitaLife",
    packingType: "Bottle",
    unitsPerPack: "30",
    mrp: "250",
    ptr: "220",
    pts: "200",
    gst: "12",
    hsnCode: "21069099",
    status: "Active",
  },

  {
    id: "5",
    code: "PRD-005",
    name: "Ibuprofen 400mg",
    genericName: "Ibuprofen",
    brandName: "PainAway",
    category: "NSAIDs",
    type: "Tablet",
    manufacturer: "PainRelief Inc.",
    packingType: "Strip",
    unitsPerPack: "10",
    mrp: "70",
    ptr: "60",
    pts: "55",
    gst: "12",
    hsnCode: "30049069",
    status: "Discontinued",
  },
];

export default function ProductMaster() {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  
  const [products, setProducts] = useState(initialProducts);

  const [showNewProductModal, setShowNewProductModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  

  const [editingProductId, setEditingProductId] = useState<string | null>(null);

  const [newProduct, setNewProduct] = useState({
    code: "",
    name: "",
    genericName: "",
    brandName: "",

    category: "",
    type: "",
    manufacturer: "",

    packingType: "",
    unitsPerPack: "",

    mrp: "",
    ptr: "",
    pts: "",

    gst: "",
    hsnCode: "",

    status: "Active" as Product["status"],
  });


  const handleExport = () => {
    const headers = [
      "Code",
      "Product Name",
      "Category",
      "Type",
      "Manufacturer",
      "Status",
    ];

    const rows = filteredData.map((item) => [
      item.code,
      item.name,
      item.category,
      item.type,
      item.manufacturer,
      item.status,
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const link = document.createElement("a");

    link.href = URL.createObjectURL(blob);

    link.download = "products.csv";

    link.click();
  };

  const handleSaveProduct = () => {
    if (
      !newProduct.code ||
      !newProduct.name ||
      !newProduct.category ||
      !newProduct.type ||
      !newProduct.manufacturer
    ) {
      alert("Please fill all required fields");
      return;
    }
    if (editMode && editingProductId) {
      setProducts((prev) =>
        prev.map((product) =>
          product.id === editingProductId
            ? {
                ...product,
                ...newProduct,
              }
            : product,
        ),
      );
    } else {
      const product: Product = {
        id: Date.now().toString(),
        code: newProduct.code,
        name: newProduct.name,
        category: newProduct.category,
        type: newProduct.type,
        manufacturer: newProduct.manufacturer,
        genericName: newProduct.genericName,
        brandName: newProduct.brandName,
        packingType: newProduct.packingType,
        unitsPerPack: newProduct.unitsPerPack,
        mrp: newProduct.mrp,
        ptr: newProduct.ptr,
        pts: newProduct.pts,
        gst: newProduct.gst,
        hsnCode: newProduct.hsnCode,
        status: newProduct.status,
      };

      setProducts((prev) => [product, ...prev]);
    }

    setShowNewProductModal(false);

    setEditMode(false);

    setEditingProductId(null);

    setNewProduct({
      code: "",
      name: "",
      category: "",
      type: "",
      manufacturer: "",
      genericName: "",
      brandName: "",
      packingType: "",
      unitsPerPack: "",
      mrp: "",
      ptr: "",
      pts: "",
      gst: "",
      hsnCode: "",
      status: "Active",
    });

    const product: Product = {
      id: Date.now().toString(),

      code: newProduct.code,
      name: newProduct.name,

      genericName: newProduct.genericName,
      brandName: newProduct.brandName,

      category: newProduct.category,
      type: newProduct.type,
      manufacturer: newProduct.manufacturer,

      packingType: newProduct.packingType,
      unitsPerPack: newProduct.unitsPerPack,

      mrp: newProduct.mrp,
      ptr: newProduct.ptr,
      pts: newProduct.pts,

      gst: newProduct.gst,
      hsnCode: newProduct.hsnCode,

      status: newProduct.status,
    };
    setProducts((prev) => [product, ...prev]);

    setNewProduct({
      code: "",
      name: "",

      genericName: "",
      brandName: "",

      category: "",
      type: "",
      manufacturer: "",

      packingType: "",
      unitsPerPack: "",

      mrp: "",
      ptr: "",
      pts: "",

      gst: "",
      hsnCode: "",

      status: "Active",
    });

    setShowNewProductModal(false);
  };

  const columns: Column<Product>[] = [
    {
      key: "code",
      label: "Code",
    },

    {
      key: "name",
      label: "Product Name",
      render: (row) => (
        <span className="font-semibold text-slate-900">{row.name}</span>
      ),
    },

    {
      key: "category",
      label: "Category",
    },

    {
      key: "type",
      label: "Type",
    },

    {
      key: "manufacturer",
      label: "Manufacturer",
    },

    {
      key: "mrp",
      label: "MRP",
      render: (row) => `₹ ${row.mrp}`,
    },

    {
      key: "gst",
      label: "GST %",
      render: (row) => `${row.gst}%`,
    },

    {
      key: "status",
      label: "Status",
      render: (row) => {
        const variant =
          row.status === "Active"
            ? "success"
            : row.status === "Inactive"
              ? "warning"
              : "danger";

        return <Badge variant={variant}>{row.status}</Badge>;
      },
    },

    {
      key: "actions",
      label: "Actions",

      render: (row) => (
        <div className="flex gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setSelectedProduct(row);
            }}
            className="text-violet-600 font-medium hover:text-violet-800"
          >
            View
          </button>
        </div>
      ),
    },
  ];

  const filteredData = products.filter((item) => {
    const matchSearch =
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.code.toLowerCase().includes(search.toLowerCase());

    const matchCat = categoryFilter ? item.category === categoryFilter : true;

    const matchStatus = statusFilter ? item.status === statusFilter : true;

    return matchSearch && matchCat && matchStatus;
  });

  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader
        title="Product Master Management"
        subtitle="Manage primary product catalog and essential details."
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
              onClick={() => {
                setEditMode(false);

                setEditingProductId(null);

                setNewProduct({
                  code: "",
                  name: "",
                  genericName: "",
                  brandName: "",
                  category: "",
                  type: "",
                  manufacturer: "",
                  packingType: "",
                  unitsPerPack: "",
                  mrp: "",
                  ptr: "",
                  pts: "",
                  gst: "",
                  hsnCode: "",
                  status: "Active",
                });

                setShowNewProductModal(true);
              }}
            >
              New Product
            </ActionButton>
          </>
        }
      />

      <FilterBar>
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search by name or code..."
        />
        <div className="w-px h-6 bg-slate-200 mx-2 hidden sm:block" />
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-medium text-slate-600">Filters:</span>
        </div>
        <SelectFilter
          value={categoryFilter}
          onChange={setCategoryFilter}
          options={[
            { label: "Antibiotics", value: "Antibiotics" },
            { label: "Analgesics", value: "Analgesics" },
            { label: "Respiratory", value: "Respiratory" },
            { label: "Vitamins", value: "Vitamins" },
          ]}
          placeholder="All Categories"
        />
        <SelectFilter
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { label: "Active", value: "Active" },
            { label: "Inactive", value: "Inactive" },
            { label: "Discontinued", value: "Discontinued" },
          ]}
          placeholder="All Status"
        />
      </FilterBar>

      <TableCard>
        <DataTable
          columns={columns}
          data={filteredData}
          onRowClick={(row) => setSelectedProduct(row)}
          emptyMessage="No products found matching your criteria."
        />
      </TableCard>

      <Drawer
        open={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
        title="Product Details"
      >
        {selectedProduct && (
          <div className="space-y-4">
            {/* Basic Information */}
            <div>
              <h3 className="text-sm font-semibold text-slate-700 border-b pb-2 mb-2">
                Basic Information
              </h3>

              <DrawerField label="Product Code" value={selectedProduct.code} />
              <DrawerField label="Product Name" value={selectedProduct.name} />
              <DrawerField
                label="Generic Name"
                value={selectedProduct.genericName}
              />
              <DrawerField
                label="Brand Name"
                value={selectedProduct.brandName}
              />
              <DrawerField label="Category" value={selectedProduct.category} />
              <DrawerField label="Product Type" value={selectedProduct.type} />
              <DrawerField
                label="Manufacturer"
                value={selectedProduct.manufacturer}
              />
            </div>

            {/* Packaging Details */}
            <div>
              <h3 className="text-sm font-semibold text-slate-700 border-b pb-2 mb-2">
                Packaging Details
              </h3>

              <DrawerField
                label="Packing Type"
                value={selectedProduct.packingType}
              />

              <DrawerField
                label="Units Per Pack"
                value={selectedProduct.unitsPerPack}
              />
            </div>

            {/* Pricing Details */}
            <div>
              <h3 className="text-sm font-semibold text-slate-700 border-b pb-2 mb-2">
                Pricing Details
              </h3>

              <DrawerField label="MRP" value={`₹ ${selectedProduct.mrp}`} />

              <DrawerField label="PTR" value={`₹ ${selectedProduct.ptr}`} />

              <DrawerField label="PTS" value={`₹ ${selectedProduct.pts}`} />
            </div>

            {/* Tax Details */}
            <div>
              <h3 className="text-sm font-semibold text-slate-700 border-b pb-2 mb-2">
                Tax Details
              </h3>

              <DrawerField label="GST %" value={`${selectedProduct.gst}%`} />

              <DrawerField label="HSN Code" value={selectedProduct.hsnCode} />
            </div>

            {/* Status */}
            <div>
              <h3 className="text-sm font-semibold text-slate-700 border-b pb-2 mb-2">
                Product Status
              </h3>

              <DrawerField
                label="Status"
                value={
                  <Badge
                    variant={
                      selectedProduct.status === "Active"
                        ? "success"
                        : selectedProduct.status === "Inactive"
                          ? "warning"
                          : "danger"
                    }
                  >
                    {selectedProduct.status}
                  </Badge>
                }
              />
            </div>

            {/* Actions */}
            <div className="pt-6 mt-6 border-t border-slate-100 flex justify-end gap-3">
              <ActionButton
                className="min-w-[140px]"
                onClick={() => {
                  if (!selectedProduct) return;

                  setNewProduct({
                    code: selectedProduct.code,
                    name: selectedProduct.name,
                    category: selectedProduct.category,
                    type: selectedProduct.type,
                    manufacturer: selectedProduct.manufacturer,
                    genericName: selectedProduct.genericName,
                    brandName: selectedProduct.brandName,
                    packingType: selectedProduct.packingType,
                    unitsPerPack: selectedProduct.unitsPerPack,
                    mrp: selectedProduct.mrp,
                    ptr: selectedProduct.ptr,
                    pts: selectedProduct.pts,
                    gst: selectedProduct.gst,
                    hsnCode: selectedProduct.hsnCode,
                    status: selectedProduct.status,
                  });

                  setEditMode(true);
                  setShowNewProductModal(true);
                  setEditingProductId(selectedProduct.id);
                  setSelectedProduct(null);
                }}
              >
                Edit Product
              </ActionButton>

              <ActionButton
                variant="secondary"
                onClick={() => setSelectedProduct(null)}
              >
                Close
              </ActionButton>
            </div>
          </div>
        )}
      </Drawer>

      {showNewProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900">
                {editMode ? "Edit Product" : "Create New Product"}
              </h2>

              <button
                onClick={() => setShowNewProductModal(false)}
                className="text-slate-500 hover:text-slate-800"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Product Code *
                </label>

                <input
                  value={newProduct.code}
                  onChange={(e) =>
                    setNewProduct({
                      ...newProduct,
                      code: e.target.value,
                    })
                  }
                  className="w-full border border-slate-200 rounded-lg px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Product Name *
                </label>

                <input
                  value={newProduct.name}
                  onChange={(e) =>
                    setNewProduct({
                      ...newProduct,
                      name: e.target.value,
                    })
                  }
                  className="w-full border border-slate-200 rounded-lg px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Generic Name *
                </label>

                <input
                  value={newProduct.genericName}
                  onChange={(e) =>
                    setNewProduct({
                      ...newProduct,
                      genericName: e.target.value,
                    })
                  }
                  className="w-full border border-slate-200 rounded-lg px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Brand Name *
                </label>

                <input
                  value={newProduct.brandName}
                  onChange={(e) =>
                    setNewProduct({
                      ...newProduct,
                      brandName: e.target.value,
                    })
                  }
                  className="w-full border border-slate-200 rounded-lg px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Category *
                </label>

                <select
                  value={newProduct.category}
                  onChange={(e) =>
                    setNewProduct({
                      ...newProduct,
                      category: e.target.value,
                    })
                  }
                  className="w-full border border-slate-200 rounded-lg px-3 py-2"
                >
                  <option value="">Select Category</option>
                  <option>Antibiotics</option>
                  <option>Analgesics</option>
                  <option>Respiratory</option>
                  <option>Vitamins</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Product Type *
                </label>

                <select
                  value={newProduct.type}
                  onChange={(e) =>
                    setNewProduct({
                      ...newProduct,
                      type: e.target.value,
                    })
                  }
                  className="w-full border border-slate-200 rounded-lg px-3 py-2"
                >
                  <option value="">Select Type</option>
                  <option>Tablet</option>
                  <option>Capsule</option>
                  <option>Syrup</option>
                  <option>Injection</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Packing Type *
                </label>

                <select
                  value={newProduct.packingType}
                  onChange={(e) =>
                    setNewProduct({
                      ...newProduct,
                      packingType: e.target.value,
                    })
                  }
                  className="w-full border border-slate-200 rounded-lg px-3 py-2"
                >
                  <option value="">Select Packing</option>
                  <option>Strip</option>
                  <option>Blister Pack</option>
                  <option>Bottle</option>
                  <option>Box</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Units Per Pack *
                </label>

                <input
                  value={newProduct.unitsPerPack}
                  onChange={(e) =>
                    setNewProduct({
                      ...newProduct,
                      unitsPerPack: e.target.value,
                    })
                  }
                  type="number"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Manufacturer *
                </label>

                <input
                  value={newProduct.manufacturer}
                  onChange={(e) =>
                    setNewProduct({
                      ...newProduct,
                      manufacturer: e.target.value,
                    })
                  }
                  className="w-full border border-slate-200 rounded-lg px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Status</label>

                <select
                  value={newProduct.status}
                  onChange={(e) =>
                    setNewProduct({
                      ...newProduct,
                      status: e.target.value as Product["status"],
                    })
                  }
                  className="w-full border border-slate-200 rounded-lg px-3 py-2"
                >
                  <option>Active</option>
                  <option>Inactive</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">MRP *</label>

                <input
                  value={newProduct.mrp}
                  onChange={(e) =>
                    setNewProduct({
                      ...newProduct,
                      mrp: e.target.value,
                    })
                  }
                  type="number"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">PTR *</label>

                <input
                  value={newProduct.ptr}
                  onChange={(e) =>
                    setNewProduct({
                      ...newProduct,
                      ptr: e.target.value,
                    })
                  }
                  type="number"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">PTS *</label>

                <input
                  value={newProduct.pts}
                  onChange={(e) =>
                    setNewProduct({
                      ...newProduct,
                      pts: e.target.value,
                    })
                  }
                  type="number"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">GST %</label>

                <select
                  value={newProduct.gst}
                  onChange={(e) =>
                    setNewProduct({
                      ...newProduct,
                      gst: e.target.value,
                    })
                  }
                  className="w-full border border-slate-200 rounded-lg px-3 py-2"
                >
                  <option value="">Select GST</option>
                  <option>5</option>
                  <option>12</option>
                  <option>18</option>
                  <option>28</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  HSN Code *
                </label>

                <input
                  value={newProduct.hsnCode}
                  onChange={(e) =>
                    setNewProduct({
                      ...newProduct,
                      hsnCode: e.target.value,
                    })
                  }
                  className="w-full border border-slate-200 rounded-lg px-3 py-2"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-8">
              <ActionButton
                variant="secondary"
                onClick={() => setShowNewProductModal(false)}
              >
                Cancel
              </ActionButton>

              <ActionButton onClick={handleSaveProduct}>
                {editMode ? "Update Product" : "Save Product"}
              </ActionButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
