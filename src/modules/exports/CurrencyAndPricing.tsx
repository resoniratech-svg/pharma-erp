import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Select } from '../../components/ui/Select';
import { apiRequest } from '../../services/apiClient';
import { Plus, Edit, Trash2 } from 'lucide-react';

const CurrencyAndPricing = () => {
  const [currencies, setCurrencies] = useState<any[]>([]);
  const [pricing, setPricing] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Modals state
  const [isCurrencyModalOpen, setIsCurrencyModalOpen] = useState(false);
  const [currencyForm, setCurrencyForm] = useState({ code: '', name: '' });
  
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
  const [pricingForm, setPricingForm] = useState({ country: '', productId: '', currencyId: '', price: '' });

  const [editingCurrencyId, setEditingCurrencyId] = useState<string | null>(null);
  const [editingPricingId, setEditingPricingId] = useState<string | null>(null);

  useEffect(() => {
    fetchCurrencies();
    fetchPricing();
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await apiRequest<{success: boolean, data: any[]}>('/products');
      if (res.success) setProducts(res.data || []);
    } catch (error) {
      console.error('Failed to fetch products', error);
    }
  };

  const fetchPricing = async () => {
    try {
      const res = await apiRequest<{success: boolean, data: any[]}>('/exports/country-pricing');
      if (res.success) setPricing(res.data || []);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchCurrencies = async () => {
    setLoading(true);
    try {
      const res = await apiRequest<{success: boolean, data: any[]}>('/exports/currencies');
      if (res.success) {
        setCurrencies(res.data || []);
      }
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  };

  const handleAddCurrency = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const endpoint = editingCurrencyId ? `/exports/currencies/${editingCurrencyId}` : '/exports/currencies';
      const method = editingCurrencyId ? 'PUT' : 'POST';
      
      const res = await apiRequest<{success: boolean}>(endpoint, {
        method,
        bodyData: currencyForm
      });
      if (res.success) {
        setIsCurrencyModalOpen(false);
        setCurrencyForm({ code: '', name: '' });
        setEditingCurrencyId(null);
        fetchCurrencies();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeleteCurrency = async (id: string) => {
    if (!confirm('Are you sure you want to delete this currency?')) return;
    try {
      const res = await apiRequest<{success: boolean}>(`/exports/currencies/${id}`, { method: 'DELETE' });
      if (res.success) fetchCurrencies();
    } catch (error) {
      console.error(error);
    }
  };

  const handleAddPricing = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const endpoint = editingPricingId ? `/exports/country-pricing/${editingPricingId}` : '/exports/country-pricing';
      const method = editingPricingId ? 'PUT' : 'POST';

      const res = await apiRequest<{success: boolean}>(endpoint, {
        method,
        bodyData: pricingForm
      });
      if (res.success) {
        setIsPricingModalOpen(false);
        setPricingForm({ country: '', productId: '', currencyId: '', price: '' });
        setEditingPricingId(null);
        fetchPricing();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeletePricing = async (id: string) => {
    if (!confirm('Are you sure you want to delete this pricing?')) return;
    try {
      const res = await apiRequest<{success: boolean}>(`/exports/country-pricing/${id}`, { method: 'DELETE' });
      if (res.success) fetchPricing();
    } catch (error) {
      console.error(error);
    }
  };

  const openEditCurrency = (c: any) => {
    setEditingCurrencyId(c.id);
    setCurrencyForm({ code: c.code, name: c.name });
    setIsCurrencyModalOpen(true);
  };

  const openEditPricing = (p: any) => {
    setEditingPricingId(p.id);
    setPricingForm({ country: p.country, productId: p.productId, currencyId: p.currencyId, price: p.price });
    setIsPricingModalOpen(true);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Currency & Pricing</h1>
          <p className="text-slate-500">Manage manual exchange rates and country-specific product prices.</p>
        </div>
        <Button className="flex items-center gap-2" onClick={() => {
          setEditingCurrencyId(null);
          setCurrencyForm({ code: '', name: '' });
          setIsCurrencyModalOpen(true);
        }}>
          <Plus className="w-4 h-4" /> Add Currency
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Currency Master</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p>Loading...</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="py-3 px-4 font-semibold text-sm text-slate-600">Code</th>
                      <th className="py-3 px-4 font-semibold text-sm text-slate-600">Name</th>
                      <th className="py-3 px-4 font-semibold text-sm text-slate-600">Exchange Rate (INR)</th>
                      <th className="py-3 px-4 font-semibold text-sm text-slate-600 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currencies.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-4 text-center text-slate-500">No currencies found</td>
                      </tr>
                    ) : (
                      currencies.map(c => (
                        <tr key={c.id} className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="py-3 px-4 font-medium">{c.code}</td>
                          <td className="py-3 px-4 text-slate-600">{c.name}</td>
                          <td className="py-3 px-4 text-slate-600">₹{c.exchangeRate}</td>
                          <td className="py-3 px-4 flex justify-end gap-2">
                            <button onClick={() => openEditCurrency(c)} className="text-blue-600 hover:bg-blue-50 p-1 rounded"><Edit className="w-4 h-4" /></button>
                            <button onClick={() => handleDeleteCurrency(c.id)} className="text-red-600 hover:bg-red-50 p-1 rounded"><Trash2 className="w-4 h-4" /></button>
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

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Country Pricing</CardTitle>
            <Button variant="outline" size="sm" className="flex items-center gap-2" onClick={() => {
              setEditingPricingId(null);
              setPricingForm({ country: '', productId: '', currencyId: '', price: '' });
              setIsPricingModalOpen(true);
            }}>
              <Plus className="w-4 h-4" /> Add Price
            </Button>
          </CardHeader>
          <CardContent>
            <p className="text-slate-500 text-sm mb-4">Set specific pricing for products per country.</p>
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="py-3 px-4 font-semibold text-sm text-slate-600">Country</th>
                      <th className="py-3 px-4 font-semibold text-sm text-slate-600">Product</th>
                      <th className="py-3 px-4 font-semibold text-sm text-slate-600">Price</th>
                      <th className="py-3 px-4 font-semibold text-sm text-slate-600 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pricing.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-4 text-center text-slate-500">No pricing configurations found</td>
                      </tr>
                    ) : (
                      pricing.map(p => (
                        <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="py-3 px-4 font-medium">{p.country}</td>
                          <td className="py-3 px-4 text-slate-600">{p.product?.name || p.productId}</td>
                          <td className="py-3 px-4 text-slate-600 font-medium">
                            {p.currency?.code} {p.price}
                          </td>
                          <td className="py-3 px-4 flex justify-end gap-2">
                            <button onClick={() => openEditPricing(p)} className="text-blue-600 hover:bg-blue-50 p-1 rounded"><Edit className="w-4 h-4" /></button>
                            <button onClick={() => handleDeletePricing(p.id)} className="text-red-600 hover:bg-red-50 p-1 rounded"><Trash2 className="w-4 h-4" /></button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
          </CardContent>
        </Card>
      </div>

      <Modal isOpen={isCurrencyModalOpen} onClose={() => setIsCurrencyModalOpen(false)} title={editingCurrencyId ? "Edit Currency" : "Add Currency"}>
        <form onSubmit={handleAddCurrency} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700">Currency Code</label>
            <Input 
              required 
              placeholder="e.g. USD, EUR" 
              value={currencyForm.code} 
              onChange={e => setCurrencyForm({...currencyForm, code: e.target.value})} 
            />
            <p className="text-xs text-slate-500 mt-1">Exchange rate will be fetched automatically via Frankfurter API.</p>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Currency Name</label>
            <Input 
              required 
              placeholder="e.g. US Dollar" 
              value={currencyForm.name} 
              onChange={e => setCurrencyForm({...currencyForm, name: e.target.value})} 
            />
          </div>
          <div className="flex justify-end pt-4">
            <Button type="submit" className="w-full">{editingCurrencyId ? 'Update Currency' : 'Save Currency'}</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isPricingModalOpen} onClose={() => setIsPricingModalOpen(false)} title={editingPricingId ? "Edit Country Pricing" : "Add Country Pricing"}>
        <form onSubmit={handleAddPricing} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700">Country</label>
            <Input 
              required 
              placeholder="e.g. United States" 
              value={pricingForm.country} 
              onChange={e => setPricingForm({...pricingForm, country: e.target.value})} 
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Product</label>
            <Select 
              required 
              value={pricingForm.productId} 
              onChange={e => setPricingForm({...pricingForm, productId: e.target.value})}
            >
              <option value="">Select Product...</option>
              {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Currency</label>
            <Select 
              required 
              value={pricingForm.currencyId} 
              onChange={e => setPricingForm({...pricingForm, currencyId: e.target.value})}
            >
              <option value="">Select Currency...</option>
              {currencies.map(c => <option key={c.id} value={c.id}>{c.code}</option>)}
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Price</label>
            <Input 
              required 
              type="number" 
              step="0.01" 
              placeholder="0.00" 
              value={pricingForm.price} 
              onChange={e => setPricingForm({...pricingForm, price: e.target.value})} 
            />
          </div>
          <div className="flex justify-end pt-4">
            <Button type="submit" className="w-full">{editingPricingId ? 'Update Pricing' : 'Save Pricing'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default CurrencyAndPricing;
