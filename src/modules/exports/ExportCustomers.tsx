import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Select } from '../../components/ui/Select';
import { apiRequest } from '../../services/apiClient';
import { Plus, Edit, Eye } from 'lucide-react';

const ExportCustomers = () => {
  const [customers, setCustomers] = useState<any[]>([]);
  const [currencies, setCurrencies] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({ name: '', country: '', iecCode: '', currencyId: '', billingAddress: '', shippingAddress: '' });
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewingCustomer, setViewingCustomer] = useState<any>(null);

  useEffect(() => {
    fetchCustomers();
    fetchCurrencies();
  }, []);

  const fetchCurrencies = async () => {
    try {
      const res = await apiRequest<{success: boolean, data: any[]}>('/exports/currencies');
      if (res.success) setCurrencies(res.data || []);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await apiRequest<{success: boolean, data: any[]}>('/exports/customers');
      if (res.success) {
        setCustomers(res.data || []);
      }
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  };

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const endpoint = editingId ? `/exports/customers/${editingId}` : '/exports/customers';
      const method = editingId ? 'PUT' : 'POST';

      const res = await apiRequest<{success: boolean}>(endpoint, {
        method,
        bodyData: form
      });
      if (res.success) {
        setIsModalOpen(false);
        setForm({ name: '', country: '', iecCode: '', currencyId: '', billingAddress: '', shippingAddress: '' });
        setEditingId(null);
        fetchCustomers();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const openEdit = (c: any) => {
    setEditingId(c.id);
    setForm({
      name: c.name || '',
      country: c.country || '',
      iecCode: c.iecCode || '',
      currencyId: c.currencyId?.toString() || '',
      billingAddress: c.billingAddress || '',
      shippingAddress: c.shippingAddress || ''
    });
    setIsModalOpen(true);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Export Customers</h1>
          <p className="text-slate-500">Manage international customer profiles and IEC code workflows.</p>
        </div>
        <Button className="flex items-center gap-2" onClick={() => {
          setEditingId(null);
          setForm({ name: '', country: '', iecCode: '', currencyId: '', billingAddress: '', shippingAddress: '' });
          setIsModalOpen(true);
        }}>
          <Plus className="w-4 h-4" /> Add Customer
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-slate-500">Loading customers...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="py-4 px-6 font-semibold text-sm text-slate-600">Customer Name</th>
                    <th className="py-4 px-6 font-semibold text-sm text-slate-600">Country</th>
                    <th className="py-4 px-6 font-semibold text-sm text-slate-600">IEC Code</th>
                    <th className="py-4 px-6 font-semibold text-sm text-slate-600">Currency</th>
                    <th className="py-4 px-6 font-semibold text-sm text-slate-600">Status</th>
                    <th className="py-4 px-6 font-semibold text-sm text-slate-600 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-500">No export customers found</td>
                    </tr>
                  ) : (
                    customers.map(c => (
                      <tr key={c.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                        <td className="py-4 px-6 font-medium text-slate-800">{c.name}</td>
                        <td className="py-4 px-6 text-slate-600">{c.country}</td>
                        <td className="py-4 px-6 text-slate-600 font-mono text-sm">{c.iecCode || 'N/A'}</td>
                        <td className="py-4 px-6 text-slate-600">{c.currency?.code}</td>
                        <td className="py-4 px-6">
                           <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${c.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                              {c.isActive ? 'Active' : 'Inactive'}
                           </span>
                        </td>
                        <td className="py-4 px-6 flex justify-end gap-2">
                          <button onClick={() => setViewingCustomer(c)} className="text-slate-400 hover:text-primary p-1 rounded transition-colors"><Eye className="w-4 h-4" /></button>
                          <button onClick={() => openEdit(c)} className="text-slate-400 hover:text-blue-600 p-1 rounded transition-colors"><Edit className="w-4 h-4" /></button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? "Edit Export Customer" : "Add Export Customer"}>
        <form onSubmit={handleAddCustomer} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-700">Customer Name</label>
              <Input 
                required 
                value={form.name} 
                onChange={e => setForm({...form, name: e.target.value})} 
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Country</label>
              <Input 
                required 
                value={form.country} 
                onChange={e => setForm({...form, country: e.target.value})} 
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">IEC Code</label>
              <Input 
                value={form.iecCode} 
                onChange={e => setForm({...form, iecCode: e.target.value})} 
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Base Currency</label>
              <Select 
                required 
                value={form.currencyId} 
                onChange={e => setForm({...form, currencyId: e.target.value})}
              >
                <option value="">Select Currency...</option>
                {currencies.map(c => <option key={c.id} value={c.id}>{c.code}</option>)}
              </Select>
            </div>
            <div className="col-span-2">
              <label className="text-sm font-medium text-slate-700">Billing Address</label>
              <Input 
                value={form.billingAddress} 
                onChange={e => setForm({...form, billingAddress: e.target.value})} 
              />
            </div>
            <div className="col-span-2">
              <label className="text-sm font-medium text-slate-700">Shipping Address</label>
              <Input 
                value={form.shippingAddress} 
                onChange={e => setForm({...form, shippingAddress: e.target.value})} 
              />
            </div>
          </div>
          <div className="flex justify-end pt-4">
            <Button type="submit">{editingId ? "Update Customer" : "Save Customer"}</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={!!viewingCustomer} onClose={() => setViewingCustomer(null)} title="Customer Details">
        {viewingCustomer && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-slate-500 mb-1">Name</p>
                <p className="font-medium text-slate-800">{viewingCustomer.name}</p>
              </div>
              <div>
                <p className="text-slate-500 mb-1">Country</p>
                <p className="font-medium text-slate-800">{viewingCustomer.country}</p>
              </div>
              <div>
                <p className="text-slate-500 mb-1">IEC Code</p>
                <p className="font-medium text-slate-800">{viewingCustomer.iecCode || 'N/A'}</p>
              </div>
              <div>
                <p className="text-slate-500 mb-1">Currency</p>
                <p className="font-medium text-slate-800">{viewingCustomer.currency?.code}</p>
              </div>
              <div className="col-span-2">
                <p className="text-slate-500 mb-1">Billing Address</p>
                <p className="font-medium text-slate-800">{viewingCustomer.billingAddress || 'N/A'}</p>
              </div>
              <div className="col-span-2">
                <p className="text-slate-500 mb-1">Shipping Address</p>
                <p className="font-medium text-slate-800">{viewingCustomer.shippingAddress || 'N/A'}</p>
              </div>
            </div>
            <div className="flex justify-end pt-4">
              <Button onClick={() => setViewingCustomer(null)} variant="outline">Close</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ExportCustomers;
