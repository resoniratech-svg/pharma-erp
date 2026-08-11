import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Select } from '../../components/ui/Select';
import { apiRequest } from '../../services/apiClient';
import { Plus, FileText, Download, Edit, Trash2, RefreshCw } from 'lucide-react';

const ExportOrders = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [orderForm, setOrderForm] = useState({ customerId: '', totalAmount: '', shippingMode: 'Air', portOfLoading: '', destinationPort: '' });
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);

  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [statusForm, setStatusForm] = useState({ status: '' });

  useEffect(() => {
    fetchOrders();
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const res = await apiRequest<{success: boolean, data: any[]}>('/exports/customers');
      if (res.success) setCustomers(res.data || []);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await apiRequest<{success: boolean, data: any[]}>('/exports/orders');
      if (res.success) {
        setOrders(res.data || []);
      }
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  };

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const endpoint = editingOrderId ? `/exports/orders/${editingOrderId}` : '/exports/orders';
      const method = editingOrderId ? 'PUT' : 'POST';

      const res = await apiRequest<{success: boolean}>(endpoint, {
        method,
        bodyData: orderForm
      });
      if (res.success) {
        setIsCreateModalOpen(false);
        setOrderForm({ customerId: '', totalAmount: '', shippingMode: 'Air', portOfLoading: '', destinationPort: '' });
        setEditingOrderId(null);
        fetchOrders();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeleteOrder = async (id: string) => {
    if (!confirm('Are you sure you want to delete this order?')) return;
    try {
      const res = await apiRequest<{success: boolean}>(`/exports/orders/${id}`, { method: 'DELETE' });
      if (res.success) fetchOrders();
    } catch (error) {
      console.error(error);
    }
  };

  const openEditOrder = (o: any) => {
    setEditingOrderId(o.id);
    setOrderForm({
      customerId: o.customerId?.toString() || '',
      totalAmount: o.totalAmount?.toString() || '',
      shippingMode: o.shippingMode || 'Air',
      portOfLoading: o.portOfLoading || '',
      destinationPort: o.destinationPort || ''
    });
    setIsCreateModalOpen(true);
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiRequest<{success: boolean}>(`/exports/orders/${selectedOrder.id}/status`, {
        method: 'PUT',
        bodyData: { status: statusForm.status }
      });
      if (res.success) {
        setIsStatusModalOpen(false);
        setSelectedOrder(null);
        fetchOrders();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'draft': return 'bg-slate-100 text-slate-700';
      case 'processing': return 'bg-blue-100 text-blue-700';
      case 'shipped': return 'bg-purple-100 text-purple-700';
      case 'cleared': return 'bg-green-100 text-green-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Export Orders & Invoicing</h1>
          <p className="text-slate-500">Process export orders and generate multi-currency export invoices.</p>
        </div>
        <Button className="flex items-center gap-2" onClick={() => {
          setEditingOrderId(null);
          setOrderForm({ customerId: '', totalAmount: '', shippingMode: 'Air', portOfLoading: '', destinationPort: '' });
          setIsCreateModalOpen(true);
        }}>
          <Plus className="w-4 h-4" /> Create Export Order
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
             <div className="p-8 text-center text-slate-500">Loading orders...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="py-4 px-6 font-semibold text-sm text-slate-600">Order No</th>
                    <th className="py-4 px-6 font-semibold text-sm text-slate-600">Customer</th>
                    <th className="py-4 px-6 font-semibold text-sm text-slate-600">Amount (Foreign)</th>
                    <th className="py-4 px-6 font-semibold text-sm text-slate-600">Amount (INR)</th>
                    <th className="py-4 px-6 font-semibold text-sm text-slate-600">Status</th>
                    <th className="py-4 px-6 font-semibold text-sm text-slate-600 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-500">No export orders found</td>
                    </tr>
                  ) : (
                    orders.map(o => (
                      <tr key={o.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                        <td className="py-4 px-6 font-medium text-slate-800">{o.orderNumber}</td>
                        <td className="py-4 px-6 text-slate-600">{o.customer?.name}</td>
                        <td className="py-4 px-6 text-slate-600 font-medium">
                          {o.currency?.code} {o.totalAmount.toLocaleString()}
                        </td>
                        <td className="py-4 px-6 text-slate-600">
                           ₹ {o.totalAmountINR.toLocaleString()}
                        </td>
                        <td className="py-4 px-6">
                           <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(o.status)}`}>
                              {o.status}
                           </span>
                        </td>
                        <td className="py-4 px-6 flex justify-end gap-2">
                          <button 
                            className="text-slate-400 hover:text-primary p-1 rounded transition-colors" 
                            title="Update Status"
                            onClick={() => {
                              setSelectedOrder(o);
                              setStatusForm({ status: o.status });
                              setIsStatusModalOpen(true);
                            }}
                          >
                            <RefreshCw className="w-4 h-4" />
                          </button>
                          <button onClick={() => openEditOrder(o)} className="text-slate-400 hover:text-blue-600 p-1 rounded transition-colors" title="Edit Order"><Edit className="w-4 h-4" /></button>
                          <button onClick={() => handleDeleteOrder(o.id)} className="text-slate-400 hover:text-red-600 p-1 rounded transition-colors" title="Delete Order"><Trash2 className="w-4 h-4" /></button>
                          <button onClick={() => alert('Download invoice functionality coming soon!')} className="text-slate-400 hover:text-green-600 p-1 rounded transition-colors" title="Download Invoice"><Download className="w-4 h-4" /></button>
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

      <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title={editingOrderId ? "Edit Export Order" : "Create Export Order"}>
        <form onSubmit={handleCreateOrder} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="text-sm font-medium text-slate-700">Customer</label>
              <Select 
                required 
                value={orderForm.customerId} 
                onChange={e => setOrderForm({...orderForm, customerId: e.target.value})}
              >
                <option value="">Select Customer...</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </Select>
            </div>
            <div className="col-span-2">
              <label className="text-sm font-medium text-slate-700">Total Amount (in Customer's Base Currency)</label>
              <Input 
                required 
                type="number"
                step="0.01"
                placeholder="0.00"
                value={orderForm.totalAmount} 
                onChange={e => setOrderForm({...orderForm, totalAmount: e.target.value})} 
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Shipping Mode</label>
              <Select 
                required 
                value={orderForm.shippingMode} 
                onChange={e => setOrderForm({...orderForm, shippingMode: e.target.value})}
              >
                <option value="Air">Air</option>
                <option value="Sea">Sea</option>
                <option value="Road">Road</option>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Port of Loading</label>
              <Input 
                value={orderForm.portOfLoading} 
                onChange={e => setOrderForm({...orderForm, portOfLoading: e.target.value})} 
              />
            </div>
            <div className="col-span-2">
              <label className="text-sm font-medium text-slate-700">Destination Port</label>
              <Input 
                value={orderForm.destinationPort} 
                onChange={e => setOrderForm({...orderForm, destinationPort: e.target.value})} 
              />
            </div>
          </div>
          <div className="flex justify-end pt-4">
            <Button type="submit">{editingOrderId ? "Update Order" : "Create Order"}</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isStatusModalOpen} onClose={() => setIsStatusModalOpen(false)} title="Update Order Status">
        <form onSubmit={handleUpdateStatus} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700">Status</label>
            <Select 
              required 
              value={statusForm.status} 
              onChange={e => setStatusForm({ status: e.target.value })}
            >
              <option value="Draft">Draft</option>
              <option value="Processing">Processing</option>
              <option value="Shipped">Shipped</option>
              <option value="Cleared">Cleared</option>
            </Select>
          </div>
          <div className="flex justify-end pt-4">
            <Button type="submit">Update</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ExportOrders;
