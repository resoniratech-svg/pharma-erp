import { useState, useMemo, useEffect } from 'react';
import { Package, AlertCircle, Clock, CheckCircle2 } from 'lucide-react';
import {
  PageHeader,
  FilterBar,
  SearchInput,
  SelectFilter,
  TableCard,
  DataTable,
  Badge,
  SummaryCard
} from './components/shared';
import { type Column, type BadgeVariant } from './components/shared';

// Import existing production services
import { inventoryService, type InventoryRecord } from '../../services/inventoryService';
import { productService } from '../../services/productService';
import { batchService } from '../../services/batchService';
import authService from '../../services/authService';

interface StockRow {
  id: string;
  productCode: string;
  productName: string;
  batchNumber: string;
  category: string;
  packType: string;
  availableQuantity: number;
  reservedQuantity: number;
  freeQuantity: number;
  expiryDate: string;
  mrp: number;
  ptr: number;
  status: 'In Stock' | 'Low Stock' | 'Out of Stock' | 'Near Expiry';
  rawRecord: InventoryRecord;
}

export default function CurrentStock() {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [batchFilter, setBatchFilter] = useState('');
  const [expiryFilter, setExpiryFilter] = useState('');

  const [rawInventory, setRawInventory] = useState<InventoryRecord[]>([]);

  const loggedInDistributorCode = useMemo(() => {
    const user = authService.getCurrentUser();
    return (user as any)?.linkedDistributorCode || (user as any)?.distributorCode || '';
  }, []);

  useEffect(() => {
    // Load inventory from service and filter by logged-in distributor
    if (loggedInDistributorCode) {
      const allInventory = inventoryService.getAll();
      const myInventory = allInventory.filter(
        record => record.warehouseId === loggedInDistributorCode || record.warehouseCode === loggedInDistributorCode
      );
      setRawInventory(myInventory);
    }
  }, [loggedInDistributorCode]);

  const stockData = useMemo<StockRow[]>(() => {
    const products = productService.getProducts();
    const batches = batchService.getAll();

    return rawInventory.map(inv => {
      const product = products.find(p => p.code === inv.productCode);
      const batch = batches.find(b => b.batchNo === inv.batchNo && b.productCode === inv.productCode);

      const minStock = product?.minimumStock ? Number(product.minimumStock) : 50;
      let status: StockRow['status'] = 'In Stock';
      
      const expiryDate = batch?.expDate || '';
      if (inv.availableQty === 0) {
        status = 'Out of Stock';
      } else if (expiryDate) {
        const today = new Date();
        const exp = new Date(expiryDate);
        const daysToExpiry = Math.ceil((exp.getTime() - today.getTime()) / (1000 * 3600 * 24));
        if (daysToExpiry <= 90 && daysToExpiry > 0) {
          status = 'Near Expiry';
        } else if (inv.availableQty <= minStock) {
          status = 'Low Stock';
        }
      } else if (inv.availableQty <= minStock) {
        status = 'Low Stock';
      }

      return {
        id: inv.id,
        productCode: inv.productCode,
        productName: inv.productName || product?.name || 'Unknown',
        batchNumber: inv.batchNo,
        category: product?.category || 'General',
        packType: product?.packingType || 'N/A',
        availableQuantity: inv.availableQty,
        reservedQuantity: inv.reservedQty || 0,
        freeQuantity: 0, // Currently no explicit free quantity stored in inventory
        expiryDate: expiryDate ? new Date(expiryDate).toLocaleDateString('en-GB') : 'N/A',
        mrp: product?.mrp ? Number(product.mrp) : 0,
        ptr: product?.ptr ? Number(product.ptr) : 0,
        status,
        rawRecord: inv
      };
    });
  }, [rawInventory]);

  const filteredData = useMemo(() => {
    return stockData.filter(item => {
      const searchLower = search.toLowerCase();
      const matchSearch = 
        item.productCode.toLowerCase().includes(searchLower) ||
        item.productName.toLowerCase().includes(searchLower);

      const matchCategory = categoryFilter ? item.category === categoryFilter : true;
      const matchStatus = statusFilter ? item.status === statusFilter : true;
      const matchBatch = batchFilter ? item.batchNumber.toLowerCase().includes(batchFilter.toLowerCase()) : true;
      
      let matchExpiry = true;
      if (expiryFilter) {
        if (expiryFilter === 'Expired' && item.expiryDate !== 'N/A') {
          const parts = item.expiryDate.split('/');
          if (parts.length === 3) {
             const exp = new Date(Number(parts[2]), Number(parts[1])-1, Number(parts[0]));
             if (exp >= new Date()) matchExpiry = false;
          }
        } else if (expiryFilter === 'Near Expiry') {
             matchExpiry = item.status === 'Near Expiry';
        }
      }

      return matchSearch && matchCategory && matchStatus && matchBatch && matchExpiry;
    });
  }, [stockData, search, categoryFilter, statusFilter, batchFilter, expiryFilter]);

  const metrics = useMemo(() => {
    const totalProducts = new Set(stockData.map(d => d.productCode)).size;
    const totalQty = stockData.reduce((sum, item) => sum + item.availableQuantity, 0);
    const lowStock = stockData.filter(d => d.status === 'Low Stock' || d.status === 'Out of Stock').length;
    const nearExpiry = stockData.filter(d => d.status === 'Near Expiry').length;

    return { totalProducts, totalQty, lowStock, nearExpiry };
  }, [stockData]);

  const uniqueCategories = useMemo(() => Array.from(new Set(stockData.map(item => item.category))), [stockData]);

  const columns: Column<StockRow>[] = [
    { label: 'Product Code', key: 'productCode' },
    { 
      label: 'Product Name', 
      key: 'productName',
      render: (row: any) => (
        <div>
          <p className="font-medium text-slate-900">{row.productName}</p>
          <p className="text-xs text-slate-500">{row.packType}</p>
        </div>
      )
    },
    { label: 'Batch Number', key: 'batchNumber' },
    { label: 'Category', key: 'category' },
    { label: 'Expiry Date', key: 'expiryDate' },
    { 
      label: 'Pricing', 
      key: 'mrp',
      render: (row: any) => (
        <div>
          <p className="text-sm">MRP: ₹{row.mrp.toFixed(2)}</p>
          <p className="text-xs text-slate-500">PTR: ₹{row.ptr.toFixed(2)}</p>
        </div>
      )
    },
    { 
      label: 'Available', 
      key: 'availableQuantity',
      render: (row: any) => <span className="font-semibold">{row.availableQuantity}</span>
    },
    { label: 'Reserved', key: 'reservedQuantity' },
    {
      label: 'Status',
      key: 'status',
      render: (row: any) => {
        let variant: BadgeVariant = 'neutral';
        switch (row.status) {
          case 'In Stock': variant = 'success'; break;
          case 'Low Stock': variant = 'warning'; break;
          case 'Out of Stock': variant = 'danger'; break;
          case 'Near Expiry': variant = 'warning'; break;
        }
        return <Badge variant={variant}>{row.status}</Badge>;
      }
    }
  ];

  return (
    <div className="animate-in fade-in duration-500 space-y-6">
      <PageHeader
        title="Current Stock"
        subtitle="View your currently owned inventory and stock levels."
      />

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <SummaryCard
          title="Total Products"
          value={String(metrics.totalProducts)}
          icon={<Package className="w-6 h-6" />}
          colorClass="text-blue-600"
          bgClass="bg-blue-50"
        />
        <SummaryCard
          title="Total Available Qty"
          value={String(metrics.totalQty)}
          icon={<CheckCircle2 className="w-6 h-6" />}
          colorClass="text-emerald-600"
          bgClass="bg-emerald-50"
        />
        <SummaryCard
          title="Low/Out of Stock"
          value={String(metrics.lowStock)}
          subtitle="Needs Replenishment"
          icon={<AlertCircle className="w-6 h-6" />}
          colorClass="text-rose-600"
          bgClass="bg-rose-50"
        />
        <SummaryCard
          title="Near Expiry Batches"
          value={String(metrics.nearExpiry)}
          subtitle="Action Required"
          icon={<Clock className="w-6 h-6" />}
          colorClass="text-amber-600"
          bgClass="bg-amber-50"
        />
      </div>

      <TableCard>
        <FilterBar>
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search by Product Name or Code..."
          />
          <SelectFilter
            value={categoryFilter}
            onChange={setCategoryFilter}
            options={uniqueCategories.map(c => ({ value: c, label: c }))}
            placeholder="All Categories"
          />
          <SelectFilter
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { value: 'In Stock', label: 'In Stock' },
              { value: 'Low Stock', label: 'Low Stock' },
              { value: 'Out of Stock', label: 'Out of Stock' },
              { value: 'Near Expiry', label: 'Near Expiry' }
            ]}
            placeholder="All Statuses"
          />
          <SearchInput
            value={batchFilter}
            onChange={setBatchFilter}
            placeholder="Filter by Batch..."
          />
        </FilterBar>

        <DataTable
          columns={columns}
          data={filteredData}
        />
      </TableCard>
    </div>
  );
}
