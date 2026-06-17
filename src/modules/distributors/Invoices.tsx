import { useState } from 'react';
import { Plus, Download, Filter, Eye } from 'lucide-react';
import {
  PageHeader,
  FilterBar,
  SearchInput,
  SelectFilter,
  ActionButton,
  TableCard,
  DataTable,
  Badge,
  Drawer,
  DrawerField
} from './components/shared';
import { type Column } from './components/shared';
import { ROLE_SUPER_ADMIN } from '../../constants/roles';
import * as XLSX from 'xlsx';
import { generateInvoicePdf } from '../../documents/generators/pdfGenerator';

interface Invoice {
  id: string;
  invoiceNo: string;
  distributor: string;
  date: string;
  dueDate: string;
  amount: number;
  status: 'Paid' | 'Unpaid' | 'Overdue' | 'Draft' | 'Generated' | 'Partially Paid' | 'Cancelled';
}

const mockData: Invoice[] = [
  { id: '1', invoiceNo: 'INV-26-9912', distributor: 'Metro Pharma Distributors', date: '01-Oct-2026', dueDate: '31-Oct-2026', amount: 150000, status: 'Unpaid' },
  { id: '2', invoiceNo: 'INV-26-9900', distributor: 'Carewell Agencies', date: '15-Aug-2026', dueDate: '15-Sep-2026', amount: 420000, status: 'Overdue' },
  { id: '3', invoiceNo: 'INV-26-9890', distributor: 'Global Health Supply', date: '10-Sep-2026', dueDate: '10-Oct-2026', amount: 85000, status: 'Paid' },
];

export default function Invoices() {
  const activeRole = localStorage.getItem('activeRole') || ROLE_SUPER_ADMIN;
  const loggedInDistributorName = 'Metro Pharma Distributors'; // Mock logged in context

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [viewInvoice, setViewInvoice] = useState<Invoice | null>(null);
  
  // Create Invoice Modal State (Admin Only)
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newInvoice, setNewInvoice] = useState({
    invoiceNo: 'INV-26-XXXX',
    date: new Date().toISOString().split('T')[0],
    distributor: '',
    orderNo: '',
    billingAddress: '',
    gstin: '',
    state: '',
    dueDate: '',
    creditDays: '30',
    remarks: ''
  });

  const formatCurrency = (amount: number) => `₹ ${amount.toLocaleString('en-IN')}`;

  const roleFilteredData = activeRole === ROLE_SUPER_ADMIN 
    ? mockData 
    : mockData.filter(item => item.distributor === loggedInDistributorName);

  const filteredData = roleFilteredData.filter((item) => {
    const matchSearch = activeRole === ROLE_SUPER_ADMIN 
      ? item.invoiceNo.toLowerCase().includes(search.toLowerCase()) || item.distributor.toLowerCase().includes(search.toLowerCase())
      : item.invoiceNo.toLowerCase().includes(search.toLowerCase());
    
    const matchStatus = statusFilter ? item.status === statusFilter : true;
    return matchSearch && matchStatus;
  });

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'Paid': return 'success';
      case 'Generated': return 'info';
      case 'Partially Paid': return 'warning';
      case 'Unpaid': return 'warning';
      case 'Overdue': return 'danger';
      case 'Cancelled': return 'danger';
      default: return 'secondary';
    }
  };

  const handleExportExcel = () => {
    const exportData = filteredData.map(item => {
      const row: any = {
        'Invoice No': item.invoiceNo,
        'Date': item.date,
        'Due Date': item.dueDate,
        'Amount': item.amount,
        'Status': item.status
      };
      if (activeRole === ROLE_SUPER_ADMIN) {
        row['Distributor'] = item.distributor;
      }
      return row;
    });

    const headers = activeRole === ROLE_SUPER_ADMIN 
      ? ['Invoice No', 'Distributor', 'Date', 'Due Date', 'Amount', 'Status']
      : ['Invoice No', 'Date', 'Due Date', 'Amount', 'Status'];

    const ws = XLSX.utils.json_to_sheet(exportData, { header: headers });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Invoice Register");
    XLSX.writeFile(wb, "Invoice_Register.xlsx");
  };

  const handleDownloadPdf = (invoice: Invoice) => {
    generateInvoicePdf(invoice);
  };

  const adminColumns: Column<Invoice>[] = [
    { key: 'invoiceNo', label: 'Invoice No', render: (row) => <span className="font-semibold text-slate-900">{row.invoiceNo}</span> },
    { key: 'distributor', label: 'Distributor', render: (row) => <span className="text-slate-800">{row.distributor}</span> },
    { key: 'date', label: 'Invoice Date', render: (row) => <span className="text-slate-600">{row.date}</span> },
    { key: 'dueDate', label: 'Due Date', render: (row) => <span className={row.status === 'Overdue' ? 'text-rose-600 font-medium' : 'text-slate-600'}>{row.dueDate}</span> },
    { key: 'amount', label: 'Invoice Amount', render: (row) => <span className="font-bold text-slate-800">{formatCurrency(row.amount)}</span> },
    {
      key: 'status',
      label: 'Payment Status',
      render: (row) => <Badge variant={getStatusVariant(row.status) as any}>{row.status}</Badge>,
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
          <button onClick={() => setViewInvoice(row)} className="text-slate-400 hover:text-violet-600 transition-colors p-1" title="View">
            <Eye className="w-4 h-4" />
          </button>
          <button onClick={() => handleDownloadPdf(row)} className="text-slate-400 hover:text-violet-600 transition-colors p-1" title="Download PDF">
            <Download className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  const distributorColumns: Column<Invoice>[] = [
    { key: 'invoiceNo', label: 'Invoice No', render: (row) => <span className="font-semibold text-slate-900">{row.invoiceNo}</span> },
    { key: 'date', label: 'Invoice Date', render: (row) => <span className="text-slate-600">{row.date}</span> },
    { key: 'dueDate', label: 'Due Date', render: (row) => <span className={row.status === 'Overdue' ? 'text-rose-600 font-medium' : 'text-slate-600'}>{row.dueDate}</span> },
    { key: 'amount', label: 'Invoice Amount', render: (row) => <span className="font-bold text-slate-800">{formatCurrency(row.amount)}</span> },
    {
      key: 'status',
      label: 'Payment Status',
      render: (row) => <Badge variant={getStatusVariant(row.status) as any}>{row.status}</Badge>,
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
          <button onClick={() => setViewInvoice(row)} className="text-slate-400 hover:text-violet-600 transition-colors p-1" title="View">
            <Eye className="w-4 h-4" />
          </button>
          <button onClick={() => handleDownloadPdf(row)} className="text-slate-400 hover:text-violet-600 transition-colors p-1" title="Download PDF">
            <Download className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader
        title="Invoice Download"
        subtitle={activeRole === ROLE_SUPER_ADMIN ? "Manage billing, tax invoices, and payment statuses for all distributors." : "Access and download your tax invoices and monitor payment statuses."}
        actions={
          <>
            <ActionButton variant="secondary" icon={<Download className="w-4 h-4" />} onClick={handleExportExcel}>
              Export Register
            </ActionButton>
            {activeRole === ROLE_SUPER_ADMIN ? (
              <ActionButton icon={<Plus className="w-4 h-4" />} onClick={() => setShowCreateModal(true)}>
                Create Invoice
              </ActionButton>
            ) : (
              <div title="Invoice creation will be available when Retailer Ordering is enabled." className="inline-block">
                <ActionButton icon={<Plus className="w-4 h-4" />} className="opacity-50 cursor-not-allowed pointer-events-none">
                  Create Invoice
                </ActionButton>
              </div>
            )}
          </>
        }
      />

      <FilterBar>
        <SearchInput 
          value={search} 
          onChange={setSearch} 
          placeholder={activeRole === ROLE_SUPER_ADMIN ? "Search invoice or distributor..." : "Search invoice no..."} 
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
            { label: 'Draft', value: 'Draft' },
            { label: 'Generated', value: 'Generated' },
            { label: 'Paid', value: 'Paid' },
            { label: 'Partially Paid', value: 'Partially Paid' },
            { label: 'Unpaid', value: 'Unpaid' },
            { label: 'Overdue', value: 'Overdue' },
            { label: 'Cancelled', value: 'Cancelled' },
          ]}
          placeholder="All Status"
        />
      </FilterBar>

      <TableCard>
        <div className="[&>div::-webkit-scrollbar]:hidden [&>div]:[-ms-overflow-style:none] [&>div]:[scrollbar-width:none]">
          {activeRole === ROLE_SUPER_ADMIN ? (
            <DataTable
              columns={adminColumns}
              data={filteredData}
              emptyMessage="No invoices found."
            />
          ) : (
            <DataTable
              columns={distributorColumns}
              data={filteredData}
              emptyMessage="No invoices found."
            />
          )}
        </div>
      </TableCard>

      {/* Admin Create Invoice Modal */}
      {showCreateModal && activeRole === ROLE_SUPER_ADMIN && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900">
                Create Invoice
              </h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-500 hover:text-slate-800"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2 mt-2 first:mt-0">
                <h3 className="text-sm font-semibold text-slate-700 border-b pb-2 mb-2">A. Invoice Information</h3>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Invoice No (Auto Generated)</label>
                <input disabled value={newInvoice.invoiceNo} className="w-full border border-slate-200 bg-slate-50 rounded-lg px-3 py-2 text-slate-500" />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Invoice Date</label>
                <input type="date" value={newInvoice.date} onChange={e => setNewInvoice({...newInvoice, date: e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2" />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Distributor</label>
                <select className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-white" value={newInvoice.distributor} onChange={e => setNewInvoice({...newInvoice, distributor: e.target.value})}>
                  <option value="">Select Distributor...</option>
                  <option value="Metro Pharma Distributors">Metro Pharma Distributors</option>
                  <option value="Carewell Agencies">Carewell Agencies</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Related Order No</label>
                <input value={newInvoice.orderNo} onChange={e => setNewInvoice({...newInvoice, orderNo: e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2" placeholder="e.g. PO-2026-001" />
              </div>

              <div className="md:col-span-2 mt-4">
                <h3 className="text-sm font-semibold text-slate-700 border-b pb-2 mb-2">B. Billing Information</h3>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Billing Address</label>
                <textarea value={newInvoice.billingAddress} onChange={e => setNewInvoice({...newInvoice, billingAddress: e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2 h-20 resize-none" />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">GSTIN</label>
                <input value={newInvoice.gstin} onChange={e => setNewInvoice({...newInvoice, gstin: e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2" />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">State</label>
                <input value={newInvoice.state} onChange={e => setNewInvoice({...newInvoice, state: e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2" />
              </div>

              <div className="md:col-span-2 mt-4">
                <h3 className="text-sm font-semibold text-slate-700 border-b pb-2 mb-2">C. Invoice Items</h3>
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-8 text-center text-slate-500 text-sm">
                  Item selection module goes here. (Mocked for design layout)
                </div>
              </div>

              <div className="md:col-span-2 mt-4">
                <h3 className="text-sm font-semibold text-slate-700 border-b pb-2 mb-2">D. Invoice Summary</h3>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Gross Amount</label>
                <input type="number" className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50" disabled value={0} />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Discount</label>
                <input type="number" className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50" disabled value={0} />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Tax Amount</label>
                <input type="number" className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50" disabled value={0} />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Net Amount</label>
                <input type="number" className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 font-bold" disabled value={0} />
              </div>

              <div className="md:col-span-2 mt-4">
                <h3 className="text-sm font-semibold text-slate-700 border-b pb-2 mb-2">E. Payment Terms</h3>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Payment Due Date</label>
                <input type="date" value={newInvoice.dueDate} onChange={e => setNewInvoice({...newInvoice, dueDate: e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2" />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Credit Days</label>
                <input type="number" value={newInvoice.creditDays} onChange={e => setNewInvoice({...newInvoice, creditDays: e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2" />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Remarks</label>
                <input value={newInvoice.remarks} onChange={e => setNewInvoice({...newInvoice, remarks: e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2" />
              </div>

            </div>

            <div className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <ActionButton variant="ghost" onClick={() => setShowCreateModal(false)}>
                Cancel
              </ActionButton>
              <ActionButton variant="secondary">
                Save Draft
              </ActionButton>
              <ActionButton onClick={() => setShowCreateModal(false)}>
                Generate Invoice
              </ActionButton>
            </div>
          </div>
        </div>
      )}

      {/* View Drawer */}
      <Drawer
        open={viewInvoice !== null}
        onClose={() => setViewInvoice(null)}
        title="Invoice Details"
      >
        {viewInvoice && (
          <div className="space-y-6 pb-20">
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">Invoice Information</h3>
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <DrawerField label="Invoice No" value={<span className="font-semibold">{viewInvoice.invoiceNo}</span>} />
                <DrawerField label="Invoice Date" value={viewInvoice.date} />
                {activeRole === ROLE_SUPER_ADMIN && (
                  <DrawerField label="Distributor" value={viewInvoice.distributor} />
                )}
                <DrawerField label="Order No" value="PO-2026-1049" />
                <DrawerField label="Due Date" value={viewInvoice.dueDate} />
              </div>
            </div>

            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">Invoice Items</h3>
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-2 font-medium text-slate-600">Product</th>
                      <th className="px-4 py-2 font-medium text-slate-600 text-right">Qty</th>
                      <th className="px-4 py-2 font-medium text-slate-600 text-right">Rate</th>
                      <th className="px-4 py-2 font-medium text-slate-600 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr>
                      <td className="px-4 py-3 text-slate-800">Paracetamol 500mg</td>
                      <td className="px-4 py-3 text-slate-600 text-right">1000</td>
                      <td className="px-4 py-3 text-slate-600 text-right">₹15</td>
                      <td className="px-4 py-3 text-slate-800 text-right font-medium">₹15,000</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-slate-800">Amoxicillin 250mg</td>
                      <td className="px-4 py-3 text-slate-600 text-right">500</td>
                      <td className="px-4 py-3 text-slate-600 text-right">₹30</td>
                      <td className="px-4 py-3 text-slate-800 text-right font-medium">₹15,000</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">Financial Summary</h3>
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <div className="flex justify-between py-2 text-sm text-slate-600">
                  <span>Gross Amount</span>
                  <span>₹30,000</span>
                </div>
                <div className="flex justify-between py-2 text-sm text-slate-600">
                  <span>Tax (12%)</span>
                  <span>₹3,600</span>
                </div>
                <div className="flex justify-between py-2 text-sm text-slate-600 border-b border-slate-200">
                  <span>Discount</span>
                  <span>-₹0</span>
                </div>
                <div className="flex justify-between py-3 text-sm font-bold text-slate-900">
                  <span>Net Amount</span>
                  <span>{formatCurrency(viewInvoice.amount)}</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">Payment Information</h3>
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <DrawerField label="Amount Paid" value={viewInvoice.status === 'Paid' ? formatCurrency(viewInvoice.amount) : '₹0'} />
                <DrawerField label="Outstanding Amount" value={viewInvoice.status === 'Paid' ? '₹0' : formatCurrency(viewInvoice.amount)} />
                <DrawerField label="Payment Status" value={<Badge variant={getStatusVariant(viewInvoice.status) as any}>{viewInvoice.status}</Badge>} />
              </div>
            </div>

            <div className="pt-4 flex gap-3">
              <ActionButton 
                variant="primary" 
                className="w-full justify-center"
                icon={<Download className="w-4 h-4" />}
                onClick={() => handleDownloadPdf(viewInvoice)}
              >
                Download PDF
              </ActionButton>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
